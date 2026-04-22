 
  export const buildScreenName = (schoolId) => {
    const source = String(
      schoolId || ""
    ).trim();
    const normalized = source.toLowerCase().replace(/[^a-z0-9]+/g, "");
    return  `prese.${normalized}school`;
  };
  export const buildUserPayload = (schoolData, schoolId) => {
    const fullName = String(schoolData.schoolName || "").trim();
    const nameParts = fullName.split(/\s+/).filter(Boolean);
    const givenName = nameParts[0] || "School";
    const familyName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "User";
    const screenName = buildScreenName(schoolId);

    return {
      alternateName: screenName,
      emailAddress: String(schoolData.schoolEmail ||schoolData.emailId || "").trim(),
      familyName,
      givenName,
      password: "Welcome@123",
      status: "Active",
    };
  };
