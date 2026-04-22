import * as yup from 'yup';

const beneficiaryFilterValidationSchema = yup.object({
  // departmentName: yup.string().required('Department Name is required'),
  schemeName: yup.string().required('Scheme Name is required'),
  financialYear: yup.string().required('Financial Year is required'),
  installment: yup.string().required('Installment is required'),
  action: yup.string().required('Action is required')
});

export default beneficiaryFilterValidationSchema;