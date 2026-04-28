import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import beneficiaryFilterValidationSchema from '../validation/beneficiaryFilterValidationSchema';
import { fetchSchemeName, fetchSchemeNameByRole } from '../api/fetch-scheme';
import { getPicklistDefinitionByExternalReferenceCode } from '../api/fetch-picklist';
import { fetchBeneficiaryList } from '../api/beneficiary-list';
import BeneficiaryTable from './BeneficiaryTable';


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

function PensionDashboard({
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
  const [lekLadkiInstallments, setLekLadkiInstallments] = useState([]);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: yupResolver(beneficiaryFilterValidationSchema),
    defaultValues: {
      schemeName: '',
      financialYear: '',
      installment: '',
      action: ''
    }
  });

  const selectedSchemeName = watch('schemeName');
  const selectedFinancialYear = watch('financialYear');
  console.log('selectedFinancialYear:::', selectedFinancialYear);


  const selectedSchemeObj = masterData.schemes?.find(
    s => (s.id + '_' + s.r_schemeMapping_c_schemeConfiguratorId) === selectedSchemeName
  );
  const isLekLadki = selectedSchemeObj?.schemeCode?.startsWith('SPA-WCDD-LEKL');
  const isOneTimeScheme = selectedSchemeObj?.schemeCode?.startsWith('SPA-SJSA-MVYS');

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getMonthOptions = (financialYear) => {
    const fy = (financialYear || '').trim();
    let startYear, endYear;
    if (fy.includes('-')) {
      [startYear, endYear] = fy.split('-').map(Number);
    } else if (fy.length === 4) {
      // e.g. "2526" means 2025-2026
      startYear = parseInt('20' + fy.substring(0, 2), 10);
      endYear = parseInt('20' + fy.substring(2, 4), 10);
    }
    if (!startYear || !endYear) return [];
    return MONTHS.map((month) => {
      const year = ['January', 'February', 'March'].includes(month) ? endYear : startYear;
      return { label: month, value: `Monthly Benefit_${month}_${year}` };

    });
  };

  useEffect(() => {
    if (!loginUserId || !roles) return;
    const fetchSchemes = async () => {
      const roleNames = (roles || []).map(r => r.name);
      const schemes = await fetchSchemeNameByRole(roleNames);
      setMasterData(prev => ({ ...prev, schemes }));
    };
    fetchSchemes();
  }, [loginUserId, roles]);

  useEffect(() => {
    const fetchPicklist = async () => {
      const picklistData = await getPicklistDefinitionByExternalReferenceCode('DBT-ACADEMIC-YEAR');
      console.log('Picklist Data for Financial Year::::', picklistData);
      setMasterData(prev => ({ ...prev, financialYears: picklistData.listTypeEntries || [] }));
    };
    fetchPicklist();
  }, []);

  useEffect(() => {
    if (!isLekLadki) {
      setLekLadkiInstallments([]);
      return;
    }
    const fetchInstallments = async () => {
      try {
        const res = await fetch(
          `/o/c/citizendashboardkpis?filter=schemeCode eq 'SPA-WCDD-LEKL-2-26-001'&pageSize=1&sort=dateCreated:desc`,
          {
            headers: {
              Accept: "application/json",
              "x-csrf-token": window.Liferay?.authToken || ""
            },
            credentials: "include"
          }
        );
        const data = await res.json();
        const benefitsRaw = data?.items?.[0]?.benefitsJsonData || "";
        const benefits = typeof benefitsRaw === "string" ? JSON.parse(benefitsRaw) : benefitsRaw;
        const installments = benefits?.installments || {};
        const sorted = Object.keys(installments)
          .sort()
          .map(k => ({ key: k, amount: installments[k] }));
        setLekLadkiInstallments(sorted);
      } catch (e) {
        console.error("Failed to fetch Lek Ladki installments", e);
        setLekLadkiInstallments([]);
      }
    };
    fetchInstallments();
  }, [isLekLadki]);

  const onSubmit = async (data) => {
    setShowLoader(true);

    try {
      const results = await fetchBeneficiaryList(data, setApiRes);
      console.log('Search Results from API:', results);
      setSearchResults(results);
      setSearchData(data);
      setBackupSearchData(results);
      setShow(true);
    } catch (error) {
      console.error('Error fetching beneficiary list:', error);
      setShowLoader(false);
      alert('An error occurred while fetching data. Please try again.');
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
                      value={scheme.id + '_' + scheme.r_schemeMapping_c_schemeConfiguratorId}
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
                  Financial Year <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${errors.financialYear ? 'is-invalid' : ''}`}
                  {...register('financialYear')}
                >
                  <option value="">Select</option>
                  {masterData.financialYears?.map((year) => (
                    <option key={year.id} value={year.key}>
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
                  Select Installment <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${errors.installment ? 'is-invalid' : ''}`}
                  {...register('installment')}
                >
                  <option value="">Select</option>
                  {isSnoRole && isLekLadki ? (
                    lekLadkiInstallments.map((inst) => (
                      <option key={inst.key} value={inst.key}>
                        {inst.key}
                      </option>
                    ))
) : isSnoRole && isOneTimeScheme ? (
  <option value="One-time Benefit">One-time Benefit</option>
) : isSnoRole ? (
  getMonthOptions(selectedFinancialYear).map(({ label, value }) => (
    <option key={value} value={value}>{label}</option>
  ))
) : (
                    <>
                      <option value="1st Installment">1st Installment</option>
                      <option value="2nd Installment">2nd Installment</option>
                    </>
                  )}
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
        <>
          <BeneficiaryTable
            searchResults={searchResults}
            searchData={searchData}
            setShowLoader={setShowLoader}
            enablePensionActions={true}
            isPensionRole={isSnoRole}
            apiRes={apiRes}
            setApiRes={setApiRes}
            setCheckBalance={setCheckBalance}
            checkBalance={checkBalance}
            setSearchResults={setSearchResults}
            setBackupSearchData={setBackupSearchData}
            backupSearchData={backupSearchData}
            onReset={handleReset}
          />
        </>
      )}
    </>
  );
}

export default PensionDashboard;
