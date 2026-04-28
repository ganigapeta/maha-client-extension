import * as yup from 'yup';

const aplBeneficiaryFilterValidationSchema = yup.object({
  schemeName: yup.string().required('Scheme Name is required'),
  distCode: yup.string().required('District is required'),
  financialYear: yup.string().required('Financial Year is required'),
  installment: yup.string().required('Installment is required'),
  action: yup.string().required('Action is required')
});

export default aplBeneficiaryFilterValidationSchema;