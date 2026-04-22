import { getCsrfToken } from '../utils/liferay';
import { getAccessToken } from './auth';

// Fetch List Type Definition by External Reference Code
export async function getPicklistDefinitionByExternalReferenceCode(externalReferenceCode) {
  try {
   
    // const token = await getAccessToken();
    // if (!token) throw new Error("Access token not available");
    
    const response = await fetch(
      `/o/headless-admin-list-type/v1.0/list-type-definitions/by-external-reference-code/${externalReferenceCode}`,
      {
        method: "GET",
        headers: {
          // Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken()
        },
        credentials: "include"
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Picklist: ${response.status}`);
    }
    const data = await response.json();
    return data || [];

  } catch (error) {
    console.error("Error fetching Picklist:", error);
    return [];
  }
}

export async function getPicklistEntriesByExternalReferenceCode(erc) {
  const token = await getAccessToken();

  // 1️⃣ Get Definition
  const defRes = await fetch(
    `/o/headless-admin-list-type/v1.0/list-type-definitions/by-external-reference-code/${erc}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!defRes.ok) throw new Error("Definition fetch failed");
  const def = await defRes.json();

  // 2️⃣ Get Entries
  const entriesRes = await fetch(
    `/o/headless-admin-list-type/v1.0/list-type-definitions/${def.id}/list-type-entries?pageSize=200`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!entriesRes.ok) throw new Error("Entries fetch failed");

  return await entriesRes.json();
}

export async function findNonRepeatableMasterData(
  attrObj,
  value,
  typeOfAttribute
) {
  try {
    if (
      typeOfAttribute !== "master" ||
      !attrObj?.nonRelation ||
      !attrObj?.mappedTable ||
      !value
    ) {
      return [];
    }

    const filter = `${attrObj.nonRelation} eq '${value}'`;

    const masterData = await getAllObjectDataByUsingObjectName(
      attrObj.mappedTable,
      filter
    );

    return Array.isArray(masterData) ? masterData : [];
  } catch (error) {
    console.error("Error in findNonRepeatableMasterData:", error);
    return [];
  }
}


export async function findRepeatableMasterData(
 originalKey,cleanKey,mappingTableObj,value
) {
  try {
   const suffix = originalKey.match(/dup\d+$/)?.[0] || null;
   
    if(mappingTableObj.nonRelation!=="" && mappingTableObj.mappedTable!=="" && mappingTableObj.nextElement!==""){
      const filter = `${mappingTableObj.nonRelation} eq '${value}'`;
      const masterData = await getAllObjectDataByUsingObjectName(
        mappingTableObj.mappedTable,
        filter
      );
      return {
        masterData: Array.isArray(masterData) ? masterData : [],
        nextElement: mappingTableObj.nextElement + suffix
      }
    }else{
      return {
        masterData:[],
        nextElement:""
      }
    }
      
  } catch (error) {
    console.error("Error in findNonRepeatableMasterData:", error);
    return {
        masterData:[],
        nextElement:""
      }
  }
}

// export async function getPicklistDefinitionByExternalReferenceCode(externalReferenceCode) {
//   try {
//     // Use Basic Auth with soham:Test credentials
//     const username = "soham";
//     const password = "Test";
//     const credentials = btoa(`${username}:${password}`);
    
//     const response = await fetch(
//       `/o/headless-admin-list-type/v1.0/list-type-definitions/by-external-reference-code/${externalReferenceCode}`,
//       {
//         method: "GET",
//         headers: {
//           Authorization: `Basic ${credentials}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error(`Failed to fetch Picklist ${externalReferenceCode}:`, response.status, errorText);
//       throw new Error(`Failed to fetch Picklist: ${response.status}`);
//     }
    
//     const data = await response.json();
//     return data || [];

//   } catch (error) {
//     console.error("Error fetching Picklist:", error);
//     return [];
//   }
// }

// Generic fetch for all object data
// export async function getAllObjectDataByUsingObjectName(objectName) {
//   try {
//     const token = await getAccessToken();
//     if (!token) throw new Error("Access token not available");

//     let allItems = [];
//     let page = 1;
//     let pageSize;

//     while (true) {
//       const response = await fetch(`/o/c/${objectName}?page=${page}${pageSize ? `&pageSize=${pageSize}` : ''}`, {
//         method: "GET",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       });

//       if (!response.ok) {
//         throw new Error(`Failed to fetch data for ${objectName}: ${response.status}`);
//       }

//       const data = await response.json();

//       // set pageSize dynamically from API if first call
//       if (!pageSize) pageSize = data.pageSize || 20;

//       allItems = allItems.concat(data.items || []);

//       if (page >= data.lastPage) break;
//       page++;
//     }

//     return allItems;
//   } catch (error) {
//     console.error(`Error fetching data for ${objectName}:`, error);
//     return [];
//   }
// }


// Generic fetch for all object data
export async function getAllObjectDataByUsingObjectName(objectName, relation) {
  try {
    // const token = await getAccessToken();
    // if (!token) throw new Error("Access token not available");

    let allItems = [];
    let page = 1;
    let pageSize = 100;
    while (true) {
      // Build base URL
      let url = `/o/c/${objectName}?page=${page}`;
      if (pageSize) url += `&pageSize=${pageSize}`;
      if (relation) {
        // Encode the filter parameter properly
        const encodedRelation = encodeURIComponent(relation);
        url += `&filter=${encodedRelation}`;
      }
      //const response = await fetch(`/o/c/${objectName}?page=${page}${pageSize ? `&pageSize=${pageSize}` : ''}`, {
      const response = await fetch(url, {  
      method: "GET",
        headers: {
          // Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
         "X-CSRF-Token": getCsrfToken()

        },
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch data for ${objectName}: ${response.status}`);
      }

      const data = await response.json();

      // set pageSize dynamically from API if first call
      if (!pageSize) pageSize = data.pageSize || 20;

      allItems = allItems.concat(data.items || []);

      if (page >= data.lastPage) break;
      page++;
    }

    return allItems;
  } catch (error) {
    console.error(`Error fetching data for ${objectName}:`, error);
    return [];
  }
}


// export async function fetchCasteByCasteCategory(casteCategoryId) {
//   try {
//     const token = await getAccessToken();
//     if (!token) throw new Error("Token not available");

//     const response = await fetch(
//       `/o/c/castemasters?filter=r_casteCategory_c_casteCategoryMasterId eq '${casteCategoryId}'`,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     if (!response.ok) {
//       throw new Error(`Failed to fetch Caste Category : ${response.status}`);
//     }

//     const data = await response.json();
//     return data.items || [];
//   } catch (error) {
//     console.error("Error fetching Caste Category:", error);
//     return [];
//   }
// }

export async function getObjectByFilter(objectName, field = "id", value) {
  try {
    if (!objectName) throw new Error("Object name is required");
    if (!value) throw new Error("Filter value is required");

    const url = `/o/c/${objectName}/?filter=${field} eq '${value}'`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: "Basic " + btoa("soham:Test"),
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      let err = {};
      try { err = await response.json(); } catch (e) {}
      console.error("API Error:", err);
      throw new Error(err.title || "Failed to fetch data");
    }

    const data = await response.json();

    return data.items?.length ? data.items[0] : null;

  } catch (error) {
    console.error("getObjectByFilter Error:", error);
    throw error;
  }
}


// Fetch districts by stateId
// export async function fetchDistrictsByState(stateId) {
//   try {
//     const token = await getAccessToken();
//     if (!token) throw new Error("Token not available");

//     const response = await fetch(
//       `/o/c/districtmasters?filter=r_state_c_stateMasterId eq '${stateId}'`,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     if (!response.ok) {
//       throw new Error(`Failed to fetch districts: ${response.status}`);
//     }

//     const data = await response.json();
//     return data.items || [];
//   } catch (error) {
//     console.error("Error fetching districts:", error);
//     return [];
//   }
// }

// Fetch talukas by districtId
// export async function fetchTalukasByDistrict(districtId) {
//   try {
//     const token = await getAccessToken();
//     if (!token) throw new Error("Token not available");

//     const response = await fetch(
//       `/o/c/talukamasters?filter=r_district_c_districtMasterId eq '${districtId}'`,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     if (!response.ok) {
//       throw new Error(`Failed to fetch talukas: ${response.status}`);
//     }

//     const data = await response.json();
//     return data.items || [];
//   } catch (error) {
//     console.error("Error fetching talukas:", error);
//     return [];
//   }
// }


