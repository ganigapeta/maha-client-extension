function getStringValue(value) {
  return String(value ?? "").trim();
}

function getMappedValue(...values) {
  for (const value of values) {
    const normalized = getStringValue(value);
    if (normalized) {
      return normalized;
    }
  }

  return "";
}

function formatAmount(value) {
  return (Number(value) || 0).toFixed(2);
}

function getBeneficiaryAmount(item = {}) {
  return (
    item?.allocatedAmount ??
    item?.finalAmount ??
    item?.tentitiveAmount ??
    item?.amount ??
    0
  );
}

function formatDateForReference(date = new Date()) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  return `${day}${month}${year}`;
}

function escapeXMLAttribute(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildXmlAttributes(attributes = {}) {
  return Object.entries(attributes)
    .map(([key, value]) => `${key}="${escapeXMLAttribute(value)}"`)
    .join(" ");
}

function buildDebitReference(scheme = {}) {
  const stateCode = getMappedValue(scheme?.stateCode, "MH").toUpperCase();
  const datePart = formatDateForReference();
  const serialPart = String(Date.now()).slice(-4);
  return `DBT${stateCode}01${datePart}${serialPart}`;
}

function buildCreditReference(debitReference, index) {
  const paddedIndex = String(index).padStart(5, "0");
  const sanitizedDebitReference = getStringValue(debitReference).replace(/^DBT/, "S");
  return `${sanitizedDebitReference}${paddedIndex}E`;
}

function buildJsonFetchOptions() {
  return {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-csrf-token": window.Liferay?.authToken || "",
    },
    credentials: "include",
  };
}

function getDDOCodeFromBeneficiaries(beneficiaries = []) {
  const uniqueDdoCodes = [...new Set(
    beneficiaries
      .map((item) => String(item?.ddoCode || item?.officeID || "").trim())
      .filter(Boolean)
  )];

  if (uniqueDdoCodes.length > 1) {
    console.warn("Multiple DDO codes found in beneficiaries. Using the first one.", uniqueDdoCodes);
  }

  return uniqueDdoCodes[0] || "";
}

async function fetchDDOMasterByCode(ddoCode) {
  try {
    const response = await fetch(
      `/o/c/ddomasters?page=1&pageSize=20&search=${encodeURIComponent(ddoCode)}`,
      buildJsonFetchOptions()
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch DDO master: ${response.status}`);
    }

    const data = await response.json();
    return data.items?.[0] || null;
  } catch (error) {
    console.error(`Error fetching DDO master for code ${ddoCode}:`, error);
    return null;
  }
}

async function fetchDDOSchemeMappingBySchemeConfiguratorId(schemeConfiguratorId) {
  try {
    const response = await fetch(
      `/o/c/ddoschememappings?nestedFields=ddoMaster,schemeConfigurator&page=1&pageSize=20&search=${encodeURIComponent(schemeConfiguratorId)}`,
      buildJsonFetchOptions()
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch DDO scheme mapping: ${response.status}`);
    }

    const data = await response.json();
    return data.items?.[0] || null;
  } catch (error) {
    console.error(
      `Error fetching DDO scheme mapping for scheme configurator ${schemeConfiguratorId}:`,
      error
    );
    return null;
  }
}

async function buildPensionSNOContext({ scheme = {}, beneficiaries = [] } = {}) {
  const ddoCode = getDDOCodeFromBeneficiaries(beneficiaries);
  const ddoMaster = ddoCode ? await fetchDDOMasterByCode(ddoCode) : null;
  const ddoSchemeMapping = scheme?.id
    ? await fetchDDOSchemeMappingBySchemeConfiguratorId(scheme.id)
    : null;

  return {
    ddoMaster,
    ddoSchemeMapping,
  };
}

const aadhaarRefCache = new Map();

async function parseErrorText(response) {
  try {
    return await response.text();
  } catch (_error) {
    return "";
  }
}

async function getAadhaar(aadhaarRefNumber) {
  const safeAadhaarRefNumber = getStringValue(aadhaarRefNumber);

  if (!safeAadhaarRefNumber) {
    return "";
  }

  const response = await fetch(
    "/o/mhdbt-headless-service/v1.0/get-aadhaar-by-aadhaarref",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-csrf-token": window.Liferay?.authToken || "",
      },
      credentials: "include",
      body: JSON.stringify({
        aadhaarOrRefNumber: safeAadhaarRefNumber,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await parseErrorText(response);
    throw new Error(
      `Failed to get Aadhaar number from ref: ${response.status} ${errorText || ""}`
    );
  }

  const data = await response.json();
  return getStringValue(
    data?.aadhaarOrRefNumber ||
      data?.data?.aadhaarOrRefNumber ||
      data?.result?.aadhaarOrRefNumber
  );
}

async function fetchCitizenDashboardKpiByApplicationRef(applicationRefNumber) {
  const safeApplicationRef = getStringValue(applicationRefNumber);

  if (!safeApplicationRef) {
    return null;
  }

  const filter = `applicationrefencenumber eq '${safeApplicationRef.replace(
    /'/g,
    "\\'"
  )}'`;
  const response = await fetch(
    `/o/c/citizendashboardkpis?filter=${encodeURIComponent(
      filter
    )}&page=1&pageSize=1`,
    buildJsonFetchOptions()
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch citizen dashboard KPI: ${response.status}`
    );
  }

  const data = await response.json();
  return data.items?.[0] || null;
}

function resolveInstructionId(item = {}) {
  return getMappedValue(item?.applicationNo, item?.applicationreferencenumber);
}

async function resolveAadhaarNumber(item = {}) {
  const applicationRefNumber = resolveInstructionId(item);

  if (!applicationRefNumber) {
    return "";
  }

  if (aadhaarRefCache.has(applicationRefNumber)) {
    return aadhaarRefCache.get(applicationRefNumber);
  }

  try {
    const kpiEntry = await fetchCitizenDashboardKpiByApplicationRef(
      applicationRefNumber
    );
    const aadhaarRefNumber = getMappedValue(kpiEntry?.aadhaarRefNumber);

    if (!aadhaarRefNumber) {
      aadhaarRefCache.set(applicationRefNumber, "");
      return "";
    }

    const aadhaarNumber = await getAadhaar(aadhaarRefNumber);
    aadhaarRefCache.set(applicationRefNumber, aadhaarNumber);
    return aadhaarNumber;
  } catch (error) {
    console.error(
      `Error resolving Aadhaar number for application ref ${applicationRefNumber}:`,
      error
    );
    aadhaarRefCache.set(applicationRefNumber, "");
    return "";
  }
}

const DEFAULT_REVIEW_ENTRY_COUNT = 10;

function buildDefaultReviewDebitData() {
  return {
    ACCOUNT_DEBIT: "000000000000",
    BANK_NAME: "Bank Name",
    DEBIT_NARRATION: "PFMS Payment",
    DISTRICT: "NA",
    EMAIL: "na@example.com",
    IFSC_CODE_DEBIT: "NA000000000",
    STATE: "MH",
  };
}

function buildDefaultReviewCreditData(count = DEFAULT_REVIEW_ENTRY_COUNT) {
  return Array.from({ length: count }, (_, index) => {
    const refSerial = String(index + 1).padStart(8, "0");
    return {
      AGENCY_CR_REF: `REF-${refSerial}`,
      AADHAAR_NO: "",
      ADDRESS: "NA",
      NAME: `BENEFICIARY ${index + 1}`,
    };
  });
}


function buildSimplePensionSNOXML({
  scheme,
  totalAmount,
  beneficiaries = [],
  ddoMaster = null,
  ddoSchemeMapping = null,
  aadhaarNumbers = [],
} = {}) {
  const safeBeneficiaries = Array.isArray(beneficiaries) ? beneficiaries : [];
  const defaultReviewCreditData = buildDefaultReviewCreditData();
  const defaultReviewDebitData = buildDefaultReviewDebitData();
  const reviewMode = safeBeneficiaries.length === 0;
  const workingBeneficiaries = reviewMode ? defaultReviewCreditData : safeBeneficiaries;
  const firstBeneficiary = workingBeneficiaries[0] || {};
  const debitReference = buildDebitReference(scheme);
  const transactionDate = formatDateForReference();
  const totalByBeneficiaries = workingBeneficiaries.reduce(
    (sum, beneficiary) => sum + Number(getBeneficiaryAmount(beneficiary) || 100),
    0
  );
  const totalDebitAmount = formatAmount(
    totalAmount ?? totalByBeneficiaries
  );

  const debitAccountAttributes = {
    ACCOUNT_DEBIT: getMappedValue(
      ddoSchemeMapping?.accountNumber,
      ddoSchemeMapping?.r_dDOMapping_c_ddoMaster?.accountNumber,
      scheme?.debitAccount,
      scheme?.accountNumber,
      firstBeneficiary?.debitAccount,
      firstBeneficiary?.accountNumber,
      defaultReviewDebitData.ACCOUNT_DEBIT
    ),
    BANK_NAME: getMappedValue(
      ddoSchemeMapping?.bankName,
      ddoMaster?.bankName,
      scheme?.bankName,
      firstBeneficiary?.bankName,
      defaultReviewDebitData.BANK_NAME
    ),
    CREDIT_COUNT: String(workingBeneficiaries.length),
    DEBIT_AMOUNT: totalDebitAmount,
    DEBIT_NARRATION: getMappedValue(scheme?.debitNarration, defaultReviewDebitData.DEBIT_NARRATION),
    DEBIT_REFERENCE: debitReference,
    DISTRICT: getMappedValue(
      ddoSchemeMapping?.districtCode,
      ddoMaster?.districtCode,
      ddoMaster?.district,
      scheme?.districtCode,
      firstBeneficiary?.districtCode,
      defaultReviewDebitData.DISTRICT
    ),
    EMAIL: getMappedValue(
      ddoMaster?.emailAddress,
      ddoMaster?.email,
      scheme?.email,
      firstBeneficiary?.email,
      firstBeneficiary?.creator?.emailAddress,
      defaultReviewDebitData.EMAIL
    ),
    IFSC_CODE_DEBIT: getMappedValue(
      ddoSchemeMapping?.iFSCCode,
      ddoSchemeMapping?.ifscCode,
      scheme?.ifscCode,
      firstBeneficiary?.ifscCode,
      firstBeneficiary?.iFSCCode,
      defaultReviewDebitData.IFSC_CODE_DEBIT
    ),
    STATE: getMappedValue(
      ddoSchemeMapping?.stateCensusCode,
      ddoMaster?.stateCode,
      scheme?.stateCode,
      defaultReviewDebitData.STATE
    ),
    TRAN_DATE: transactionDate,
  };

  const creditAccountXml = workingBeneficiaries.map((beneficiary, index) => {
    const defaultCredit = defaultReviewCreditData[index] || {};
    const creditAttributes = {
      AGENCY_CR_REF: getMappedValue(
        beneficiary?.agencyCreditReference,
        beneficiary?.agencyCrRef,
        beneficiary?.applicationNo,
        beneficiary?.applicationreferencenumber,
        defaultCredit.AGENCY_CR_REF,
        `AGENCY-${index + 1}`
      ),
      NARRATION: getMappedValue(beneficiary?.narration),
      NPCI_USER_NAME: getMappedValue(
        ddoMaster?.dDOName,
        ddoMaster?.name,
        scheme?.npciUserName,
        scheme?.departmentName,
        scheme?.schemeName,
        "RAJARSHI SHAHU MAHA"
      ),
      NPCI_USER_ID: getMappedValue(
        ddoSchemeMapping?.dDOUserID,
        ddoSchemeMapping?.schemeMappingERC,
        ddoSchemeMapping?.externalReferenceCode,
        scheme?.npciUserId,
        scheme?.agencyCode,
        "OBC2DM4"
      ),
      AADHAAR_NO: getMappedValue(
        aadhaarNumbers[index],
        beneficiary?.aadhaarNo,
        beneficiary?.aadhaarNumber,
        beneficiary?.aadhaar,
        defaultCredit.AADHAAR_NO
      ),
      CREDIT_BANK_IIN: getMappedValue(beneficiary?.creditBankIin, beneficiary?.bankIin),
      ACCOUNT_CREDIT: getMappedValue(beneficiary?.accountNumber, beneficiary?.accountNo),
      IFSC_CODE_CREDIT: getMappedValue(beneficiary?.ifscCode, beneficiary?.iFSCCode),
      CREDIT_REFERENCE: getMappedValue(
        beneficiary?.creditReference,
        buildCreditReference(debitReference, index)
      ),
      CREDIT_BANK_NAME: getMappedValue(beneficiary?.bankName),
      CREDIT_AMOUNT: formatAmount(getBeneficiaryAmount(beneficiary) || 100),
      PAYMENT_MODE: getMappedValue(beneficiary?.paymentMode, "U"),
      ADDRESS: getMappedValue(
        beneficiary?.address,
        beneficiary?.addressLine1,
        beneficiary?.fullAddress,
        defaultCredit.ADDRESS
      ),
      NAME: getMappedValue(
        beneficiary?.applicantName,
        beneficiary?.beneficiaryName,
        beneficiary?.creator?.name,
        defaultCredit.NAME
      ),
    };

    return `<CREDIT_ACCOUNT ${buildXmlAttributes(creditAttributes)} />`;
  }).join("");

  return {
    xml: `<STATE_GOVT_PAYMENTS><DEBIT_ACCOUNT ${buildXmlAttributes(debitAccountAttributes)}><CREDITACCOUNTS>${creditAccountXml}</CREDITACCOUNTS></DEBIT_ACCOUNT></STATE_GOVT_PAYMENTS>`,
    debitReference,
  };
}

function downloadXMLFile(xmlContent, fileName) {
  const blob = new Blob([xmlContent], { type: "application/xml" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export const generateAndDownloadPensionSNOXML = async ({ scheme, totalAmount, beneficiaries = [] } = {}) => {
  console.log("Generating Pension SNO XML for scheme:", scheme);
  try {
    const context = await buildPensionSNOContext({ scheme, beneficiaries });
    const aadhaarNumbers = await Promise.all(
      beneficiaries.map((beneficiary) => resolveAadhaarNumber(beneficiary))
    );

    const { xml: finalXml, debitReference } = buildSimplePensionSNOXML({
      scheme,
      totalAmount,
      beneficiaries,
      ddoMaster: context.ddoMaster,
      ddoSchemeMapping: context.ddoSchemeMapping,
      aadhaarNumbers,
    });
    downloadXMLFile(finalXml, `${debitReference}.xml`);
  } catch (error) {
    console.error("Pension SNO XML generation failed:", error);
  }
};
