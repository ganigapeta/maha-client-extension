import { getAccessToken } from './auth';

const buildHeaders = () => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  Authorization: "Basic " + btoa("prabhudasu:root"),
  //Authorization: `Bearer ${token}`,

  // "x-csrf-token": window.Liferay?.authToken || ""

});

const buildCreds = () => "include"; // or "omit" based on your needs

export async function getUserRolesById(userId) {
  try {
    const token = await getAccessToken();

    const response = await fetch(
      `/o/headless-admin-user/v1.0/user-accounts/${userId}`,
      {
        headers: buildHeaders(),
        credentials: buildCreds(),
      }
    );
    console.log("Response of getUserRolesById::::::::::",response,"User::::::::::::::",userId);
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