import { getCsrfToken } from "../utils/liferay";
import { getAccessToken } from "./auth";


export async function getPicklistEntriesByExternalReferenceCode(erc) {
  // const token = await getAccessToken();

  // 1️⃣ Get Definition
  const defRes = await fetch(
    `/o/headless-admin-list-type/v1.0/list-type-definitions/by-external-reference-code/${erc}`,
    {
      headers: {
        //Authorization: `Bearer ${token}`
        "Content-Type": "application/json",
        "X-CSRF-Token": getCsrfToken(),
      },
      credentials: "include",
    },
  );

  console.log("Definition API Response Status:", defRes.status, erc);
  if (!defRes.ok) throw new Error("Definition fetch failed");
  const def = await defRes.json();

  // 2️⃣ Get Entries
  const entriesRes = await fetch(
    `/o/headless-admin-list-type/v1.0/list-type-definitions/${def.id}/list-type-entries?pageSize=200`,
    {
      headers: {
        // Authorization: `Bearer ${token}`
        "Content-Type": "application/json",
        "X-CSRF-Token": getCsrfToken(),
      },
      credentials: "include",
    },
  );
console.log("Entries API Response Status:", entriesRes.status, erc);
  if (!entriesRes.ok) throw new Error("Entries fetch failed");

  return await entriesRes.json();
}


export async function getPicklistEntriesByExternalReferenceCodeV2(erc) {
  // const token = await getAccessToken();

 

  // 2️⃣ Get Entries
  const entriesRes = await fetch(
    `/o/headless-admin-list-type/v1.0/list-type-definitions/by-external-reference-code/${erc}/list-type-entries`,
    {
      headers: {
        // Authorization: `Bearer ${token}`
        "Content-Type": "application/json",
        "X-CSRF-Token": getCsrfToken(),
      },
      credentials: "include",
    },
  );

  if (!entriesRes.ok) throw new Error("Entries fetch failed");

  return await entriesRes.json();
}

export async function getPicklistEntriesByExternalReferenceCodeV3(erc) {
  const response = await fetch(
    `/o/headless-admin-list-type/v1.0/list-type-definitions/by-external-reference-code/${erc}/list-type-entries`,
    {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "X-CSRF-Token": getCsrfToken(),
      },
      credentials: "include", // VERY IMPORTANT
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error("API Error:", err, erc);
    throw new Error("Entries fetch failed");
  }

  return response.json();
}