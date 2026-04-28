import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import beneficiaryFilterValidationSchema from '../validation/beneficiaryFilterValidationSchema';
// import {fetchDepartmentsBasedOnRoles} from '../api/fetch-department';
import {fetchSchemeName} from '../api/fetch-scheme';
import {getPicklistDefinitionByExternalReferenceCode} from '../api/fetch-picklist';
import {fetchBeneficiaryList} from '../api/beneficiary-list';
import BeneficiaryTable from "./BeneficiaryTable";
import BeneficiaryDetails from "./BeneficiaryDetails";

// Create a simple modal loader component
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

function BeneficiaryFilter({
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
  title = "Beneficiary List",
  hasCoopRole
}) {
    const [masterData, setMasterData] = useState({});
    const [show,setShow]=useState(false);
    const [backupSearchData,setBackupSearchData]=useState([]);
    const [showLoader, setShowLoader] = useState(false); // New state for loader modal
    
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
      resolver: yupResolver(beneficiaryFilterValidationSchema),
      defaultValues: {
        // departmentName: '',
        schemeName: '',
        financialYear: '',
        installment: '',
        action: ''
      }
    });

    useEffect(() => {
      if (!loginUserId) return;
      const fetchDepartments = async () => {
        // const departments = await fetchDepartmentsBasedOnRoles(roles);
        // console.log("Departments based on roles:::::", departments);
        const schemes = await fetchSchemeName(loginUserId,setApiRes);
        // console.log("schemes::::::::::",schemes)
        setMasterData(prev => ({ ...prev, schemes }));
      };
      fetchDepartments();
    }, [loginUserId]);

    useEffect(() => {
      const fetchPicklist = async () => {
        const picklistData = await getPicklistDefinitionByExternalReferenceCode("DBT-ACADEMIC-YEAR");
        console.log("Picklist Data for Financial Year::::", picklistData);
        setMasterData(prev => ({ ...prev, financialYears: picklistData.listTypeEntries || [] }));
      }
      fetchPicklist()
    },[])

    const onSubmit = async (data) => {
      // Show loader modal
      setShowLoader(true);
      
      try {
        // console.log('Form Data:', data);
        const results = await fetchBeneficiaryList(data, setApiRes);
        console.log("Search Results from API:", results);
        setSearchResults(results);
        setSearchData(data);
        setBackupSearchData(results);
        
        // Hide loader after API call completes
        // setShowLoader(false);
        
        // Show the results (BeneficiaryTable and BeneficiaryDetails)
        setShow(true);
      } catch (error) {
        // Handle error case
        console.error("Error fetching beneficiary list:", error);
        setShowLoader(false);
        // Optionally show error message to user
        alert("An error occurred while fetching data. Please try again.");
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
    
    console.log("Master Data in Filter Component::::", masterData);

    return (
      <>
        <div className="card">
          {/* Dark navy header */}
          <div className="card-header">
            <h5 className="mb-0 fw-bold">{title}</h5>
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
                    {masterData.schemes?.map((scheme) => (
                      <option key={scheme.id} value={scheme.id+'_'+scheme.r_schemeMapping_c_schemeConfiguratorId}>
                        {scheme.name}
                      </option>
                    ))}
                  </select>
                  {errors.schemeName && (
                    <div className="invalid-feedback">{errors.schemeName.message}</div>
                  )}
                </div>

                {/* Financial Year */}
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

                {/* Select Installment */}
                <div className="col-md-4 mb-3">
                  <label className="form-label">
                    Select Installment <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${errors.installment ? 'is-invalid' : ''}`}
                    {...register('installment')}
                  >
                    <option value="">Select</option>
                    {
                      hasCoopRole ? (<>
                       <option value="1st Installment">One-time Interest Subsidy</option>
                      </>):(<>
                      <option value="1st Installment">1st Installment</option>
                       <option value="2nd Installment">2nd Installment</option>
                      </>)
                    }
                    
                  </select>
                  {errors.installment && (
                    <div className="invalid-feedback">{errors.installment.message}</div>
                  )}
                </div>
             
                {/* Action */}
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

                {/* Buttons - with proper gap */}
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
        
        {/* Loader Modal */}
        <LoaderModal show={showLoader} />
        
        {/* Results Section */}
        {show && (
          <>
            <BeneficiaryTable searchResults={searchResults} searchData={searchData} setShowLoader={setShowLoader} hasCoopRole={hasCoopRole}/>
            <BeneficiaryDetails 
              searchResults={searchResults} 
              apiRes={apiRes} 
              searchData={searchData} 
              setCheckBalance={setCheckBalance} 
              setApiRes={setApiRes} 
              checkBalance={checkBalance} 
              setSearchResults={setSearchResults} 
              setBackupSearchData={setBackupSearchData} 
              backupSearchData={backupSearchData}
            />
          </>
        )}
      </>
    );
}

export default BeneficiaryFilter;
