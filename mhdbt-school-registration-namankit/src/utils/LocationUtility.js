/**
 * locationUtils.js
 * ─────────────────────────────────────────────────────────────
 * Location fetching utility for School Onboarding.
 * Tribal Development Department – Maharashtra Government.
 *
 * Exports:
 *   resolveId(item)          – Extract a consistent id from any API shape
 *   resolveLabel(item)       – Extract a consistent label from any API shape
 *   sortByName(arr)          – Sort normalized items alphabetically by name
 *   normalizeItems(items)    – Map raw API items → { id, name, raw }
 *   useLocationCascade(...)  – Custom hook: states/districts/talukas/villages
 *                              with loading flags, cascade resets, and
 *                              a handleLocationSelect dispatcher
 *
 * API functions expected (injected via hook options):
 *   getStates()
 *   fetchDistrictsByState(stateId)
 *   fetchTalukasByDistrict(districtId)
 *   fetchVillagesByTaluka(talukaId)
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';

// ─── Field resolution helpers ────────────────────────────────

/**
 * Picks the first truthy value from a list of candidate keys on `item`.
 * Falls back to an empty string so callers never get undefined.
 */
function firstOf(item, ...keys) {
  for (const key of keys) {
    const v = item[key];
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      return String(v).trim();
    }
  }
  return '';
}

/**
 * Extracts a stable numeric/string id from an API item regardless of
 * which key the backend uses (id, ID, value, stateId, …).
 */
export function resolveId(item) {
  if (!item || typeof item !== 'object') return '';
  return firstOf(item,
    'id', 'ID', 'Id',
    'value', 'Value',
    'stateId', 'districtId', 'talukaId', 'villageId',
    'stateID', 'districtID', 'talukaID', 'villageID',
    'code', 'Code',
  );
}

/**
 * Extracts a human-readable label from an API item regardless of
 * which key the backend uses (name, label, title, …).
 */
export function resolveLabel(item) {
  if (!item || typeof item !== 'object') return '';
  return firstOf(item,
    'name', 'Name',
    'label', 'Label',
    'title', 'Title',
    'stateName', 'districtName', 'talukaName', 'villageName',
    'description', 'Description',
  );
}

// ─── Collection helpers ──────────────────────────────────────

/** Sort an array of normalised { id, name, raw } items A→Z by name. */
export function sortByName(items) {
  return [...items].sort((a, b) =>
    a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })
  );
}

/**
 * Map a raw API array → normalised [ { id, name, raw }, … ]
 * Items missing either id or name are silently dropped.
 */
export function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return sortByName(
    items
      .map((item) => ({
        id:   resolveId(item),
        name: resolveLabel(item),
        raw:  item,
      }))
      .filter((item) => item.id && item.name)
  );
}

// ─── Census-code extractors ──────────────────────────────────
// Kept here so the form never needs to know which key the API uses.

export function extractStateCodeCensus(raw = {}) {
  return firstOf(raw, 'statecodecensus', 'stateCodeCensus', 'stateCensus', 'statecode');
}

export function extractDistrictCode(raw = {}) {
  return firstOf(raw, 'districtCode', 'districtcode', 'districtCodeCensus');
}

export function extractDistrictCodeCensus(raw = {}) {
  return firstOf(raw, 'districtcodecensus', 'districtCodeCensus', 'districtCensus');
}

export function extractTalukaCodeCensus(raw = {}) {
  return firstOf(raw, 'talukacodecensus', 'talukaCodeCensus', 'talukaCensus');
}

// ─── Custom hook ─────────────────────────────────────────────

/**
 * useLocationCascade
 *
 * Encapsulates the full State → District → Taluka → Village cascade:
 *   • Loads states on mount
 *   • Re-loads districts whenever schoolData.state changes
 *   • Re-loads talukas  whenever schoolData.district changes
 *   • Re-loads villages whenever schoolData.taluka changes
 *
 * @param {object} options
 * @param {object}   options.schoolData        – Current form data (read-only)
 * @param {function} options.setSchoolData      – Form data setter
 * @param {object}   options.errors             – Current validation errors
 * @param {function} options.setErrors          – Errors setter
 * @param {function} options.validateField      – (fieldName, value) → errorString
 * @param {function} options.getStates          – () → Promise<raw[]>
 * @param {function} options.fetchDistrictsByState  – (stateId) → Promise<raw[]>
 * @param {function} options.fetchTalukasByDistrict – (districtId) → Promise<raw[]>
 * @param {function} options.fetchVillagesByTaluka  – (talukaId) → Promise<raw[]>
 *
 * @returns {object} {
 *   states, districts, talukas, villages,
 *   isLoadingStates, isLoadingDistricts, isLoadingTalukas, isLoadingVillages,
 *   handleLocationSelect,
 * }
 */
export function useLocationCascade({
  schoolData,
  setSchoolData,
  errors,
  setErrors,
  validateField,
  getStates,
  fetchDistrictsByState,
  fetchTalukasByDistrict,
  fetchVillagesByTaluka,
}) {
  // ── Normalised dropdown data
  const [states,    setStates]    = useState([]);
  const [districts, setDistricts] = useState([]);
  const [talukas,   setTalukas]   = useState([]);
  const [villages,  setVillages]  = useState([]);

  // ── Loading flags
  const [isLoadingStates,    setIsLoadingStates]    = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingTalukas,   setIsLoadingTalukas]   = useState(false);
  const [isLoadingVillages,  setIsLoadingVillages]  = useState(false);

  // ── Load states once on mount ──────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadStates() {
      setIsLoadingStates(true);
      try {
        const items = await getStates();
        if (!cancelled) setStates(normalizeItems(items));
      } catch (err) {
        console.error('[locationUtils] loadStates failed:', err);
        if (!cancelled) setStates([]);
      } finally {
        if (!cancelled) setIsLoadingStates(false);
      }
    }

    loadStates();
    return () => { cancelled = true; };
  }, [getStates]);

  // ── Cascade: state → districts ─────────────────────────────
  useEffect(() => {
    if (!schoolData.state) {
      setDistricts([]);
      return;
    }

    let cancelled = false;
    setDistricts([]);
    setIsLoadingDistricts(true);

    async function loadDistricts() {
      try {
        const selectedState = states.find((item) => item.name === schoolData.state);
        if (!selectedState) return;

        const items = await fetchDistrictsByState(selectedState.id);
        if (!cancelled) setDistricts(normalizeItems(items));
      } catch (err) {
        console.error('[locationUtils] loadDistricts failed:', err);
        if (!cancelled) setDistricts([]);
      } finally {
        if (!cancelled) setIsLoadingDistricts(false);
      }
    }

    loadDistricts();
    return () => { cancelled = true; };
  }, [schoolData.state, states, fetchDistrictsByState]);

  // ── Cascade: district → talukas ────────────────────────────
  useEffect(() => {
    if (!schoolData.district) {
      setTalukas([]);
      return;
    }

    let cancelled = false;
    setTalukas([]);
    setIsLoadingTalukas(true);

    async function loadTalukas() {
      try {
        const selectedDistrict = districts.find((item) => item.name === schoolData.district);
        if (!selectedDistrict) return;

        const items = await fetchTalukasByDistrict(selectedDistrict.id);
        if (!cancelled) setTalukas(normalizeItems(items));
      } catch (err) {
        console.error('[locationUtils] loadTalukas failed:', err);
        if (!cancelled) setTalukas([]);
      } finally {
        if (!cancelled) setIsLoadingTalukas(false);
      }
    }

    loadTalukas();
    return () => { cancelled = true; };
  }, [schoolData.district, districts, fetchTalukasByDistrict]);

  // ── Cascade: taluka → villages ─────────────────────────────
  useEffect(() => {
    if (!schoolData.taluka) {
      setVillages([]);
      return;
    }

    let cancelled = false;
    setVillages([]);
    setIsLoadingVillages(true);

    async function loadVillages() {
      try {
        const selectedTaluka = talukas.find((item) => item.name === schoolData.taluka);
        if (!selectedTaluka) return;

        const items = await fetchVillagesByTaluka(selectedTaluka.id);
        if (!cancelled) setVillages(normalizeItems(items));
      } catch (err) {
        console.error('[locationUtils] loadVillages failed:', err);
        if (!cancelled) setVillages([]);
      } finally {
        if (!cancelled) setIsLoadingVillages(false);
      }
    }

    loadVillages();
    return () => { cancelled = true; };
  }, [schoolData.taluka, talukas, fetchVillagesByTaluka]);

  // ── handleLocationSelect ────────────────────────────────────
  /**
   * Unified handler for all four location dropdowns.
   * Clears downstream fields whenever an upstream selection changes.
   *
   * @param {'state'|'district'|'taluka'|'village'} field
   * @param {{ label?, name?, value?, id?, raw? } | null} option
   */
  const handleLocationSelect = useCallback((field, option = null) => {
    const value = option ? (option.label || option.name || '') : '';
    const id    = option ? (option.value || option.id    || '') : '';
    const raw   = option?.raw || {};

    setSchoolData((prev) => {
      const next = {
        ...prev,
        [field]:         value,
        [`${field}Id`]:  id,
      };

      if (field === 'state') {
        next.stateName          = value;
        next.statecodecensus    = extractStateCodeCensus(raw);
        // Clear downstream
        next.district           = '';
        next.districtId         = '';
        next.districtName       = '';
        next.districtCode       = '';
        next.districtcodecensus = '';
        next.taluka             = '';
        next.talukaId           = '';
        next.talukaName         = '';
        next.talukacodecensus   = '';
        next.village            = '';
        next.villageId          = '';
        next.villageName        = '';
      }

      if (field === 'district') {
        next.districtName       = value;
        next.districtCode       = extractDistrictCode(raw);
        next.districtcodecensus = extractDistrictCodeCensus(raw);
        // Clear downstream
        next.taluka             = '';
        next.talukaId           = '';
        next.talukaName         = '';
        next.talukacodecensus   = '';
        next.village            = '';
        next.villageId          = '';
        next.villageName        = '';
      }

      if (field === 'taluka') {
        next.talukaName         = value;
        next.talukacodecensus   = extractTalukaCodeCensus(raw);
        // Clear downstream
        next.village            = '';
        next.villageId          = '';
        next.villageName        = '';
      }

      if (field === 'village') {
        next.villageName = value;
      }

      return next;
    });

    // Clear existing error for this field immediately,
    // then run fresh validation on the new value.
    setErrors((prev) => ({
      ...prev,
      [field]: validateField ? validateField(field, value) : '',
    }));
  }, [setSchoolData, setErrors, validateField]);

  // ── Return ──────────────────────────────────────────────────
  return {
    // Dropdown data
    states,
    districts,
    talukas,
    villages,
    // Loading flags
    isLoadingStates,
    isLoadingDistricts,
    isLoadingTalukas,
    isLoadingVillages,
    // Dispatcher
    handleLocationSelect,
  };
}