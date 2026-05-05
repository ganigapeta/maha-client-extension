import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import beneficiaryFilterValidationSchema from '../validation/beneficiaryFilterValidationSchema';
import { fetchDepartmentsBasedOnRoles } from '../api/fetch-department';
import { fetchSchemeNameForDDO } from '../api/fetch-scheme';
import { getPicklistDefinitionByExternalReferenceCode } from '../api/fetch-picklist';
import { fetchBeneficiaryList } from '../api/beneficiary-list';

const getFinancialYearPicklistCode = (scheme = {}) => {
  const schemeType = String(scheme?.schemeType || '').toLowerCase();
  const schemeName = String(scheme?.name || '').toLowerCase();
  const isPostMatricScheme =
    schemeType.includes('post matric') || schemeName.includes('post matric');

  return isPostMatricScheme ? 'DBT-ACADEMIC-YEAR' : 'ADDITIONAL-YEAR';
};

function BeneficiaryFilter({ roles, setSearchResults, setSearchData, setScheme, isPensionDDO = false, isAssistanceDDO = false }) {
  const [masterData, setMasterData] = useState({});
const [lekLadkiInstallments, setLekLadkiInstallments] = useState([]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: yupResolver(beneficiaryFilterValidationSchema),
    defaultValues: {
      departmentName: '',
      schemeName: '',
      financialYear: '',
      installment: '',
      action: '',
      year: '',
      month: ''
    }
  });

  const selectedSchemeName = watch('schemeName');
  const selectedYear = watch('year');

  const selectedSchemeObj = masterData.schemeNames?.find(
    s => `${s.id}_${s.name}_${s.code}` === selectedSchemeName
  );
  const schemeCode = selectedSchemeObj?.code || '';
  const isLekLadki = schemeCode.startsWith('SPA-WCDD-LEKL');
  const isOneTimeScheme = schemeCode.startsWith('SPA-SJSA-MVYS');
  const isPensionScheme = schemeCode.startsWith('PEN-');

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
    if (!isLekLadki || !schemeCode) {
      setLekLadkiInstallments([]);
      return;
    }
    const fetchInstallments = async () => {
      try {
        const res = await fetch(
          `/o/c/citizendashboardkpis?filter=schemeCode eq '${schemeCode}'&pageSize=1&sort=dateCreated:desc`,
          {
            headers: { Accept: 'application/json', 'x-csrf-token': window.Liferay?.authToken || '' },
            credentials: 'include'
          }
        );
        const data = await res.json();
        const benefitsRaw = data?.items?.[0]?.benefitsJsonData || '';
        const benefits = typeof benefitsRaw === 'string' ? JSON.parse(benefitsRaw) : benefitsRaw;
        const installments = benefits?.installments || {};
        const sorted = Object.keys(installments)
          .sort((a, b) => {
            const numA = parseInt(a.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.replace(/\D/g, '')) || 0;
            return numA - numB;
          })
          .map(k => ({ key: k, amount: installments[k] }));
        setLekLadkiInstallments(sorted);
      } catch (e) {
        console.error('Failed to fetch Lek Ladki installments', e);
        setLekLadkiInstallments([]);
      }
    };
    fetchInstallments();
  }, [isLekLadki, schemeCode]);


  useEffect(() => {
    if (!roles) return;
    const fetchDepartments = async () => {
      const departments = await fetchDepartmentsBasedOnRoles(roles);
      console.log("Departments based on roles:::::", departments);
      setMasterData(prev => ({ ...prev, departments }));

      if (departments && departments.length > 0) {
        const dept = departments[0];
        const deptValue = dept.id + '_' + dept.name + '_' + dept.code;
        setValue('departmentName', deptValue);
        await fetchSchemeNameForDDO(deptValue, setMasterData, roles);
      }

    };
    fetchDepartments();
  }, [roles, setValue]);

  useEffect(() => {
    const selectedScheme = masterData.schemeNames?.find(
      (scheme) =>
        `${scheme.id}_${scheme.name}_${scheme.code}` === selectedSchemeName,
    );

    setValue('year', '');

    if (!selectedScheme) {
      setMasterData((prev) => ({ ...prev, years: [] }));
      return;
    }

    const fetchYears = async () => {
      const externalReferenceCode =
        getFinancialYearPicklistCode(selectedScheme);
      const picklistData =
        await getPicklistDefinitionByExternalReferenceCode(
          externalReferenceCode,
        );

      console.log(
        'Picklist Data for Financial Year::::',
        externalReferenceCode,
        picklistData,
      );

      setMasterData((prev) => ({
        ...prev,
        years: picklistData?.listTypeEntries || [],
      }));
    };

    fetchYears();
  }, [masterData.schemeNames, selectedSchemeName, setValue]);

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
      <div className="terms-card mb-3">

        {/* Dark navy header */}
        <div className="terms-card-head">
          <h5 className="mb-0">Beneficiary List</h5>
        </div>

        {/* Card body */}
        <div className="card-body">
          <form onSubmit={handleSubmit(onSubmit)}>

            <div className="row g-3">

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

              {/* Year */}
              <div className="col-md-4 mb-3">
                <label className="form-label">Financial Year</label>
                <select
                  className="form-select"
                  {...register('year')}
                  disabled={!selectedSchemeName}
                >
                  <option value="">All</option>
                  {masterData.years?.map(y => (
                    <option key={y.key} value={y.key}>{y.name}</option>
                  ))}
                </select>
              </div>

              {/* Installment */}
              <div className="col-md-4 mb-3">
                <label className="form-label">
                  {isPensionScheme ? 'Month' : isOneTimeScheme ? 'Benefit Type' : isLekLadki ? 'Installment' : 'Installment'}
                </label>
                <select className="form-select" {...register('installment')}>
                  <option value="">All</option>
                  {isOneTimeScheme ? (
                    <option value="One-time Benefit">One-time Benefit</option>
                  ) : isLekLadki ? (
                    lekLadkiInstallments.map(inst => (
                      <option key={inst.key} value={inst.key}>{inst.key}</option>
                    ))
                  ) : isPensionScheme ? (
                    getMonthOptions(selectedYear).map(({ label, value }) => (
                      <option key={value} value={value}>{label}</option>
                    ))
                  ) : (
                    <>
                      <option value="1st Installment">1st Installment</option>
                      <option value="2nd Installment">2nd Installment</option>
                    </>
                  )}
                </select>
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
