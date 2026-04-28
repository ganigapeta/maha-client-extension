const buildHeaders = () => ({
  Accept: "application/json",
  "Content-Type": "application/json",
   Authorization: "Basic " + btoa("prabhudasu:root"),
  //Authorization: `Bearer ${token}`,
  //"x-csrf-token": window.Liferay?.authToken || ""

});

const buildCreds = () => "include"; // or "omit" based on your needs

export async function getPicklistDefinitionByExternalReferenceCode(externalReferenceCode) {
  try {
   
    const response = await fetch(
      `/o/headless-admin-list-type/v1.0/list-type-definitions/by-external-reference-code/${externalReferenceCode}`,
      {
        method: "GET",
        headers: buildHeaders(),
        credentials: buildCreds()
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