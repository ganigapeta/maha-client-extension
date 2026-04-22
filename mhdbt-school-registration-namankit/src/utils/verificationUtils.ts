export const verifyParichayId = (parichayId: string): boolean => {
  return parichayId.trim().length > 0;
};

export const verifySevarthId = (sevarthId: string): boolean => {
  return sevarthId.trim().length > 0;
};

export const verifyJanParichayId = (janParichayId: string): boolean => {
  return janParichayId.trim().length > 0;
};

export const verifyAadhaar = (aadhaarNumber:  string): boolean => {
  return aadhaarNumber.length === 12 && /^\d+$/.test(aadhaarNumber);
};

export const verifyOtp = (otp: string): boolean => {
  return otp. length === 6 && /^\d+$/.test(otp);
};

// Mock data retrieval
export const getMockUserDetails = () => ({
  fullName: 'Rajesh Kumar Sharma',
  department: 'Education Department',
});

