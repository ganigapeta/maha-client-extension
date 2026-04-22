//  export const buildSchoolPayload = (liferayUser = null, schoolData) => ({
//     districtCode: String(schoolData.districtCode || "").trim(),
//     districtcodecensus: String(schoolData.districtcodecensus || "").trim(),
//     districtId: String(schoolData.districtId || "").trim(),
//     districtName: String(schoolData.districtName || schoolData.district || "").trim(),
//     establishmentYear: String(schoolData.establishmentYear || "").trim(),
//     isITI: String(schoolData.isITI || "No").trim(),
//     isMilitary: String(schoolData.isMilitary || "No").trim(),
//     isSchoolUnder: Number(schoolData.isSchoolUnderId || 0),
//     isSchoolUnderName: String(
//       schoolData.isSchoolUnderName || schoolData.isSchoolUnder || ""
//     ).trim(),
//     liferayUserId: String(liferayUser?.id || "").trim(),
//     name: String(schoolData.schoolName || "").trim(),
//     namell: String(schoolData.schoolName || "").trim(),
//     pinCode: String(schoolData.pinCode || "").trim(),
//     schaddress: String(schoolData.schoolAddress || "").trim(),
//     schoolCategory: Number(schoolData.schoolCategoryId || 0),
//     schoolCategoryName: String(
//       schoolData.schoolCategoryName || schoolData.schoolCategory || ""
//     ).trim(),
//     schoolBoard: Number(schoolData.schoolBoardId || 0),
//     schoolBoardName: String(
//       schoolData.schoolBoardName || schoolData.schoolBoard || ""
//     ).trim(),
//     schoolCode: String(schoolData.schoolCode || schoolData.udiseCode || "").trim(),
//     schoolContactNo: String(schoolData.schoolContactNo || "").trim(),
//     schoolEmail: String(schoolData.schoolEmail || "").trim(),
//     schoolManagement: Number(schoolData.schoolManagementId || 0),
//     schoolManagementName: String(
//       schoolData.schoolManagementName || schoolData.schoolManagement || ""
//     ).trim(),
//     schoolRegistrationNo: String(schoolData.schoolRegistrationNo || "").trim(),
//     schoolSubManagement: Number(schoolData.schoolSubManagementId || 0),
//     schoolSubManagementName: String(
//       schoolData.schoolSubManagementName || schoolData.schoolSubManagement || ""
//     ).trim(),
//     schoolWebsite: String(schoolData.schoolWebsite || "").trim(),
//     screenName: String(liferayUser?.alternateName || "").trim(),
//     statecodecensus: String(schoolData.statecodecensus || "").trim(),
//     stateId: String(schoolData.stateId || "").trim(),
//     stateName: String(schoolData.stateName || schoolData.state || "").trim(),
//     talukacodecensus: String(schoolData.talukacodecensus || "").trim(),
//     talukaId: String(schoolData.talukaId || "").trim(),
//     talukaName: String(schoolData.talukaName || schoolData.taluka || "").trim(),
//     villageId: String(schoolData.villageId || "").trim(),
//     villageName: String(schoolData.villageName || schoolData.village || "").trim(),
//   });


  export const buildSchoolPayload = (liferayUser = null, form = {}) => ({
  externalReferenceCode: "",

  // Basic Info
  trusteeName: String(form.trusteeName || "").trim(),
  schoolName: String(form.schoolName || "").trim(),
  address: String(form.address || "").trim(),

  // Location (ONLY IDs as per object)
  stateId: Number(form.stateId || 0),
  districtId: Number(form.districtId || 0),
  talukaId: Number(form.talukaId || 0),
  villageId: Number(form.villageId || 0),

  // Address
  pincode: String(form.pincode || "").trim(),
  poName: String(form.poNameId || form.pOName || "").trim(),

  // Contact
  emailId: String(form.emailId || "").trim(),
  mobileNumberSchool: String(form.mobileSchool || "").trim(),
  mobileNumberTrustee: String(form.mobileTrustee || "").trim(),
  mobileNumberPrincipal: String(form.mobilePrincipal || "").trim(),

  // UDISE Codes
  primaryUDISECode: String(form.primaryUDISE || "").trim(),
  secondaryUDISECode: String(form.secondaryUDISE || "").trim(),
  higherSecondaryUDISECode: String(form.higherSecondaryUDISE || "").trim(),
  udiseCode: String(form.primaryUDISE || "").trim(),

  screenName: String(liferayUser?.alternateName || "").trim(),
  liferayUserId: String(liferayUser?.id || "").trim(),
});