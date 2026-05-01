import axios from 'axios';

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
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('API Request - User:', user);
    if (user.user_id) {
      config.headers['x-user-id'] = user.user_id;
    }
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

export function generateBillNumber() {
  const timestamp = Date.now().toString().slice(-6);
  const randomNumber = Math.floor(100 + Math.random() * 900);
  return `${randomNumber}${timestamp}`;
}
export function generateAllotmentID() {
  const timestampPart = Date.now().toString().slice(-6);
  const randomNumber = Math.floor(100 + Math.random() * 900);
  return `${timestampPart}-${randomNumber}`;
}
export function generateRFTNumber(financialYear) {
  // financialYear should be like "2025-2026"
  // Output: MH2025-2026/APLS/25072025/123456789

  // Current date in DDMMYYYY format
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const currentDate = `${dd}${mm}${yyyy}`;

  // 9-digit unique number using timestamp + random padding
  const timestamp = Date.now().toString(); // 13 digits
  const random = Math.floor(100 + Math.random() * 900).toString(); // 3 digits
  const nineDigit = (timestamp + random).slice(-9); // take last 9 digits

  return `MH${financialYear}/APLS/${currentDate}/${nineDigit}`;
}


export function generateApplicationNo(typeCode = 'APL', sequence = 1) {
  const now = new Date();

  // 2-digit year
  const year = now.getFullYear().toString().slice(-2);

  // Week number (ISO week)
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7)
    .toString()
    .padStart(2, '0');

  // 2-digit month
  const month = (now.getMonth() + 1).toString().padStart(2, '0');

  // 10-digit zero-padded sequence
  // const seq = sequence.toString().padStart(10, '0');
    const timestampPart = Date.now().toString().slice(-6);
  const randomNumber = Math.floor(100 + Math.random() * 900);


  return `${year}${week}${month}${typeCode}${timestampPart}${randomNumber}`;
}

const transformToFamilyStructureAmount = (apiData) => {
  const familiesMap = new Map();
  let totalMembers = 0;
  let totalAmount = 0;

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
        is_disbursement_account: record.is_disbursement_account || false,
        member_count: record.member_count || 0,
        amount: record.amount || 0,
        id: record.id
      });

      // ✅ Aggregate only once per unique RC (family)
      totalMembers += record.member_count || 0;
    }
  });

    totalAmount = totalMembers * 170;

  const families = Array.from(familiesMap.values());

  return {
    total_families: families.length,
    total_members: totalMembers,
    total_amount: totalAmount,
    families,
  };
};
// API service methods
export const apiService = {


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

  // Get WIP beneficiaries with APPROVED status (for DFSO)
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
      const mm = monthMap[params.installment] || parseInt(params.installment);

      
      const response = await api.get("/apl-wip/", {
        params: {
          page: 1,
          limit: 100,
          sortBy: "rc_no",
          sortOrder: "DESC",
          isActive: true,
          wf_status: "APPROVED",
          fpsCode: params.fpsCode,
          fy: params.financialYear, // e.g., '2026-27'
          mm: mm,
          distCode: params.distCode,
          is_disbursement_account: true
        },
      });

      const families = transformToFamilyStructureAmount(response.data.data);
      return families;
    } catch (error) {
      console.error("Error fetching WIP data:", error);
      throw error;
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

    
  

  // Save WIP data (bulk insert) with fy and mm
  allocateAPLBeneficiaries: async (payload, searchParams, setBillGeneratedBillInfo) => {
    // Extract month number from month name

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
      const mm = monthMap[searchParams.installment] || parseInt(searchParams.installment);


    // let billNumber = generateBillNumber();
    let billNumber = generateRFTNumber(searchParams?.financialYear);

    console.log("Generated Bill Number:", payload[0]);
    // Add fy and mm to each record in payload
    const enrichedPayload = payload.map((record) => ({
      ...record,
      scrutiny_id: record.id,
      // bill_date: new Date().toISOString(),
      bill_date: new Date().toISOString().split('T')[0],
      bill_generated_by: searchParams.user_id || 1,
      fy: searchParams?.financialYear,
      mm: mm,
      allotment_id: generateAllotmentID(),
      application_no: generateApplicationNo(),
      bill_no: billNumber, // e.g., '2026-27'
      rft_status: 'ALLOTTED',
      billNumber: billNumber
      // rft_no: rftNumber
      // batchID: billNumber
    }));
    try{
    setBillGeneratedBillInfo(enrichedPayload[0]);
    const response = await api.post("/apl-bill/allotment/bulk", enrichedPayload);
    
    return {status: true, data: enrichedPayload};
     } catch (error) {
      console.error("Failed to Allocate:", error);
      return {status: false, data: [] };
      // return {status: false, data: enrichedPayload };

    }
  },

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
      const mm = monthMap[payload.installment] || parseInt(payload.installment);
      payload.mm = mm; // Month number 1-12


    const response = await api.post("/apl-wip/bulk-update-status", payload);
    return response.data;
  },

  // Update Bill data status (bulk update to ALLOTTED/BILL_GENERATED/DISBURSED)
  updateRFTStatus: async (payload) => {
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
      const mm = monthMap[payload.installment] || parseInt(payload.installment);
      payload.mm = mm; // Month number 1-12

    const response = await api.post("/apl-wip/rft-update", payload);
    return response.data;
  },
};

export default api;
