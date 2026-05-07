import React, { useState, useEffect } from 'react';
import GenerateBill from '../../modal/GenerateBill';
import APLBillManagementTable from './APLBillManagementTable';
import { saveAllocateBeneficiaries } from "../../api/save"
import * as XLSX from 'xlsx';
import { getObjectName } from '../../api/fetch-scheme';
import { apiService } from '../../api/external-api';

const APLAllocationDetailsCard = ({
  checkBalance,
  apiRes,
  searchResults,
  setSearchResults,
  setBackupSearchData,
  setShowGenerateButton,
  showGenerateButton,
  backupSearchData = [],
  searchData,
  isPensionRole = false,
  hideUpperTable = false,
  onReset,
}) => {

   const [showGenerateModal, setShowGenerateModal] = useState({
        show: false,
        isConform: false
      });
  // Calculate allocated amount based on selected beneficiaries
const isPensionInstallment = searchData?.installment === "Monthly Benefit" ||
  String(searchData?.installment || '').startsWith('Installment') ||
  String(searchData?.installment || '').startsWith('Monthly Benefit_') ||
  searchData?.installment === "One-time Benefit";
  // Calculate allocated amount based on selected beneficiaries
  const calculateAllocatedAmount = (numBeneficiaries) => {
    if (!numBeneficiaries || numBeneficiaries === "") return 0;

    const rawCount = parseInt(numBeneficiaries, 10);
    if (isNaN(rawCount) || rawCount <= 0) return 0;

    const maxAllowed = searchResults.length || 0;
    const count = Math.min(rawCount, maxAllowed);

    // const selected = searchResults.slice(0, count);

    const isFirstInstallment =
      searchData?.installment === "1st Installment" || isPensionInstallment;
   
      return searchResults?.total_amount.toFixed(2);
    // return selected
    //   .reduce((total, item) => {
    //     const amount = isFirstInstallment
    //       ? parseFloat(item?.installment1) || 0
    //       : parseFloat(item?.installment2) || 0;

    //     return total + amount;
    //   }, 0)
    //   .toFixed(2);
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

  const [billGeneratedBillInfo, setBillGeneratedBillInfo] = useState({});

  // const [showGenerateButton, setShowGenerateButton] = useState(false);
  const [showDownloadBeneficiariesButton, setshowDownloadBeneficiariesButton] = useState(searchResults?.families?.length > 0);
  const [isDownloading, setIsDownloading] = useState(false);

  // Sample data (can be overridden by props)
  const safeData = searchResults || [];

  // Add useEffect to monitor state changes
  useEffect(() => {
    setShowGenerateModal({ confirm: false, show: false });
    setValidationMessage({
        text: ``,
        type: 'success'
      });
    if (searchResults?.families?.length > 0) {
      setshowDownloadBeneficiariesButton(true);
    }
  }, [searchResults]);

  const formatAmountIndian = (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "0.00";
    return amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

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

  const getDistrictName = () => {
    return searchData?.dist_name || "N/A";
  };

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
    selectedDistrict: getDistrictName(),
    financialYear: searchData?.financialYear || "N/A",
    installmentMonth: searchData?.installment || "N/A",
    totalFamilies: searchResults?.total_families || 0,
    totalMembers: searchResults?.total_members || 0,
    totalAmount: searchResults?.total_amount || 0,
    // totalBeneficiaryAmount: totalBeneficiaryAmount,
    allocatedAmount: allocateInputData.allocatedAmount, // Use from state
    schemeCode: apiRes?.ddoRecord?.integrationSchemeCode,
  };

  const handleAllocate = async () => {
    const payload = await apiService.allocateAPLBeneficiaries(searchResults?.families, searchData, setBillGeneratedBillInfo);
    setSelectedBeneficiaries(payload?.data || []);
    setValidationMessage({
      text: `Successfully allocated ${searchResults?.total_families} beneficiaries with amount ₹${searchResults?.total_amount}`,
      type: 'success'
    });

    // Set allocation success to true to keep office payment number visible
    setAllocationSuccess(true);
    setShowGenerateButton(true)
  };

  const exportToExcel = async () => {

    const isLekLadki = String(apiRes?.schemeData?.schemeCode || '').startsWith('SPA-WCDD-LEKL');
    const hasInstituteName = backupSearchData.some(item => item.collegeName);
    const isFirstInstallment = searchData?.installment === "1st Installment" || isPensionInstallment;
    const dataToExport = await Promise.all(
      backupSearchData.map(async (item, index) => {
        const amount = isFirstInstallment
          ? parseFloat(item?.installment1) || 0
          : parseFloat(item?.installment2) || 0;

        const districtName = item.districtName
          ? item.districtName
          : isNaN(Number(item.district))
            ? item.district || ""
            : await getObjectName("districts", "id", item.district).catch(() => "");

        const appRef = String(item.applicationreferencenumber || "").trim();
        const refYearCode = appRef.substring(0, 4);
        const savedFinancialYear = String(item.financialyear || item.academicyear || "").trim();
        const isRenewal =
          /^\d{4}$/.test(refYearCode) &&
            savedFinancialYear.length >= 4 &&
            refYearCode !== savedFinancialYear.substring(0, 4)
            ? "Yes"
            : "No";

        const row = {
          "S.No": index + 1,
          "Application ID": item.applicationreferencenumber || "",
          "Applicant Name": item?.beneficiaryfullnameasinaadhaar || item?.name || item?.farmername || item?.fullname || item?.applicantfullname || `${item?.creator?.givenName || ''} ${item?.creator?.familyName || ''}`.trim(),
          "District": districtName,
          "Institute Approval Date": formatDate(item.instituteApprovalDate),
          "Department Approval Date": formatDate(item.approvalDate),
          "Amount (₹)": amount,
          "Status": item.status?.label_i18n || "-"
        };

        if (hasInstituteName) row["Institute Name"] = item.collegeName || "";
        if (!isLekLadki) row["Renewal Application"] = isRenewal;

        return row;
      })
    );

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Beneficiaries");
    XLSX.writeFile(wb, `Beneficiary_Allocation_${apiRes?.ddoMaster?.dDOCode || 'List'}_${new Date().getTime()}.xlsx`);
  };

  const handleGenerateBill = () => {
    setAllocateInputData(prev => ({
      ...prev,
      schemeName: searchData?.schemeName,
      schemeCode: searchData?.schemeCode,
      allocatedAmount: searchResults?.total_amount,
      beneficiaryCount: searchResults?.total_families || 0,
      submittedStatus: "Pending",
      noOfBeneficiariesAllocated: searchResults?.total_families || 0,
      noOfBeneficiariesInput: searchResults?.total_families || 0,
      // Don't reset allocated amount and allocated beneficiaries here
      // as they represent actual allocated values
    }));

     setBillGeneratedBillInfo(prev => ({
      ...prev,
    totalFamilies: searchResults?.total_families || 0,
    totalMembers: searchResults?.total_members || 0,
    totalAmount: searchResults?.total_amount || 0
    }));

    console.log("BillGeneration payload response:", billGeneratedBillInfo);


    setShowGenerateModal({
      show: true,
      isConform: false
    })
  };

  const handleDownloadExcel = async () => {
    setIsDownloading(true);

    try {
      const dataToExport = await Promise.all(
        backupSearchData.map(async (item, index) => {

          const row = {
            "S.No": index + 1,
            "District Name": item?.dist_name || "",
            "DFSO Office": item?.dfso_name || "",
            "AFSO Office": item?.afso_name || "",
            "FPS Name": item?.fps_name || "",
            "RC Type": item?.rc_type || "",
            "RC Number": item?.rc_no || "",
            "HOF Name": item?.hof_name || "",
            "Member Name": item?.member_name || "",
            "Member ID": item?.member_id || "",
            "Gender": item?.gender || "",
            "Relationship with HOF": item?.relation || "",
            "Date of Birth": item?.dob ? formatDate(item.dob) : "",
            "Age": item?.age || "",
            "Aadhaar No.": item?.masked_aadhaar_no || "",
            "Demographic Authentication Completed": item?.demo_auth || "",
            "eKYC Status": item?.ekyc || "",
            "Aadhaar Linked Bank Account Available?":
              item?.is_aadhaar_linked_account ? "Yes" : "No",
            "Total Family Member": item?.member_count || "",
            "Financial Year": searchData?.financialYear || "",
            "Installment Month": searchData?.installment || "",
            "Total Benefit Amount (₹)": item?.amount
              ? `₹ ${formatAmountIndian(item.amount)}`
              : "",
          };

          return row;
        })
      );

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Beneficiaries");
      XLSX.writeFile(wb, `Beneficiary_Allocation_${searchData?.financialYear}_${searchData?.installment}_${apiRes?.ddoMaster?.dDOCode || 'List'}_${new Date().getTime()}.xlsx`);
    } catch (error) {
      console.error("Error preparing data for Excel export:", error);
      alert("An error occurred while preparing the Excel file. Please try again.");
      setIsDownloading(false);
      return;
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle PDF Download
  const handleDownloadPDF = async () => {
  setIsDownloading(true);
  try {
    await new Promise(resolve => setTimeout(resolve, 500));

    const tableHeader = [
      { text: "S.No.", style: "th", alignment: "center" },
      { text: "District Name", style: "th", alignment: "center" },
      { text: "DFSO Office", style: "th", alignment: "center" },
      { text: "AFSO Office", style: "th", alignment: "center" },
      { text: "FPS Name", style: "th", alignment: "center" },
      { text: "RC Type", style: "th", alignment: "center" },
      { text: "RC Number", style: "th", alignment: "center" },
      { text: "HOF Name", style: "th", alignment: "center" },
      { text: "Member Name", style: "th", alignment: "center" },
      { text: "Member ID", style: "th", alignment: "center" },
      { text: "Gender", style: "th", alignment: "center" },
      { text: "Relationship with HOF", style: "th", alignment: "center" },
      { text: "Date of Birth", style: "th", alignment: "center" },
      { text: "Age", style: "th", alignment: "center" },
      { text: "Aadhaar No.", style: "th", alignment: "center" },
      { text: "Demographic Authentication Completed", style: "th", alignment: "center" },
      { text: "eKYC Status", style: "th", alignment: "center" },
      { text: "Aadhaar Linked Bank Account Available?", style: "th", alignment: "center" },
      { text: "Total Family Member", style: "th", alignment: "center" },
      { text: "Financial Year", style: "th", alignment: "center" },
      { text: "Installment Month", style: "th", alignment: "center" },
      { text: "Total Benefit Amount (₹)", style: "th", alignment: "center" },
    ];

    const tableRows = backupSearchData.map((item, index) => [
      { text: String(index + 1), style: "td", alignment: "center" },
      { text: String(item?.dist_name || ""), style: "td", alignment: "left" },
      { text: String(item?.dfso_name || ""), style: "td", alignment: "left" },
      { text: String(item?.afso_name || ""), style: "td", alignment: "left" },
      { text: String(item?.fps_name || ""), style: "td", alignment: "left" },
      { text: String(item?.rc_type || ""), style: "td", alignment: "center" },
      { text: String(item?.rc_no || ""), style: "td", alignment: "center" },
      { text: String(item?.hof_name || ""), style: "td", alignment: "left" },
      { text: String(item?.member_name || ""), style: "td", alignment: "left" },
      { text: String(item?.member_id || ""), style: "td", alignment: "center" },
      { text: String(item?.gender || ""), style: "td", alignment: "center" },
      { text: String(item?.relation || ""), style: "td", alignment: "center" },
      { text: item?.dob ? formatDate(item.dob) : "", style: "td", alignment: "center" },
      { text: String(item?.age ?? ""), style: "td", alignment: "center" },
      { text: String(item?.masked_aadhaar_no || ""), style: "td", alignment: "center" },
      { text: String(item?.demo_auth || ""), style: "td", alignment: "center" },
      { text: String(item?.ekyc || ""), style: "td", alignment: "center" },
      { text: item?.is_aadhaar_linked_account ? "Yes" : "No", style: "td", alignment: "center" },
      { text: String(item?.member_count ?? ""), style: "td", alignment: "center" },
      { text: searchData?.financialYear || "", style: "td", alignment: "center" },
      { text: searchData?.installment || "", style: "td", alignment: "center" },
      { text: item?.amount ? `₹ ${formatAmountIndian(item.amount)}` : "", style: "td", alignment: "right" },
    ]);

    const dd = {
      pageSize: "A3",           // ← A3 gives more width for 20 columns
      pageOrientation: "landscape",
      pageMargins: [20, 20, 20, 20],

      content: [
        {
          text: "Beneficiary Detail",
          style: "pageTitle",
          alignment: "center",
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            headerRows: 1,
            widths: [   // ← Exactly 20 widths matching 20 columns
              18,   // S.No.
              55,   // District Name
              80,   // DFSO Office
              70,   // AFSO Office
              55,   // FPS Name
              28,   // RC Type
              60,   // RC Number
              70,   // HOF Name
              70,   // Member Name
              65,   // Member ID
              25,   // Gender
              45,   // Relationship with HOF
              40,   // Date of Birth
              18,   // Age
              55,   // Aadhaar No.
              40,   // Demographic Auth
              30,   // EKYC Status
              40,   // Aadhaar Linked
              30,   // Total Family Member
              30,   // Financial Year
              30,   // Installment Month
              45,   // Total Benefit Amount
            ],
            body: [tableHeader, ...tableRows],  // ← clean spread, no totalRow
          },
          layout: {
            hLineWidth: () => 0.6,
            vLineWidth: () => 0.6,
            hLineColor: () => "#aaaaaa",
            vLineColor: () => "#aaaaaa",
            fillColor: (rowIndex) => {
              if (rowIndex === 0) return "#dce6f1";
              return rowIndex % 2 === 0 ? "#f5f7fb" : null;
            },
            paddingLeft: () => 3,
            paddingRight: () => 3,
            paddingTop: () => 3,
            paddingBottom: () => 3,
          },
        },
      ],

      styles: {
        pageTitle: { fontSize: 13, bold: true, font: "Roboto", color: "#1a237e" },
        th: { fontSize: 7, bold: true, font: "Roboto" },
        td: { fontSize: 7, bold: false, font: "Roboto" },
      },

      defaultStyle: { font: "Roboto", fontSize: 7 },
    };

    window.pdfMake.createPdf(dd).download(`Beneficiary_Detail_${searchData?.financialYear}_${searchData?.installment}.pdf`);

  } catch (error) {
    console.error("Error preparing data for PDF export:", error);
    alert("An error occurred while preparing the PDF file. Please try again.");
    setIsDownloading(false);
    return;
  } finally {
    setIsDownloading(false);
  }
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

  return (
    <>
      <div className="card">
        {/* Dark navy header */}
        <div className="card-header">
          <h5 className="mb-0 fw-bold">Allocation Details</h5>
        </div>

        {/* Card body */}
        <div className="card-body p-0">
          <table
            className="table table-bordered mb-0"
            style={{ borderCollapse: "collapse" }}
          >
            <tbody>
              {!hideUpperTable && (
                <>
                  {/* Row 1: DDO Code | BEAMS Scheme code | Detail Head */}
                  <tr>
                    <td
                      className="fw-bold"
                      style={{
                        width: "16.66%",
                        padding: "10px",
                        backgroundColor: "#e9ecef",
                      }}
                    >
                      DDO Code
                    </td>
                    <td
                      style={{
                        width: "16.66%",
                        padding: "10px",
                        backgroundColor: "white",
                      }}
                    >
                      {allocationData.ddoCode}
                    </td>
                    <td
                      className="fw-bold"
                      style={{
                        width: "16.66%",
                        padding: "10px",
                        backgroundColor: "#e9ecef",
                      }}
                    >
                      BEAMS Scheme code
                    </td>
                    <td
                      style={{
                        width: "16.66%",
                        padding: "10px",
                        backgroundColor: "white",
                      }}
                    >
                      {allocationData.beamsSchemeCode}
                    </td>
                    <td
                      className="fw-bold"
                      style={{
                        width: "16.66%",
                        padding: "10px",
                        backgroundColor: "#e9ecef",
                      }}
                    >
                      Detail Head
                    </td>
                    <td
                      style={{
                        width: "16.66%",
                        padding: "10px",
                        backgroundColor: "white",
                      }}
                    >
                      {allocationData.detailHead}
                    </td>
                  </tr>

                  {/* Row 2: Current Month Budget | Current Month Expenditure | Current Month Balance */}
                  <tr>
                    <td
                      className="fw-bold"
                      style={{ padding: "10px", backgroundColor: "#e9ecef" }}
                    >
                      Current Month Budget (₹)
                    </td>
                    <td style={{ padding: "10px", backgroundColor: "white" }}>
                      ₹{allocationData.currentMonthBudget}
                    </td>
                    <td
                      className="fw-bold"
                      style={{ padding: "10px", backgroundColor: "#e9ecef" }}
                    >
                      Current Month Expenditure (₹)
                    </td>
                    <td style={{ padding: "10px", backgroundColor: "white" }}>
                      ₹{allocationData.currentMonthExpenditure}
                    </td>
                    <td
                      className="fw-bold"
                      style={{ padding: "10px", backgroundColor: "#e9ecef" }}
                    >
                      Current Month Balance (₹)
                    </td>
                    <td style={{ padding: "10px", backgroundColor: "white" }}>
                      ₹{allocationData.currentMonthBalance}
                    </td>
                  </tr>

                  {/* Row 3: Total Budget | Total Expenditure | Total Balance */}
                  <tr>
                    <td
                      className="fw-bold"
                      style={{ padding: "10px", backgroundColor: "#e9ecef" }}
                    >
                      Total Budget (₹)
                    </td>
                    <td style={{ padding: "10px", backgroundColor: "white" }}>
                      ₹{allocationData.totalBudget}
                    </td>
                    <td
                      className="fw-bold"
                      style={{ padding: "10px", backgroundColor: "#e9ecef" }}
                    >
                      Total Expenditure (₹)
                    </td>
                    <td style={{ padding: "10px", backgroundColor: "white" }}>
                      ₹{allocationData.totalExpenditure}
                    </td>
                    <td
                      className="fw-bold"
                      style={{ padding: "10px", backgroundColor: "#e9ecef" }}
                    >
                      Total Balance (₹)
                    </td>
                    <td style={{ padding: "10px", backgroundColor: "white" }}>
                      ₹{allocationData.totalBalance}
                    </td>
                  </tr>

                  {/* Row 4: State Budget | State Expenditure | State Balance */}
                  <tr>
                    <td
                      className="fw-bold"
                      style={{ padding: "10px", backgroundColor: "#e9ecef" }}
                    >
                      State Budget (₹)
                    </td>
                    <td style={{ padding: "10px", backgroundColor: "white" }}>
                      {allocationData.stateBudget}
                    </td>
                    <td
                      className="fw-bold"
                      style={{ padding: "10px", backgroundColor: "#e9ecef" }}
                    >
                      State Expenditure (₹)
                    </td>
                    <td style={{ padding: "10px", backgroundColor: "white" }}>
                      {allocationData.stateExpenditure}
                    </td>
                    <td
                      className="fw-bold"
                      style={{ padding: "10px", backgroundColor: "#e9ecef" }}
                    >
                      State Balance (₹)
                    </td>
                    <td style={{ padding: "10px", backgroundColor: "white" }}>
                      {allocationData.stateBalance}
                    </td>
                  </tr>

                  {/* Row 5: Current Timestamp | Distributed Flag | Negative Expenditure */}
                  <tr>
                    <td
                      className="fw-bold"
                      style={{ padding: "10px", backgroundColor: "#e9ecef" }}
                    >
                      Current Timestamp
                    </td>
                    <td style={{ padding: "10px", backgroundColor: "white" }}>
                      {allocationData.currentTimestamp}
                    </td>
                    <td
                      className="fw-bold"
                      style={{ padding: "10px", backgroundColor: "#e9ecef" }}
                    >
                      Distributed Flag
                    </td>
                    <td style={{ padding: "10px", backgroundColor: "white" }}>
                      {allocationData.distributedFlag}
                    </td>
                    <td
                      className="fw-bold"
                      style={{ padding: "10px", backgroundColor: "#e9ecef" }}
                    >
                      Negative Expenditure (₹)
                    </td>
                    <td style={{ padding: "10px", backgroundColor: "white" }}>
                      {allocationData.negativeExpenditure}
                    </td>
                  </tr>

                  {/* Spacer row with custom height */}
                  <tr style={{ height: "20px" }}>
                    <td
                      colSpan="6"
                      style={{
                        padding: 0,
                        border: "none",
                        backgroundColor: "transparent",
                      }}
                    ></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>

          {/* Two-column table with download buttons on the right */}
          <div className="d-flex gap-3 p-3">
            {/* Left side: 2-column table */}
            <div style={{ flex: "1" }}>
              <table
                className="table table-bordered mb-0"
                style={{ borderCollapse: "collapse" }}
              >
                <tbody>
                  {/* Row 1: Selected District */}
                  <tr>
                    <td
                      className="fw-bold"
                      style={{
                        width: "50%",
                        padding: "10px",
                        backgroundColor: "#e9ecef",
                      }}
                    >
                      Selected District
                    </td>
                    <td
                      style={{
                        width: "50%",
                        padding: "10px",
                        backgroundColor: "white",
                      }}
                    >
                      {allocationData.selectedDistrict}
                    </td>
                  </tr>

                  {/* Row 2: Financial Year */}
                  <tr>
                    <td
                      className="fw-bold"
                      style={{ padding: "10px", backgroundColor: "#e9ecef" }}
                    >
                      Financial Year
                    </td>
                    <td style={{ padding: "10px", backgroundColor: "white" }}>
                      {allocationData.financialYear}
                    </td>
                  </tr>

                  {/* Row 3: Installment Month */}
                  <tr>
                    <td
                      className="fw-bold"
                      style={{ padding: "10px", backgroundColor: "#e9ecef" }}
                    >
                      Installment Month
                    </td>
                    <td style={{ padding: "10px", backgroundColor: "white" }}>
                      {allocationData.installmentMonth}
                    </td>
                  </tr>

                  {/* Row 4: Total Families */}
                  <tr>
                    <td
                      className="fw-bold"
                      style={{ padding: "10px", backgroundColor: "#e9ecef" }}
                    >
                      Total Families
                    </td>
                    <td style={{ padding: "10px", backgroundColor: "white" }}>
                      {allocationData.totalFamilies}
                    </td>
                  </tr>

                  {/* Row 5: Total Members */}
                  <tr>
                    <td
                      className="fw-bold"
                      style={{ padding: "10px", backgroundColor: "#e9ecef" }}
                    >
                      Total Members
                    </td>
                    <td style={{ padding: "10px", backgroundColor: "white" }}>
                      {allocationData.totalMembers}
                    </td>
                  </tr>

                  {/* Row 6: Total Amount */}
                  <tr>
                    <td
                      className="fw-bold"
                      style={{ padding: "10px", backgroundColor: "#e9ecef" }}
                    >
                      Total Amount (₹)
                    </td>
                    <td style={{ padding: "10px", backgroundColor: "white" }}>
                      ₹{allocationData.totalAmount}
                    </td>
                  </tr>

                  {/* Row 11: Office Payment Number */}
                  {/* <tr>
                    <td
                      className="fw-bold"
                      style={{ padding: "10px", backgroundColor: "#e9ecef" }}
                    >
                      Office Payment Number
                    </td>
                    <td style={{ padding: "10px", backgroundColor: "white" }}>
                      <input
                        type="text"
                        name="officePaymentNumber"
                        className="form-control form-control-sm border-0 p-0"
                        value={allocateInputData.officePaymentNumber}
                        onChange={handleInputChange}
                        style={{
                          backgroundColor: "transparent",
                          width: "100%",
                        }}
                        placeholder="Enter office payment number"
                        readOnly={allocationSuccess}
                      />
                    </td>
                  </tr> */}
                </tbody>
              </table>
            </div>

            {/* Right side: Download buttons */}
            
            {allocationData?.totalFamilies > 0 && (

            <div
              className="d-flex flex-column gap-2"
              style={{ minWidth: "250px" }}
            >
              <button
                className="btn btn-primary px-4 py-2"
                onClick={handleDownloadExcel}
              >
                <i className="bi bi-file-earmark-excel me-2"></i>
                Download Beneficiary List - Excel
              </button>
              <button
                className="btn btn-primary px-4 py-2"
                onClick={handleDownloadPDF}
              >
                <i className="bi bi-file-earmark-pdf me-2"></i>
                Download Beneficiary List - PDF
              </button>
            </div>
            )}
          </div>

          <table
            className="table table-bordered mb-0"
            style={{ borderCollapse: "collapse" }}
          >
            <tbody></tbody>
          </table>

          {/* Validation message */}
          {validationMessage.text && (
            <div
              className={`px-3 pt-2 ${validationMessage.type === "error" ? "text-danger" : "text-success"}`}
            >
              <small>{validationMessage.text}</small>
            </div>
          )}

          {/* Action buttons */}
        {!showGenerateButton && allocationData?.totalFamilies > 0 && (
          <div className="p-3 d-flex justify-content-end gap-2">
            <button className="btn btn-primary px-4" onClick={handleAllocate}>
              Allocate Beneficiaries
            </button>
          </div>
        )}

        {showGenerateButton && (
         <div className="p-3 d-flex justify-content-end gap-2">
            <button
              className="btn btn-primary px-4"
              onClick={() => handleGenerateBill()}
            >
              Generate Bill
            </button>
        </div>
      )}
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

      {showGenerateModal.show && (
        <>
          <GenerateBill
            showGenerateModal={showGenerateModal}
            setShowGenerateModal={setShowGenerateModal}
          />
        </>
      )}

      {showGenerateModal.isConform && (
        <>
          <APLBillManagementTable
            billGeneratedBillInfo={billGeneratedBillInfo}
            selectedBeneficiaries={selectedBeneficiaries}
            apiRes={apiRes}
            allocateInputData={allocateInputData}
            isPensionRole={true}
            searchData={searchData}
            showGenerateButton={showGenerateButton}
            setShowGenerateButton={setShowGenerateButton}
            searchResults={searchResults}
          />{" "}
        </>
      )}
    </>
  );
};

export default APLAllocationDetailsCard;
