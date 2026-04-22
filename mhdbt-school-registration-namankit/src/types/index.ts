export interface OnboardingState {
  userType: 'govtOfficial' | 'contractualEmployee' | '';
  verified: boolean;
  roleData:  RoleData;
}

export interface RoleData {
  post: string;
  designation: string;
  date: string;
  schemes: string[];
  department: string;
  fileName?:  string;
}

export interface VerificationData {
  parichayId?: string;
  sevarthId?: string;
  janParichayId?: string;
  aadhaarNumber?: string;
  mobileNumber?: string;
  emailAddress?: string;  
  fullName?: string;
  department?: string;
  designation?: string;
  empCode?: string;
  dob?: string;
  joinDate?: string;
}


export interface NotificationProps {
  message: string;
  type: 'success' | 'error';
}

export interface StepIndicatorState {
  completedSteps: number[];
  activeStep: number;
}