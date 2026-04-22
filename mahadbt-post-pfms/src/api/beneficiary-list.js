export async function fetchBeneficiaryList(
  data,
  setScheme,
  isPensionOrAssistanceDDO = false,
) {
  try {
    const departmentId = data.departmentName?.split("_")[0];
    const schemeName = data.schemeName?.split("_")[1];
    const fetchSchemeData = await fetchSchemeName(departmentId, schemeName);
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
        `/o/c/billmanagements?filter=${encodeURIComponent(`schemeCode eq '${schemeCode}' and submittedStatus eq '${statusFilter}'`)}&pageSize=200`,
        {
          headers: {
            Accept: "application/json",
            "x-csrf-token": window.Liferay?.authToken || "",
          },
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
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-csrf-token": window.Liferay?.authToken || "",
      },
      credentials: "include",
    });
    const result = await response.json();
    console.log("Beneficiary List:", result);
    const enrichedItems = await enrichBeneficiariesWithBillData(
      result?.items || [],
    );
    setScheme(fetchSchemeData[0] || {});
    return enrichedItems;
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
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-csrf-token": window.Liferay?.authToken || "",
        },
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

export async function fetchSchemeName(departmentId, schemeName) {
  try {
    const response = await fetch(
      `/o/c/schemeconfigurators/?filter= schemeName eq '${schemeName}' and department eq '${departmentId}'`,
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
