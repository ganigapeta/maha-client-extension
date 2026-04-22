

import React, { useState, useCallback } from "react";

// Styles
import {
  CSS_VARIABLES,
  KEYFRAMES,
  layoutStyles,
  pageStyles,
} from "./SchoolMasterStyles";

// API
import { getPONames, saveSchool } from "./schoolMasterAPI";

// API
import {
  getStates,
  fetchDistrictsByState,
  fetchTalukasByDistrict,
  fetchVillagesByTaluka,
  fetchPOByTaluka,
} from "../api/fetch-masters";

// Location cascade hook
import { useLocationCascade } from "../utils/LocationUtility";

// Components
import {
  FormField,
  TDDInput,
  TDDSelect,
  TDDButton,
  Toast,
  SectionLabel,
  CaptchaWidget,
  PageHeader,
  MockDataBadge,
  Divider,
} from "./SchoolMasterComponents";

import SchoolMasterReviewStep from "./SchoolMasterReviewStep";
import { buildSchoolPayload } from "./validations";
import {
  assignSchoolRoleToUserAccount,
  createSchoolLiferayUserAccount,
  deleteSchoolLiferayUserAccount,
  fetchSchoolLiferayUserByEmail,
  fetchSchoolRoleByName,
  saveSchoolMasterEntry,
  updateSchoolEntry,
} from "../api/save-school";
import { buildUserPayload } from "../utils/userUtility";

// ─── Constants ───────────────────────────────────────────────

const STEP_FORM = "form";
const STEP_REVIEW = "review";

const INITIAL_FORM = {
  trusteeName: "",
  schoolName: "",
  address: "",
  // Location display values (human-readable names)
  state: "",
  stateId: "",
  stateName: "",
  statecodecensus: "",
  district: "",
  districtId: "",
  districtName: "",
  districtCode: "",
  districtcodecensus: "",
  taluka: "",
  talukaId: "",
  talukaName: "",
  talukacodecensus: "",
  village: "",
  villageId: "",
  villageName: "",
  // Other fields
  pincode: "",
  poNameId: "",
  mobileSchool: "",
  mobileTrustee: "",
  mobilePrincipal: "",
  emailId: "",
  primaryUDISE: "",
  secondaryUDISE: "",
  higherSecondaryUDISE: "",
  captchaAnswer: "",
};

function generateCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return { question: `${a} + ${b} = ?`, answer: String(a + b) };
}

// ─── Validation ──────────────────────────────────────────────

function validateField(field, value) {
  switch (field) {
    case "schoolName":
      return value.trim() ? "" : "School Name is required.";
    case "address":
      return value.trim() ? "" : "Address is required.";
    case "state":
      return value ? "" : "Please select a State.";
    case "district":
      return value ? "" : "Please select a District.";
    case "taluka":
      return value ? "" : "Please select a Taluka.";
    case "village":
      return value ? "" : "Please select a Village.";
    case "poNameId":
      // return value ? "" : "Please select a PO Name.";
      return value ? "" : "";

    case "mobileSchool":
      if (!value.trim()) return "School mobile number is required.";
      if (!/^[6-9]\d{9}$/.test(value))
        return "Must be a valid 10-digit Indian mobile number.";
      return "";
    case "mobileTrustee":
    case "mobilePrincipal":
      if (value && !/^[6-9]\d{9}$/.test(value))
        return "Must be a valid 10-digit mobile number.";
      return "";
    case "emailId":
      if (!value.trim()) return "Email ID is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        return "Enter a valid email address.";
      return "";
    case "primaryUDISE":
      if (!value.trim()) return "Primary UDISE Code is required.";
      if (!/^\d{11}$/.test(value))
        return "UDISE Code must be exactly 11 digits.";
      return "";
    case "secondaryUDISE":
    case "higherSecondaryUDISE":
      if (value && !/^\d{11}$/.test(value)) return "Must be exactly 11 digits.";
      return "";
    case "pincode":
      if (value && !/^\d{6}$/.test(value)) return "Pincode must be 6 digits.";
      return "";
    default:
      return "";
  }
}

function validateAll(form, captchaAnswer) {
  const errors = {};

  const fields = [
    "schoolName",
    "address",
    "state",
    "district",
    "taluka",
    "village",
    "poNameId",
    "mobileSchool",
    "mobileTrustee",
    "mobilePrincipal",
    "emailId",
    "primaryUDISE",
    "secondaryUDISE",
    "higherSecondaryUDISE",
    "pincode",
  ];

  fields.forEach((field) => {
    const err = validateField(field, form[field] ?? "");
    if (err) errors[field] = err;
  });

  // Captcha
  if (!form.captchaAnswer.trim()) {
    errors.captchaAnswer = "Please answer the captcha.";
  } else if (form.captchaAnswer.trim() !== captchaAnswer) {
    errors.captchaAnswer = "Incorrect answer. Please try again.";
  }

  return errors;
}

const initialSchoolData = {
  udiseCode: "",
  schoolCode: "",
  schoolName: "",
  schoolNameLocked: false,
  schoolManagement: "",
  schoolManagementId: "",
  schoolManagementName: "",
  schoolSubManagement: "",
  schoolSubManagementId: "",
  schoolSubManagementName: "",
  state: "Maharashtra",
  stateId: "",
  stateName: "Maharashtra",
  statecodecensus: "",
  district: "",
  districtId: "",
  districtName: "",
  districtCode: "",
  districtcodecensus: "",
  taluka: "",
  talukaId: "",
  talukaName: "",
  talukacodecensus: "",
  village: "",
  villageId: "",
  villageName: "",
  schoolAddress: "",
  schoolAddressLocked: false,
  pinCode: "",
  schoolEmail: "",
  schoolContactNo: "",
  schoolWebsite: "",
  schoolRegistrationNo: "",
  establishmentYear: "",
  schoolBoard: "",
  schoolBoardName: "",
  isSchoolUnder: "",
  isSchoolUnderId: "",
  isSchoolUnderName: "",
  schoolCategory: "",
  schoolCategoryId: "",
  schoolCategoryName: "",
  isMilitary: "No",
  isITI: "No",
  liferayUserId: "",
  screenName: "",
};

// ─── Main Component ───────────────────────────────────────────

export default function SchoolMasterForm({ useMockData = false, onBack }) {
  const [failureMessage, setFailureMessage] = useState("");

  const [schoolData, setSchoolData] = useState(initialSchoolData);
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchMessage, setFetchMessage] = useState("");
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);

  // ── Step control
  const [step, setStep] = useState(STEP_FORM);

  // ── Form state (single source of truth — location fields live here too)
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [captcha, setCaptcha] = useState(generateCaptcha);

  // ── PO Names (not part of location cascade)
  const [poNames, setPONames] = useState([]);
  const [loadingPO, setLoadingPO] = useState(false);
  const [poNameLabel, setPONameLabel] = useState("");

  // ── Submission + declaration
  const [submitting, setSubmitting] = useState(false);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  // ── Toast
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  // ─── Toast helper ─────────────────────────────────────────────
  const showToast = useCallback((message, type = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3500);
  }, []);

  // ─── Location cascade hook ────────────────────────────────────
  //
  // Replaces all cascade useEffects that were previously in this file.
  // handleLocationSelect updates form.state / form.district / etc.
  // and clears downstream fields automatically.
  //
  const {
    states,
    districts,
    talukas,
    villages,
    isLoadingStates,
    isLoadingDistricts,
    isLoadingTalukas,
    isLoadingVillages,
    handleLocationSelect,
  } = useLocationCascade({
    schoolData: form,
    setSchoolData: setForm,
    errors,
    setErrors,
    validateField,
    getStates: useCallback(() => getStates(useMockData), [useMockData]),
    fetchDistrictsByState: useCallback(
      (id) => fetchDistrictsByState(id, useMockData),
      [useMockData],
    ),
    fetchTalukasByDistrict: useCallback(
      (id) => fetchTalukasByDistrict(id, useMockData),
      [useMockData],
    ),
    fetchVillagesByTaluka: useCallback(
      (id) => fetchVillagesByTaluka(id, useMockData),
      [useMockData],
    ),
  });

  // ─── Load PO Names on mount ───────────────────────────────────
  React.useEffect(() => {
    let cancelled = false;
    setLoadingPO(true);

    fetchPOByTaluka(useMockData)
      .then((data) => {
        if (!cancelled) setPONames(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("[SchoolMasterForm] PO Names load failed:", err);
        if (!cancelled) setPONames([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingPO(false);
      });

    return () => {
      cancelled = true;
    };
  }, [useMockData]);

  // ─── Resolve PO Name label for review ────────────────────────
  React.useEffect(() => {
    if (!form.poNameId) {
      setPONameLabel("");
      return;
    }
    const found = poNames.find(
      (p) => String(p.value) === String(form.poNameId),
    );
    setPONameLabel(found ? found.label : "");
  }, [form.poNameId, poNames]);

  // ─── Generic field change (non-location fields) ───────────────
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((err) => ({ ...err, [name]: validateField(name, value) }));
  }, []);

  // ─── Location dropdown onChange wrappers ──────────────────────
  //
  // TDDSelect fires a standard DOM event (e.target.value = the option's value).
  // We find the full normalised option object and pass it to handleLocationSelect.
  //
  const onStateChange = useCallback(
    (e) => {
      const selected = states.find(
        (s) => String(s.id) === String(e.target.value),
      );
      handleLocationSelect("state", selected ?? null);
    },
    [states, handleLocationSelect],
  );

  const onDistrictChange = useCallback(
    (e) => {
      const selected = districts.find(
        (d) => String(d.id) === String(e.target.value),
      );
      handleLocationSelect("district", selected ?? null);
    },
    [districts, handleLocationSelect],
  );

  const onTalukaChange = useCallback(
    (e) => {
      const selected = talukas.find(
        (t) => String(t.id) === String(e.target.value),
      );
      handleLocationSelect("taluka", selected ?? null);
    },
    [talukas, handleLocationSelect],
  );

  const onVillageChange = useCallback(
    (e) => {
      const selected = villages.find(
        (v) => String(v.id) === String(e.target.value),
      );
      handleLocationSelect("village", selected ?? null);
    },
    [villages, handleLocationSelect],
  );

  // ─── Captcha ──────────────────────────────────────────────────
  const refreshCaptcha = useCallback(() => {
    setCaptcha(generateCaptcha());
    setForm((f) => ({ ...f, captchaAnswer: "" }));
    setErrors((e) => ({ ...e, captchaAnswer: "" }));
  }, []);

  // ─── Back ─────────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    if (typeof onBack === "function") onBack();
    else window.history.back();
  }, [onBack]);

  // ─── Reset ────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setForm(INITIAL_FORM);
    setErrors({});
    setStep(STEP_FORM);
    setPONameLabel("");
    setDeclarationAccepted(false);
    refreshCaptcha();
    // Cascade hook resets its own dropdown lists automatically
    // because form.state / district / taluka are all cleared via INITIAL_FORM
  }, [refreshCaptcha]);

  // ─── Proceed to Review ────────────────────────────────────────
  function handleReview() {
    const validationErrors = validateAll(form, captcha.answer);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setTimeout(() => {
        const el = document.querySelector(".tdd-field-error");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }
    setDeclarationAccepted(false);
    setSubmitting(false);
    setStep(STEP_REVIEW);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }


  const handleConfirmationModalClose = () => {
    setShowConfirmationModal(false);
    handleReset();
  };

  const handleFailureModalClose = () => {
    setShowFailureModal(false);
    setFailureMessage("");
    setShowConfirmationModal(false);
    handleReset();
  };

  const handleBackToForm = () => {
    setStep(1);
  };

  const confirmationModal = showConfirmationModal ? (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Confirmation</h5>
              <button
                type="button"
                className="btn-close"
                onClick={handleConfirmationModalClose}
                aria-label="Close"
              />
            </div>
            <div className="modal-body">
              <p className="mb-0">School information has been submitted successfully.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={handleConfirmationModalClose}>
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  ) : null;

  const failureModal = showFailureModal ? (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header bg-danger text-white">
              <h5 className="modal-title">Submission Failed</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={handleFailureModalClose}
                aria-label="Close"
              />
            </div>
            <div className="modal-body">
              <p className="mb-0">{failureMessage || "Failed to save the data."}</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-danger" onClick={handleFailureModalClose}>
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  ) : null;

  // ─── Final Submit from Review ─────────────────────────────────
  async function handleSubmit() {


    setSubmitting(true);

    if(true){
      handleFinalSubmit();
      return;
    }
    
    try {
      const payload = {
        trusteeName: form.trusteeName,
        schoolName: form.schoolName,
        address: form.address,
        stateId: form.stateId,
        stateName: form.stateName,
        statecodecensus: form.statecodecensus,
        districtId: form.districtId,
        districtName: form.districtName,
        districtCode: form.districtCode,
        districtcodecensus: form.districtcodecensus,
        talukaId: form.talukaId,
        talukaName: form.talukaName,
        talukacodecensus: form.talukacodecensus,
        villageId: form.villageId,
        villageName: form.villageName,
        pincode: form.pincode,
        poNameId: form.poNameId,
        pOName: form.poNameId,
        mobileNumberSchool: form.mobileSchool,
        mobileNumberTrustee: form.mobileTrustee,
        mobileNumberPrincipal: form.mobilePrincipal,
        emailId: form.emailId,
        primaryUDISECode: form.primaryUDISE,
        secondaryUDISECode: form.secondaryUDISE,
        higherSecondaryUDISECode: form.higherSecondaryUDISE,
      };

      await saveSchool(payload, useMockData);
      showToast("School registered successfully!", "success");
      handleReset();
    } catch (err) {
      console.error("[SchoolMasterForm] Save failed:", err);
      showToast("Failed to save. Please try again.", "error");
      setStep(STEP_FORM);
    } finally {
      setSubmitting(false);
    }
  }

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    // setErrors((prev) => ({ ...prev, submit: "" }));

    try {
      const initialSchoolPayload = buildSchoolPayload(null, form);
      console.log("School Payload", initialSchoolPayload);
      
      const savedSchool = await saveSchoolMasterEntry(initialSchoolPayload);
      console.log("Saved School Entry:", savedSchool);
      const schoolId = Number(savedSchool?.id);
      if (!Number.isInteger(schoolId) || schoolId <= 0) {
        throw new Error(
          "School saved successfully but no school ID was returned",
        );
      }

      const userPayload = buildUserPayload(initialSchoolPayload,schoolId);
      console.log("User Payload for Liferay account creation:", userPayload);
      let liferayUser;
      let createdNewLogin = false;

      try {
        liferayUser = await createSchoolLiferayUserAccount(userPayload);
        console.log("Created Liferay User Account:", liferayUser);
        createdNewLogin = true;
      } catch (createError) {
        if (Number(createError?.status) === 409) {
          const existingUser = await fetchSchoolLiferayUserByEmail(
            schoolData.schoolEmail,
          );
          if (!existingUser?.id) {
            throw createError;
          }

          liferayUser = existingUser;
        } else {
          throw createError;
        }
      }

      try {
        const preSchoolRole = await fetchSchoolRoleByName("Pre School");

        if (!preSchoolRole?.id) {
          throw new Error("Pre School role was not found");
        }

        const roleAssigned = await assignSchoolRoleToUserAccount(
          liferayUser.id,
          preSchoolRole.id,
        );

        if (!roleAssigned) {
          throw new Error(
            "Failed to assign Pre School role to the created user",
          );
        }
      } catch (roleError) {
        if (createdNewLogin && liferayUser?.id) {
          try {
            await deleteSchoolLiferayUserAccount(liferayUser.id);
          } catch (cleanupError) {
            console.error(
              "Failed to clean up Liferay user after role assignment failure:",
              cleanupError,
            );
          }
        }
        throw roleError;
      }

      const payload = buildSchoolPayload(liferayUser,form);
      console.log("Final School Payload with Liferay user details:", payload);
      const saved = await updateSchoolEntry(schoolId, payload);
      console.log("Updated School Entry with Liferay user details:", saved);
      setSchoolData((prev) => ({
        ...prev,
        liferayUserId: String(liferayUser?.id || "").trim(),
        screenName: String(liferayUser?.alternateName || "").trim(),
      }));

      setFetchMessage("");
      setShowConfirmationModal(true);


      showToast("School registered successfully!", "success");

      if (typeof onFetchSuccess === "function") {
        // onFetchSuccess(saved);
      }
    } catch (error) {
      setSubmitting(false);
      console.error("Final submission error:", error);
      const message =
        error?.message || "Something went wrong while submitting.";

      if (String(error?.status || "") === "409") {
        setErrors((prev) => ({
          ...prev,
          schoolEmail: "This email is already registered.",
          submit:
            "Email already exists in Liferay. Please use a unique email address.",
        }));
        showToast(
          "Email already exists in Liferay. Please use a unique email address.",
        );
        setStep(1);
      } else if (String(error?.status || "") === "400") {
        const badRequestMessage =
          "Failed to create login id. Please check the generated screen name, email, and role assignment.";
        setErrors((prev) => ({ ...prev, submit: badRequestMessage }));
        showToast(badRequestMessage);
      } else {
        setErrors((prev) => ({ ...prev, submit: message }));
        // showToast(message);
      }

      setFailureMessage(message);
      setShowFailureModal(true);


      // handleReset();
      // setStep(STEP_FORM);

    } finally {
      setSubmitting(false);
      setIsSubmitting(false);
    }
  };

  // ─── Build review data (human-readable) ──────────────────────
  // Location names are already stored as human-readable strings
  // in form.stateName / districtName / talukaName / villageName
  // by handleLocationSelect — no separate label state needed.
  const reviewData = {
    trusteeName: form.trusteeName,
    schoolName: form.schoolName,
    address: form.address,
    state: form.stateName,
    district: form.districtName,
    taluka: form.talukaName,
    village: form.villageName,
    pincode: form.pincode,
    poName: poNameLabel,
    mobileSchool: form.mobileSchool,
    mobileTrustee: form.mobileTrustee,
    mobilePrincipal: form.mobilePrincipal,
    emailId: form.emailId,
    primaryUDISE: form.primaryUDISE,
    secondaryUDISE: form.secondaryUDISE,
    higherSecondaryUDISE: form.higherSecondaryUDISE,
  };

  // ─── Normalise dropdown options for TDDSelect ─────────────────
  // TDDSelect expects { value, label } — locationUtils gives { id, name }
  // so we map here at the boundary.
  const toOptions = (items) =>
    // items.map((item) => ({ value: item.id, label: item.name }));

   (Array.isArray(items) ? items : []).map((item) => ({
      value: item.id,
      label: item.name,
      id: item.id,
      name: item.name,
      raw: item.raw || item,
    }));
  // ─── Render ───────────────────────────────────────────────────
  return (
    <>
      <style>{CSS_VARIABLES + KEYFRAMES}</style>

      <div className="tdd-portlet" style={pageStyles.wrapper}>
        {/* <PageHeader /> */}

        <main style={layoutStyles.main}>
          {/* ══════════════ STEP 1 : FORM ══════════════ */}
          {step === STEP_FORM && (
            <div className="tdd-card" style={layoutStyles.card}>
              <div className="tdd-section-bar" style={layoutStyles.sectionBar}>
                <span>📋</span>
                <span>School Master</span>
                {useMockData && <MockDataBadge />}
              </div>

              <div style={layoutStyles.formBody}>
                {/* ── Basic Information */}
                <SectionLabel>Basic Information</SectionLabel>
                <div className="tdd-grid-3" style={layoutStyles.grid3}>
                  <FormField label="Trustee Name" error={errors.trusteeName}>
                    <TDDInput
                      name="trusteeName"
                      value={form.trusteeName}
                      onChange={handleChange}
                      maxLength={100}
                      hasError={!!errors.trusteeName}
                    />
                  </FormField>

                  <FormField
                    label="School Name"
                    required
                    error={errors.schoolName}
                  >
                    <TDDInput
                      name="schoolName"
                      value={form.schoolName}
                      onChange={handleChange}
                      maxLength={200}
                      hasError={!!errors.schoolName}
                    />
                  </FormField>

                  <FormField label="Address" required error={errors.address}>
                    <TDDInput
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      maxLength={300}
                      hasError={!!errors.address}
                    />
                  </FormField>
                </div>

                <Divider />

                {/* ── Location */}
                <SectionLabel>Location</SectionLabel>

                <div className="tdd-grid-3" style={layoutStyles.grid3}>
                  {/* State — value is the id, onChange resolves full option */}
                  <FormField label="State" required error={errors.state}>
                    <TDDSelect
                      name="state"
                      value={form.stateId}
                      onChange={onStateChange}
                      options={toOptions(states)}
                      loading={isLoadingStates}
                      hasError={!!errors.state}
                      loadingText="Loading states..."
                    />
                  </FormField>

                  {/* District */}
                  <FormField label="District" required error={errors.district}>
                    <TDDSelect
                      name="district"
                      value={form.districtId}
                      onChange={onDistrictChange}
                      options={toOptions(districts)}
                      loading={isLoadingDistricts}
                      disabled={!form.state}
                      hasError={!!errors.district}
                      emptyText={
                        !form.state ? "Select State first" : "---Select---"
                      }
                      loadingText="Loading districts..."
                    />
                  </FormField>

                  {/* Taluka */}
                  <FormField label="Taluka" required error={errors.taluka}>
                    <TDDSelect
                      name="taluka"
                      value={form.talukaId}
                      onChange={onTalukaChange}
                      options={toOptions(talukas)}
                      loading={isLoadingTalukas}
                      disabled={!form.district}
                      hasError={!!errors.taluka}
                      emptyText={
                        !form.district
                          ? "Select District first"
                          : "---Select---"
                      }
                      loadingText="Loading talukas..."
                    />
                  </FormField>
                </div>

                <div className="tdd-grid-3" style={layoutStyles.grid3}>
                  {/* Village */}
                  <FormField label="Village" required error={errors.village}>
                    <TDDSelect
                      name="village"
                      value={form.villageId}
                      onChange={onVillageChange}
                      options={toOptions(villages)}
                      loading={isLoadingVillages}
                      disabled={!form.taluka}
                      hasError={!!errors.village}
                      emptyText={
                        !form.taluka ? "Select Taluka first" : "---Select---"
                      }
                      loadingText="Loading villages..."
                    />
                  </FormField>

                  <FormField label="Pincode" error={errors.pincode}>
                    <TDDInput
                      name="pincode"
                      value={form.pincode}
                      onChange={handleChange}
                      maxLength={6}
                      inputMode="numeric"
                      hasError={!!errors.pincode}
                    />
                  </FormField>

                  <FormField label="PO Name" required error={errors.poNameId}>
                    <TDDSelect
                      name="poNameId"
                      value={form.poNameId}
                      onChange={handleChange}
                      options={poNames}
                      loading={loadingPO}
                      hasError={!!errors.poNameId}
                      loadingText="Loading PO names..."
                    />
                  </FormField>
                </div>

                <div className="tdd-grid-3" style={layoutStyles.grid3}>
                  <FormField
                    label="Mobile No (School)"
                    required
                    error={errors.mobileSchool}
                  >
                    <TDDInput
                      name="mobileSchool"
                      value={form.mobileSchool}
                      onChange={handleChange}
                      maxLength={10}
                      inputMode="tel"
                      hasError={!!errors.mobileSchool}
                    />
                  </FormField>
                </div>

                <Divider />

                {/* ── Contact Details */}
                <SectionLabel>Contact Details</SectionLabel>
                <div className="tdd-grid-3" style={layoutStyles.grid3}>
                  <FormField
                    label="Mobile Number (Trustee)"
                    error={errors.mobileTrustee}
                  >
                    <TDDInput
                      name="mobileTrustee"
                      value={form.mobileTrustee}
                      onChange={handleChange}
                      maxLength={10}
                      inputMode="tel"
                      hasError={!!errors.mobileTrustee}
                    />
                  </FormField>

                  <FormField
                    label="Mobile Number (Principal)"
                    error={errors.mobilePrincipal}
                  >
                    <TDDInput
                      name="mobilePrincipal"
                      value={form.mobilePrincipal}
                      onChange={handleChange}
                      maxLength={10}
                      inputMode="tel"
                      hasError={!!errors.mobilePrincipal}
                    />
                  </FormField>

                  <FormField label="Email ID" required error={errors.emailId}>
                    <TDDInput
                      name="emailId"
                      value={form.emailId}
                      onChange={handleChange}
                      type="email"
                      maxLength={150}
                      hasError={!!errors.emailId}
                    />
                  </FormField>
                </div>

                <Divider />

                {/* ── UDISE Codes */}
                <SectionLabel>UDISE Codes</SectionLabel>
                <div className="tdd-grid-3" style={layoutStyles.grid3}>
                  <FormField
                    label="Primary UDISE Code"
                    required
                    error={errors.primaryUDISE}
                  >
                    <TDDInput
                      name="primaryUDISE"
                      value={form.primaryUDISE}
                      onChange={handleChange}
                      maxLength={11}
                      inputMode="numeric"
                      placeholder="11-digit code"
                      hasError={!!errors.primaryUDISE}
                    />
                  </FormField>

                  <FormField
                    label="Secondary UDISE Code"
                    error={errors.secondaryUDISE}
                  >
                    <TDDInput
                      name="secondaryUDISE"
                      value={form.secondaryUDISE}
                      onChange={handleChange}
                      maxLength={11}
                      inputMode="numeric"
                      hasError={!!errors.secondaryUDISE}
                    />
                  </FormField>

                  <FormField
                    label="Higher Secondary UDISE Code"
                    error={errors.higherSecondaryUDISE}
                  >
                    <TDDInput
                      name="higherSecondaryUDISE"
                      value={form.higherSecondaryUDISE}
                      onChange={handleChange}
                      maxLength={11}
                      inputMode="numeric"
                      hasError={!!errors.higherSecondaryUDISE}
                    />
                  </FormField>
                </div>

                {/* ── Captcha */}
                <CaptchaWidget
                  question={captcha.question}
                  value={form.captchaAnswer}
                  onChange={handleChange}
                  onRefresh={refreshCaptcha}
                  error={errors.captchaAnswer}
                />
              </div>

              {/* ── Action Buttons */}
              <div className="tdd-action-row" style={layoutStyles.actionRow}>
                <TDDButton variant="save" onClick={handleReview}>
                  Preview &amp; Review
                </TDDButton>

                <TDDButton variant="reset" onClick={handleReset}>
                  Reset
                </TDDButton>

                <TDDButton variant="back" onClick={handleBack}>
                  Back
                </TDDButton>
              </div>
            </div>
          )}

          {/* ══════════════ STEP 2 : REVIEW ══════════════ */}
          {step === STEP_REVIEW && (
            <>
            <SchoolMasterReviewStep
              reviewData={reviewData}
              isSubmitting={submitting}
              isDeclarationAccepted={declarationAccepted}
              onToggleDeclaration={setDeclarationAccepted}
              onBack={() => setStep(STEP_FORM)}
              onSubmit={handleSubmit}
              
            />
             {confirmationModal}
             {failureModal}
            </>
          )}
        </main>
      </div>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
      />
    </>
  );
}
