// Static reference kept for PFMS field names:
// const STATIC_DBT_BENEFICIARIES = [
//   {
//     btchBookg: "true",
//     ReqdExctnDt: "2024-08-22",
//     InstrId: "",
//     endToEndId: "1819MNT1000000495-36",
//     CtreAmt: "",
//     PrvcAmt: "12500.00",
//     InstdAmt: "12500.00",
//     BICFI: "SBIN0000123",
//     BrnchId: "000123",
//     PrTryId: "1819MNT1000000495",
//     CPSMSId: "BMHMU00284417",
//     Cdtr_TP: "2981",
//     Cdtr_Titl: "",
//     Cdtr_Nm: "Mohammed Aqeeb Hamid Husain Khan",
//     Cdtr_BenRegType: "",
//     PstlAdr_DstCd: "517",
//     PstlAdr_PrvcCd: "27",
//     CdtrAcct_BBAN: "",
//     CdtrAcct_SOSE: "505136416312",
//     Purp_CD: "1496",
//     Purp_CtreAmt: "",
//     Purp_PrvcAmt: "",
//     Purp_InstdAmt: "",
//     RmtInf_SrcId: "",
//     RmtInf_UsrId: "",
//     RmtInf_CreDtTm: "2024-08-22T12:40:34",
//     RmtInf_FrmDt: "2018-06-01",
//     RmtInf_ToDt: "2018-10-30",
//     RfrdDocInf_Nb: "",
//     RfrdDocInf_RltdDt: "",
//     RltdInf_Rem: ""
//   }
// ];

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

function getCurrentExecutionDate() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentCreateDateTime() {
  return new Date().toISOString().slice(0, 19);
}

function resolveBICFI(ddoSchemeMapping = {}) {
  return getStringValue(ddoSchemeMapping?.iFSCCode);
}

function resolveAccountDetails() {
  return {
    CdtrAcct_BBAN: "",
  };
}

function resolveDistrictCode(ddoSchemeMapping = {}) {
  return getStringValue(ddoSchemeMapping?.districtCode);
}

async function resolveCdtrAcctSOSE(item = {}) {
  const applicationRefNumber = resolveInstructionId(item);

  if (!applicationRefNumber) {
    return "";
  }

  if (aadhaarRefCache.has(applicationRefNumber)) {
    return aadhaarRefCache.get(applicationRefNumber);
  }

  try {
    const kpiEntry = await fetchCitizenDashboardKpiByApplicationRef(applicationRefNumber);
    const aadhaarRefNumber = getMappedValue(
      kpiEntry?.aadhaarRefNumber,
    );

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

function resolveFromDate() {
  return "";
}

function resolveToDate() {
  return "";
}

function resolveInstructionId(item = {}) {
  return getMappedValue(
    item?.applicationNo,
    item?.applicationreferencenumber,
  );
}

function resolveCentreAmount(item = {}) {
  return getMappedValue(
    item?.centreAmount,
    item?.ctreAmt,
    item?.centerAmount,
  );
}

function resolveBranchId(ddoSchemeMapping = {}) {
  return getMappedValue(
    ddoSchemeMapping?.branchId,
    ddoSchemeMapping?.branchCode,
    ddoSchemeMapping?.bankBranchCode,
  );
}

function resolveCreditorTitle(item = {}) {
  return getMappedValue(
    item?.title,
    item?.cdtrTitle,
  );
}

function resolvePurposeCentreAmount(item = {}) {
  return getMappedValue(
    item?.purposeCentreAmount,
    item?.purpCtreAmt,
  );
}

function resolvePurposeProvinceAmount(item = {}) {
  return getMappedValue(
    item?.purposeProvinceAmount,
    item?.purpPrvcAmt,
  );
}

function resolvePurposeInstructedAmount(item = {}) {
  return getMappedValue(
    item?.purposeInstructedAmount,
    item?.purpInstdAmt,
  );
}

function resolveRemittanceSourceId(item = {}, ddoSchemeMapping = {}) {
  return getMappedValue(
    item?.sourceId,
    item?.rmtInfSrcId,
    ddoSchemeMapping?.schemeMappingERC,
    ddoSchemeMapping?.externalReferenceCode,
  );
}

function resolveRemittanceUserId(item = {}, ddoSchemeMapping = {}) {
  return getMappedValue(
    item?.userId,
    item?.loginUserId,
    item?.creatorId,
    ddoSchemeMapping?.dDOUserID,
  );
}
//const CPSMS_ID_PREFIX = "BMHMU002844";
const cpsmsIdCache = new Map();
const userCustomFieldCache = new Map();
const aadhaarRefCache = new Map();

function buildJsonFetchOptions() {
  return {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "x-csrf-token": window.Liferay?.authToken || ""
    },
    credentials: "include"
  };
}

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

  const filter = `applicationrefencenumber eq '${safeApplicationRef.replace(/'/g, "\\'")}'`;
  const response = await fetch(
    `/o/c/citizendashboardkpis?filter=${encodeURIComponent(filter)}&page=1&pageSize=1`,
    buildJsonFetchOptions()
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch citizen dashboard KPI: ${response.status}`);
  }

  const data = await response.json();
  return data.items?.[0] || null;
}

async function fetchUserAccountById(userId) {
  const safeUserId = getStringValue(userId);

  if (!safeUserId) {
    return null;
  }

  const response = await fetch(
    `/o/headless-admin-user/v1.0/user-accounts/${safeUserId}`,
    buildJsonFetchOptions()
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch user account ${safeUserId}: ${response.status}`);
  }

  return response.json();
}

function extractCustomFieldValue(userAccount = {}, fieldName) {
  const normalizedFieldName = getStringValue(fieldName).toLowerCase();
  const customFields = Array.isArray(userAccount?.customFields) ? userAccount.customFields : [];

  const match = customFields.find((field) => {
    return getStringValue(field?.name).toLowerCase() === normalizedFieldName;
  });

  return getStringValue(match?.customValue?.data || match?.value || match?.data);
}

async function fetchCPSMSId(item = {}) {
  const existingId = getStringValue(item?.CPSMSId || item?.cpsmsId);
    //console.log("existingId number is",existingId);

  if (existingId) {
    return existingId;
  }

  const applicationRefNumber = resolveInstructionId(item);
 // console.log("reference number is",applicationRefNumber);
  if (!applicationRefNumber) {
    return "";
  }

  if (cpsmsIdCache.has(applicationRefNumber)) {
    return cpsmsIdCache.get(applicationRefNumber);
  }

  try {
    const kpiEntry = await fetchCitizenDashboardKpiByApplicationRef(applicationRefNumber);
    const loginUserId = getStringValue(kpiEntry?.loginUserId || kpiEntry?.loginuserid);
   //console.log("loged in id",loginUserId);

    if (!loginUserId) {
      cpsmsIdCache.set(applicationRefNumber, "");
      return "";
    }

    if (userCustomFieldCache.has(loginUserId)) {
      const cachedValue = userCustomFieldCache.get(loginUserId);
      cpsmsIdCache.set(applicationRefNumber, cachedValue);
      return cachedValue;
    }

    const userAccount = await fetchUserAccountById(loginUserId);
    //console.log("userAccount in id",userAccount);
    const cpsmsId = extractCustomFieldValue(userAccount, "Pfms beneficiary code");
// console.log("cpsmsId in id",cpsmsId);
    userCustomFieldCache.set(loginUserId, cpsmsId);
    cpsmsIdCache.set(applicationRefNumber, cpsmsId);

    return cpsmsId;
  } catch (error) {
 //   console.error(`Error resolving CPSMSId for application ref ${applicationRefNumber}:`, error);
    cpsmsIdCache.set(applicationRefNumber, "");
    return "";
  }
}

function buildDynamicDBTBeneficiaries(
  beneficiaries = [],
  scheme = {},
  ddoSchemeMapping = {},
  cpsmsIds = [],
  cdtrAcctSoses = [],
) {
  return beneficiaries.map((item, index) => {
    const amount = formatAmount(getBeneficiaryAmount(item));
    const accountDetails = resolveAccountDetails();

    return {
      btchBookg: "true",
      ReqdExctnDt: getCurrentExecutionDate(),
      InstrId: resolveInstructionId(item),
      endToEndId: getStringValue(item?.applicationNo || item?.applicationreferencenumber || item?.id) || `PFMS-${Date.now()}-${index + 1}`,
      CtreAmt: resolveCentreAmount(item),
      PrvcAmt: amount,
      InstdAmt: amount,
      BICFI: resolveBICFI(ddoSchemeMapping),
      BrnchId: resolveBranchId(ddoSchemeMapping),
      PrTryId: getStringValue(item?.applicationNo || item?.applicationreferencenumber || item?.id),
      CPSMSId: getStringValue(cpsmsIds[index] || item?.CPSMSId || item?.cpsmsId),
      Cdtr_TP: getStringValue(ddoSchemeMapping?.beneficiaryType),
      Cdtr_Titl: resolveCreditorTitle(item),
      Cdtr_Nm: getStringValue(item?.applicantName || item?.creator?.name),
      Cdtr_BenRegType: "",
      PstlAdr_DstCd: resolveDistrictCode(ddoSchemeMapping),
      PstlAdr_PrvcCd: getStringValue(ddoSchemeMapping?.stateCensusCode),
      CdtrAcct_BBAN: accountDetails.CdtrAcct_BBAN,
      CdtrAcct_SOSE: getStringValue(cdtrAcctSoses[index]),
      Purp_CD: getStringValue(ddoSchemeMapping?.purposeofpaymentcode),
      Purp_CtreAmt: resolvePurposeCentreAmount(item),
      Purp_PrvcAmt: resolvePurposeProvinceAmount(item),
      Purp_InstdAmt: resolvePurposeInstructedAmount(item),
      RmtInf_SrcId: resolveRemittanceSourceId(item, ddoSchemeMapping),
      RmtInf_UsrId: resolveRemittanceUserId(item, ddoSchemeMapping),
      RmtInf_CreDtTm: getCurrentCreateDateTime(),
      RmtInf_FrmDt: resolveFromDate(),
      RmtInf_ToDt: resolveToDate(),
      RfrdDocInf_Nb: getStringValue(item?.billNumber),
      RfrdDocInf_RltdDt: getStringValue(item?.billDate),
      RltdInf_Rem: getStringValue(item?.remarks),
    };
  });
}

function getDepartmentCodeFromScheme(scheme) {
  const directDepartmentCode = String(
    scheme?.departmentCode || scheme?.departmentcode || ""
  ).trim();

  if (directDepartmentCode) {
    return directDepartmentCode;
  }

  const schemeCode = String(scheme?.schemeCode || "").trim();
  const parts = schemeCode.split("-");

  return parts.length > 1 ? parts[1] : "";
}

function getDDOCodeFromBeneficiaries(beneficiaries = []) {
  const uniqueDdoCodes = [...new Set(
    beneficiaries
      .map((item) => String(item?.ddoCode || "").trim())
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
      {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "x-csrf-token": window.Liferay?.authToken || ""
        },
        credentials: "include"
      }
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
      {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "x-csrf-token": window.Liferay?.authToken || ""
        },
        credentials: "include"
      }
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

async function buildPFMSPayload({ scheme, totalAmount, beneficiaries = [] }) {
  const ddoCode = getDDOCodeFromBeneficiaries(beneficiaries);
  const ddoMaster = ddoCode ? await fetchDDOMasterByCode(ddoCode) : null;
  const ddoSchemeMapping = scheme?.id
    ? await fetchDDOSchemeMappingBySchemeConfiguratorId(scheme.id)
    : null;
  const cpsmsIds = await Promise.all(beneficiaries.map((beneficiary) => fetchCPSMSId(beneficiary)));
  const cdtrAcctSoses = await Promise.all(
    beneficiaries.map((beneficiary) => resolveCdtrAcctSOSE(beneficiary))
  );
  const dynamicDBTBeneficiaries = buildDynamicDBTBeneficiaries(
    beneficiaries,
    scheme,
    ddoSchemeMapping,
    cpsmsIds,
    cdtrAcctSoses,
  );

  return {
    departmentWithLocation: getStringValue(ddoSchemeMapping?.accountHolderName),
    departmentCode: getStringValue(
       ddoMaster?.initiatingPartyCode // || ddoSchemeMapping?.r_dDOMapping_c_ddoMaster?.initiatingPartyCode
    ),
    schemeCode: getStringValue(
      ddoSchemeMapping?.integrationSchemeCode || scheme?.schemeCode || ""
    ),
    totalAmount: (Number(totalAmount) || 0).toFixed(2),
    DBTbeneficiaries: dynamicDBTBeneficiaries
  };
}

async function generatePFMSPaymentXML(payload) {
  try {
    const response = await fetch(
      "/o/mhdbt-headless-service/v1.0/generate-pfms-payment-xml",
      {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "x-csrf-token": window.Liferay?.authToken || ""
        },
        body: JSON.stringify(payload),
        credentials: "include"
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const xmlString = data.bytes;

    return {
      status: response.status,
      xml: xmlString,
      success: true
    };
  } catch (error) {
    console.error("Error:", error);

    return {
      status: 400,
      success: false,
      error: "Failed to generate PFMS XML"
    };
  }
}

export const generateAndDownloadXML = async ({ scheme, totalAmount, beneficiaries = [] } = {}) => {
  try {
    const payload = await buildPFMSPayload({ scheme, totalAmount, beneficiaries });

    if (!payload.departmentWithLocation) {
      throw new Error("Department with location is required for PFMS XML");
    }

    if (!payload.departmentCode) {
      throw new Error("Department code is required for PFMS XML");
    }

    if (!payload.schemeCode) {
      throw new Error("Scheme code is required for PFMS XML");
    }

    if (!Array.isArray(payload.DBTbeneficiaries) || payload.DBTbeneficiaries.length === 0) {
      throw new Error("At least one beneficiary is required for PFMS XML");
    }

    const response = await generatePFMSPaymentXML(payload);

    if (!response.success || !response.xml) {
      throw new Error(response.error || "Failed to generate PFMS XML");
    }

    const cleanedXml = response.xml
      .replace(/\\"/g, '"')
      .replace(/\\r\\n/g, '\n');

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(cleanedXml, "application/xml");

    const parseError = xmlDoc.getElementsByTagName("parsererror");
    if (parseError.length > 0) {
      console.error("Invalid XML", parseError);
      return;
    }

    const serializer = new XMLSerializer();
    const finalXml = serializer.serializeToString(xmlDoc);

    const blob = new Blob([finalXml], { type: "application/xml" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "pfms.xml";
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("XML generation failed:", error);
  }
};

