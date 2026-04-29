import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import beneficiaryFilterValidationSchema from '../../validation/beneficiaryFilterValidationSchema';
import { fetchSchemeNameByRole } from '../../api/fetch-scheme';
import { getPicklistDefinitionByExternalReferenceCode } from '../../api/fetch-picklist';
import { getFilteredMonths } from '../../utils/fetch-months';
import { fetchDistrictsByState } from '../../api/fetch-apl-masters';
import APLAllocationDetailsCard from './APLAllocateBeneficiaries';
import { apiService } from '../../api/external-api';

const LoaderModal = ({ show }) => {
  if (!show) return null;

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-body text-center py-5">
            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <h5 className="mt-3 mb-0">Searching for beneficiaries...</h5>
            <p className="text-muted mt-2 mb-0">Please wait while we fetch the data</p>
          </div>
        </div>
      </div>
    </div>
  );
};

function APLDashboard({
  roles,
  setSearchResults,
  setSearchData,
  setApiRes,
  loginUserId,
  searchData,
  searchResults,
  apiRes,
  setCheckBalance,
  checkBalance,
}) {
  const [masterData, setMasterData] = useState({});
  const [show, setShow] = useState(false);
  const [backupSearchData, setBackupSearchData] = useState([]);
  const [showLoader, setShowLoader] = useState(false);
  const [months, setMonths] = useState([]);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: yupResolver(beneficiaryFilterValidationSchema),
    defaultValues: {
      schemeName: '',
      financialYear: '',
      installment: '',
      action: ''
    }
  });

  const financialYear = watch('financialYear');

  useEffect(() => {
    if (!loginUserId || !roles) return;
    const fetchSchemes = async () => {
      const roleNames = (roles || []).map(r => r.name);
      const schemes = await fetchSchemeNameByRole(roleNames);
      if (schemes.length === 0) {
        schemes.push({ 
          id: '179438_179438',
          name: 'Above Poverty Line (APL) Scheme',
          schemeCode: 'PEN-SJSA-SGNY-2-26-023',
          benefitsJsonData: ''
        });
      }
      setMasterData(prev => ({ ...prev, schemes }));
    };
    fetchSchemes();
  }, [loginUserId, roles]);

  useEffect(() => {
    const fetchPicklist = async () => {
      const picklistData = await getPicklistDefinitionByExternalReferenceCode('DBT-FINANCIAL-YEAR-APL');
      console.log('Picklist Data for Financial Year::::', picklistData);
      setMasterData(prev => ({ ...prev, financialYears: picklistData.listTypeEntries || [] }));
    };
    fetchPicklist();
  }, []);

  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        
        const items = await fetchDistrictsByState('179438');
        setMasterData(prev => ({ ...prev, districts: items || [] }));
      } catch (error) {
        console.error('Error fetching districts:', error);
      }
    };
    fetchDistricts();
  }, []);

  useEffect(() => {
    if (financialYear) {
      const filteredMonths = getFilteredMonths({ financialYear });
      setMonths(filteredMonths);
    } else {
      setMonths([]);
    }
  }, [financialYear]);

  const onSubmit = async (data) => {
    setShowLoader(true);
    
    try {
      const results = await apiService.getWIPBeneficiaries(data);
      const familyObj = results?.families?.[0];
      setSearchResults(results || []);
      setSearchData({ ...data, ...familyObj });
      setBackupSearchData(results.families || []);
      setShowLoader(false);
      setShow(true);
    } catch (error) {
      console.error('Error fetching beneficiary list:', error);
      setShowLoader(false);
    }
  };

  const handleReset = () => {
    reset();
    setShow(false);
    setSearchResults([]);
    setBackupSearchData([]);
    setSearchData([]);
    setCheckBalance({});
  };

  console.log('Master Data in Pension Dashboard::::', masterData, roles);
  const SNO_ROLES = ["pension sno", "assistance sno", "stipend sno", "pre matric sno"];
  const isSnoRole = roles?.some(r => SNO_ROLES.includes(r?.name?.toLowerCase())) || false;

  return (
    <>
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0 fw-bold">Pension Beneficiary List</h5>
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="row g-3">
              <div className="col-md-4 mb-3">
                <label className="form-label">
                  Scheme Name <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${errors.schemeName ? 'is-invalid' : ''}`}
                  {...register('schemeName')}
                >
                  <option value="">Select</option>
                  {masterData.schemes?.map((scheme) => (
                    <option
                      key={scheme.id}
                      value={scheme.schemeCode}
                    >
                      {scheme.name}
                    </option>
                  ))}
                </select>
                {errors.schemeName && (
                  <div className="invalid-feedback">{errors.schemeName.message}</div>
                )}
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">
                  District <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${errors.distCode ? 'is-invalid' : ''}`}
                  {...register('distCode')}
                >
                  <option value="">Select</option>
                  {masterData.districts?.map((district) => (
                    <option key={district.id} value={district.districtcode}>
                      {district.name}
                    </option>
                  ))}
                </select>
                {errors.distCode && (
                  <div className="invalid-feedback">{errors.distCode.message}</div>
                )}
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">
                  Financial Year <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${errors.financialYear ? 'is-invalid' : ''}`}
                  {...register('financialYear')}
                >
                  <option value="">Select</option>
                  {masterData.financialYears?.map((year) => (
                    <option key={year.id} value={year.name}>
                      {year.name}
                    </option>
                  ))}
                </select>
                {errors.financialYear && (
                  <div className="invalid-feedback">{errors.financialYear.message}</div>
                )}
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">
                  Installment <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${errors.installment ? 'is-invalid' : ''}`}
                  {...register('installment')}
                  disabled={!financialYear}
                >
                  <option value="">Select</option>
                  {months.map((month) => (
                    <option key={month.id} value={month.month_name}>
                      {month.month_name}
                    </option>
                  ))}
                </select>
                {errors.installment && (
                  <div className="invalid-feedback">{errors.installment.message}</div>
                )}
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">
                  Action <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${errors.action ? 'is-invalid' : ''}`}
                  {...register('action')}
                >
                  <option value="">Select</option>
                  <option value="Allocate Beneficiaries">Allocate Beneficiaries</option>
                </select>
                {errors.action && (
                  <div className="invalid-feedback">{errors.action.message}</div>
                )}
              </div>

              <div className="col-md-4 mb-3 d-flex align-items-end">
                <div className="d-flex gap-3 w-100">
                  <button type="submit" className="btn btn-primary flex-fill">Search</button>
                  <button type="button" className="btn btn-outline-primary flex-fill" onClick={handleReset}>Reset</button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      <LoaderModal show={showLoader} />

      {show && (
        <APLAllocationDetailsCard
          checkBalance={checkBalance?.data}
          apiRes={apiRes}
          searchResults={searchResults}
          setSearchResults={setSearchResults}
          setBackupSearchData={setBackupSearchData}
          backupSearchData={backupSearchData}
          searchData={searchData}
          hideUpperTable={true}
        />
      )}
    </>
  );
}

export default APLDashboard;
