import { buildCreds, buildHeaders } from "../config";
import { getAccessToken } from "./auth";



// Utility function to fetch user roles from Liferay
export const getUserRolesById = async (userId) => {
  try {
    const response = await fetch(
      `/o/headless-admin-user/v1.0/user-accounts/${userId}`,
      {
    
        headers: buildHeaders(),
        credentials: buildCreds(),
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch user roles');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return null;
  }
};


// Fetch districts by stateId
export async function fetchOfficeDetails(office_type, userId) {
  try {

    const response = await fetch(
      `/o/c/apluserofficemaps?filter=liferayUserId eq '${userId}'`,
      {
        headers: buildHeaders(),
        credentials: buildCreds(),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch offices: ${response.status}`);
    }

    const data = await response.json();


    return data.items?.[0] || {};
  } catch (error) {
    console.error("Error fetching offices:", error);
    return {};
  }
}

 

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


// const buildHeaders = () => ({
//   Accept: "application/json",
//   "Content-Type": "application/json",
//   Authorization: "Basic " + btoa("prabhudasu:root"),
//   // "x-csrf-token": window.Liferay?.authToken || ""

// });

// const buildCreds = () => "include";

export async function getStates() {
  try {
    let allItems = [];
    let page = 1;
    let pageSize;


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
        headers: buildHeaders(),
        credentials: buildCreds(),
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



