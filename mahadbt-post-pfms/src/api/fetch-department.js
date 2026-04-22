export async function fetchDepartmentsBasedOnRoles(roleIds) {
  try {

    // Create filter for multiple roles
    const filter = roleIds
      .map(role => `contains(roles,'${role.id}')`)
      .join(" or ");

    const response = await fetch(
      `/o/c/departments/?filter=${encodeURIComponent(filter)}`,
      {
        method: "GET",
        headers: {
         "Accept": "application/json",
          "Content-Type": "application/json",
          "x-csrf-token": window.Liferay?.authToken || "" 
        },
        credentials: "include"
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch departments: ${response.status}`);
    }

    const data = await response.json();
    return data.items;

  } catch (error) {
    console.error("Error fetching departments:", error);
    return [];
  }
}