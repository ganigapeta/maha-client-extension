import { buildHeaders, getLiferayUserId } from "../config";
import { apiService } from "./external-api";

export async function fetchBillList(
  data,
  setScheme,
  isPensionOrAssistanceDDO = false,
) {
  try {
    const schemeConfiguratorId = data.schemeName?.split("_")[0];
    const fetchSchemeData = await fetchSchemeById(schemeConfiguratorId);
    console.log(
      "Scheme Data based on Department and Scheme Name::::",
      fetchSchemeData,
    );

    // Step 1: Get bill numbers for this scheme from billmanagements
    const schemeCode = fetchSchemeData[0]?.schemeCode || "";
    let validBatchIDs = [];

    if (schemeCode) {
      const statusFilter = isPensionOrAssistanceDDO
        ? "Signed by DDO"
        : "Completed";

      const billRes = await fetch(
        `/o/c/billmanagements?filter=${encodeURIComponent(
          `schemeCode eq '${schemeCode}' and submittedStatus eq '${statusFilter}' and submittedStatus ne 'XML Generated'`,
        )}&pageSize=200`,
        {
          headers: buildHeaders(),
          credentials: "include",
        },
      );
      const billData = await billRes.json();
      validBatchIDs = (billData?.items || [])
        .map((b) => b.billNumber)
        .filter(Boolean);
    }

    console.log("validBatchIDs for scheme:", schemeCode, validBatchIDs);

    // Step 2: Fetch allotment records filtered by those batchIDs
    if (validBatchIDs.length === 0) {
      setScheme(fetchSchemeData[0] || {});
      return [];
    }

    const batchFilter = validBatchIDs
      .map((id) => `batchID eq '${id}'`)
      .join(" or ");

    const filterStr = `status eq 0 and (${batchFilter})`;
    const filter = encodeURIComponent(filterStr);

    const payload = {
            bill_no: validBatchIDs,
            fy: data?.financialYear,
            installment: data?.installment,
            distCode: data?.distCode,
            userId: getLiferayUserId()
          };

    const billResp = await apiService.getBillDetails(payload);

    const result = await billResp.json();
    console.log("Beneficiary Bill List:", result);
    // const enrichedItems = await enrichBeneficiariesWithBillData(
    //   result?.items || [],
    // );

    setScheme(fetchSchemeData[0] || {});
    return billResp;
  } catch (err) {
    console.error("Error fetching departments:", err);
    return [];
  }
}

export async function fetchBeneficiaryList(
  data,
  setScheme,
  isPensionOrAssistanceDDO = false,
) {
  try {
    const schemeConfiguratorId = data.schemeName?.split("_")[0];
    const fetchSchemeData = await fetchSchemeById(schemeConfiguratorId);
    console.log(
      "Scheme Data based on Department and Scheme Name::::",
      fetchSchemeData,
    );
    const objectDef = await fetchObjectInfo(
      fetchSchemeData[0].applicationAllotmentDetailsID,
    );
    console.log("Object Definition:", objectDef);
    if (!objectDef?.restContextPath) {
      throw new Error("Invalid object definition or missing restContextPath");
    }
    const url = objectDef.restContextPath;
    // Step 1: Get bill numbers for this scheme from billmanagements
    const schemeCode = fetchSchemeData[0]?.schemeCode || "";
    let validBatchIDs = [];

    if (schemeCode) {
      const statusFilter = isPensionOrAssistanceDDO
        ? "Signed by DDO"
        : "Completed";

      const billRes = await fetch(
        `/o/c/billmanagements?filter=${encodeURIComponent(
          `schemeCode eq '${schemeCode}' and submittedStatus eq '${statusFilter}' and submittedStatus ne 'XML Generated'`,
        )}&pageSize=200`,
        {
          headers: buildHeaders(),
          credentials: "include",
        },
      );
      const billData = await billRes.json();
      validBatchIDs = (billData?.items || [])
        .map((b) => b.billNumber)
        .filter(Boolean);
    }

    console.log("validBatchIDs for scheme:", schemeCode, validBatchIDs);

    // Step 2: Fetch allotment records filtered by those batchIDs
    if (validBatchIDs.length === 0) {
      setScheme(fetchSchemeData[0] || {});
      return [];
    }

    const batchFilter = validBatchIDs
      .map((id) => `batchID eq '${id}'`)
      .join(" or ");

    const filterStr = `status eq 0 and (${batchFilter})`;
    const filter = encodeURIComponent(filterStr);

    const response = await fetch(`${url}?filter=${filter}&pageSize=200`, {
      method: "GET",
      headers: buildHeaders(),
      credentials: "include",
    });
    const result = await response.json();
    console.log("Beneficiary List:", result);
    const enrichedItems = await enrichBeneficiariesWithBillData(
      result?.items || [],
    );

    const { year, installment } = data;
    const isLekLadkiInst = String(installment || "").startsWith("Installment");
    const instNumber = isLekLadkiInst
      ? parseInt(installment.replace("Installment ", "").trim(), 10) || 1
      : 0;

    const filtered = enrichedItems.filter((item) => {
      const appNo = item.applicationNo || item.applicationreferencenumber || "";
      const financialYear = appNo.substring(0, 4);

      if (year && financialYear !== year) return false;

      // Monthly benefit filter
      if (installment?.startsWith("Monthly Benefit_")) {
        const [, monthName] = installment.split("_");
        const targetMonth = new Date(`${monthName} 1, 2000`).getMonth();
        const itemDate = item.dateCreated ? new Date(item.dateCreated) : null;
        if (!itemDate) return false;
        if (itemDate.getMonth() !== targetMonth) return false;
      }

      // Lek Ladki installment filter
      if (isLekLadkiInst) {
        const itemInstallmentStatus = Number(item.installmentStatus ?? -1);
        return itemInstallmentStatus === instNumber;
      }

      // 1st/2nd installment filter
      if (installment === "1st Installment") {
        return Number(item.installmentStatus ?? 1) === 1;
      }
      if (installment === "2nd Installment") {
        return Number(item.installmentStatus ?? 0) === 2;
      }

      return true;
    });

    setScheme(fetchSchemeData[0] || {});
    return filtered;
  } catch (err) {
    console.error("Error fetching departments:", err);
    return [];
  }
}

async function enrichBeneficiariesWithBillData(items) {
  try {
    const uniqueBatchIds = [
      ...new Set(
        items.map((item) => String(item.batchID || "").trim()).filter(Boolean),
      ),
    ];

    if (uniqueBatchIds.length === 0) {
      return items;
    }

    const billEntries = await Promise.all(
      uniqueBatchIds.map(async (batchId) => {
        const billData = await fetchBillManagementByBatchId(batchId);
        return [batchId, billData];
      }),
    );

    const billDataMap = Object.fromEntries(billEntries);

    return items.map((item) => {
      const batchId = String(item.batchID || "").trim();
      const billData = billDataMap[batchId];

      if (!billData) {
        return item;
      }

      return {
        ...item,
        allocatedAmount: billData.allocatedAmount || item.allocatedAmount || "",
        ddoCode: billData.ddoCode || item.ddoCode || "",
        billNumber: billData.billNumber || item.billNumber || "",
        billStatus: billData.billStatus || item.billStatus || "",
      };
    });
  } catch (error) {
    console.error("Error enriching beneficiaries with bill data:", error);
    return items;
  }
}

async function fetchBillManagementByBatchId(batchId) {
  try {
    const response = await fetch(
      `/o/c/billmanagements?page=1&pageSize=20&search=${encodeURIComponent(batchId)}`,
      {
        method: "GET",
        headers: buildHeaders(),
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch bill management: ${response.status}`);
    }

    const data = await response.json();
    return data.items?.[0] || null;
  } catch (error) {
    console.error(
      `Error fetching bill management for batch ${batchId}:`,
      error,
    );
    return null;
  }
}

async function fetchSchemeById(schemeId) {
  try {
    const response = await fetch(`/o/c/schemeconfigurators/${schemeId}`, {
      method: "GET",
      headers: buildHeaders(),
      credentials: "include",
    });
    if (!response.ok) return [];
    const data = await response.json();
    return [data];
  } catch (err) {
    console.error("Error fetching scheme by id:", err);
    return [];
  }
}

export async function fetchSchemeName(departmentId, schemeName) {
  try {
    const response = await fetch(
      `/o/c/schemeconfigurators/?filter=schemeName eq '${schemeName}'`,

      {
        method: "GET",
        headers: buildHeaders(),
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch scheme names: ${response.status}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (err) {
    console.error("Error fetching scheme names:", err);
    return [];
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
        headers: buildHeaders(),
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
