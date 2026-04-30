import { buildCreds, buildHeaders } from "../config";

export async function fetchSchemeName(userId, setApiRes) {
  try {
    const response = await fetch(
      `/o/c/ddomasters/?filter=dDOUserID eq ${Number(userId)}`,
      {
        method: "GET",
        headers: buildHeaders(),
        credentials: buildCreds(),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch DDO master: ${response.status}`);
    }

    const data = await response.json();

    if (!data?.items || data.items.length === 0) {
      return [];
    }

    const ddoMappingId = data?.items[0]?.id || [];
    const ddoMaster = data?.items[0] || {};

    setApiRes((prev) => ({
      ...prev,
      ddoMaster: ddoMaster,
    }));

    const schemeMappings = await fetchSchemeNameDDOMapping(ddoMappingId);
    return schemeMappings;
  } catch (err) {
    console.error("Error fetching scheme names:", err);
    return [];
  }
}

export async function fetchSchemeNameDDOMapping(ddoMappingId) {
  try {
    const response = await fetch(
      `/o/c/ddoschememappings/?filter=r_dDOMapping_c_ddoMasterId eq '${ddoMappingId}'`,
      {
        method: "GET",
        headers: buildHeaders(),
        credentials: buildCreds(),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch scheme mappings: ${response.status}`);
    }

    const data = await response.json();

    return data?.items || [];
  } catch (err) {
    console.error("Error fetching scheme mappings:", err);
    return [];
  }
}

export async function getObjectName(objectName, field = "id", value) {
  try {
    if (!objectName) throw new Error("Object name is required");
    if (!value) throw new Error("Filter value is required");

    const url = `/o/c/${objectName}/?filter=${field} eq '${value}'`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: "Basic " + btoa("soham:Test"),
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      let err = {};
      try {
        err = await response.json();
      } catch (e) {}
      console.error("API Error:", err);
      throw new Error(err.title || "Failed to fetch data");
    }

    const data = await response.json();

    return data.items?.length ? data.items[0].name : null;
  } catch (error) {
    console.error("getObjectByFilter Error:", error);
    return null;
  }
}

export async function fetchSchemeNameByRole(roleNames) {
  try {
    const SNO_ROLES = [
      "pension sno",
      "assistance sno",
      "stipend sno",
      "pre matric sno",
    ];
    const isSnoRole =
      window.Liferay?.ThemeDisplay?.getUserRoles?.()?.some((role) =>
        SNO_ROLES.includes(role?.toLowerCase()),
      ) || false;

    const matchedRole = roleNames.find((name) =>
      SNO_ROLES.some((sno) => String(name).trim().toLowerCase().includes(sno)),
    );

    if (!matchedRole) return [];

    // Step 1: Get the roleschememappings record for this role
    const roleRes = await fetch(
      `/o/c/roleschememappings/?filter=roleName eq '${matchedRole}'`,
      {
        headers: buildHeaders(),
        credentials: buildCreds(),
      },
    );

    if (!roleRes.ok)
      throw new Error(`Failed to fetch role mapping: ${roleRes.status}`);

    const roleData = await roleRes.json();
    const roleMapping = roleData?.items?.[0];
    if (!roleMapping) return [];

    const roleMappingId = roleMapping.id; // e.g. 2939170

    // Step 2: Query schemeconfigurators filtered by the roleSchemeMappingId
    // The field on schemeconfigurators side is r_schemeConfigurator_c_roleSchemeMappingId
    const schemesRes = await fetch(
      `/o/c/schemeconfigurators/?filter=r_schemeConfigurator_c_roleSchemeMappingId eq '${roleMappingId}'`,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-csrf-token": window.Liferay?.authToken || "",
        },
        credentials: "include",
      },
    );

    if (!schemesRes.ok)
      throw new Error(`Failed to fetch schemes: ${schemesRes.status}`);

    const schemesData = await schemesRes.json();
    const schemes = schemesData?.items || [];

    // Return in same shape as ddoschememappings so dropdown works identically
    return schemes.map((scheme) => ({
      id: scheme.id,
      name: scheme.schemeName,
      schemeCode: scheme.schemeCode,
      benefitsJsonData:
        scheme.benefitsJsonData || scheme.benefitsjsondata || "",
      r_schemeMapping_c_schemeConfiguratorId: scheme.id,
    }));
  } catch (err) {
    console.error("Error fetching role scheme mappings:", err);
    return [];
  }
}


export async function getObjectDetail(objectName, field = "id", value) {
  try {
    if (!objectName) throw new Error("Object name is required");
    if (!value) throw new Error("Filter value is required");

    const url = `/o/c/${objectName}/?filter=${field} eq '${value}'`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: "Basic " + btoa("soham:Test"),
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    return data.items?.length ? data.items[0] : null;
  } catch (error) {
    console.error("getObjectDetail Error:", error);
    return null;
  }
}