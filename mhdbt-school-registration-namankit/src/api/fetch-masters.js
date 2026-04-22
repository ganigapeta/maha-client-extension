import { MOCK_STATES, simulateMockAPI } from "../schools/mockData";
import { getAccessToken } from "./auth";

const useMockData = false; // Set to true to use mock data instead of real API calls
export async function getDepartment() {
  try {
    const response = await fetch(`/o/c/departments`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-csrf-token": window.Liferay?.authToken || "",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Object definition API failed: ${response.status}`);
    }

    const data = await response.json();
    const items = data.items || [];
    return items.filter((item) => item?.status?.code === 0);
  } catch (error) {
    console.error("Error fetching object definition:", error);
    return [];
  }
}


const buildHeaders = () => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  Authorization: "Basic " + btoa("prabhudasu:root"),
  // "x-csrf-token": window.Liferay?.authToken || ""

});

const buildCreds = () => "include";

export async function getStates() {
  try {
    let allItems = [];
    let page = 1;
    let pageSize;

    if (useMockData) {
      return simulateMockAPI(MOCK_STATES);
    }

    while (true) {
      let url = `/o/c/states?page=${page}`;

      if (pageSize) {
        url += `&pageSize=${pageSize}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: buildHeaders(),
        credentials: buildCreds(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch states: ${response.status}`);
      }

      const data = await response.json();

      // Set pageSize dynamically from API response
      if (!pageSize) {
        pageSize = data.pageSize || 20;
      }

      const items = data.items || [];

      // Optional: filter like colleges (if needed)
      allItems = allItems.concat(items);

      // Stop when last page reached
      if (page >= data.lastPage) break;

      page++;
    }

    return allItems;
  } catch (error) {
    console.error("Error fetching states:", error);
    return [];
  }
}

// Fetch districts by stateId
export async function fetchDistrictsByState(stateId) {
  let allDistricts = [];
  let page = 1;
  let hasMore = true;

  try {
    while (hasMore) {
      const response = await fetch(
        `/o/c/districts?filter=r_state_c_stateId eq '${stateId}'&page=${page}&pageSize=200`,
        {
          headers: buildHeaders(),
          credentials: buildCreds(),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed at page ${page}`);
      }

      const data = await response.json();
      allDistricts = [...allDistricts, ...(data.items || [])];

      hasMore = data.items && data.items.length > 0;
      page++;
    }

    return allDistricts;
  } catch (error) {
    console.error("Error fetching districts:", error);
    return [];
  }
}

// Fetch talukas by districtId
export async function fetchTalukasByDistrict(districtId) {
  try {
    const response = await fetch(
      `/o/c/talukas?filter=r_district_c_districtId eq '${districtId}'`,
      {
        headers: buildHeaders(),
        credentials: buildCreds(),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch talukas: ${response.status}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Error fetching talukas:", error);
    return [];
  }
}

// Fetch districts by stateId
export async function fetchVillagesByTaluka(stateId) {
  try {
    const response = await fetch(
      `/o/c/villages?filter=r_taluka_c_talukaId eq '${stateId}'`,
      {
        headers: buildHeaders(),
        credentials: buildCreds(),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch districts: ${response.status}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Error fetching districts:", error);
    return [];
  }
}

export async function fetchPOByTaluka(stateId) {
  try {
    const response = await fetch(
      `/o/c/villages?filter=r_taluka_c_talukaId eq '${stateId}'`,
      {
        headers: buildHeaders(),
        credentials: buildCreds(),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch districts: ${response.status}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Error fetching districts:", error);
    return [];
  }
}

export async function getColleges() {
  try {
    const response = await fetch(`/o/c/colleges`, {
      method: "GET",

      headers: buildHeaders(),
      credentials: buildCreds(),
    });

    if (!response.ok) {
      throw new Error(`Object definition API failed: ${response.status}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Error fetching object definition:", error);
    return [];
  }
}
export async function getUniversity() {
  try {
    const response = await fetch(`/o/c/universities`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-csrf-token": window.Liferay?.authToken || "",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Object definition API failed: ${response.status}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Error fetching object definition:", error);
    return [];
  }
}

export async function getPicklistByERC(erc) {
  try {
    const response = await fetch(
      `/o/headless-admin-list-type/v1.0/list-type-definitions/by-external-reference-code/${erc}/list-type-entries`,
      {
        method: "GET",
        headers: {
          Authorization: "Basic " + btoa("prabhudasu:root"),
        },
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch picklist: ${response.status}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Error fetching picklist:", error);
    return [];
  }
}

export async function creatingEntry(payload) {
  try {
    const token = await getAccessToken();
    if (!token) throw new Error("Access token unavailable.");
    // const response = await fetch("/o/c/instituteregistrationdetailses", {
    const response = await fetch("/o/c/colleges", {
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
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create entry");
    }

    const data = await response.json();
    return data; // API response (e.g., created entry, application number)
  } catch (e) {
    console.error("Error creating entry:", e);
    throw e;
  }
}

// ── Update function (PUT) ──────────────────────────────────────────────
export async function updateEntry(id, payload) {
  try {
    const username = "prabhudasu";
    const password = "root";
    const response = await fetch(`/o/c/colleges/${id}`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(`${username}:${password}`),
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update entry");
    }

    const data = await response.json();
    return data;
  } catch (e) {
    console.error("Error updating entry:", e);
    throw e;
  }
}

export async function checkEmailExists(email) {
  const res = await fetch(
    `/o/headless-admin-user/v1.0/user-accounts?filter=emailAddress eq '${email}'`,
    {
      method: "GET",
      // headers: {
      //   "Accept": "application/json",
      //   "Content-Type": "application/json",
      //   "x-csrf-token": window.Liferay?.authToken || ""
      // },
      // credentials: "include"
      headers: {
        Authorization: "Basic " + btoa("prabhudasu:root"),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
  );

  if (!res.ok) {
    throw new Error("Failed to fetch users");
  }

  const data = await res.json();

  return data.totalCount > 0;
}

export async function checkAisheCode(aisheCode) {
  try {
    const formattedCode = aisheCode.trim().toUpperCase();

    const res = await fetch(
      `/o/c/colleges/?filter=${encodeURIComponent(
        `aisheCode eq '${formattedCode}'`,
      )}`,
      // const res = await fetch(
      //   `/o/c/colleges/?filter=${encodeURIComponent(
      //     `aisheCode eq '${aisheCode}'`
      //   )}`,
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

    if (!res.ok) {
      throw new Error("Failed to fetch colleges");
    }

    const data = await res.json();
    console.log("AISHE Code Check Response:", data);
    const items = data.items || [];
    return items.some((item) => item?.status?.code === 0);
  } catch (error) {
    console.error("Error checking AISHE Code:", error);
    return false; // fallback
  }
}

export async function getCollegeByAisheCode(aisheCode) {
  try {
    const res = await fetch(
      `/o/c/colleges/?filter=${encodeURIComponent(
        `aisheCode eq '${aisheCode}'`,
      )}`,
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

    if (!res.ok) {
      throw new Error("Failed to fetch colleges");
    }

    const data = await res.json();
    const items = data.items || [];
    return items.find((item) => item?.status?.code === 0) || null;
  } catch (error) {
    console.error("Error fetching college by AISHE Code:", error);
    return null;
  }
}

export async function createAisheEntry(payload) {
  try {
    const response = await fetch(`/o/c/aishes`, {
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
      throw new Error(
        errorText || `Failed to create AISHE entry: ${response.status}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating AISHE entry:", error);
    throw error;
  }
}

export async function getAllColleges() {
  try {
    let allItems = [];
    let page = 1;
    let pageSize;

    while (true) {
      let url = `/o/c/colleges?page=${page}&filter=${encodeURIComponent(
        "mahaApplicationId ne ''",
      )}`;

      if (pageSize) {
        url += `&pageSize=${pageSize}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-csrf-token": window.Liferay?.authToken || "",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch colleges: ${response.status}`);
      }

      const data = await response.json();

      if (!pageSize) {
        pageSize = data.pageSize || 20;
      }

      const items = data.items || [];
      allItems = allItems.concat(
        items.filter((item) => item?.status?.code === 0),
      );

      if (page >= data.lastPage) break;

      page++;
    }

    return allItems;
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
}

// export async function getCollegesData(stateId, districtId, name) {
//   try {

//     let filters = [];

//     if (districtId) {
//       filters.push(`districtId eq '${districtId}'`);
//     }

//     if (stateId) {
//       filters.push(`stateId eq ${Number(stateId)}`);
//     }

//     if (name && name.trim() !== "") {
//       filters.push(`name eq '${name.trim()}'`);
//     }

//     const filterQuery = filters.join(" and ");

//     const url = filterQuery
//       ? `/o/c/colleges/?filter=${encodeURIComponent(filterQuery)}`
//       : `/o/c/colleges`;

//     console.log("Final URL:", url); // 🔎 Debug

//     const response = await fetch(url, {
//       method: "GET",
//       headers: {
//         Accept: "application/json",
//         "Content-Type": "application/json",
//         "x-csrf-token": window.Liferay?.authToken || "",
//       },
//       credentials: "include",
//     });

//     if (!response.ok) {
//       const err = await response.json();
//       console.error("API Error:", err);
//       throw new Error("API failed");
//     }

//     const data = await response.json();
//     return data.items || [];

//   } catch (error) {
//     console.error("Error fetching colleges:", error);
//     return [];
//   }
// }

export async function getCollegesData(stateId, districtId, name) {
  try {
    let filters = [];

    // District (string field)
    if (districtId) {
      filters.push(`districtId eq '${districtId}'`);
    }

    // State (number field)
    if (stateId) {
      filters.push(`stateId eq ${Number(stateId)}`);
    }

    // Name (partial search using contains)
    if (name && name.trim() !== "") {
      const cleanName = name.trim().replace(/'/g, "''"); // escape single quotes
      filters.push(`contains(name,'${cleanName}')`);
    }

    const filterQuery = filters.join(" and ");

    const url = filterQuery
      ? `/o/c/colleges/?filter=${encodeURIComponent(filterQuery)}`
      : `/o/c/colleges`;

    console.log("Final URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-csrf-token": window.Liferay?.authToken || "",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("API Error:", err);
      throw new Error("API failed");
    }

    const data = await response.json();
    const items = data.items || [];
    return items.filter(
      (item) => item?.status?.code === 0 || item?.status?.code === 6,
    );
  } catch (error) {
    console.error("Error fetching colleges:", error);
    return [];
  }
}
