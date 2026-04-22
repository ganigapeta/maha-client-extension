import { getAccessToken } from "./auth";
import { getCsrfToken } from "../utils/liferay";
// import { fetchObjectName } from "./save-update-api";
const OBJECT_API_URL = "/o/c/universityotherfeeses/"; // your Object REST endpoint
const UPLOAD_API = "/o/headless-delivery/v1.0"; // ✅ added missing constant



const buildHeaders = () => ({
  Accept: "application/json",
  "Content-Type": "application/json",
   "Authorization": "Basic " + btoa("prabhudasu:root")
});

const safeApiErrorMessage = (errorText, fallbackMessage) => {
  const text = String(errorText || "").trim();
  if (!text) {
    return fallbackMessage;
  }

  const looksLikeHtml =
    /^<!doctype html/i.test(text) || /^<html[\s>]/i.test(text) || /<[^>]+>/.test(text);

  return looksLikeHtml ? fallbackMessage : text;
};

export async function fetchSchoolLiferayUserByEmail(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) {
    return null;
  }

  const escapedEmail = normalizedEmail.replace(/'/g, "''");
  const response = await fetch(
    `/o/headless-admin-user/v1.0/user-accounts?filter=${encodeURIComponent(
      `emailAddress eq '${escapedEmail}'`
    )}`,
    {
      method: "GET",
       headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
           "Authorization": "Basic " + btoa("prabhudasu:root")
        },
      credentials: "omit",
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to find user by email.`);
  }

  const data = await response.json();
  return Array.isArray(data?.items) && data.items.length ? data.items[0] : null;
}


export async function updateSchoolEntry(schoolId, payload) {
  const parsedSchoolId = Number(schoolId);
  if (!Number.isInteger(parsedSchoolId) || parsedSchoolId <= 0) {
    throw new Error("Invalid school ID for update");
  }

  const response = await fetch(`/o/c/namankitschoolprofiles/${parsedSchoolId}`, {
    method: "PATCH",
    headers: buildHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(safeApiErrorMessage(errorText, apiFallbackMessages.updateSchool));
  }

  return response.json();
}

export async function assignSchoolRoleToUserAccount(userId, roleId) {
  const parsedRoleId = Number(roleId);

  if (!Number.isInteger(parsedRoleId) || parsedRoleId <= 0) {
    return false;
  }

  const res = await fetch(
    `/o/headless-admin-user/v1.0/roles/${parsedRoleId}/association/user-account/${userId}`,
    {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa("prabhudasu:root"),
        "Content-Type": "application/json"
      }
    }
  );

  // Already assigned
  if (res.status === 409) {
    return true;
  }

  if (!res.ok) {
    const err = await res.text();
    console.error("Assign Role Error:", res.status, err);
    throw new Error(safeApiErrorMessage(err, apiFallbackMessages.assignRole));
  }

  return true;
}
 

export async function saveSchoolMasterEntry(payload) {
  const response = await fetch("/o/c/namankitschoolprofiles", {
    method: "POST",
    headers: buildHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(safeApiErrorMessage(errorText, apiFallbackMessages.saveSchool));
  }

  return response.json();
}


const apiFallbackMessages = {
  emailCheck: "We could not verify this email right now. Please try again.",
  createUser: "We could not create the user account right now. Please try again.",
  deleteUser: "We could not delete the user right now. Please try again.",
  fetchRole: "We could not load the role list right now. Please try again.",
  assignRole: "We could not assign the role right now. Please try again.",
  saveSchool: "We could not save the school right now. Please try again.",
  updateSchool: "We could not update the school right now. Please try again.",
  saveSchoolInformation:
    "We could not save the school information right now. Please try again.",
  updateSchoolInformation:
    "We could not update the school information right now. Please try again.",
};

export async function saveUniversityFee(payload) {
  try {
    const token = await getAccessToken();
    if (!token) throw new Error("Token not available");

    // 1. GET Object Definition (returns full object with restContextPath)
    const objectDef = await fetchObjectName('2845293');
    console.log("Object Definition:", objectDef);

    if (!objectDef?.restContextPath) {
      throw new Error("Invalid object definition or missing restContextPath");
    }

    const url = objectDef.restContextPath;

 
  
    // 3. Save primary object entry
    console.log("POST Request to:", url);
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-CSRF-Token": getCsrfToken()
      },
      credentials: "include",
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let err = {};
      try { err = await response.json(); } catch (e) {}
      throw new Error(err.title || "Save failed");
    }

    const result = await response.json();
    console.log("Created Entry:", result);
    
   return result;

  } catch (error) {
    console.error("Save User Error:", error);
    throw error;
  }
}


export async function fetchObjectName(objectDefinitionId) {
  try {
     const token = await getAccessToken();
     if (!token) throw new Error("Token not available");

    if (!objectDefinitionId) {
      throw new Error("objectDefinitionId is required");
    }

    // Basic auth (same working method)
    const response = await fetch(
      `/o/object-admin/v1.0/object-definitions/${objectDefinitionId}`,
      {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        credentials: "omit"
      }
    );

    if (!response.ok) {
      let err = {};
      try { err = await response.json(); } catch(e) {}
      console.error("Error fetching Object Definition:", err);
      throw new Error(err.title || "Failed to fetch object definition");
    }

    return await response.json();

  } catch (error) {
    console.error("fetchObjectName Error:", error);
    throw error;
  }
}

export async function createSchoolLiferayUserAccount(payload) {
  const response = await fetch("/o/headless-admin-user/v1.0/user-accounts", {
    method: "POST",
     headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
           "Authorization": "Basic " + btoa("prabhudasu:root")
        },
    credentials: "omit",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(
      safeApiErrorMessage(errorText, apiFallbackMessages.createUser)
    );
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function deleteSchoolLiferayUserAccount(userId) {
  const parsedUserId = Number(userId);
  if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
    return false;
  }
  const response = await fetch(`/o/headless-admin-user/v1.0/user-accounts/${parsedUserId}`, {
    method: "DELETE",
    headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
           "Authorization": "Basic " + btoa("prabhudasu:root")
        },
    credentials: "omit",
  });

  if (response.status === 404) {
    return true;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(safeApiErrorMessage(errorText, apiFallbackMessages.deleteUser));
  }

  return true;
}

export async function fetchSchoolRoleByName(roleName) {
  const normalizedName = String(roleName || "").trim();
  if (!normalizedName) {
    return null;
  }
  const pageSize = 200;
  let page = 1;
  const allRoles = [];

  while (true) {
    const response = await fetch(
      `/o/headless-admin-user/v1.0/roles?page=${page}&pageSize=${pageSize}`,
      {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
           "Authorization": "Basic " + btoa("prabhudasu:root")
        },
        credentials: "omit",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        safeApiErrorMessage(errorText, apiFallbackMessages.fetchRole)
      );
    }

    const data = await response.json();
    const items = Array.isArray(data?.items) ? data.items : [];
    allRoles.push(...items);

    const lastPage = Boolean(data?.lastPage);
    if (lastPage || items.length < pageSize) {
      break;
    }

    page += 1;
  }

  const normalizedTarget = normalizedName.toLowerCase();
  const exactMatch = allRoles.find(
    (item) =>
      String(item?.name || "").trim().toLowerCase() === normalizedTarget &&
      String(item?.roleType || "").trim().toLowerCase() === "regular"
  );

  return exactMatch || null;
}



