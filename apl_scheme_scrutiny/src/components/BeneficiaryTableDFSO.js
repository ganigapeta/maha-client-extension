import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import LoadingModal from './modals/LoadingModal';
import SuccessModal from './modals/SuccessModal';
import ErrorModal from './modals/ErrorModal';
import RemarksModal from './modals/RemarksModal';
import { formatDate } from './utils';

const BeneficiaryTableDFSO = ({ beneficiaries, searchParams, userRole }) => {
  const [selectedFamilies, setSelectedFamilies] = useState(new Set());
  const [selectedDisbursements, setSelectedDisbursements] = useState({});
  const [validationErrors, setValidationErrors] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectAllChecked, setSelectAllChecked] = useState(false);

  console.log('BeneficiaryTableDFSO - Rendered with beneficiaries:', beneficiaries);
  // Modal states
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [modalMessage, setModalMessage] = useState({ title: '', message: '' });

  // Reset to page 1 when beneficiaries or rowsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [beneficiaries, rowsPerPage]);

  // Auto-select radio buttons based on business logic
  useEffect(() => {
    const autoSelections = {};
    beneficiaries.forEach((family) => {
      const hofMember = family.members.find(m => m.is_hof);
      
      // Auto-select if HOF has bank account
      if (hofMember && hofMember.bank_account === 'Yes') {
        autoSelections[family.rc_no] = {
          memberId: hofMember.member_id,
          locked: true
        };
      }
    });
    setSelectedDisbursements(autoSelections);
  }, [beneficiaries]);

  // Pagination calculations
  const totalPages = Math.ceil(beneficiaries.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedFamilies = beneficiaries.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Calculate total benefit amount for a family
  const calculateBenefitAmount = (members) => {
    return members.length * 170;
  };

  // Check if any member in family has Aadhaar linked account
  const hasFamilyAadhaarLinkedAccount = (family) => {
    return family.members.some(member => member.is_aadhaar_linked_account === true);
  };

  // Handle Select All for current page only
  const handleSelectAll = () => {
    const newSelected = new Set(selectedFamilies);
    
    if (selectAllChecked) {
      // Deselect all families on current page
      paginatedFamilies.forEach(family => {
        newSelected.delete(family.rc_no);
      });
      setSelectAllChecked(false);
    } else {
      // Select all families on current page
      paginatedFamilies.forEach(family => {
        newSelected.add(family.rc_no);
      });
      setSelectAllChecked(true);
    }
    
    setSelectedFamilies(newSelected);
    setValidationErrors(new Set());
  };

  // Select ALL families across ALL pages
  const handleSelectAllFamilies = () => {
    const allFamilies = new Set();
    beneficiaries.forEach(family => {
      allFamilies.add(family.rc_no);
    });
    setSelectedFamilies(allFamilies);
    setValidationErrors(new Set());
  };

  // Clear all selections and reset checkboxes
  const handleClearAll = () => {
    setSelectedFamilies(new Set());
    setValidationErrors(new Set());
    setSelectAllChecked(false);
  };

  // Update Select All checkbox state
  useEffect(() => {
    const allPageFamiliesSelected = paginatedFamilies.length > 0 && 
      paginatedFamilies.every(family => selectedFamilies.has(family.rc_no));
    setSelectAllChecked(allPageFamiliesSelected);
  }, [currentPage, selectedFamilies, paginatedFamilies]);

  // Handle family checkbox toggle
  const handleFamilySelect = (rcNo) => {
    const newSelected = new Set(selectedFamilies);
    if (newSelected.has(rcNo)) {
      newSelected.delete(rcNo);
    } else {
      newSelected.add(rcNo);
    }
    setSelectedFamilies(newSelected);
    
    const newErrors = new Set(validationErrors);
    newErrors.delete(rcNo);
    setValidationErrors(newErrors);
  };

  // Handle Approve action
  const handleApprove = async () => {
    if (selectedFamilies.size === 0) {
      setModalMessage({
        title: 'Validation Error',
        message: 'Please select at least one family before approving.'
      });
      setShowErrorModal(true);
      return;
    }

    setShowLoadingModal(true);
    
    const rcNumbers = Array.from(selectedFamilies);
    const payload = {
      rc_numbers: rcNumbers,
      status: 'APPROVED',
      fy: searchParams?.financialYear,
      month: searchParams?.month,
      fpsCode: searchParams?.fpsCode,
    };

    console.log('DFSO - Approve Payload:', JSON.stringify(payload, null, 2));

    try {
      const response = await apiService.updateWIPDataStatus(payload);
      console.log('Approve response:', response);
      
      setShowLoadingModal(false);
      setModalMessage({
        title: 'Records Approved',
        message: `${rcNumbers.length} record(s) successfully approved.`
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error approving data:', error);
      
      setShowLoadingModal(false);
      setModalMessage({
        title: 'Operation Failed',
        message: `Failed to approve records. ${error.response?.data?.message || error.message}`
      });
      setShowErrorModal(true);
    }
  };

  // Handle Reject action
  const handleReject = () => {
    if (selectedFamilies.size === 0) {
      setModalMessage({
        title: 'Validation Error',
        message: 'Please select at least one family before rejecting.'
      });
      setShowErrorModal(true);
      return;
    }
    setShowRemarksModal(true);
  };

  // Handle remarks submission
  const handleRemarksSubmit = async (remarks) => {
    setShowRemarksModal(false);
    setShowLoadingModal(true);
    
    const rcNumbers = Array.from(selectedFamilies);
    const payload = {
      rc_numbers: rcNumbers,
      status: 'REJECTED',
      remarks: remarks,
      fy: searchParams?.financialYear,
      month: searchParams?.month,
      fpsCode: searchParams?.fpsCode,
    };

    console.log('DFSO - Reject Payload:', JSON.stringify(payload, null, 2));

    try {
      const response = await apiService.updateWIPDataStatus(payload);
      console.log('Reject response:', response);
      
      setShowLoadingModal(false);
      setModalMessage({
        title: 'Records Rejected',
        message: `${rcNumbers.length} record(s) successfully rejected.`
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error rejecting data:', error);
      
      setShowLoadingModal(false);
      setModalMessage({
        title: 'Operation Failed',
        message: `Failed to reject records. ${error.response?.data?.message || error.message}`
      });
      setShowErrorModal(true);
    }
  };

  // Handle remarks modal cancel
  const handleRemarksCancel = () => {
    setShowRemarksModal(false);
  };

  // Handle success modal close
  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    window.location.reload();
  };

  // Handle error modal close
  const handleErrorClose = () => {
    setShowErrorModal(false);
  };

  if (beneficiaries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500 text-lg">No records found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header Section with Select All Families and Clear All Buttons */}
      <div class="p-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">List of Beneficiaries</h2>
          <p className="text-sm text-gray-600 mt-1">
            Total Families: {beneficiaries.length} | Selected: {selectedFamilies.size}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSelectAllFamilies}
            className="text-white font-semibold px-4 py-2 rounded-lg transition shadow-md hover:shadow-lg hover:opacity-90 text-sm"
            style={{ backgroundColor: '#002B70' }}
          >
            Select All Families
          </button>
          {selectedFamilies.size > 0 && (
            <button
              onClick={handleClearAll}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition shadow-md hover:shadow-lg text-sm"
            >
              Clear All Selections
            </button>
          )}
        </div>
      </div>

      {/* Fixed header with scrollable body */}
      <div className="overflow-x-auto" style={{ maxHeight: '600px' }}>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 sticky top-0 z-10" style={{ backgroundColor: '#002B70' }}>
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-white">S.No.</th>
              <th className="px-4 py-3 text-left font-semibold text-white">District Name</th>
              <th className="px-4 py-3 text-left font-semibold text-white">DFSO Office</th>
              <th className="px-4 py-3 text-left font-semibold text-white">AFSO Office</th>
              <th className="px-4 py-3 text-left font-semibold text-white">FPS Name</th>
              <th className="px-4 py-3 text-left font-semibold text-white">RC Type</th>
              <th className="px-4 py-3 text-left font-semibold text-white">RC Number</th>
              <th className="px-4 py-3 text-left font-semibold text-white">HOF Name</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Member Name</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Member ID</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Gender</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Relationship with HOF</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Date of Birth</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Age</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Aadhaar No.</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Demographic Authentication Completed</th>
              <th className="px-4 py-3 text-left font-semibold text-white">EKYC Status</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Aadhaar Linked Bank account available?</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Selected Account for Disbursement?</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Total Benefit Amount</th>
              <th className="px-4 py-3 text-left font-semibold text-white">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectAllChecked}
                    onChange={handleSelectAll}
                    className="w-5 h-5 rounded cursor-pointer"
                  />
                  <span>Select</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedFamilies.map((family, familyIndex) => {
              const isSelected = selectedFamilies.has(family.rc_no);
              const hasValidationError = validationErrors.has(family.rc_no);
              const totalBenefit = //family?.members?.[0]?.amount 
              calculateBenefitAmount(family.members);
              
              // Check if family has any Aadhaar linked account
              const hasAadhaarLinked = hasFamilyAadhaarLinkedAccount(family);

              return family.members.map((member, memberIndex) => {
                const isFirstMember = memberIndex === 0;
                const rowBgColor = hasValidationError && isSelected 
                  ? 'bg-red-50' 
                  : isSelected 
                  ? 'bg-blue-50' 
                  : 'bg-white hover:bg-gray-50';

                return (
                  <tr key={`${family.rc_no}-${member.member_id}`} className={rowBgColor}>
                    <td className="px-4 py-3">
                      {isFirstMember ? startIndex + familyIndex + 1 : ''}
                    </td>
                    <td className="px-4 py-3">
                      {isFirstMember ? family.dist_name : ''}
                    </td>
                    <td className="px-4 py-3">
                      {isFirstMember ? family.dfso_name : ''}
                    </td>
                    <td className="px-4 py-3">
                      {isFirstMember ? family.afso_name : ''}
                    </td>
                    <td className="px-4 py-3">
                      {isFirstMember ? family.fps_name : ''}
                    </td>
                    <td className="px-4 py-3">
                      {isFirstMember ? family.rc_type : ''}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {isFirstMember ? family.rc_no : ''}
                    </td>
                    <td className="px-4 py-3">
                      {isFirstMember ? family.hof_name : ''}
                    </td>
                    <td className="px-4 py-3">{member.member_name}</td>
                    <td className="px-4 py-3">{member.member_id}</td>
                    <td className="px-4 py-3">{member.gender}</td>
                    <td className="px-4 py-3">{member.relation}</td>
                    <td className="px-4 py-3">{formatDate(member.dob)}</td>
                    <td className="px-4 py-3">{member.age}</td>
                    <td className="px-4 py-3">{member.masked_aadhaar_no}</td>
                    <td className="px-4 py-3 text-center">{member.demo_auth}</td>
                    <td className="px-4 py-3 text-center">{member.ekyc}</td>
                    <td className="px-4 py-3 text-center">{member.bank_account}</td>
                    <td className="px-4 py-3 text-center">
                      {member.is_disbursement_account === true ? (
                        <span className="text-green-600 font-semibold">Yes</span>
                      ) : (
                        <span className="text-red-600 font-semibold">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-green-600">
                      {isFirstMember && hasAadhaarLinked ? `₹${totalBenefit}` : ''}
                    </td>
                    <td className={`px-4 py-3 ${!isFirstMember && 'border-l-4 border-gray-200'}`}>
                      {isFirstMember && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleFamilySelect(family.rc_no)}
                          className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                        />
                      )}
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Families per page:</span>
          <select
            value={rowsPerPage}
            onChange={handleRowsPerPageChange}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(endIndex, beneficiaries.length)} of {beneficiaries.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Previous
          </button>

          {getPageNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' && handlePageChange(page)}
              disabled={page === '...'}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                page === currentPage
                  ? 'text-white'
                  : page === '...'
                  ? 'bg-white text-gray-400 cursor-default'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              style={page === currentPage ? { backgroundColor: '#002B70' } : {}}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Next
          </button>
        </div>
      </div>

      {/* Action Buttons - Reject and Approve */}
      <div className="p-6 border-t border-gray-200 flex justify-end items-center gap-3">
        <button
          onClick={handleReject}
          className="btn-primary hover:btn-primary text-white font-semibold px-6 py-2 rounded-lg transition shadow-md hover:shadow-lg text-sm"
          style={{ backgroundColor: '#002B70' }}
        >
          Reject
        </button>
        <button
          onClick={handleApprove}
          className="btn-primary hover:btn-primary text-white font-semibold px-6 py-2 rounded-lg transition shadow-md hover:shadow-lg text-sm"
          style={{ backgroundColor: '#002B70' }}
        >
          Approve
        </button>
      </div>

      {/* Modal Components */}
      <LoadingModal
        isOpen={showLoadingModal}
        title="Processing..."
        subtitle="Please wait while we process your request."
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

      <RemarksModal
        isOpen={showRemarksModal}
        title="Enter Rejection Remarks"
        placeholder="Please provide reason for rejection..."
        onSubmit={handleRemarksSubmit}
        onCancel={handleRemarksCancel}
        submitButtonText="Reject"
        cancelButtonText="Cancel"
      />
    </div>
  );
};

export default BeneficiaryTableDFSO;
