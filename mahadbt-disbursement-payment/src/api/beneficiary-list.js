// export async function fetchBeneficiaryList(data,setApiRes) {
//     try {
//       const departmentId = data.departmentName?.split("_")[0];
//       const schemeName = data.schemeName?.split("_")[1];
//       const fetchSchemeData=await fetchSchemeName(departmentId, schemeName);
//       console.log("Scheme Data based on Department and Scheme Name::::", fetchSchemeData);
//       const objectDef = await fetchObjectInfo(fetchSchemeData[0].targetObjectDefinitionId);
//       console.log("Object Definition:", objectDef);
//        if (!objectDef?.restContextPath) {
//       throw new Error("Invalid object definition or missing restContextPath");
//     }
//     const url = objectDef.restContextPath;
//     const response = await fetch(
//         `${url}?filter=financialyear eq '${data.financialYear}' and status eq 1`,
//             {
//                 method: "GET",
//                 headers: {
//                     "Accept": "application/json",
//                     "Content-Type": "application/json",
//                     "x-csrf-token": window.Liferay?.authToken || ""
//                 },
//                 credentials: "include"
//             }
//         );
//         const result = await response.json();
//         console.log("Beneficiary List:", result);
//         setApiRes(fetchSchemeData[0] || {});
//         return result.items || [];
//     } catch (err) {
//       console.error('Error fetching departments:', err);
//       return [];
//     }
// }

export async function fetchBeneficiaryList(data, setApiRes) {
  try {
    console.log("data in fetchBeneficiaryList ::::::::::::", data);
    const schemeDataList = await fetchSchemeData(data);
    console.log("Scheme Data:", schemeDataList);

    if (!schemeDataList || schemeDataList.length === 0) {
      console.warn("No scheme data found");
      return [];
    }

    const schemeData = schemeDataList[0];

    const objectDef = await fetchObjectInfo(
      schemeData.targetObjectDefinitionId,
    );

    console.log("Object Definition:", objectDef);

    if (!objectDef?.restContextPath) {
      throw new Error("Invalid object definition or missing restContextPath");
    }

    const url = objectDef.restContextPath;

    const response = await fetch(
      `${url}?filter=financialyear eq '${data.financialYear}' and status eq 0`,
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
      throw new Error(`Failed to fetch beneficiary list: ${response.status}`);
    }

    const result = await response.json();
    console.log("Beneficiary List::::::::::::", result);

    setApiRes((prev) => ({
      ...prev,
      schemeData: schemeData,
    }));

    let applicationAllotmentDetailsID =
      schemeData?.applicationAllotmentDetailsID;

    if (!applicationAllotmentDetailsID) {
      throw new Error("AllotmentBenefitsDetailsID is missing");
    }

    const objectDef1 = await fetchObjectInfo(applicationAllotmentDetailsID);
    const url1 = objectDef1?.restContextPath;
    console.log(
      "applicationAllotmentDetailsID:::::::",
      applicationAllotmentDetailsID,
      " :objectDef1:::",
      objectDef1,
      "  url1::::",
      url1,
    );

    const isPensionScheme =
      schemeData?.schemeType === "Pension Schemes" ||
      schemeData?.schemeType === "Special Assistance Schemes";

    const isLekLadkiInstallment = String(data?.installment || "").startsWith(
      "Installment",
    );
    const isMonthlyBenefitInstallment = String(
      data?.installment || "",
    ).startsWith("Monthly Benefit_");

    const filterAllotmentTable =
      (isPensionScheme && !isLekLadkiInstallment) || isMonthlyBenefitInstallment
        ? result?.items || []
        : await fetchAllotmentData(result?.items || [], url1, data);

    let responseDataAfterKpi = await getKipdashboardDataUsingEntryId(
      filterAllotmentTable || [],
      schemeData.scrutinyLogObjId,
      data.installment,
    );

    // Filter by specific month if Monthly Benefit month is selected
    if (data.installment?.startsWith("Monthly Benefit_")) {
      const [, monthName] = data.installment.split("_");
      const targetMonth = new Date(`${monthName} 1, 2000`).getMonth();

      responseDataAfterKpi = responseDataAfterKpi.filter((item) => {
        const date = new Date(item.dateCreated);
        return !isNaN(date.getTime()) && date.getMonth() === targetMonth;
      });
    }

    console.log("Beneficiary List with kpi", responseDataAfterKpi);

    const sortedData = responseDataAfterKpi?.length
      ? [...responseDataAfterKpi].sort(
          (a, b) =>
            new Date(a.kpiData?.dateModified || 0) -
            new Date(b.kpiData?.dateModified || 0),
        )
      : [];

    console.log("Sorted FIFO Data:", sortedData);

    return sortedData;
  } catch (err) {
    console.error("Error fetching beneficiary list:", err);
    return [];
  }
}

export async function getKipdashboardDataUsingEntryId(
  items,
  scrutinyLogObjId,
  selectedInstallment,
) {
  try {
    const updatedItems = await Promise.all(
      items.map(async (item) => {
        try {
          const response = await fetch(
            `/o/c/citizendashboardkpis?filter=objectEntryId eq ${item.id}`,
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
            throw new Error(`Error ${response.status}`);
          }

          const data = await response.json();
          const kpi = data.items?.[0] || null;

          let installment1 = 0;
          let installment2 = 0;

          // Extract benefitsJsonData safely
          let totalAmount = 0;

          if (kpi?.benefitsJsonData) {
            try {
              const benefits = JSON.parse(kpi.benefitsJsonData);

              const installments = benefits?.installments || {};
              const installmentKeys = Object.keys(installments);

              if (
                selectedInstallment &&
                selectedInstallment.startsWith("Installment") &&
                installments[selectedInstallment] !== undefined
              ) {
                installment1 = Number(installments[selectedInstallment]) || 0;
                installment2 = 0;
                totalAmount = installment1;
              } else {
                installment1 = installmentKeys
                  .filter(
                    (k) =>
                      k.includes("1") ||
                      k === "Monthly Benefit" ||
                      k === "One-time Interest Subsidy" ||
                      k === "Monthly Reimbursement",
                  )
                  .reduce((sum, k) => sum + (Number(installments[k]) || 0), 0);

                // Fallback: if installments is empty, sum all additionalBenefits (e.g. MVYS uses {allowance: 3000})
                if (installment1 === 0) {
                  const additionalBenefits = benefits?.additionalBenefits || {};
                  installment1 = Object.values(additionalBenefits).reduce(
                    (sum, v) => sum + (Number(v) || 0),
                    0,
                  );
                }

                installment2 = installmentKeys
                  .filter((k) => k.includes("2") && !k.includes("1"))
                  .reduce((sum, k) => sum + (Number(installments[k]) || 0), 0);

                totalAmount =
                  benefits?.totalAmount || installment1 + installment2;
              }
            } catch (e) {
              console.error("Invalid JSON", e);
            }
          }

          const scrutinyLogs = await getScrutinyLogsForEntry(
            item.id,
            scrutinyLogObjId,
          );

          // Extract approval dates based on typical role keywords
          // Institute approval = oldest log matching institute role (first approval)
          // Department approval = newest log matching department role (final approval)
          const instituteLogs = scrutinyLogs.filter((log) =>
            /clerk|principal|institute/i.test(log.scrutinyUserRole),
          );
          const departmentLogs = scrutinyLogs.filter((log) =>
            /dda|dpo|sno|department/i.test(log.scrutinyUserRole),
          );

          // Approval Date: first entry in scrutiny logs (first approval on application)
          // Institute/Department Approval Date: same as approval date (application approval date)
          const approvalDate =
            scrutinyLogs.length > 0
              ? scrutinyLogs[scrutinyLogs.length - 1].dateCreated
              : null;
          const instituteApprovalDate = approvalDate;

          return {
            ...item,
            kpiData: kpi,
            installment1,
            installment2,
            totalAmount,
            approvalDate,
            instituteApprovalDate,
          };
        } catch (err) {
          console.error(`Error fetching KPI for ID ${item.id}`, err);

          return {
            ...item,
            kpiData: null,
            installment1: 0,
            installment2: 0,
          };
        }
      }),
    );

    return updatedItems;
  } catch (error) {
    console.error("getKipdashboardDataUsingEntryId Error:", error);
    throw error;
  }
}

export function formatDate(dateString) {
  if (!dateString || dateString === "0" || dateString === 0) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime()) || date.getTime() === 0) return "-";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// export async function fetchAllotmentData(items, url,data) {
//   try {

//    if(data.installment==="2nd Installment"){
//      installmentStatus=1
//    }
//     const results = await Promise.all(
//       items.map(async (item) => {
//         try {
//           const response = await fetch(
//             `${url}?filter=applicationNo eq '${item.applicationreferencenumber}' and applicationState eq 'Bill Submitted'`,
//             {
//               method: "GET",
//               headers: {
//                 Accept: "application/json",
//                 "Content-Type": "application/json",
//                 "x-csrf-token": window.Liferay?.authToken || "",
//               },
//               credentials: "include",
//             }
//           );

//           if (!response.ok) {
//             throw new Error(`Error ${response.status}`);
//           }

//           const data = await response.json();
//           console.log("fetchAllotmentData data::::::::::",data)
//           //  Check if API returned items
//           if (data?.items && data.items.length > 0) {
//             return null;
//           }else{
//            return {
//               ...item,
//               // allotmentData: data.items
//             };
//           }

//         } catch (error) {
//           console.error("Error for item:", item, error);
//           return null;
//         }
//       })
//     );

//     //  Remove null values
//     const filteredItems = results.filter(item => item !== null);

//     return filteredItems;

//   } catch (error) {
//     console.error("Main Error:", error);
//     return [];
//   }
// }

export async function fetchAllotmentData(items, url, data) {
  try {
    const results = await Promise.all(
      items.map(async (item) => {
        try {
          const isLekLadkiInst = String(data?.installment || "").startsWith(
            "Installment",
          );
          const instNumber = isLekLadkiInst
            ? parseInt(
                data.installment.replace("Installment ", "").trim(),
                10,
              ) || 1
            : data.installment === "2nd Installment"
              ? 2
              : 1;

          // Build the base filter
          let filter = `applicationNo eq '${item.applicationreferencenumber}' and applicationState eq 'Bill Submitted'`;

          // For Lek Ladki 2+ or POM 2nd installment, add installmentStatus filter
          if (isLekLadkiInst && instNumber > 1) {
            filter += ` and installmentStatus eq ${instNumber - 1}`;
          } else if (data.installment === "2nd Installment") {
            filter += ` and installmentStatus eq 1`;
          }

          const response = await fetch(
            `${url}?filter=${encodeURIComponent(filter)}`,
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
            throw new Error(`Error ${response.status}`);
          }

          const responseData = await response.json();
          console.log("fetchAllotmentData data::::::::::", responseData);

          if (isLekLadkiInst) {
            if (instNumber === 1) {
              // Installment 1 — eligible if NO prior allotment exists
              return !responseData?.items || responseData.items.length === 0
                ? { ...item }
                : null;
            } else {
              // Installment 2+ — eligible if prior installment allotment exists
              if (responseData?.items && responseData.items.length > 0) {
                const validItems = responseData.items.filter(
                  (responseItem) =>
                    responseItem.installmentStatus === instNumber - 1,
                );
                return validItems.length > 0 ? { ...item } : null;
              }
              return null;
            }
          } else if (data.installment === "2nd Installment") {
            // POM 2nd installment — existing logic
            if (responseData?.items && responseData.items.length > 0) {
              const validItems = responseData.items.filter(
                (responseItem) => responseItem.installmentStatus === 1,
              );
              return validItems.length > 0 ? { ...item } : null;
            }
            return null;
          } else {
            // Original logic for other installments
            return responseData?.items && responseData.items.length > 0
              ? null
              : { ...item };
          }
        } catch (error) {
          console.error("Error for item:", item, error);
          return null;
        }
      }),
    );

    const filteredItems = results.filter((item) => item !== null);
    return filteredItems;
  } catch (error) {
    console.error("Main Error:", error);
    return [];
  }
}

export async function fetchSchemeData(item) {
  try {
    const schemeConfiguratorId = item?.schemeName?.split("_")?.[1] || 0;
    console.log("schemeId:::::", schemeConfiguratorId);
    if (!schemeConfiguratorId) {
      console.error("Invalid schemeConfiguratorId");
      return [];
    }

    const response = await fetch(
      `/o/c/schemeconfigurators/?filter=id eq '${schemeConfiguratorId}'`,
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
      throw new Error(`Failed to fetch scheme data: ${response.status}`);
    }

    const result = await response.json();

    return result?.items || [];
  } catch (err) {
    console.error("Error fetching scheme data:", err);
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

export async function getScrutinyLogsForEntry(entryId, scrutinyLogObjId) {
  try {
    if (!entryId || !scrutinyLogObjId) return [];

    const obj = await fetchObjectInfo(scrutinyLogObjId);
    if (!obj?.restContextPath) return [];

    const filter = encodeURIComponent(`schemeApplicationId eq '${entryId}'`);
    const url = `${obj.restContextPath}?filter=${filter}&sort=dateCreated:desc`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-csrf-token": window.Liferay?.authToken || "",
      },
      credentials: "include",
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.items || [];
  } catch (err) {
    console.error("Error fetching scrutiny logs:", err);
    return [];
  }
}

export async function checkBalanceApi(payload) {
  try {
    const response = await fetch(
      `/o/mhdbt-headless-service/v1.0/beams/check-balance`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-csrf-token": window.Liferay?.authToken || "",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      let err = {};
      try {
        err = await response.json();
      } catch (e) {}

      console.error("Error in checkBalance API:", err);
      throw new Error(err.title || "Failed to check balance");
    }

    return await response.json();
  } catch (error) {
    console.error("checkBalanceApi Error:", error);
    throw error;
  }
}

export async function getDDORecordUsingId(ddoMappingId) {
  try {
    const schemeId = ddoMappingId?.split("_")?.[0] || 0;
    console.log("schemeId:::::::", schemeId);
    const response = await fetch(
      `/o/c/ddoschememappings/?filter=id eq '${schemeId}'`,
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
      throw new Error(`Failed to fetch scheme mappings: ${response.status}`);
    }

    const data = await response.json();

    return data?.items[0] || [];
  } catch (err) {
    console.error("Error fetching scheme mappings:", err);
    return [];
  }
}
