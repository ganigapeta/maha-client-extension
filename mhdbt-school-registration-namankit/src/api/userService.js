import { getAccessToken } from './auth';

export async function getUserRolesById(userId) {
  try {

    const response = await fetch(
      `/o/headless-admin-user/v1.0/user-accounts/${userId}`,
      {
         headers: {
              // "Accept": "application/json",
              // "Content-Type": "application/json",
              // "x-csrf-token": window.Liferay?.authToken || ""
              Authorization: "Basic " + btoa("prabhudasu:root") 
            },
            credentials: "include"
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.status}`);
    }

    const userData = await response.json();

    // Extract role names
   
    return userData;
  } catch (err) {
    console.error("Error fetching user roles:", err);
    return [];
  }
}
