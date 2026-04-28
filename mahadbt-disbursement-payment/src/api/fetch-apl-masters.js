
const buildHeaders = () => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  Authorization: "Basic " + btoa("prabhudasu:root"),
  //Authorization: `Bearer ${token}`,

  // "x-csrf-token": window.Liferay?.authToken || ""

});

const buildCreds = () => "include"; // or "omit" based on your needs

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