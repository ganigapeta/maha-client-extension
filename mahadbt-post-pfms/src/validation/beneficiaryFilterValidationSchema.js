import * as yup from 'yup';

const beneficiaryFilterValidationSchema = yup.object({
  departmentName: yup.string().required('Department Name is required'),
  schemeName: yup.string().required('Scheme Name is required'),

});

export default beneficiaryFilterValidationSchema;