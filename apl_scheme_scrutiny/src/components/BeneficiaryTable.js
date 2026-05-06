import React, { useState, useEffect } from 'react';
import { formatDate } from './utils';

/**
 * Reusable Beneficiary Table Component
 * Used for both New Scrutiny and Old Scrutiny Records
 * 
 * @param {Array} beneficiaries - Array of family beneficiary data
 * @param {Object} searchParams - Search parameters used to fetch data
 * @param {Function} onSelectionChange - Callback when selection changes (for final submit)
 * @param {string} tabType - Type of tab ('new' or 'old')
 */
const BeneficiaryTable = ({ 
  beneficiaries, 
  searchParams, 
  onSelectionChange,
  tabType = 'new',
  setSelectedDisbursementsSearch
}) => {
  const [selectedFamilies, setSelectedFamilies] = useState(new Set());
  const [selectedDisbursements, setSelectedDisbursements] = useState({});
  const [validationErrors, setValidationErrors] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [selectPageChecked, setSelectPageChecked] = useState(false);
  const [isOldScrutiny, setIsIsOldScrutiny] = useState(tabType === 'new' ? false : true);

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
          locked: true // Disable other radio buttons
        };
      }
    });
    setSelectedDisbursements(autoSelections);
  }, [beneficiaries]);

  // Notify parent component of selection changes
  useEffect(() => {
    if (onSelectionChange) {
      const selectedData = buildPayload();
      onSelectionChange(selectedData, tabType);
    }
  }, [selectedFamilies, selectedDisbursements]);

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


  // Handle Page-wise Select All (current page only)
  const handleSelectPage = () => {
    const newSelected = new Set(selectedFamilies);
    const newErrors = new Set(validationErrors);
    
    if (selectPageChecked) {
      // Deselect all families on current page
      paginatedFamilies.forEach(family => {
        if (hasFamilyAadhaarLinkedAccount(family)) {
          newSelected.delete(family.rc_no);
          newErrors.delete(family.rc_no);
        }
      });
      setSelectPageChecked(false);
    } else {
      // Select all families on current page that have at least one member with Aadhaar linked account
      paginatedFamilies.forEach(family => {
        if (hasFamilyAadhaarLinkedAccount(family)) {
          newSelected.add(family.rc_no);
          // Add validation error if no disbursement selected
          if (!selectedDisbursements[family.rc_no] || !selectedDisbursements[family.rc_no].memberId) {
            newErrors.add(family.rc_no);
          } else {
            newErrors.delete(family.rc_no);
          }
        }
      });
      setSelectPageChecked(true);
    }
    
    setSelectedFamilies(newSelected);
    setValidationErrors(newErrors);
  };

  // Handle Global Select All (ALL families across all pages)
  const handleSelectAll = () => {
    const newSelected = new Set(selectedFamilies);
    const newErrors = new Set(validationErrors);
    
    if (selectAllChecked) {
      // Deselect all families
      newSelected.clear();
      newErrors.clear();
      setSelectAllChecked(false);
    } else {
      // Select all families that have at least one member with Aadhaar linked account
      beneficiaries.forEach(family => {
        // Skip families where no member has Aadhaar linked account
        if (hasFamilyAadhaarLinkedAccount(family)) {
          newSelected.add(family.rc_no);
          // Add validation error if no disbursement selected
          if (!selectedDisbursements[family.rc_no] || !selectedDisbursements[family.rc_no].memberId) {
            newErrors.add(family.rc_no);
          } else {
            newErrors.delete(family.rc_no);
          }
        }
      });
      setSelectAllChecked(true);
    }
    
    setSelectedFamilies(newSelected);
    setValidationErrors(newErrors);
  };

  // Clear all selections including radio buttons
  const handleClearAll = () => {
    setSelectedFamilies(new Set());
    setValidationErrors(new Set());
    setSelectAllChecked(false);
    
    // Reset radio buttons to initial auto-selected state
    const autoSelections = {};
    beneficiaries.forEach((family) => {
      const hofMember = family.members.find(m => m.is_hof);
      
      // Auto-select if HOF has bank account
      if (hofMember && hofMember.is_aadhaar_linked_account === true) {
        autoSelections[family.rc_no] = {
          memberId: hofMember.member_id,
          locked: true
        };
      }
    });
    setSelectedDisbursements(autoSelections);
  };

  // Update Select Page checkbox state based on current page families
  useEffect(() => {
    const eligiblePageFamilies = paginatedFamilies.filter(family => hasFamilyAadhaarLinkedAccount(family));
    const allPageFamiliesSelected = eligiblePageFamilies.length > 0 && 
      eligiblePageFamilies.every(family => selectedFamilies.has(family.rc_no));
    setSelectPageChecked(allPageFamiliesSelected);
  }, [selectedFamilies, paginatedFamilies, currentPage]);

  // Update Select All checkbox state based on ALL families
  useEffect(() => {
    // Get all eligible families (those with at least one Aadhaar linked account)
    const eligibleFamilies = beneficiaries.filter(family => hasFamilyAadhaarLinkedAccount(family));
    const allEligibleSelected = eligibleFamilies.length > 0 && 
      eligibleFamilies.every(family => selectedFamilies.has(family.rc_no));
    setSelectAllChecked(allEligibleSelected);
  }, [selectedFamilies, beneficiaries]);

  // Handle family checkbox toggle
  const handleFamilySelect = (rcNo) => {
    const newSelected = new Set(selectedFamilies);
    if (newSelected.has(rcNo)) {
      newSelected.delete(rcNo);
    } else {
      newSelected.add(rcNo);
    }
    setSelectedFamilies(newSelected);
    
    // Clear validation error for this family
    const newErrors = new Set(validationErrors);
    newErrors.delete(rcNo);
    setValidationErrors(newErrors);
  };

  // Handle radio button selection with unselect capability
  const handleDisbursementSelect = (rcNo, memberId) => {
    // Check if radio buttons are locked for this family
    if (selectedDisbursements[rcNo]?.locked) {
      return;
    }

    // Check if the same radio button is clicked again - unselect it
    if (selectedDisbursements[rcNo]?.memberId === memberId) {
      const newSelections = { ...selectedDisbursements };
      delete newSelections[rcNo];
      setSelectedDisbursements(newSelections);
    } else {
      // Select the new radio button
      setSelectedDisbursements({
        ...selectedDisbursements,
        [rcNo]: { memberId, locked: false }
      });
    }

    // Clear validation error for this family
    const newErrors = new Set(validationErrors);
    newErrors.delete(rcNo);
    setValidationErrors(newErrors);
  };

  // Build payload for selected families - includes ALL family members
  const buildPayload = () => {
    const payload = [];

    selectedFamilies.forEach((rcNo) => {
      const family = beneficiaries.find(f => f.rc_no === rcNo);
      const selectedMemberId = selectedDisbursements[rcNo]?.memberId;

      if (family && selectedMemberId) {
        const totalBenefitAmount = calculateBenefitAmount(family.members);
        
        // Add ALL family members to payload
        family.members.forEach((member) => {
          const isDisbursementMember = parseInt(member.member_id) === parseInt(selectedMemberId);
          
          payload.push({
            rc_no: parseInt(family.rc_no),
            hof_name: family.hof_name || "string",
            member_id: parseInt(member.member_id),
            dist_code: family.dist_code,
            dfso_code: family.dfso_code,
            afso_code: family.afso_code,
            fps_code: family.fps_code,
            fps_name: family.fps_name || "string",
            amount: totalBenefitAmount,
            member_count: family.members.length,
            is_aadhaar_linked_account: member.is_aadhaar_linked_account || false,
            is_disbursement_account: isDisbursementMember, // true only for selected member
            wf_status: "SCRUTINY_PENDING"
          });
        });

        console.log(`Built payload for RC ${rcNo}: ${family.members.length} members, disbursement member: ${selectedMemberId}`);
      }
    });

    return payload;
  };

  // Validate selections
  const validateSelection = () => {
    const errors = new Set();

    // Check if at least one family is selected
    if (selectedFamilies.size === 0) {
      return { valid: false, message: 'Please select at least one family' };
    }

    // Check if each selected family has a disbursement member selected
    selectedFamilies.forEach((rcNo) => {
      if (!selectedDisbursements[rcNo] || !selectedDisbursements[rcNo].memberId) {
        errors.add(rcNo);
      }
    });

    if (errors.size > 0) {
      setValidationErrors(errors);
      return { 
        valid: false, 
        message: `Please select a disbursement member for ${errors.size} family(families) highlighted in red` 
      };
    }

    return { valid: true };
  };

  // Get validation result (exposed for parent component)
  const getValidationResult = () => {
    return validateSelection();
  };

  // Get selected data (exposed for parent component)
  const getSelectedData = () => {
    const validation = validateSelection();
    if (!validation.valid) {
      return { valid: false, message: validation.message, data: [] };
    }
    return { valid: true, data: buildPayload() };
  };

  // Expose methods to parent via ref or callback
  React.useImperativeHandle(React.useRef(), () => ({
    getSelectedData,
    getValidationResult
  }));

  if (beneficiaries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500 text-lg">No records found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div class="p-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">List of Beneficiaries</h2>
          <p className="text-sm text-gray-600 mt-1">
            Total Families: {beneficiaries.length} | 
            Selected: {selectedFamilies.size}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          {/* Global Select All Families Button */}
          <button
            onClick={handleSelectAll}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg transition shadow-md hover:shadow-lg text-sm"
          >
            {selectAllChecked ? 'Deselect All Families' : 'Select All Families'}
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
              <th className="px-4 py-3 text-left font-semibold text-white">eKYC Status</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Aadhaar Linked Bank account available?</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Select Account for Disbursement</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Total Benefit Amount</th>
              <th className="px-4 py-3 text-left font-semibold text-white">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectPageChecked}
                    onChange={handleSelectPage}
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
              const totalBenefit = calculateBenefitAmount(family.members);
              const isLocked = selectedDisbursements[family.rc_no]?.locked;

              // Check if family has any Aadhaar linked account
              const hasAadhaarLinked = hasFamilyAadhaarLinkedAccount(family);

              return family.members.map((member, memberIndex) => {
                const isFirstMember = memberIndex === 0;
                const rowBgColor = hasValidationError && isSelected 
                  ? 'bg-red-50' 
                  : isSelected 
                  ? 'bg-blue-50' 
                  : !hasAadhaarLinked
                  ? 'bg-gray-100'
                  : 'bg-white hover:bg-gray-50';

                return (
                  <tr key={`${family.rc_no}-${member.member_id}`} className={rowBgColor}>
                    {/* S.No. - Adjust for pagination */}
                    <td className="px-4 py-3">
                      {isFirstMember ? startIndex + familyIndex + 1 : ''}
                    </td>

                    {/* District Name - Merged for family */}
                    <td className="px-4 py-3">
                      {isFirstMember ? family.dist_name : ''}
                    </td>

                    {/* DFSO Office - Merged */}
                    <td className="px-4 py-3">
                      {isFirstMember ? family.dfso_name : ''}
                    </td>

                    {/* AFSO Office - Merged */}
                    <td className="px-4 py-3">
                      {isFirstMember ? family.afso_name : ''}
                    </td>

                    {/* FPS Name - Merged */}
                    <td className="px-4 py-3">
                      {isFirstMember ? family.fps_name : ''}
                    </td>

                    {/* RC Type - Merged */}
                    <td className="px-4 py-3">
                      {isFirstMember ? family.rc_type : ''}
                    </td>

                    {/* RC Number - Merged */}
                    <td className="px-4 py-3 font-semibold">
                      {isFirstMember ? family.rc_no : ''}
                    </td>

                    {/* HOF Name - Merged */}
                    <td className="px-4 py-3">
                      {isFirstMember ? family.hof_name : ''}
                    </td>

                    {/* Member-specific columns */}
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

                    {/* Radio Button for Disbursement - Hide when member's is_aadhaar_linked_account is NO/NULL/False */}
                    <td className="px-4 py-3 text-center">
                      {!member.is_aadhaar_linked_account || member.is_aadhaar_linked_account === false || member.is_aadhaar_linked_account == 'NO' ? (
                        // Hide radio button if member doesn't have Aadhaar linked account
                        <span className="text-gray-400 text-xs"></span>
                      ) : isLocked && selectedDisbursements[family.rc_no]?.memberId !== member.member_id ? (
                        // Hide radio button for other members when HOF is locked
                        <span className="text-gray-400"></span>
                      ) : (
                        <>
                          <input
                            type="radio"
                            name={`disbursement-${tabType}-${family.rc_no}`}
                            checked={selectedDisbursements[family.rc_no]?.memberId === member.member_id}
                            onChange={() => handleDisbursementSelect(family.rc_no, member.member_id)}
                            disabled={isLocked}
                            className={`w-5 h-5 text-blue-600 ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          />
                          {/* {isLocked && selectedDisbursements[family.rc_no]?.memberId === member.member_id && (
                            <span className="ml-2 text-xs text-green-600 font-semibold">(Auto)</span>
                          )}*/}
                        </>
                      )}
                    </td>

                    {/* Total Benefit Amount - Only on first row, hide if no Aadhaar linked account */}
                    <td className="px-4 py-3 font-bold text-green-600">
                      {isFirstMember && hasAadhaarLinked ? `₹${totalBenefit}` : ''}
                    </td>

                    {/* Select Checkbox - Only on first row, MOVED TO LAST COLUMN, disabled if no Aadhaar linked */}
                    <td className={`px-4 py-3 ${!isFirstMember && 'border-l-4 border-gray-200'}`}>
                      {isFirstMember && (
                        hasAadhaarLinked ? (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleFamilySelect(family.rc_no)}
                            className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                          />
                        ) : (
                          <input
                            type="checkbox"
                            disabled
                            className="w-5 h-5 rounded cursor-not-allowed opacity-50"
                            title="No Aadhaar linked account in family"
                          />
                        )
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
        {/* Left: Rows per page */}
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

        {/* Right: Page navigation */}
        <div className="flex items-center gap-2">
          {/* Previous Button */}
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

          {/* Page Numbers */}
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

          {/* Next Button */}
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

      {/* Validation Error Message */}
      {validationErrors.size > 0 && (
        <div className="px-6 pb-4">
          <p className="text-sm text-red-600 font-semibold">
            ⚠️ {validationErrors.size} family(families) missing disbursement selection
          </p>
        </div>
      )}
    </div>
  );
};

export default BeneficiaryTable;
