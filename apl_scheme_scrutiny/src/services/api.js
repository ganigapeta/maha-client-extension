import axios from 'axios';
import { getPicklistByERC } from './fetch-masters';
import { buildHeadersExternal, getLiferayUserId } from '../config';

const API_BASE_URL = process.env.REACT_APP_API_APL_URL || 'https://mahadbt2-qa-dashboard.quantela.com/apl';
const API_BASE_URL_PREFIX = process.env.REACT_APP_API_APL_URL_PREFIX || '/v1';

const api = axios.create({
  baseURL: `${API_BASE_URL}${API_BASE_URL_PREFIX}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    config.headers['x-user-id'] = getLiferayUserId();
    return config;
  },
  (error) => Promise.reject(error)
);

// Calculate age from date of birth
const calculateAge = (dob) => {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Determine bank account availability
const determineBankAccount = (record) => {
  // Assume HOF has bank account if ekyc is completed
  // if (record.relation_name === 'HOF' || record.relation_name === 'SELF') {
    return record.is_aadhaar_linked_account === true ? 'Yes' : 'No';
  // }
  return 'No';
};

// Transform flat API data to family structure
const transformToFamilyStructure = (apiData) => {
  const familiesMap = new Map();

  apiData.forEach(record => {
    const rcNo = record.rc_no;
    
    if (!familiesMap.has(rcNo)) {
      familiesMap.set(rcNo, {
        rc_no: rcNo,
        rc_type: record.ct_card_desk || 'APL',
        dist_name: record.dist_name,
        dfso_name: record.dfso_name,
        afso_name: record.afso_name,
        fps_name: record.fps_name,
        hof_name: record.hof_name,
        dist_code: record.dist_code,
        dfso_code: record.dfso_code,
        afso_code: record.afso_code,
        fps_code: record.fps_code,
        members: []
      });
    }
       
    const family = familiesMap.get(rcNo);
    family.members.push({
      member_id: record.member_id,
      member_name: record.member_name,
      gender: record.gender,
      relation: record.relation_name,
      dob: record.member_dob || record.meber_dob,
      age: calculateAge(record.member_dob || record.meber_dob),
      aadhaar: record.uid,
      masked_aadhaar_no: record.masked_aadhaar_no,
      demo_auth: record.demo_auth,
      ekyc: record.ekyc,
      bank_account: determineBankAccount(record),
      is_aadhaar_linked_account: record.is_aadhaar_linked_account,
      is_hof: record.relation_name?.toLowerCase() === 'self' || record.relation_name?.toLowerCase() === 'hof',
      dist_code: record.dist_code,
      dfso_code: record.dfso_code,
      afso_code: record.afso_code,
      fps_code: record.fps_code,
      is_disbursement_account: record.is_disbursement_account || false,
      member_count: record.member_count || 0,
      amount: record.amount || 0
    });
  });

   // sort members: HOF/SELF first
  familiesMap.forEach(family => {
    family.members.sort((a, b) => {
      return (b.is_hof === true) - (a.is_hof === true);
    });
  });

  return Array.from(familiesMap.values());
};

// Mock data function
const getMockBeneficiaries = (params) => {
  return [
    {
      rc_no: 123456,
      rc_type: 'APL',
      dist_name: 'District A',
      dfso_name: 'DFSO Office A',
      afso_name: params.afsoOffice || 'AFSO Office',
      fps_name: params.fpsName || 'FPS Sample',
      hof_name: 'John Doe',
      members: [
        {
          member_id: 1001,
          member_name: 'John Doe',
          gender: 'Male',
          relation: 'HOF',
          dob: '1980-01-15',
          age: 44,
          aadhaar: '1234-5678-9012',
          demo_auth: 'Yes',
          ekyc: 'Yes',
          bank_account: 'Yes',
          is_hof: true
        },
        {
          member_id: 1002,
          member_name: 'Jane Doe',
          gender: 'Female',
          relation: 'Wife',
          dob: '1985-05-20',
          age: 39,
          aadhaar: '2345-6789-0123',
          demo_auth: 'Yes',
          ekyc: 'Yes',
          bank_account: 'No',
          is_hof: false
        },
        {
          member_id: 1003,
          member_name: 'Alice Doe',
          gender: 'Female',
          relation: 'Daughter',
          dob: '2010-03-10',
          age: 14,
          aadhaar: '3456-7890-1234',
          demo_auth: 'Yes',
          ekyc: 'No',
          bank_account: 'No',
          is_hof: false
        }
      ]
    },
    {
      rc_no: 789012,
      rc_type: 'PHH',
      dist_name: 'District A',
      dfso_name: 'DFSO Office A',
      afso_name: params.afsoOffice || 'AFSO Office',
      fps_name: params.fpsName || 'FPS Sample',
      hof_name: 'Robert Smith',
      members: [
        {
          member_id: 2001,
          member_name: 'Robert Smith',
          gender: 'Male',
          relation: 'HOF',
          dob: '1975-08-25',
          age: 49,
          aadhaar: '4567-8901-2345',
          demo_auth: 'Yes',
          ekyc: 'Yes',
          bank_account: 'No',
          is_hof: true
        },
        {
          member_id: 2002,
          member_name: 'Mary Smith',
          gender: 'Female',
          relation: 'Wife',
          dob: '1978-11-30',
          age: 46,
          aadhaar: '5678-9012-3456',
          demo_auth: 'Yes',
          ekyc: 'Yes',
          bank_account: 'Yes',
          is_hof: false
        }
      ]
    },
    {
      rc_no: 345678,
      rc_type: 'AAY',
      dist_name: 'District A',
      dfso_name: 'DFSO Office A',
      afso_name: params.afsoOffice || 'AFSO Office',
      fps_name: params.fpsName || 'FPS Sample',
      hof_name: 'David Wilson',
      members: [
        {
          member_id: 3001,
          member_name: 'David Wilson',
          gender: 'Male',
          relation: 'HOF',
          dob: '1990-02-14',
          age: 34,
          aadhaar: '6789-0123-4567',
          demo_auth: 'Yes',
          ekyc: 'Yes',
          bank_account: 'Yes',
          is_hof: true
        }
      ]
    }
  ];
};

// API service methods
export const apiService = {
  // Financial Year
  getFinancialYears: async () => {
    try {
      const years = await getPicklistByERC("DBT-FINANCIAL-YEAR-APL");

      const formattedYears = years.map((item) => ({
        id: item.key,
        financial_year: item.name,
      }));

      console.log("years ", formattedYears);

      return {
        data: formattedYears,
      };
    } catch (error) {
      console.error("Error fetching Years list:", error);
      return { data: [] };
    }
  },

  // Months
  getMonths: async () => {
    return {
      data: [
        { id: 1, month_name: "January", month_number: 1 },
        { id: 2, month_name: "February", month_number: 2 },
        { id: 3, month_name: "March", month_number: 3 },
        { id: 4, month_name: "April", month_number: 4 },
        { id: 5, month_name: "May", month_number: 5 },
        { id: 6, month_name: "June", month_number: 6 },
        { id: 7, month_name: "July", month_number: 7 },
        { id: 8, month_name: "August", month_number: 8 },
        { id: 9, month_name: "September", month_number: 9 },
        { id: 10, month_name: "October", month_number: 10 },
        { id: 11, month_name: "November", month_number: 11 },
        { id: 12, month_name: "December", month_number: 12 },
      ],
    };
  },

  // AFSO
  getAFSOList: async () => {
    try {
      const response = await api.get(
        "/afso?page=1&limit=100&sortBy=afso_code&sortOrder=ASC",
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching AFSO list:", error);
      return { data: [] };
    }
  },

  // AFSO
  getAFSOListByDFSOCode: async (dfsoCode) => {
    try {
      const response = await api.get(`/afso/dfso/${dfsoCode}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching AFSO list:", error);
      return { data: [] };
    }
  },

  // FPS
  getFPSList: async () => {
    try {
      const response = await api.get("/fps?isActive=true&limit=100");
      return response.data;
    } catch (error) {
      console.error("Error fetching FPS list:", error);
      return { data: [] };
    }
  },

  // FPS
  getFPSListByAFSOCode: async (afsoCode) => {
    try {
      const response = await api.get(`/fps/afso/${afsoCode}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching FPS list:", error);
      return { data: [] };
    }
  },

  // Get beneficiaries for New Scrutiny (Tab 1)
  // Excludes records already submitted for the selected month/year
  getBeneficiaries: async (params) => {
    const useMockData = process.env.REACT_APP_USE_MOCK_DATA === "true";

    if (useMockData) {
      console.log("Using mock data (REACT_APP_USE_MOCK_DATA=true)");
      return getMockBeneficiaries(params);
    }
    console.log("Fetching beneficiaries (New Scrutiny) with params:", params);

    // Fetch from real API
    try {
      console.log("Fetching from API (REACT_APP_USE_MOCK_DATA=false)");

      // Extract month number from month name
      const monthMap = {
        January: 1,
        February: 2,
        March: 3,
        April: 4,
        May: 5,
        June: 6,
        July: 7,
        August: 8,
        September: 9,
        October: 10,
        November: 11,
        December: 12,
      };
      const mm = monthMap[params.month] || parseInt(params.month);

      const response = await api.get("/apl-data/", {
        params: {
          page: 1,
          limit: 1000,
          sortBy: "rc_no",
          sortOrder: "DESC",
          fpsCode: params.fpsCode,
          fy: params.financialYear, // e.g., '2026-27'
          mm: mm, // Month number 1-12
          excludeSubmitted: true, // Exclude already submitted records
        },
      });

      console.log("API Response (New Scrutiny):", response.data);

      // Transform API response to family structure
      const families = transformToFamilyStructure(response.data.data);
      console.log("Transformed to families:", families.length);
      return families;
    } catch (error) {
      console.error(
        "Error fetching from API, falling back to mock data:",
        error,
      );
      return [];
    }
  },

  // Get WIP beneficiaries with SCRUTINY_PENDING status (for DFSO)
  getWIPBeneficiaries: async (params) => {
    try {
      console.log("Fetching WIP data with status SCRUTINY_PENDING");

      // Extract month number from month name
      const monthMap = {
        January: 1,
        February: 2,
        March: 3,
        April: 4,
        May: 5,
        June: 6,
        July: 7,
        August: 8,
        September: 9,
        October: 10,
        November: 11,
        December: 12,
      };
      const mm = monthMap[params.month] || parseInt(params.month);

      const response = await api.get("/apl-wip/", {
        params: {
          page: 1,
          limit: 100,
          sortBy: "rc_no",
          sortOrder: "DESC",
          isActive: true,
          wf_status: "SCRUTINY_PENDING",
          fpsCode: params.fpsCode,
          fy: params.financialYear, // e.g., '2026-27'
          mm: mm,
        },
      });

      console.log("WIP API Response:", response.data);

      // Transform API response to family structure
      const families = transformToFamilyStructure(response.data.data);
      console.log("Transformed to families:", families.length);
      return families;
    } catch (error) {
      console.error("Error fetching WIP data:", error);
      throw error;
    }
  },

  // Get Old Scrutiny Records (Tab 2 - Latest APPROVED records)
  // Gets latest distinct APPROVED records where all family records match with t_apl_data
  getOldScrutinyRecords: async (params) => {
    try {
      console.log(
        "Fetching Old Scrutiny Records (latest APPROVED) with params:",
        params,
      );

      // Extract month number from month name
      const monthMap = {
        January: 1,
        February: 2,
        March: 3,
        April: 4,
        May: 5,
        June: 6,
        July: 7,
        August: 8,
        September: 9,
        October: 10,
        November: 11,
        December: 12,
      };
      const mm = monthMap[params.month] || parseInt(params.month);

      const response = await api.get("/apl-wip/old-scrutiny", {
        params: {
          page: 1,
          limit: 1000,
          sortBy: "rc_no",
          sortOrder: "DESC",
          fpsCode: params.fpsCode,
          fy: params.financialYear, // e.g., '2026-27'
          mm: mm, // Month number 1-12
          status: "APPROVED", // Only APPROVED records
          latestOnly: true, // Latest distinct records
        },
      });

      console.log("Old Scrutiny API Response:", response.data);

      // Transform API response to family structure
      const families = transformToFamilyStructure(response.data.data);
      console.log("Transformed to families:", families.length);
      return families;
    } catch (error) {
      console.error("Error fetching old scrutiny data:", error);
      // Return empty array instead of throwing to allow graceful handling
      return [];
    }
  },

  // Save WIP data (bulk insert) with fy and mm
  saveWIPData: async (payload, searchParams) => {
    // Extract month number from month name
    const monthMap = {
      January: 1,
      February: 2,
      March: 3,
      April: 4,
      May: 5,
      June: 6,
      July: 7,
      August: 8,
      September: 9,
      October: 10,
      November: 11,
      December: 12,
    };
    const mm = monthMap[searchParams?.month] || parseInt(searchParams?.month);

    // Add fy and mm to each record in payload
    const enrichedPayload = payload.map((record) => ({
      ...record,
      fy: searchParams?.financialYear, // e.g., '2026-27'
      mm: mm, // Month number 1-12
    }));

    console.log("Saving WIP data with fy and mm:", {
      fy: searchParams?.financialYear,
      mm,
    });
    const response = await api.post("/apl-wip/bulk", enrichedPayload);
    return response.data;
  },

  // Update WIP data status (bulk update to APPROVED)
  updateWIPDataStatus: async (payload) => {

     // Extract month number from month name
      const monthMap = {
        January: 1,
        February: 2,
        March: 3,
        April: 4,
        May: 5,
        June: 6,
        July: 7,
        August: 8,
        September: 9,
        October: 10,
        November: 11,
        December: 12,
      };
      const mm = monthMap[payload.month] || parseInt(payload.month);
      payload.mm = mm; // Month number 1-12

    const response = await api.post("/apl-wip/bulk-update-status", payload);
    return response.data;
  },
};

export default api;
