import React, { useState, useEffect } from 'react';
import GenerateBillTable from "./GenerateBillTable"
import { saveAllocateBeneficiaries } from "../api/save"
const AllocationDetailsCard = ({
  checkBalance,
  apiRes,
  searchResults,
  setSearchResults,
  setBackupSearchData,
  backupSearchData = [],
  searchData,
  isPensionRole = false,
  hideUpperTable = false,
}) => {
  // Calculate allocated amount based on selected beneficiaries
  const isPensionInstallment = searchData?.installment === "Monthly Benefit";
  // Calculate allocated amount based on selected beneficiaries
  const calculateAllocatedAmount = (numBeneficiaries) => {
    if (!numBeneficiaries || numBeneficiaries === "") return 0;

    const rawCount = parseInt(numBeneficiaries, 10);
    if (isNaN(rawCount) || rawCount <= 0) return 0;

    const maxAllowed = searchResults.length || 0;
    const count = Math.min(rawCount, maxAllowed);

    const selected = searchResults.slice(0, count);

    const isFirstInstallment =
      searchData?.installment === "1st Installment" || isPensionInstallment;

    return selected
      .reduce((total, item) => {
        const amount = isFirstInstallment
          ? parseFloat(item?.installment1) || 0
          : parseFloat(item?.installment2) || 0;

        return total + amount;
      }, 0)
      .toFixed(2);
  };

  // Calculate if allocated amount exceeds total balance
  const checkAllocationAgainstBalance = (numBeneficiaries) => {
    const allocatedAmount = calculateAllocatedAmount(numBeneficiaries);
    const totalBalance = parseFloat(checkBalance?.totalBalance) || 0;

    if (allocatedAmount > totalBalance) {
      return {
        isValid: false,
        message: `Allocated amount (₹${allocatedAmount}) exceeds total balance (₹${totalBalance})`,
        amount: allocatedAmount
      };
    }
    return {
      isValid: true,
      message: `Valid: ₹${allocatedAmount} to be allocated`,
      amount: allocatedAmount
    };
  };

  const initialBeneficiaries = backupSearchData.length || 0;

  const initialAllocation = checkAllocationAgainstBalance(initialBeneficiaries);

  const [allocateInputData, setAllocateInputData] = useState({
    officePaymentNumber: "",
    noOfBeneficiariesInput: initialBeneficiaries,
    noOfBeneficiariesAllocated: "",
    allocatedAmount: initialAllocation?.amount || 0
  });

  // Remove separate allocatedAmount state since it's now in allocateInputData

  // Add this new state for validation message
  const [validationMessage, setValidationMessage] = useState({ text: '', type: '' });

  // Add state for selected beneficiaries
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState([]);

  // Add state to track if valid number is entered
  const [isValidNumberEntered, setIsValidNumberEntered] = useState(true);

  // Add state to track if allocation was successful
  const [allocationSuccess, setAllocationSuccess] = useState(false);

  // Sample data (can be overridden by props)
  const safeData = searchResults || [];

  // Add useEffect to monitor state changes
  useEffect(() => {
    console.log("searchResults updated:", searchResults);
    console.log("selectedBeneficiaries updated:", selectedBeneficiaries);
    console.log("allocateInputData updated:", allocateInputData);
  }, [searchResults, selectedBeneficiaries, allocateInputData]);

  // Calculate total beneficiary amount
  // const totalBeneficiaryAmount = backupSearchData.reduce((total, item) => {
  //   return total + (parseFloat(item?.totalAmount) || 0);
  // }, 0);

  const totalBeneficiaryAmount = () => {
    const isFirstInstallment = searchData?.installment === "1st Installment" || isPensionInstallment;

    return backupSearchData
      .reduce((total, item) => {
        const amount = isFirstInstallment
          ? parseFloat(item?.installment1) || 0
          : parseFloat(item?.installment2) || 0;

        return total + amount;
      }, 0)
      .toFixed(2);
  };




  function formatDate(dateString) {
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return 'Invalid Date';
    }
  }

  // console.log("searchResults:::::::::", searchResults, apiRes?.ddoRecord)

  const allocationData = {
    ddoCode: apiRes?.ddoRecord?.dDOCode,
    beamsSchemeCode: apiRes?.ddoRecord?.beamsSchemeCodeOLD,
    detailHead: apiRes?.ddoRecord?.detailHead,
    currentMonthBudget: checkBalance?.currMonthBudget || 0,
    currentMonthExpenditure: checkBalance?.currMonthExp || 0,
    currentMonthBalance: checkBalance?.currMonthBalance || 0,
    totalBudget: checkBalance?.totalBudget || 0,
    totalExpenditure: checkBalance?.totalExp || 0,
    totalBalance: parseFloat(checkBalance?.totalBalance) || 0,
    stateBudget: checkBalance?.stateBudget || 0,
    stateExpenditure: checkBalance?.stateExp || 0,
    stateBalance: checkBalance?.stateBalance || 0,
    currentTimestamp: formatDate(checkBalance?.currTimeStamp) || "NA",
    distributedFlag: checkBalance?.distributedFlag || "NA",
    negativeExpenditure: checkBalance?.negativeExp || "NA",
    totalBeneficiaries: backupSearchData.length || 0,
    totalAllocatedBeneficiaries: totalBeneficiaryAmount(),
    // totalBeneficiaryAmount: totalBeneficiaryAmount,
    allocatedAmount: allocateInputData.allocatedAmount, // Use from state
    schemeCode: apiRes?.ddoRecord?.integrationSchemeCode,
  };

  // Fixed handleAllocate method
  const handleAllocate = async () => {
    if (!allocateInputData.noOfBeneficiariesInput || allocateInputData.noOfBeneficiariesInput === "") {
      setValidationMessage({ text: 'Please enter number of beneficiaries to allocate', type: 'error' });
      return;
    }

    if (!allocateInputData.officePaymentNumber) {
      setValidationMessage({ text: 'Please enter office payment number', type: 'error' });
      return;
    }

    const numValue = parseInt(allocateInputData.noOfBeneficiariesInput, 10);

    // Validate if number is valid and within range
    if (numValue <= 0) {
      setValidationMessage({ text: 'Please enter a valid number of beneficiaries', type: 'error' });
      return;
    }

    if (numValue > searchResults.length) {
      setValidationMessage({ text: `Cannot allocate more than ${searchResults.length} beneficiaries`, type: 'error' });
      return;
    }

    if (!isPensionRole) {
      const balanceCheck = checkAllocationAgainstBalance(numValue);

      if (!balanceCheck.isValid) {
        setValidationMessage({ text: balanceCheck.message, type: 'error' });
        return;
      }
    }


    // Select top N beneficiaries
    const selected = searchResults.slice(0, numValue);
    const remaining = searchResults.slice(numValue);

    const payload = await saveAllocateBeneficiaries(selected, apiRes, searchData);
    // Calculate allocated amount
    console.log("Payload:::::::", payload)
    // const calculatedAllocatedAmount = selected.reduce((total, item) => {
    //   return total + (parseFloat(item.feespaid) || 0);
    // }, 0);

    const isFirstInstallment = searchData?.installment === "1st Installment" || isPensionInstallment;

    const calculatedAllocatedAmount = selected
      .reduce((total, item) => {
        const amount = isFirstInstallment
          ? parseFloat(item?.installment1) || 0
          : parseFloat(item?.installment2) || 0;

        return total + amount;
      }, 0)
      .toFixed(2);

    // Update allocateInputData
    setAllocateInputData(prev => ({
      ...prev,
      noOfBeneficiariesAllocated: numValue.toString(),
      allocatedAmount: calculatedAllocatedAmount
    }));

    // Update all states
    setSelectedBeneficiaries(payload.data);
    setSearchResults(remaining);

    setValidationMessage({
      text: `Successfully allocated ${numValue} beneficiaries with amount ₹${calculatedAllocatedAmount}`,
      type: 'success'
    });

    // Set allocation success to true to keep office payment number visible
    setAllocationSuccess(true);

    //alert(`Allocated ${numValue} beneficiaries. Payment No: ${allocateInputData.officePaymentNumber}`);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "noOfBeneficiariesInput") {
      // Allow empty value for clearing the input
      if (value === "") {
        setAllocateInputData(prev => ({
          ...prev,
          [name]: value,
          allocatedAmount: 0
          // Don't reset allocated amount and allocated beneficiaries here
          // as they represent actual allocated values
        }));
        setValidationMessage({ text: '', type: '' });
        setIsValidNumberEntered(false);
        setAllocationSuccess(false); // Reset allocation success when input is cleared
        return;
      }

      // Check if it's a valid number
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue)) {
        // Validate the number
        const maxValue = searchResults.length || 0;
        let isValid = false;

        if (numValue <= 0) {
          setValidationMessage({ text: 'Please enter a valid number of beneficiaries', type: 'error' });
          isValid = false;
        } else if (numValue > maxValue) {
          setValidationMessage({
            text: `Cannot exceed remaining beneficiaries (${maxValue})`,
            type: 'error'
          });
          isValid = false;
        } else {
          // Check against total balance
          const balanceCheck = checkAllocationAgainstBalance(numValue);
          if (!balanceCheck.isValid) {
            setValidationMessage({ text: balanceCheck.message, type: 'error' });
            isValid = false;
          } else {
            setValidationMessage({
              text: `Valid: ${numValue} beneficiaries selected, amount: ₹${balanceCheck.amount}`,
              type: 'success'
            });
            isValid = true;
            // Update preview amount in allocateInputData
            setAllocateInputData(prev => ({
              ...prev,
              [name]: value,
              allocatedAmount: balanceCheck.amount // Preview the amount
            }));
          }
        }

        // Set isValidNumberEntered based on validation
        setIsValidNumberEntered(isValid);

        // If number becomes invalid, clear the office payment number
        if (!isValid) {
          setAllocateInputData(prev => ({
            ...prev,
            [name]: value,
            allocatedAmount: calculateAllocatedAmount(numValue)
          }));
        }
      } else {
        // Handle non-numeric input
        setAllocateInputData(prev => ({
          ...prev,
          [name]: value
        }));
        setValidationMessage({ text: 'Please enter a valid number', type: 'error' });
        setIsValidNumberEntered(false);
        setAllocationSuccess(false); // Reset allocation success
        setAllocateInputData(prev => ({
          ...prev,
          allocatedAmount: 0
        }));
      }
    } else {
      setAllocateInputData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  console.log("Current state - searchResults:", searchResults, "selectedBeneficiaries:", selectedBeneficiaries);

  return (
    <>
      <div className="card">
        {/* Dark navy header */}
        <div className="card-header">
          <h5 className="mb-0 fw-bold">Allocation Details</h5>
        </div>

        {/* Card body */}
        <div className="card-body p-0">
          <table className="table table-bordered mb-0" style={{ borderCollapse: 'collapse' }}>
            <tbody>
              {!hideUpperTable && (
                <>
                  {/* Row 1: DDO Code | BEAMS Scheme code | Detail Head */}
                  <tr>
                    <td className="fw-bold" style={{ width: '16.66%', padding: '10px', backgroundColor: '#e9ecef' }}>DDO Code</td>
                    <td style={{ width: '16.66%', padding: '10px', backgroundColor: 'white' }}>{allocationData.ddoCode}</td>
                    <td className="fw-bold" style={{ width: '16.66%', padding: '10px', backgroundColor: '#e9ecef' }}>BEAMS Scheme code</td>
                    <td style={{ width: '16.66%', padding: '10px', backgroundColor: 'white' }}>{allocationData.beamsSchemeCode}</td>
                    <td className="fw-bold" style={{ width: '16.66%', padding: '10px', backgroundColor: '#e9ecef' }}>Detail Head</td>
                    <td style={{ width: '16.66%', padding: '10px', backgroundColor: 'white' }}>{allocationData.detailHead}</td>
                  </tr>

                  {/* Row 2: Current Month Budget | Current Month Expenditure | Current Month Balance */}
                  <tr>
                    <td className="fw-bold" style={{ padding: '10px', backgroundColor: '#e9ecef' }}>Current Month Budget (₹)</td>
                    <td style={{ padding: '10px', backgroundColor: 'white' }}>₹{allocationData.currentMonthBudget}</td>
                    <td className="fw-bold" style={{ padding: '10px', backgroundColor: '#e9ecef' }}>Current Month Expenditure (₹)</td>
                    <td style={{ padding: '10px', backgroundColor: 'white' }}>₹{allocationData.currentMonthExpenditure}</td>
                    <td className="fw-bold" style={{ padding: '10px', backgroundColor: '#e9ecef' }}>Current Month Balance (₹)</td>
                    <td style={{ padding: '10px', backgroundColor: 'white' }}>₹{allocationData.currentMonthBalance}</td>
                  </tr>

                  {/* Row 3: Total Budget | Total Expenditure | Total Balance */}
                  <tr>
                    <td className="fw-bold" style={{ padding: '10px', backgroundColor: '#e9ecef' }}>Total Budget (₹)</td>
                    <td style={{ padding: '10px', backgroundColor: 'white' }}>₹{allocationData.totalBudget}</td>
                    <td className="fw-bold" style={{ padding: '10px', backgroundColor: '#e9ecef' }}>Total Expenditure (₹)</td>
                    <td style={{ padding: '10px', backgroundColor: 'white' }}>₹{allocationData.totalExpenditure}</td>
                    <td className="fw-bold" style={{ padding: '10px', backgroundColor: '#e9ecef' }}>Total Balance (₹)</td>
                    <td style={{ padding: '10px', backgroundColor: 'white' }}>₹{allocationData.totalBalance}</td>
                  </tr>

                  {/* Row 4: State Budget | State Expenditure | State Balance */}
                  <tr>
                    <td className="fw-bold" style={{ padding: '10px', backgroundColor: '#e9ecef' }}>State Budget (₹)</td>
                    <td style={{ padding: '10px', backgroundColor: 'white' }}>{allocationData.stateBudget}</td>
                    <td className="fw-bold" style={{ padding: '10px', backgroundColor: '#e9ecef' }}>State Expenditure (₹)</td>
                    <td style={{ padding: '10px', backgroundColor: 'white' }}>{allocationData.stateExpenditure}</td>
                    <td className="fw-bold" style={{ padding: '10px', backgroundColor: '#e9ecef' }}>State Balance (₹)</td>
                    <td style={{ padding: '10px', backgroundColor: 'white' }}>{allocationData.stateBalance}</td>
                  </tr>

                  {/* Row 5: Current Timestamp | Distributed Flag | Negative Expenditure */}
                  <tr>
                    <td className="fw-bold" style={{ padding: '10px', backgroundColor: '#e9ecef' }}>Current Timestamp</td>
                    <td style={{ padding: '10px', backgroundColor: 'white' }}>{allocationData.currentTimestamp}</td>
                    <td className="fw-bold" style={{ padding: '10px', backgroundColor: '#e9ecef' }}>Distributed Flag</td>
                    <td style={{ padding: '10px', backgroundColor: 'white' }}>{allocationData.distributedFlag}</td>
                    <td className="fw-bold" style={{ padding: '10px', backgroundColor: '#e9ecef' }}>Negative Expenditure (₹)</td>
                    <td style={{ padding: '10px', backgroundColor: 'white' }}>{allocationData.negativeExpenditure}</td>
                  </tr>

                  {/* Spacer row with custom height */}
                  <tr style={{ height: '20px' }}>
                    <td colSpan="6" style={{ padding: 0, border: 'none', backgroundColor: 'transparent' }}></td>
                  </tr>
                </>
              )}

              {/* Row 6: Total No. of Beneficiaries | Total Beneficiaries Amount | Scheme Code */}
              <tr>
                <td className="fw-bold" style={{ padding: '10px', backgroundColor: '#e9ecef' }}>Total No. of Beneficiaries</td>
                <td style={{ padding: '10px', backgroundColor: 'white' }}>{allocationData.totalBeneficiaries}</td>
                <td className="fw-bold" style={{ padding: '10px', backgroundColor: '#e9ecef' }}>Total Beneficiaries Amount</td>
                <td style={{ padding: '10px', backgroundColor: 'white' }}>₹{allocationData.totalAllocatedBeneficiaries}</td>
                <td className="fw-bold" style={{ padding: '10px', backgroundColor: '#e9ecef' }}>Scheme Code</td>
                <td style={{ padding: '10px', backgroundColor: 'white' }}>{allocationData.schemeCode}</td>
              </tr>

              {/* Row 7: Total No. of Allocated Beneficiaries | Allocated Amount */}
              <tr>
                <td className="fw-bold" style={{ padding: '10px', backgroundColor: '#e9ecef' }}>Total No. of Allocated Beneficiaries</td>
                <td style={{ padding: '10px', backgroundColor: 'white' }}>{allocateInputData.noOfBeneficiariesAllocated || allocateInputData.noOfBeneficiariesInput}</td>
                <td className="fw-bold" style={{ padding: '10px', backgroundColor: '#e9ecef' }}>Allocated Amount (₹)</td>
                <td style={{ padding: '10px', backgroundColor: 'white' }}>₹{allocateInputData.allocatedAmount}</td>
                <td className="fw-bold" style={{ padding: '10px', backgroundColor: '#e9ecef' }}></td>
                <td style={{ padding: '10px', backgroundColor: 'white' }}></td>
              </tr>

              {/* Row 8: No. of Beneficiaries to be allocated | Office Payment Number */}
              <tr>
                <td className="fw-bold" style={{ padding: '10px', backgroundColor: '#e9ecef' }}>No. of Beneficiaries to be allocated</td>
                <td style={{ padding: '10px', backgroundColor: 'white' }}>
                  <input
                    type="number"
                    name="noOfBeneficiariesInput"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="form-control form-control-sm border-0 p-0"
                    value={allocateInputData.noOfBeneficiariesInput}
                    onChange={handleInputChange}
                    min="0"
                    style={{ backgroundColor: 'transparent', width: '100%' }}
                    readOnly={allocationSuccess}
                  />
                </td>

                {/* Show Office Payment Number field when either isValidNumberEntered is true OR allocation was successful */}
                <>
                  <td className="fw-bold" style={{ padding: '10px', backgroundColor: '#e9ecef' }}>Office Payment Number</td>
                  <td style={{ padding: '10px', backgroundColor: 'white' }}>
                    <input
                      type="text"
                      name="officePaymentNumber"
                      className="form-control form-control-sm border-0 p-0"
                      value={allocateInputData.officePaymentNumber}
                      onChange={handleInputChange}
                      style={{ backgroundColor: 'transparent', width: '100%' }}
                      placeholder="Enter office payment number"
                      readOnly={allocationSuccess}
                    />
                  </td>
                </>
              </tr>
            </tbody>
          </table>

          {/* Validation message */}
          {validationMessage.text && (
            <div className={`px-3 pt-2 ${validationMessage.type === 'error' ? 'text-danger' : 'text-success'}`}>
              <small>{validationMessage.text}</small>
            </div>
          )}

          {/* Action buttons */}
          <div className="p-3 d-flex justify-content-end gap-2">
            <button className="btn btn-primary px-4" onClick={handleAllocate}>
              Allocate Beneficiaries
            </button>
          </div>
        </div>

        <style jsx>{`
          .table-bordered td, .table-bordered th {
            border: 1px solid #dee2e6;
          }
          .card-header {
            border-bottom: 1px solid rgba(0,0,0,0.125);
          }
          .form-control:focus {
            box-shadow: none;
            outline: none;
          }
          .form-control {
            border-radius: 0;
          }
          hr {
            opacity: 1;
            border-top: 2px solid #dee2e6;
          }
        `}</style>
      </div>


      <GenerateBillTable
        selectedBeneficiaries={selectedBeneficiaries}
        apiRes={apiRes}
        isPensionRole={isPensionRole}
        allocateInputData={allocateInputData}
        searchData={searchData}
      />
    </>
  );
};

export default AllocationDetailsCard;
