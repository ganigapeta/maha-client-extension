import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import BeneficiaryTableDFSO from '../components/BeneficiaryTableDFSO';
import TabContainer from '../components/TabContainer';
import BeneficiaryTable from '../components/BeneficiaryTable';
import LoadingModal from '../components/modals/LoadingModal';
import SuccessModal from '../components/modals/SuccessModal';
import ErrorModal from '../components/modals/ErrorModal';
const SchemeSearch = ({ userRole, userId, officeData }) => {
  console.log('SchemeSearch - Props:', { userRole, userId, officeData });
  
   

  const [formData, setFormData] = useState({
    financialYear: '',
    month: '',
    dfsoOffice: userRole === 'DFSO' ? (officeData?.officeName || '') : '',
    afsoOffice: userRole === 'AFSO' ? (officeData?.officeName || '') : '',
    afsoCode: userRole === 'AFSO' ? (officeData?.officeId || '') : '',
    dfsoCode: userRole === 'DFSO' ? (officeData?.officeId || '') : '',
    fpsName: '',
    fpsCodes: []
  });
  const [financialYears, setFinancialYears] = useState([]);
  const [months, setMonths] = useState([]);
  const [dfsoList, setDfsoList] = useState([]);
  const [afsoList, setAfsoList] = useState([]);
  const [fpsList, setFpsList] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAFSO, setIsAFSO] = useState(userRole === 'AFSO');
  const [isFPSMultiSelect, setFPSMultiSelect] = useState(false);
    const [selectedDisbursementsSearch, setSelectedDisbursementsSearch] = useState({});
  

  // State for AFSO tabbed interface
  const [activeTab, setActiveTab] = useState('new');
  const [newScrutinyData, setNewScrutinyData] = useState([]);
  const [oldScrutinyData, setOldScrutinyData] = useState([]);
  const [selectedDataFromTabs, setSelectedDataFromTabs] = useState({
    new: [],
    old: []
  });
  const [tableResetKey, setTableResetKey] = useState(0);

  // Modal states
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState({ title: '', message: '' });

  // Replace fpsCode with fpsCodes (array) in your formData initial state
// const [formData, setFormData] = useState({
//   // ...other fields
//   fpsCodes: [], // was: fpsCode: ""
// });

// Add dropdown open state
const [fpsDropdownOpen, setFpsDropdownOpen] = useState(false);

// Close dropdown on outside click
useEffect(() => {
  const handleClickOutside = (e) => {
    if (!e.target.closest(".fps-dropdown-wrapper")) {
      setFpsDropdownOpen(false);
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);


  // Financial year month order (April to March)
  const financialYearMonthOrder = [
    'April', 'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December', 'January', 'February', 'March'
  ];

  // Get current financial year and month
  const getCurrentFinancialYearAndMonth = () => {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();
    
    // Financial year starts in April (month 3)
    let fyStartYear, fyEndYear;
    if (currentMonth >= 3) { // April to December
      fyStartYear = currentYear;
      fyEndYear = currentYear + 1;
    } else { // January to March
      fyStartYear = currentYear - 1;
      fyEndYear = currentYear;
    }
    
    const currentFY = `${fyStartYear}-${fyEndYear}`;
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentMonthName = monthNames[currentMonth];
    
    return { currentFY, currentMonthName };
  };

  // Filter months based on selected financial year
  const getFilteredMonths = () => {
    if (!formData.financialYear) return [];
    
    const { currentFY, currentMonthName } = getCurrentFinancialYearAndMonth();
    
    // Order months in financial year sequence
    const orderedMonths = months
      .sort((a, b) => {
        const indexA = financialYearMonthOrder.indexOf(a.month_name);
        const indexB = financialYearMonthOrder.indexOf(b.month_name);
        return indexA - indexB;
      });
    
    // If selected year is current financial year, filter up to current month
    if (formData.financialYear === currentFY) {
      const currentMonthIndex = financialYearMonthOrder.indexOf(currentMonthName);
      return orderedMonths.filter(month => {
        const monthIndex = financialYearMonthOrder.indexOf(month.month_name);
        return monthIndex < currentMonthIndex; // Changed <= to avoid current month
      });
    }
    
    // For past financial years, show all months
    return orderedMonths;
  };

  useEffect(() => {
    loadDropdownData();
  }, []);

  // Reset month when financial year changes
  useEffect(() => {
    if (formData.financialYear && formData.month) {
      const filteredMonths = getFilteredMonths();
      const isMonthAvailable = filteredMonths.some(m => m.month_name === formData.month);
      
      // If selected month is not available in filtered list, reset it
      if (!isMonthAvailable) {
        setFormData(prev => ({ ...prev, month: '' }));
      }
    }
  }, [formData.financialYear]);

  const loadDropdownData = async () => {
    try {
      const promises = [
        apiService.getFinancialYears(),
        apiService.getMonths()
      ];
      
      console.log("User Role--:", userRole);
       // Load AFSO list only if user is AFSO
      if (userRole === 'AFSO') {
        promises.push(apiService.getFPSListByAFSOCode(formData.afsoCode));
      }
      // Load AFSO list only if user is DFSO
      if (userRole === 'DFSO') {
        promises.push(apiService.getAFSOListByDFSOCode(formData.dfsoCode));
      }
      
      const results = await Promise.all(promises);
      
      setFinancialYears(results[0].data || []);
      setMonths(results[1].data || []);
      
       if (userRole === 'AFSO' && results[2]) {
        setFpsList(results[2].data || []);
      }
      if (userRole === 'DFSO' && results[2]) {
        setAfsoList(results[2].data || []);
      }
    } catch (error) {
      console.error('Error loading dropdown data:', error);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const isFormValid = () => {
    const baseValid = formData.financialYear && formData.month && formData.fpsName;
    // For DFSO role, AFSO office is also mandatory
    if (userRole === 'DFSO') {
      return baseValid && formData.afsoCode && formData.fpsCode;
    }
    return baseValid;
  };

  const handleProceed = async () => {
    if (!isFormValid()) {
      alert('Please fill all mandatory fields');
      return;
    }

    // Reset bottom section and clear all selections
    setSelectedDataFromTabs({
      new: [],
      old: []
    });
    
    // Force BeneficiaryTable components to reset by changing key
    setTableResetKey(prev => prev + 1);

    setLoading(true);
    try {
      if (userRole === 'DFSO') {
        // DFSO: Fetch from WIP table with SCRUTINY_PENDING status
        const data = await apiService.getWIPBeneficiaries(formData);
        setBeneficiaries(data);
      } else {
        // AFSO: Fetch both new and old scrutiny data
        const [newData, oldData] = await Promise.all([
          apiService.getBeneficiaries(formData),
          apiService.getOldScrutinyRecords(formData)
        ]);
        setNewScrutinyData(newData);
        setOldScrutinyData(oldData);
      }
      setShowTable(true);
    } catch (error) {
      console.error('Error fetching beneficiaries:', error);
      alert('Error fetching beneficiary data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAfsoChange = async (key, value) => {
    // update state
    setFormData((prev) => ({
      ...prev,
      [key]: value
    }));

    // call API only if value selected
    if (value) {
      try {
        console.log("Fetching FPS list for AFSO code:", value);
        const res = await apiService.getFPSListByAFSOCode(value);
        setFpsList(res.data || []);
      } catch (err) {
        console.error("Error fetching FPS list:", err);
      }
    }
  };

  // Handle selection changes from BeneficiaryTable components
  const handleSelectionChange = (selectedData, tabType) => {
    setSelectedDataFromTabs(prev => ({
      ...prev,
      [tabType]: selectedData
    }));
  };

  // Handle Final Submit (combines data from both tabs)
  const handleFinalSubmit = async () => {
    const newTabData = selectedDataFromTabs.new || [];
    const oldTabData = selectedDataFromTabs.old || [];

    // Validate that at least one tab has selections
    if (newTabData.length === 0 && oldTabData.length === 0) {
      setModalMessage({
        title: 'Validation Error',
        message: 'Please select at least one family from either tab before submitting.'
      });
      setShowErrorModal(true);
      return;
    }

    // Combine data from both tabs
    const combinedPayload = [...newTabData, ...oldTabData];

    console.log('Final Submit - Combined Payload:', JSON.stringify(combinedPayload, null, 2));
    console.log(`New Scrutiny: ${newTabData.length} records, Next Installment Scrutiny: ${oldTabData.length} records`);

    // Show loading modal
    setShowLoadingModal(true);

    try {
      const response = await apiService.saveWIPData(combinedPayload, formData);
      console.log('Save response:', response);
      
      // Hide loading modal
      setShowLoadingModal(false);
      
      // Show success modal
      setModalMessage({
        title: 'Success!',
        message: `Request submitted successfully and forwarded for further verification!`
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error saving data:', error);
      
      // Hide loading modal
      setShowLoadingModal(false);
      
      // Show error modal
      setModalMessage({
        title: 'Operation Failed',
        message: `Unable to submit the request. Please check the entered details and try again. ${error.response?.data?.message || error.message}`
      });
      setShowErrorModal(true);
    }
  };

  // Handle success modal close
  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    // Optionally reload the page
    window.location.reload();
  };

  // Handle error modal close
  const handleErrorClose = () => {
    setShowErrorModal(false);
  };

  return (
    <div className="min-vh-100 w-100 bg-light">
      {/* Main Content */}
      <main className="container-fluid py-4">
        {/* Search Form */}
        <div className="card shadow-sm mb-4">
          <div className="card-body p-4">
            <h2 className="h5 fw-semibold mb-4">Beneficiary Search</h2>

            <div className="row g-3">
              {/* Financial Year */}
              <div className="col-12 col-md-6 col-lg-3">
                <label className="form-label small fw-medium">
                  Financial Year <span className="text-danger">*</span>
                </label>
                <select
                  value={formData.financialYear}
                  onChange={(e) => handleChange("financialYear", e.target.value)}
                  className="form-select"
                >
                  <option value="">Select Financial Year</option>
                  {financialYears.map((fy) => (
                    <option key={fy.id} value={fy.financial_year}>
                      {fy.financial_year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month */}
              <div className="col-12 col-md-6 col-lg-3">
                <label className="form-label small fw-medium">
                  Month <span className="text-danger">*</span>
                </label>
                <select
                  value={formData.month}
                  onChange={(e) => handleChange("month", e.target.value)}
                  disabled={!formData.financialYear}
                  className="form-select"
                >
                  <option value="">Select Month</option>
                  {getFilteredMonths().map((month) => (
                    <option key={month.id} value={month.month_name}>
                      {month.month_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* DFSO Office - Shows for DFSO role (Read-only) */}
              {userRole === "DFSO" && (
                <div className="col-12 col-md-6 col-lg-3">
                  <label className="form-label small fw-medium">DFSO Office Name</label>
                  <input
                    type="text"
                    value={formData.dfsoOffice}
                    readOnly
                    className="form-control"
                  />
                </div>
              )}

              {/* AFSO Office - Dropdown for DFSO, Read-only for AFSO */}
              <div className="col-12 col-md-6 col-lg-3">
                <label className="form-label small fw-medium">
                  AFSO Office Name{" "}
                  {userRole === "DFSO" && <span className="text-danger">*</span>}
                </label>
                {userRole === "DFSO" ? (
                  <select
                    value={formData.afsoCode}
                    onChange={(e) => handleAfsoChange("afsoCode", e.target.value)}
                    className="form-select"
                  >
                    <option value="">Select AFSO Office</option>
                    {afsoList.map((afso) => (
                      <option key={afso.id} value={afso.afso_code}>
                        {afso.description_en} || {afso.afso_code}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.afsoOffice}
                    readOnly
                    className="form-control"
                  />
                )}
              </div>

              {/* FPS Name */}
              <div className="col-12 col-md-6 col-lg-3">
                <label className="form-label small fw-medium">
                  FPS Name <span className="text-danger">*</span>
                </label>
                <select
                  value={formData.fpsCode}
                  onChange={(e) => handleChange("fpsCode", e.target.value)}
                  className="form-select"
                >
                  <option value="">Select FPS</option>
                  {fpsList.map((fps) => (
                    <option key={fps.id} value={fps.fps_code}>
                      {fps.description_en}
                    </option>
                  ))}
                </select>
              </div>



              {/* FPS Name - Multi Select */}
  {isFPSMultiSelect && (<div className="col-12 col-md-6 col-lg-3">
  <label className="form-label small fw-medium">
    FPS Name <span className="text-danger">*</span>
  </label>
  <div className="position-relative">
    <div
      className="form-select d-flex flex-wrap gap-1 align-items-center"
      style={{ height: "auto", minHeight: "38px", cursor: "pointer" }}
      onClick={() => setFpsDropdownOpen((prev) => !prev)}
    >
      {formData.fpsCodes?.length > 0 ? (
        formData.fpsCodes.map((code) => {
          const fps = fpsList.find((f) => f.fps_code === code);
          return (
            <span
              key={code}
              className="badge bg-primary d-flex align-items-center gap-1"
              style={{ fontSize: "0.75rem" }}
            >
              {fps?.description_en}
              <button
                type="button"
                className="btn-close btn-close-white"
                style={{ fontSize: "0.5rem" }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleChange(
                    "fpsCodes",
                    formData.fpsCodes.filter((c) => c !== code)
                  );
                }}
              />
            </span>
          );
        })
      ) : (
        <span className="text-muted">Select FPS</span>
      )}
    </div>

    {fpsDropdownOpen && (
      <ul
        className="dropdown-menu show w-100 overflow-auto"
        style={{ maxHeight: "200px", zIndex: 1050 }}
      >
        {fpsList.map((fps) => {
          const isSelected = formData.fpsCodes?.includes(fps.fps_code);
          return (
            <li key={fps.id}>
              <button
                type="button"
                className={`dropdown-item d-flex align-items-center gap-2 ${
                  isSelected ? "active" : ""
                }`}
                onClick={() => {
                  const updated = isSelected
                    ? formData.fpsCodes.filter((c) => c !== fps.fps_code)
                    : [...(formData.fpsCodes || []), fps.fps_code];
                  handleChange("fpsCodes", updated);
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  readOnly
                  className="form-check-input m-0"
                />
                {fps.description_en}
              </button>
            </li>
          );
        })}
      </ul>
    )}
  </div>
</div>
)}

            </div>

            <div className="mt-4">
              <button
                onClick={handleProceed}
                disabled={!isFormValid() || loading}
                className="btn-primary hover:btn-primary text-white font-semibold px-6 py-2 rounded-lg transition shadow-md hover:shadow-lg text-sm"
                 style={{ backgroundColor: '#002B70', borderColor: '#002B70' }}
              >
                {loading ? "Loading..." : "Proceed"}
              </button>
            </div>
          </div>
        </div>

        {/* Beneficiary Tables */}
        {showTable && isAFSO && (
          <div className="card shadow-sm p-4">
            {/* Tab Navigation */}
            <TabContainer
              tabs={[
                { id: 'new', label: 'New Scrutiny', count: newScrutinyData.length },
                { id: 'old', label: 'Next Installment Scrutiny', count: oldScrutinyData.length }
              ]}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {/* Tab Content - Both tabs rendered but hidden to preserve state */}
            <div className="mt-4">
              <div style={{ display: activeTab === 'new' ? 'block' : 'none' }}>
                <BeneficiaryTable
                  key={`new-${tableResetKey}`}
                  beneficiaries={newScrutinyData}
                  searchParams={formData}
                  onSelectionChange={handleSelectionChange}
                  tabType="new"
                  setSelectedDisbursementsSearch = {setSelectedDisbursementsSearch}
                />
              </div>
              
              <div style={{ display: activeTab === 'old' ? 'block' : 'none' }}>
                <BeneficiaryTable
                  key={`old-${tableResetKey}`}
                  beneficiaries={oldScrutinyData}
                  searchParams={formData}
                  onSelectionChange={handleSelectionChange}
                  tabType="old"
                  setSelectedDisbursementsSearch = {setSelectedDisbursementsSearch}
                />
              </div>
            </div>

            {/* Final Submit Button */}
            <div className="mt-4 pt-4 border-top d-flex justify-content-between align-items-center">
              <div className="small text-secondary">
                <span className="fw-semibold">Selected Families: </span>
                New Scrutiny: {new Set(selectedDataFromTabs.new.map(item => item.rc_no)).size} | 
                Next Installment Scrutiny: {new Set(selectedDataFromTabs.old.map(item => item.rc_no)).size} | 
                Total: {new Set([...selectedDataFromTabs.new, ...selectedDataFromTabs.old].map(item => item.rc_no)).size}
              </div>
              <button
                onClick={handleFinalSubmit}
                className="btn-primary hover:btn-primary text-white font-semibold px-6 py-2 rounded-lg transition shadow-md hover:shadow-lg text-sm"
                style={{ backgroundColor: '#002B70' }}
              >
                Submit
              </button>
            </div>
          </div>
        )}

        {showTable && !isAFSO && (
          <BeneficiaryTableDFSO
            beneficiaries={beneficiaries}
            searchParams={formData}
            userRole={userRole}
          />
        )}
      </main>

      {/* Modal Components */}
      <LoadingModal
        isOpen={showLoadingModal}
        title="Saving Data..."
        subtitle="Please wait while we process your submission."
      />

      <SuccessModal
        isOpen={showSuccessModal}
        title={modalMessage.title}
        message={modalMessage.message}
        onClose={handleSuccessClose}
        buttonText="OK"
      />

      <ErrorModal
        isOpen={showErrorModal}
        title={modalMessage.title}
        message={modalMessage.message}
        onClose={handleErrorClose}
        buttonText="Close"
      />
    </div>
  );
};

export default SchemeSearch;
