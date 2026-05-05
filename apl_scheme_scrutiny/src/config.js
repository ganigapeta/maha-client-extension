const USE_HARDCODED_AUTH = false; // 👈 flip this one flag
const USE_HARDCODED_USER = false; // 👈 flip this one flag
const IS_AFSO = true; 
export const AUTH_TOKEN = USE_HARDCODED_AUTH
  ? "Basic " + btoa("prabhudasu:root")
  : null;

export const buildHeaders = () => {
  if (AUTH_TOKEN) {
    return {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: AUTH_TOKEN,
    };
  }

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "x-csrf-token": window.Liferay?.authToken || "",
  };
};

export const buildHeadersDocument = () => {
  if (AUTH_TOKEN) {
    return {
      Accept: "application/json",
      Authorization: AUTH_TOKEN,
    };
  }

  return {
    Accept: "application/json",
    "x-csrf-token": window.Liferay?.authToken || "",
  };
};


export const getLiferayUserId = () => {
  try {

     const _AFSO = 3068014//3068014 -AFSO; //window.Liferay?.ThemeDisplay?.getUserId();
    const _DFSO = 3068039//3068039 -DFSO; //window.Liferay?.ThemeDisplay?.getUserId();

    return USE_HARDCODED_USER
      ? ( IS_AFSO ? _AFSO: _DFSO )
      : window.Liferay.ThemeDisplay.getUserId();
  } catch (error) {
    console.error("Error getting user ID:", error);
    return null;
  }
};

export const buildHeadersExternal = () => {
  return {
    Accept: "application/json",
    "x-csrf-token": window.Liferay?.authToken || "",
    userId: getLiferayUserId()

  };
};

export const buildCreds = () => "include"; // or "omit" based on your needs

export const isSignedIn = ()=> { return  USE_HARDCODED_AUTH
  ? true
  : window.Liferay?.ThemeDisplay?.isSignedIn();
};

export const getScopeGroupId = () => {
  return USE_HARDCODED_AUTH
    ? 20118
    : window.Liferay?.ThemeDisplay?.getScopeGroupId();
};
export default AUTH_TOKEN;