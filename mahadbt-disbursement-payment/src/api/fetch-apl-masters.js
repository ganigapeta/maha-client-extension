import { buildCreds, buildHeaders } from "../config";


// Fetch districts by stateId
export async function fetchDistrictsByState(stateId) {
  let allDistricts = [];
  let page = 1;
  let hasMore = true;

  try {
    while (hasMore) {
      const response = await fetch(
        `/o/c/districts?filter=r_state_c_stateId eq '${stateId}'&page=${page}&pageSize=200&sort=name`,
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

      hasMore = allDistricts && allDistricts.length < data.totalCount;
      page++;
    }

    return allDistricts;
  } catch (error) {
    console.error("Error fetching districts:", error);
    return [];
  }
}