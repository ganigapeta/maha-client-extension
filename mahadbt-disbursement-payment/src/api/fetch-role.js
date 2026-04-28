import { getAccessToken } from './auth';
export async function getUserRolesById(userId) {
  try {
    const token = await getAccessToken();

    const response = await fetch(
      `/o/headless-admin-user/v1.0/user-accounts/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "omit"
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