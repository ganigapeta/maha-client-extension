export const validationRules = {
  parentDepartment: { required: true, message: "Parent Department is required" },
  // deptCode: {
  //   required: true,
  //   pattern: /^\d+$/,
  //   message: "Department Assigned Code must be a number",
  // },
  deptCode: {
    required: true,
    pattern: /^\d{4}$/,
    message: "Department Code must be exactly 4 digits",
  },
  // aisheCode: {
  //   required: true,
  //   pattern: /^[A-Za-z0-9-]{3,20}$/,
  //   message: "Enter valid AISHE Code",
  // },
  aisheCode: {
    required: true,
    pattern: /^[A-Z]-\d{4}$/,
    message: "AISHE Code must be in format like U-0632",
  },

  instituteName: {
    required: true,
    pattern: /^[A-Za-z\s.,'-]{3,100}$/,
    message: "Institute Name should contain only letters",
  },


  mahaDbtCode: {
    required: false,
    pattern: /^[A-Za-z0-9]+$/,
    message: "Maha DBT Code is required and must be alphanumeric",
  },



  state: { required: true, message: "State is required" },
  district: { required: true, message: "District is required" },
  taluka: { required: true, message: "Taluka is required" },
  // village: { required: true, message: "Village is required" },

  address: { required: true, message: "Address is required" },

  pincode: {
    required: true,
    pattern: /^[0-9]{6}$/,
    message: "Enter valid 6-digit pincode",
  },

  website: {
    required: true,
    // allow www.example.com, http://example.com, https://example.com
    pattern: /^(https?:\/\/)?(www\.)?([a-zA-Z0-9\-]+\.)+[a-zA-Z]{2,}$/,
    message: "Enter valid website URL",
  },

  stdCode: {
    required: true,
    pattern: /^[0-9]{2,5}$/,
    message: "Enter valid STD code",
  },

  phone: {
    required: true,
    pattern: /^[1-9]{6,8}$/,
    message: "Enter a valid number (6 to 8 digits only)",
  },

  mobileNumber: {
    required: true,
    pattern: /^[6-9]\d{9}$/,
    message: "Enter valid mobile number",
  },

  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Enter valid email address",
  },

  instituteType: { required: true, message: "Institute Type is required" },
  // regNumber: { required: true, message: "Registration Number is required" },
  regNumber: {
    required: true,
    pattern: /^[A-Za-z0-9]{3,20}$/,
    message: "Registration Number is required",
  },

  establishYear: {
    required: true,
    pattern: /^(18|19|20)\d{2}$/,
    message: "Enter valid establishment year",
  },

  university: { required: true, message: "University is required" },
  instituteUnder: { required: true, message: "Institute Under is required" },

  naacAccredited: {
    required: true,
    message: "Please select NAAC accreditation status",
  },
  aadhaarNumber: {
    required: true,
    pattern: /^\d{12}$/,
    message: "Aadhaar must be exactly 12 digits",
  },
};
