export async function fetchSchemeNameForDDO(departmentValue, setMasterData, roles) {
  try {
    const departmentId = departmentValue?.split("_")[0];
    if (!departmentId) return;

    // Map DDO role to schemeType
    const DDO_SCHEME_TYPE_MAP = {
      "pension ddo": "Pension Schemes",
      "assistance ddo": "Special Assistance Schemes",
      "stipend ddo": "Stipend",
      "pre matric ddo": "Pre Matric Scheme"
    };

    const roleNames = (roles || []).map(r => String(r?.name || "").toLowerCase().trim());
    const matchedEntry = Object.entries(DDO_SCHEME_TYPE_MAP).find(([ddo]) =>
      roleNames.some(r => r.includes(ddo))
    );

    let filter = `department eq '${departmentId}'`;
    if (matchedEntry) {
      filter += ` and schemeType eq '${matchedEntry[1]}'`;
    }

    const response = await fetch(
      `/o/c/schemeconfigurators?filter=${encodeURIComponent(filter)}&pageSize=50`,
      {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "x-csrf-token": window.Liferay?.authToken || ""
        },
        credentials: "include"
      }
    );

    const data = await response.json();
    setMasterData(prev => ({
      ...prev,
      schemeNames: (data.items || []).map(s => ({
        id: s.id,
        name: s.schemeName,
        code: s.schemeCode
      }))
    }));

  } catch (err) {
    console.error("Error fetching scheme names for DDO:", err);
    setMasterData(prev => ({ ...prev, schemeNames: [] }));
  }
}