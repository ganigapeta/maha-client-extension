import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import beneficiaryFilterValidationSchema from '../validation/beneficiaryFilterValidationSchema';
import { fetchDepartmentsBasedOnRoles } from '../api/fetch-department';
import { fetchSchemeNameForDDO } from '../api/fetch-scheme';
import { getPicklistDefinitionByExternalReferenceCode } from '../api/fetch-picklist';
import { fetchBeneficiaryList } from '../api/beneficiary-list';

function BeneficiaryFilter({ roles, setSearchResults, setSearchData, setScheme, isPensionDDO = false, isAssistanceDDO = false }) {
  const [masterData, setMasterData] = useState({});
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(beneficiaryFilterValidationSchema),
    defaultValues: {
      departmentName: '',
      schemeName: '',
      financialYear: '',
      installment: '',
      action: ''
    }
  });

  useEffect(() => {
    if (!roles) return;
    const fetchDepartments = async () => {
      const departments = await fetchDepartmentsBasedOnRoles(roles);
      console.log("Departments based on roles:::::", departments);
      setMasterData(prev => ({ ...prev, departments }));

    };
    fetchDepartments();
  }, [roles]);

  useEffect(() => {
    const fetchPicklist = async () => {
      const picklistData = await getPicklistDefinitionByExternalReferenceCode("DBT-ACADEMIC-YEAR");
      console.log("Picklist Data for Financial Year::::", picklistData);
      setMasterData(prev => ({ ...prev, financialYears: picklistData.listTypeEntries || [] }));
    }
    fetchPicklist()
  }, [])

  const onSubmit = async (data) => {
    console.log('Form Data:', data);
    const results = await fetchBeneficiaryList(data, setScheme, isPensionDDO || isAssistanceDDO);

    console.log("Search Results from API:", results);
    setSearchResults(results);
    setSearchData(data);
  };
  console.log("Master Data in Filter Component::::", masterData);

  return (
    <>
      <div className="card">

        {/* Dark navy header */}
        <div className="card-header">
          <h5 className="mb-0 fw-bold">Beneficiary List</h5>
        </div>

        {/* Card body */}
        <div className="card-body">
          <form onSubmit={handleSubmit(onSubmit)}>

            <div className="row g-3">
              {/* Department Name */}
              <div className="col-md-4 mb-3">
                <label className="form-label">
                  Department Name <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${errors.departmentName ? 'is-invalid' : ''}`}
                  {...register('departmentName')}
                  onChange={async (e) => {
                    await fetchSchemeNameForDDO(e.target.value, setMasterData, roles);
                  }}
                >
                  <option value="">Select</option>
                  {masterData.departments?.map((dept) => (
                    <option key={dept.id} value={dept.id + '_' + dept.name + '_' + dept.code}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {errors.departmentName && (
                  <div className="invalid-feedback">{errors.departmentName.message}</div>
                )}
              </div>

              {/* Scheme Name */}
              <div className="col-md-4 mb-3">
                <label className="form-label">
                  Scheme Name <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${errors.schemeName ? 'is-invalid' : ''}`}
                  {...register('schemeName')}
                >
                  <option value="">Select</option>
                  {masterData.schemeNames?.map((scheme) => (
                    <option key={scheme.id} value={scheme.id + '_' + scheme.name + '_' + scheme.code}>
                      {scheme.name}
                    </option>
                  ))}
                </select>
                {errors.schemeName && (
                  <div className="invalid-feedback">{errors.schemeName.message}</div>
                )}
              </div>

              {/* Buttons - with proper gap */}
              <div className="col-md-4 mb-3 d-flex align-items-end">
                <div className="d-flex gap-3 w-100">
                  <button type="submit" className="btn btn-primary flex-fill">Submit</button>
                  <button type="button" className="btn btn-outline-primary flex-fill" onClick={() => reset()}>Reset</button>
                </div>
              </div>
            </div>

          </form>
        </div>
      </div>

    </>
  )
}

export default BeneficiaryFilter
