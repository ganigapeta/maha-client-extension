import forge from "node-forge";
import { buildCreds, buildHeaders } from "../config";

export async function saveSelectedBeneficiarieAPL(
  selectedBeneficiaries,
  apiRes,
  allocateInputData,
  userId,
) {
  try {
    console.log(
      "Save ::::::::::",
      selectedBeneficiaries,
      apiRes,
      allocateInputData,
      userId,
    );

    // Check if bill already exists for this batch
    const existingCheck = await fetch(
      `/o/c/billmanagements?filter=billNumber eq '${selectedBeneficiaries[0].bill_no}'`,
      {
         headers: buildHeaders(),
         credentials: buildCreds(),
      },
    );
    const existingData = await existingCheck.json();
    if (existingData?.items?.length > 0) {
      console.log("Bill already exists for this batch, skipping creation");
      return existingData.items[0];
    }
    //  Main Bill Payload
    // Fetch DDO scheme mapping to get ddoCode if not in apiRes
    let ddoCodeValue = apiRes?.ddoRecord?.dDOCode || "";
    if (!ddoCodeValue && apiRes?.schemeData?.id) {
      try {
        const ddoMappingRes = await fetch(
          `/o/c/ddoschememappings?filter=r_schemeMapping_c_schemeConfiguratorId eq '${apiRes.schemeData.id}'`,
          {
            headers: buildHeaders(),
            credentials: buildCreds(),
          },
        );
        const ddoMappingData = await ddoMappingRes.json();
        ddoCodeValue = ddoMappingData?.items?.[0]?.dDOCode || "";
      } catch (e) {
        console.error("Failed to fetch DDO mapping:", e);
      }
    }

    let payload = {
      billNumber: selectedBeneficiaries[0].bill_no || selectedBeneficiaries[0].batchID,
      schemeCode: allocateInputData.schemeCode || '',
      ddoCode: ddoCodeValue,
      allocatedAmount: allocateInputData?.allocatedAmount || 0,
      beneficiaryCount: allocateInputData?.noOfBeneficiariesInput || 0,
      submittedStatus: "Pending",
      ddoUserId: userId,
    };

    console.log("Bill Payload:", payload);

    const response = await fetch(`/o/c/billmanagements`, {
      method: "POST",
      headers: buildHeaders(),
      credentials: buildCreds(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bill creation failed: ${errorText}`);
    }

    const result = await response.json();
    console.log("Bill Created:", result);

    return result;
  } catch (error) {
    console.error("Error saving bill:", error);

    return [];
  }
}

export async function saveSelectedBeneficiarie(
  selectedBeneficiaries,
  apiRes,
  allocateInputData,
  userId,
) {
  try {
    console.log(
      "Save ::::::::::",
      selectedBeneficiaries,
      apiRes,
      allocateInputData,
      userId,
    );

    // Check if bill already exists for this batch
    const existingCheck = await fetch(
      `/o/c/billmanagements?filter=billNumber eq '${selectedBeneficiaries[0].batchID}'`,
      {
         headers: buildHeaders(),
         credentials: buildCreds(),
      },
    );
    const existingData = await existingCheck.json();
    if (existingData?.items?.length > 0) {
      console.log("Bill already exists for this batch, skipping creation");
      return existingData.items[0];
    }
    //  Main Bill Payload
    // Fetch DDO scheme mapping to get ddoCode if not in apiRes
    let ddoCodeValue = apiRes?.ddoRecord?.dDOCode || "";
    if (!ddoCodeValue && apiRes?.schemeData?.id) {
      try {
        const ddoMappingRes = await fetch(
          `/o/c/ddoschememappings?filter=r_schemeMapping_c_schemeConfiguratorId eq '${apiRes.schemeData.id}'`,
          {
            headers: buildHeaders(),
            credentials: buildCreds(),
          },
        );
        const ddoMappingData = await ddoMappingRes.json();
        ddoCodeValue = ddoMappingData?.items?.[0]?.dDOCode || "";
      } catch (e) {
        console.error("Failed to fetch DDO mapping:", e);
      }
    }

    let payload = {
      billNumber: selectedBeneficiaries[0].batchID,
      schemeCode: allocateInputData.schemeCode || '',
      ddoCode: ddoCodeValue,
      allocatedAmount: allocateInputData?.allocatedAmount || 0,
      beneficiaryCount: allocateInputData?.noOfBeneficiariesInput || 0,
      submittedStatus: "Pending",
      ddoUserId: userId,
    };

    console.log("Bill Payload:", payload);

    const response = await fetch(`/o/c/billmanagements`, {
      method: "POST",
      headers: buildHeaders(),
      credentials: buildCreds(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bill creation failed: ${errorText}`);
    }

    const result = await response.json();
    console.log("Bill Created:", result);

    return result;
  } catch (error) {
    console.error("Error saving bill:", error);

    return [];
  }
}

export async function getBills(ddoUserId) {
  try {
    const response = await fetch(
      `/o/c/billmanagements?filter=ddoUserId eq '${ddoUserId}'&pageSize=1&sort=dateCreated:desc`,

      {
        method: "GET",
        headers: buildHeaders(),
        credentials: buildCreds(),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Fetch failed: ${errorText}`);
    }

    const data = await response.json();
    console.log("Pending Bills:", data);

    return data?.items || [];
  } catch (error) {
    console.error("Error fetching pending bills:", error);
    return [];
  }
}

function generateBillNumber() {
  const timestamp = Date.now().toString().slice(-6);
  const randomNumber = Math.floor(100 + Math.random() * 900);
  return `${randomNumber}${timestamp}`;
}
export function generateAllotmentID() {
  const timestampPart = Date.now().toString().slice(-6);
  const randomNumber = Math.floor(100 + Math.random() * 900);
  return `${timestampPart}-${randomNumber}`;
}

export async function saveAllocateBeneficiaries(
  selectedBeneficiaries,
  apiRes,
  searchData,
) {
  try {
    let applicationAllotmentDetailsID =
      apiRes?.schemeData?.applicationAllotmentDetailsID;

    if (!applicationAllotmentDetailsID) {
      throw new Error("AllotmentBenefitsDetailsID is missing");
    }

    const objectDef = await fetchObjectInfo(applicationAllotmentDetailsID);
    const url = objectDef?.restContextPath;

    console.log("API URL:", url);

    if (!url) {
      throw new Error("REST context path not found");
    }
    let billNumber = generateBillNumber();
    //  Prepare payload

    console.log("searchData in saveAllocateBeneficiaries::::::::", searchData);
    const payload = selectedBeneficiaries.map((item) => {
      const isLekLadkiInstallment = String(
        searchData?.installment || "",
      ).startsWith("Installment");

      const totalValue = isLekLadkiInstallment
        ? item?.installment1
        : searchData?.installment === "1st Installment" ||
            searchData?.installment === "Monthly Benefit" ||
            String(searchData?.installment || "").startsWith(
              "Monthly Benefit_",
            ) ||
            searchData?.installment === "One-time Benefit"
          ? item?.installment1
          : item?.installment2;

      let installmentStatus = isLekLadkiInstallment
        ? parseInt(
            searchData.installment.replace("Installment ", "").trim(),
            10,
          ) || 1
        : searchData?.installment === "1st Installment"
          ? 1
          : 2;
      console.log("installmentStatus::::::::", installmentStatus);
      return {
        applicantName:
          item?.beneficiaryfullnameasinaadhaar ||
          item?.name ||
          item?.farmername ||
          item?.fullname ||
          item?.applicantfullname ||
          `${item?.creator?.givenName || ""} ${item?.creator?.familyName || ""}`.trim(),
        mobileNo: item?.mobilenumber,
        applicationNo: item?.applicationreferencenumber || "",
        gender: item?.gender,
        age: item?.age,
        dob: item?.dateofbirthasperaadhaar,
        emailId: item?.emailid,
        amount: item?.amount || 0,
        allotmentID: generateAllotmentID(),
        batchID: billNumber,
        aadharReferenceNumber: item?.aadhaarreferenceno,
        finalAmount: totalValue || 0,
        casteCategoryID: Number(item?.castecategory) || 0,
        courseid: Number(item?.coursename) || 0,
        collegeid: Number(item?.collegenameschoolname) || 0,
        installmentStatus: installmentStatus,
      };
    });

    console.log("Payload:", payload);

    //  Save multiple entries
    const responses = await Promise.all(
      payload.map(async (data) => {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "x-csrf-token": window.Liferay?.authToken || "",
          },
          credentials: "include",
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed: ${errorText}`);
        }

        return res.json();
      }),
    );

    console.log("Saved Responses:", responses);

    return {
      success: true,
      data: responses,
    };
  } catch (error) {
    console.error("Error saving beneficiaries:", error);

    return {
      success: false,
      message: error.message,
    };
  }
}

export async function fetchObjectInfo(objectDefinitionId) {
  try {
    //   const csrfToken = await getCsrfToken();
    //  if (!csrfToken) throw new Error("Access csrfToken not available");

    if (!objectDefinitionId) {
      throw new Error("objectDefinitionId is required");
    }

    // Basic auth (same working method)
    const response = await fetch(
      `/o/object-admin/v1.0/object-definitions/${objectDefinitionId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-csrf-token": window.Liferay?.authToken || "",
        },
        credentials: "include",
      },
    );

    if (!response.ok) {
      let err = {};
      try {
        err = await response.json();
      } catch (e) {}
      console.error("Error fetching Object Definition:", err);
      throw new Error(err.title || "Failed to fetch object definition");
    }

    return await response.json();
  } catch (error) {
    console.error("fetchObjectInfo Error:", error);
    throw error;
  }
}

export async function getDataBaseOnBillNumber(billNumber, schemeData) {
  try {
    //  get object definition id
    const applicationAllotmentDetailsID =
      schemeData?.applicationAllotmentDetailsID;

    if (!applicationAllotmentDetailsID) {
      throw new Error("applicationAllotmentDetailsID is missing");
    }

    //  fetch object info
    const objectDef = await fetchObjectInfo(applicationAllotmentDetailsID);
    const url = objectDef?.restContextPath;

    if (!url) {
      throw new Error("REST context path not found");
    }

    console.log("API URL:", url);

    //  fetch data based on billNumber
    const response = await fetch(`${url}?filter=batchID eq '${billNumber}'`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-csrf-token": window.Liferay?.authToken || "",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Fetch failed: ${errorText}`);
    }

    const data = await response.json();

    console.log("Filtered Data:", data);

    const items = data?.items || [];

    // Enrich items: if finalAmount is 0, fetch correct amount from KPI benefitsJsonData
    const enriched = await Promise.all(
      items.map(async (item) => {
        if (Number(item.finalAmount) !== 0) return item;
        try {
          const kpiRes = await fetch(
            `/o/c/citizendashboardkpis?filter=applicationrefencenumber eq '${item.applicationNo || ""}'`,
            {
              headers: {
                Accept: "application/json",
                "x-csrf-token": window.Liferay?.authToken || "",
              },
              credentials: "include",
            },
          );
          const kpiData = await kpiRes.json();
          const kpi = kpiData?.items?.[0];
          if (!kpi?.benefitsJsonData) return item;
          const benefits = JSON.parse(kpi.benefitsJsonData);
          const installments = benefits?.installments || {};
          const additionalBenefits = benefits?.additionalBenefits || {};
          let amount = Object.values(installments).reduce(
            (s, v) => s + (Number(v) || 0),
            0,
          );
          if (amount === 0) {
            amount = Object.values(additionalBenefits).reduce(
              (s, v) => s + (Number(v) || 0),
              0,
            );
          }
          if (amount === 0) amount = Number(benefits?.totalAmount) || 0;
          return { ...item, finalAmount: amount };
        } catch (e) {
          return item;
        }
      }),
    );

    // return only items
    return enriched;
  } catch (error) {
    console.error("Error fetching data by bill number:", error);
    return [];
  }
}

export async function generateBill(payload) {
  try {
    const response = await fetch(
      `/o/mhdbt-headless-service/v1.0/beams/generate-bill`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          "x-csrf-token": window.Liferay?.authToken || "",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Generate Bill failed: ${errorText}`);
    }

    const data = await response.json();

    console.log("Generate Bill Response:", data);

    return data;
  } catch (error) {
    console.error("Error generating bill:", error);
    return null;
  }
}

export async function getBillsByBillNumber(billNumber, res, ddoUserId) {
  try {
    //  Step 1: Fetch bill
    const response = await fetch(
      `/o/c/billmanagements?filter=billNumber eq '${billNumber}' and ddoUserId eq '${ddoUserId}'`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-csrf-token": window.Liferay?.authToken || "",
        },
        credentials: "include",
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Fetch failed: ${errorText}`);
    }

    const data = await response.json();
    const bill = data?.items?.[0];

    if (!bill) {
      throw new Error("Bill not found");
    }

    console.log("Fetched Bill:", bill);

    //  Step 2: Prepare update payload
    let formattedRes = "";

    if (typeof res === "object") {
      formattedRes = JSON.stringify(res);
    } else if (typeof res === "string") {
      try {
        JSON.parse(res); // check valid JSON
        formattedRes = res;
      } catch {
        formattedRes = JSON.stringify(res);
      }
    }

    const payload = {
      beamsPdfUrl: res?.url || "",
      beamsPdfId: res?.fileEntryId || "",
      submittedStatus: "",
      beamsPdfData: formattedRes,
    };
    // Step 3: PATCH update
    const updateResponse = await fetch(`/o/c/billmanagements/${bill.id}`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-csrf-token": window.Liferay?.authToken || "",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Update failed: ${errorText}`);
    }

    const updatedData = await updateResponse.json();

    console.log("Updated Bill:", updatedData);
    return getBills(ddoUserId);
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

export async function updateAllotment(billNumber, apiRes) {
  try {
    const applicationAllotmentDetailsID =
      apiRes?.schemeData?.applicationAllotmentDetailsID;

    if (!applicationAllotmentDetailsID) {
      throw new Error("applicationAllotmentDetailsID is missing");
    }

    // Step 1: Get Object Definition (REST URL)
    const objectDef = await fetchObjectInfo(applicationAllotmentDetailsID);
    const baseUrl = objectDef?.restContextPath;

    if (!baseUrl) {
      throw new Error("REST context path not found");
    }

    console.log("Base URL:", baseUrl);

    // Step 2: Fetch all records by billNumber
    const fetchResponse = await fetch(
      `${baseUrl}?filter=batchID eq '${billNumber}'`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-csrf-token": window.Liferay?.authToken || "",
        },
        credentials: "include",
      },
    );

    if (!fetchResponse.ok) {
      throw new Error("Failed to fetch records");
    }

    const data = await fetchResponse.json();
    const items = data?.items || [];

    console.log("Fetched Records:", items);

    // Step 3: Loop and update each record
    for (const item of items) {
      const payload = {
        applicationState: "Bill Submitted",
      };

      const updateResponse = await fetch(`${baseUrl}/${item.id}`, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-csrf-token": window.Liferay?.authToken || "",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error(`Failed for ID ${item.id}:`, errorText);
        continue; // skip and continue
      }

      console.log(`Updated ID: ${item.id}`);
    }

    console.log("All records updated successfully ");
  } catch (error) {
    console.error("Update Allotment Error:", error);
  }
}

export async function createSecondInstallmentApplications(
  submittedBillList,
  apiRes,
) {
  try {
    const schemeData = apiRes?.schemeData;

    // Get object restContextPath
    const objectDef = await fetchObjectInfo(
      schemeData?.targetObjectDefinitionId,
    );
    const objectUrl = objectDef?.restContextPath || "";

    const results = await Promise.all(
      submittedBillList.map(async (item) => {
        const payload = {
          applicationId: item.applicationNo || "",
          applicationReferenceNumber: item.applicationNo || "",
          schemeName: schemeData?.schemeName || "",
          schemeCode: schemeData?.schemeCode || "",
          schemeId: String(schemeData?.id || ""),
          department: String(schemeData?.department || ""),
          objectUrl: objectUrl,
          objectEntryId: String(item.id || ""),
          benefitJsonData: JSON.stringify({
            installments: { "Installment 2": item.finalAmount || 0 },
            totalAmount: item.finalAmount || 0,
          }),
          financialYear: "",
        };

        console.log("2nd Installment Payload:", payload);

        const response = await fetch(`/o/c/secondinstallmentapplications/`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "x-csrf-token": window.Liferay?.authToken || "",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to create 2nd installment: ${errorText}`);
        }

        const created = await response.json();

        // Get aisheCode from original KPI entry
        let aisheCode = "";
        try {
          const kpiRes = await fetch(
            `/o/c/citizendashboardkpis?filter=applicationrefencenumber eq '${item.applicationNo}'`,
            {
              headers: {
                Accept: "application/json",
                "x-csrf-token": window.Liferay?.authToken || "",
              },
              credentials: "include",
            },
          );
          const kpiData = await kpiRes.json();
          aisheCode = kpiData?.items?.[0]?.aisheCode || "";
          console.log("aisheCode for 2nd installment:", aisheCode);
        } catch (e) {
          console.warn("Could not fetch aisheCode:", e);
        }

        // Also create KPI entry so it appears in Scrutiny Dashboard
        await createKpiEntryForSecondInstallment(
          item,
          schemeData,
          created.id,
          aisheCode,
        );
        return created;
      }),
    );

    console.log("2nd Installment Applications Created:", results);
    return results;
  } catch (error) {
    console.error("Error creating 2nd installment applications:", error);
    return [];
  }
}

export async function createKpiEntryForSecondInstallment(
  item,
  schemeData,
  secondInstallmentId,
  aisheCode = "",
) {
  try {
    const payload = {
      applicationrefencenumber: item.applicationNo || "",
      aisheCode: aisheCode,
      benefitsJsonData: JSON.stringify({
        installments: { "Installment 2": item.finalAmount || 0 },
        totalAmount: item.finalAmount || 0,
      }),
      citizenStatus: "pending",
      collegeId: "",
      courseId: "",
      department: String(schemeData?.department || ""),
      departmentName: "",
      description: schemeData?.description || "",
      emailId: item.emailId || "",
      loginUserId: item.creator?.id || 0,
      mobileNumber: item.mobileNo || "",
      objectEntryId: secondInstallmentId,
      objectId: schemeData?.id || 0,
      objectName: "SECONDINSTALLMENTAPPLICATION",
      objectUrl: "/o/c/secondinstallmentapplications",
      schemeCategory: schemeData?.schemeCategory || "",
      schemeCode: schemeData?.schemeCode || "",
      schemeId: schemeData?.id || 0,
      schemeName: schemeData?.schemeName || "",
      schemeType: schemeData?.schemeType || "",
      scrutinyLogObjId: String(schemeData?.scrutinyLogObjId || ""),
      workflowId: 0,
    };

    console.log("KPI Entry Payload for 2nd Installment:", payload);

    const response = await fetch(`/o/c/citizendashboardkpis/`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-csrf-token": window.Liferay?.authToken || "",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create KPI entry: ${errorText}`);
    }

    const result = await response.json();
    console.log("KPI Entry Created for 2nd Installment:", result);
    return result;
  } catch (error) {
    console.error("Error creating KPI entry:", error);
    return null;
  }
}

export async function signPdfWithPfx(base64Pdf, fileName, password) {
  try {
    // Step 1 — Fetch .pfx from Documents & Media
    const pfxRes = await fetch("/documents/d/guest/test-pfx-certificate", {
      credentials: "include",
    });
    if (!pfxRes.ok) throw new Error("Failed to fetch PFX file");

    const pfxArrayBuffer = await pfxRes.arrayBuffer();
    const pfxBinary = String.fromCharCode(...new Uint8Array(pfxArrayBuffer));

    // Step 2 — Parse PFX using node-forge
    const pfxAsn1 = forge.asn1.fromDer(pfxBinary);
    const pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, password);

    // Step 3 — Extract private key and certificate
    const keyBags = pfx.getBags({
      bagType: forge.pki.oids.pkcs8ShroudedKeyBag,
    });
    const privateKey = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0]?.key;

    const certBags = pfx.getBags({
      bagType: forge.pki.oids.certBag,
    });
    const certificate = certBags[forge.pki.oids.certBag][0]?.cert;

    if (!privateKey || !certificate) {
      throw new Error("Could not extract key or certificate from PFX");
    }

    // Step 4 — Create PKCS#7 signed data structure
    const pdfBinary = atob(base64Pdf);
    const p7 = forge.pkcs7.createSignedData();
    p7.content = forge.util.createBuffer(pdfBinary, "raw");
    p7.addCertificate(certificate);
    p7.addSigner({
      key: privateKey,
      certificate: certificate,
      digestAlgorithm: forge.pki.oids.sha256,
      authenticatedAttributes: [
        {
          type: forge.pki.oids.contentType,
          value: forge.pki.oids.data,
        },
        {
          type: forge.pki.oids.messageDigest,
        },
        {
          type: forge.pki.oids.signingTime,
          value: new Date(),
        },
      ],
    });
    p7.sign();

    // Step 5 — Convert signed data to bytes
    const signedDer = forge.asn1.toDer(p7.toAsn1()).getBytes();
    const signedBase64 = btoa(signedDer);

    // Step 6 — Upload signed PDF to D&M
    const signedBlob = new Blob(
      [Uint8Array.from(signedDer, (c) => c.charCodeAt(0))],
      { type: "application/pdf" },
    );
    const formData = new FormData();
    formData.append("file", signedBlob, fileName);

    const uploadRes = await fetch(
      `/o/headless-delivery/v1.0/document-folders/0/documents`,
      {
        method: "POST",
        headers: { "x-csrf-token": window.Liferay?.authToken || "" },
        credentials: "include",
        body: formData,
      },
    );

    const uploadData = await uploadRes.json();

    return {
      base64Pdf: signedBase64,
      downloadUrl: uploadData?.contentUrl || "",
      fileEntryId: String(uploadData?.id || ""),
      statusCode: "200",
    };
  } catch (err) {
    console.error("Error signing PDF:", err);
    return { statusCode: "400", message: err.message };
  }
}
