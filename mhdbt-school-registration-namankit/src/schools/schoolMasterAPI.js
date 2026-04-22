/**
 * schoolMasterAPI.js
 * ─────────────────────────────────────────────────────────────
 * All Liferay REST API calls for the School Master Form.
 *
 * Endpoints are under the custom REST Builder module:
 *   /o/tribal-dev/v1.0/
 *
 * Authentication:
 *   - Uses window.Liferay.authToken for CSRF protection
 *   - Uses credentials: 'include' for session cookies
 *   - Portal base URL auto-detected from window.Liferay.ThemeDisplay
 *
 * Mock data integration:
 *   All functions accept a `useMockData` boolean flag.
 *   When true  → returns mock data (simulateMockAPI)
 *   When false → calls real Liferay endpoint; throws on error
 *
 * Usage:
 *   import { getDistricts, getTalukas, getVillages, getPONames, saveSchool } from './schoolMasterAPI';
 *   const districts = await getDistricts(false);          // real API
 *   const districts = await getDistricts(true);           // mock data
 * ─────────────────────────────────────────────────────────────
 */

import {
  MOCK_DISTRICTS,
  MOCK_TALUKAS,
  MOCK_VILLAGES,
  MOCK_PO_NAMES,
  simulateMockAPI,
  MOCK_STATES,
} from './mockData';

// ─── Liferay Context Helpers ─────────────────────────────────

/**
 * Returns the Liferay portal base URL.
 * Falls back to empty string (relative URLs) outside of Liferay.
 */
function getPortalURL() {
  try {
    return window?.Liferay?.ThemeDisplay?.getPortalURL?.() ?? '';
  } catch {
    return '';
  }
}

/**
 * Returns the Liferay CSRF auth token.
 * Sent as X-CSRF-Token header on all mutating requests.
 */
function getAuthToken() {
  try {
    return window?.Liferay?.authToken ?? '';
  } catch {
    return '';
  }
}

/**
 * Returns the group / site ID for scoped API calls.
 */
function getSiteGroupId() {
  try {
    return window?.Liferay?.ThemeDisplay?.getScopeGroupId?.() ?? '';
  } catch {
    return '';
  }
}

// ─── Base Fetch Wrapper ──────────────────────────────────────

/**
 * Core HTTP fetch for all Liferay REST endpoints.
 *
 * @param {string} path    – Relative path, e.g. '/o/tribal-dev/v1.0/districts'
 * @param {object} options – fetch() options override
 * @returns {Promise<any>} – Parsed JSON response
 * @throws  {Error}        – On non-2xx status or network failure
 */
async function liferayFetch(path, options = {}) {
  const url = `${getPortalURL()}${path}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-CSRF-Token': getAuthToken(),
  };

  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(
      `[SchoolMasterAPI] HTTP ${response.status} ${response.statusText} — ${path}\n${errorBody}`
    );
  }

  return response.json();
}

// ─── API Module: Dropdown Data ───────────────────────────────


/**
 * Fetch all States.
 *
 * Real endpoint : GET /o/tribal-dev/v1.0/districts
 * Response shape: [{ id: string, name: string }]
 *
 * @param {boolean} useMockData
 * @returns {Promise<Array<{id: string, name: string}>>}
 */
export async function getStates(useMockData) {
  if (useMockData) {
    return simulateMockAPI(MOCK_STATES);
  }
  const data = await liferayFetch('/o/tribal-dev/v1.0/states');
  // Normalise in case the API wraps items under a key
  return Array.isArray(data) ? data : (data?.items ?? []);
}

/**
 * Fetch all districts.
 *
 * Real endpoint : GET /o/tribal-dev/v1.0/districts
 * Response shape: [{ id: string, name: string }]
 *
 * @param {boolean} useMockData
 * @returns {Promise<Array<{id: string, name: string}>>}
 */
export async function getDistricts(useMockData) {
  if (useMockData) {
    return simulateMockAPI(MOCK_DISTRICTS);
  }
  const data = await liferayFetch('/o/tribal-dev/v1.0/districts');
  // Normalise in case the API wraps items under a key
  return Array.isArray(data) ? data : (data?.items ?? []);
}

/**
 * Fetch talukas for a given district.
 *
 * Real endpoint : GET /o/tribal-dev/v1.0/talukas?districtId={districtId}
 * Response shape: [{ id: string, name: string }]
 *
 * @param {string}  districtId
 * @param {boolean} useMockData
 * @returns {Promise<Array<{id: string, name: string}>>}
 */
export async function getTalukas(districtId, useMockData) {
  if (!districtId) return [];
  if (useMockData) {
    return simulateMockAPI(MOCK_TALUKAS[districtId] ?? []);
  }
  const data = await liferayFetch(
    `/o/tribal-dev/v1.0/talukas?districtId=${encodeURIComponent(districtId)}`
  );
  return Array.isArray(data) ? data : (data?.items ?? []);
}

/**
 * Fetch villages for a given taluka.
 *
 * Real endpoint : GET /o/tribal-dev/v1.0/villages?talukaId={talukaId}
 * Response shape: [{ id: string, name: string }]
 *
 * @param {string}  talukaId
 * @param {boolean} useMockData
 * @returns {Promise<Array<{id: string, name: string}>>}
 */
export async function getVillages(talukaId, useMockData) {
  if (!talukaId) return [];
  if (useMockData) {
    return simulateMockAPI(MOCK_VILLAGES[talukaId] ?? []);
  }
  const data = await liferayFetch(
    `/o/tribal-dev/v1.0/villages?talukaId=${encodeURIComponent(talukaId)}`
  );
  return Array.isArray(data) ? data : (data?.items ?? []);
}

/**
 * Fetch all PO Names (Post Offices).
 *
 * Real endpoint : GET /o/tribal-dev/v1.0/po-names
 * Response shape: [{ id: string, name: string }]
 *
 * @param {boolean} useMockData
 * @returns {Promise<Array<{id: string, name: string}>>}
 */
export async function getPONames(useMockData) {
  if (useMockData) {
    return simulateMockAPI(MOCK_PO_NAMES);
  }
  const data = await liferayFetch('/o/tribal-dev/v1.0/po-names');
  return Array.isArray(data) ? data : (data?.items ?? []);
}

// ─── API Module: School CRUD ─────────────────────────────────

/**
 * Submit (create) a new School Master record.
 *
 * Real endpoint : POST /o/tribal-dev/v1.0/schools
 * Content-Type  : application/json
 * Auth          : Session cookie + X-CSRF-Token
 *
 * @param {SchoolPayload} payload
 * @param {boolean}       useMockData  – When true, simulates a 800ms save delay
 * @returns {Promise<{ id: string, success: boolean }>}
 *
 * @typedef {Object} SchoolPayload
 * @property {string} trusteeName
 * @property {string} schoolName
 * @property {string} address
 * @property {string} districtId
 * @property {string} talukaId
 * @property {string} villageId
 * @property {string} pincode
 * @property {string} poNameId
 * @property {string} mobileSchool
 * @property {string} mobileTrustee
 * @property {string} mobilePrincipal
 * @property {string} emailId
 * @property {string} primaryUDISECode
 * @property {string} secondaryUDISECode
 * @property {string} higherSecondaryUDISECode
 */
export async function saveSchool(payload, useMockData) {
  if (useMockData) {
    // Simulate network latency
    await new Promise((r) => setTimeout(r, 800));
    return { id: `MOCK-${Date.now()}`, success: true };
  }
  return liferayFetch('/o/tribal-dev/v1.0/schools', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Update an existing School Master record.
 *
 * Real endpoint : PUT /o/tribal-dev/v1.0/schools/{id}
 *
 * @param {string}        schoolId
 * @param {SchoolPayload} payload
 * @param {boolean}       useMockData
 * @returns {Promise<{ id: string, success: boolean }>}
 */
export async function updateSchool(schoolId, payload, useMockData) {
  if (useMockData) {
    await new Promise((r) => setTimeout(r, 600));
    return { id: schoolId, success: true };
  }
  return liferayFetch(`/o/tribal-dev/v1.0/schools/${encodeURIComponent(schoolId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Delete a School Master record.
 *
 * Real endpoint : DELETE /o/tribal-dev/v1.0/schools/{id}
 *
 * @param {string}  schoolId
 * @param {boolean} useMockData
 * @returns {Promise<{ success: boolean }>}
 */
export async function deleteSchool(schoolId, useMockData) {
  if (useMockData) {
    await new Promise((r) => setTimeout(r, 400));
    return { success: true };
  }
  return liferayFetch(`/o/tribal-dev/v1.0/schools/${encodeURIComponent(schoolId)}`, {
    method: 'DELETE',
  });
}

/**
 * Fetch a single School record by ID (for edit mode).
 *
 * Real endpoint : GET /o/tribal-dev/v1.0/schools/{id}
 *
 * @param {string}  schoolId
 * @param {boolean} useMockData
 * @returns {Promise<SchoolPayload & { id: string }>}
 */
export async function getSchoolById(schoolId, useMockData) {
  if (useMockData) {
    await new Promise((r) => setTimeout(r, 400));
    return {
      id: schoolId,
      trusteeName: 'Ramesh Patil',
      schoolName: 'Tribal Primary School No. 1',
      address: 'Near Hanuman Temple, Main Road',
      districtId: '1',
      talukaId: '101',
      villageId: '10101',
      pincode: '445204',
      poNameId: 'po1',
      mobileSchool: '9876543210',
      mobileTrustee: '9876543211',
      mobilePrincipal: '9876543212',
      emailId: 'school@example.com',
      primaryUDISECode: '27123456789',
      secondaryUDISECode: '',
      higherSecondaryUDISECode: '',
    };
  }
  return liferayFetch(`/o/tribal-dev/v1.0/schools/${encodeURIComponent(schoolId)}`);
}

// ─── Utility: Validate UDISE Code via API ────────────────────

/**
 * Check if a UDISE code is already registered.
 * Real endpoint: GET /o/tribal-dev/v1.0/schools/check-udise?code={code}
 *
 * @param {string}  udiseCode
 * @param {boolean} useMockData
 * @returns {Promise<{ exists: boolean }>}
 */
export async function checkUDISEExists(udiseCode, useMockData) {
  if (useMockData) {
    await new Promise((r) => setTimeout(r, 300));
    return { exists: false }; // always free in mock mode
  }
  return liferayFetch(
    `/o/tribal-dev/v1.0/schools/check-udise?code=${encodeURIComponent(udiseCode)}`
  );
}
