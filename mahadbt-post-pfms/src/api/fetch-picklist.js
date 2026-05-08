import { buildHeaders } from "../config";

export async function getPicklistDefinitionByExternalReferenceCode(externalReferenceCode) {
  try {
   
    const response = await fetch(
      `/o/headless-admin-list-type/v1.0/list-type-definitions/by-external-reference-code/${externalReferenceCode}`,
      {
        method: "GET",
        headers: buildHeaders(),
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