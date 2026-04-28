import React, { useState, useEffect } from 'react';
import { getObjectName } from '../../api/fetch-scheme';

const APLBillSubmission = ({ apiRes, submittedBillList, setResponseData, setSubmittedBillList, generateRftOnly, billRowData }) => {  const [isAgreed, setIsAgreed] = useState(false);
  const [pdfMakeLoaded, setPdfMakeLoaded] = useState(false);
  const [beneficiaryList, setBeneficiaryList] = useState([]); // State for beneficiary data
  const [loadingBeneficiaries, setLoadingBeneficiaries] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false); // State for download loading

  // Calculate total allocated amount from submittedBillList
  const totalAllocatedAmount = submittedBillList?.reduce((total, item) => {
    return total + (item.finalAmount || 0);
  }, 0) || 0;



  // Bill details from API data
  const billDetails = {
    schemeName: apiRes?.ddoRecord?.name || apiRes?.schemeData?.schemeName || 'N/A',
    ddoCode: apiRes?.ddoRecord?.dDOCode || 'N/A',
    schemeCode: apiRes?.ddoRecord?.integrationSchemeCode || apiRes?.schemeData?.schemeCode || 'N/A',
    billNumber: submittedBillList?.[0]?.batchID || 'N/A',
    allocatedBeneficiary: submittedBillList?.length || 0,
    allocatedAmount: totalAllocatedAmount
  };

const signingRowData = {
  id: billRowData?.id || null,
  billNumber: billDetails.billNumber,
  allocatedAmount: billDetails.allocatedAmount,
  beneficiaryCount: billDetails.allocatedBeneficiary,
  schemeName: billDetails.schemeName,
  ddoCode: billDetails.ddoCode,
  schemeCode: billDetails.schemeCode,
  financialYear: apiRes?.selectedFinancialYear || apiRes?.financialYear, // ✅ ADD THIS
  beamsPdfUrl: billRowData?.beamsPdfUrl || "",
  beamsPdfId: billRowData?.beamsPdfId || ""
};

  // Transform submittedBillList to match the PDF table structure
  const transformBeneficiaryData = async () => {
    if (!submittedBillList || submittedBillList.length === 0) return [];

    const transformedData = await Promise.all(submittedBillList.map(async (item, index) => {
      // Only call getObjectName if we have valid IDs
      const casteName = item?.casteCategoryID ? await getObjectName("castecategories", "id", item.casteCategoryID) : 'N/A';
      const courseName = item?.courseid ? await getObjectName("courses", "id", item.courseid) : 'N/A';
      const collegeName = item?.collegeid ? await getObjectName("colleges", "id", item.collegeid) : 'N/A';

      console.log("casteName::::", casteName, "  courseName::::", courseName, "  collegeName::::", collegeName);

      return {
        srNo: index + 1,
        applicationNo: item.applicationNo || 'N/A',
        applicantName: item.applicantName || 'N/A',
        mobileNo: item.mobileNo || 'N/A',
        ddoCode: billDetails.ddoCode,
        caste: casteName || 'N/A',
        courseName: courseName || 'N/A',
        collegeName: collegeName || 'N/A',
        allocatedAmount: item.finalAmount || 0,
      };
    }));

    return transformedData;
  };

  // Load beneficiary data when component mounts or submittedBillList changes
  useEffect(() => {
    const loadBeneficiaryData = async () => {
      setLoadingBeneficiaries(true);
      try {
        const data = await transformBeneficiaryData();
        setBeneficiaryList(data);
      } catch (error) {
        console.error("Error loading beneficiary data:", error);
        setBeneficiaryList([]);
      } finally {
        setLoadingBeneficiaries(false);
      }
    };

    loadBeneficiaryData();
  }, [submittedBillList]); // Re-run when submittedBillList changes

  // Load pdfmake scripts
  useEffect(() => {
    const loadPdfMake = () => {
      if (window.pdfMake) {
        setPdfMakeLoaded(true);
        return;
      }

      const pdfMakeScript = document.createElement('script');
      pdfMakeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js';
      pdfMakeScript.async = true;
      pdfMakeScript.onload = () => {
        const vfsScript = document.createElement('script');
        vfsScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js';
        vfsScript.async = true;
        vfsScript.onload = () => {
          setPdfMakeLoaded(true);
        };
        document.body.appendChild(vfsScript);
      };
      document.body.appendChild(pdfMakeScript);
    };

    loadPdfMake();
  }, []);

  useEffect(() => {
    console.log("submittedBillList:", JSON.stringify(submittedBillList, null, 2));
    console.log("apiRes.schemeData:", JSON.stringify(apiRes?.schemeData, null, 2));
  }, [submittedBillList, apiRes]);

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatAmountIndian = (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "0.00";
    return amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  

    const handleSubmit = async () => {
  if (!isAgreed) {
    alert("Please agree to the terms and conditions before submitting.");
    return;
  }

  const isSnoRole = billDetails.ddoCode === 'N/A';

  try {
if (isSnoRole) {
  await generateRftOnly(signingRowData);
  setSubmittedBillList([]);
} else {
      // Regular DDO — directly mark as Completed
      await fetch(`/o/c/billmanagements/${signingRowData.id}`, {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-csrf-token': window.Liferay?.authToken || ''
        },
        credentials: 'include',
        body: JSON.stringify({ submittedStatus: 'Completed' })
      });
      setSubmittedBillList([]);
      // Refresh bills
      const { getBills } = await import('../api/save');
      const userId = window.Liferay.ThemeDisplay.getUserId();
      await new Promise(resolve => setTimeout(resolve, 1000));
      const refreshBills = await getBills(userId);
      const mappedData = refreshBills.map(item => ({
        ...item,
        beneficiaryAllocatedCount: Number(item.beneficiaryCount || 0),
        submittedBillStatus: item.submittedStatus,
        paymentAuthorizationLetter: item.paymentAuthLetter,
        mtr: item.mtrFile,
        beneficiaryListExport: item.beneficiaryExport,
        beams: item.beamsStatus
      }));
      setResponseData(mappedData);
    }
  } catch (error) {
    console.error("Error submitting bill:", error);
    alert("Failed to submit bill.");
  }
};

  const generatePDF = async () => {
    // Set downloading state to true
    setIsDownloading(true);
    const isSnoRole = billDetails.ddoCode === 'N/A';

    try {
      if (!pdfMakeLoaded) {
        alert("PDF generator is loading. Please try again in a moment.");
        return;
      }

      if (!beneficiaryList || beneficiaryList.length === 0) {
        alert("No beneficiary data available to generate PDF.");
        return;
      }

      // Simulate a small delay to show loading state (optional)
      await new Promise(resolve => setTimeout(resolve, 500));

      // Header row with all columns
      const tableHeader = [
        { text: "Sr.No.", style: "th", alignment: "center" },
        { text: "Application No", style: "th", alignment: "center" },
        { text: "Applicant Name", style: "th", alignment: "center" },
        { text: "Mobile No", style: "th", alignment: "center" },
        ...(!isSnoRole ? [
          { text: "DDO Code", style: "th", alignment: "center" },
          { text: "Caste", style: "th", alignment: "center" },
          { text: "Course Name", style: "th", alignment: "center" },
          { text: "College Name", style: "th", alignment: "center" },
        ] : []),
        { text: "Allocated Amount", style: "th", alignment: "center" },
      ];


      // Data rows
      const tableRows = beneficiaryList.map((item) => [
        { text: String(item.srNo || ""), style: "td", alignment: "center" },
        { text: item.applicationNo || "", style: "td", alignment: "center" },
        { text: item.applicantName || "", style: "td" },
        { text: item.mobileNo || "", style: "td", alignment: "center" },
        ...(!isSnoRole ? [
          { text: item.ddoCode || "", style: "td", alignment: "center" },
          { text: item.caste || "", style: "td", alignment: "center" },
          { text: item.courseName || "", style: "td" },
          { text: item.collegeName || "", style: "td" },
        ] : []),
        { text: `₹ ${formatAmountIndian(item.allocatedAmount)}`, style: "td", alignment: "right" },
      ]);

      const grandTotal = formatAmountIndian(
        beneficiaryList.reduce((sum, item) => {
          return sum + (Number(item.allocatedAmount) || 0);
        }, 0)
      );

      const totalRow = isSnoRole ? [
        { text: "", colSpan: 3, border: [true, true, false, true], margin: [0, 2, 0, 2] },
        {}, {},
        { text: "Grand Total", style: "th", alignment: "right", border: [true, true, true, true], margin: [0, 2, 0, 2] },
        { text: `₹ ${grandTotal}`, style: "td", alignment: "right", bold: true, border: [true, true, true, true], margin: [0, 2, 0, 2] },
      ] : [
        { text: "", colSpan: 7, border: [true, true, false, true], margin: [0, 2, 0, 2] },
        {}, {}, {}, {}, {}, {},
        { text: "Grand Total", style: "th", alignment: "right", border: [true, true, true, true], margin: [0, 2, 0, 2] },
        { text: `₹ ${grandTotal}`, style: "td", alignment: "right", bold: true, border: [true, true, true, true], margin: [0, 2, 0, 2] },
      ];

      // Update widths too
      const tableWidths = isSnoRole
        ? [25, 100, 120, 80, 80]
        : [25, 82, 85, 62, 55, 40, 82, 154, 60];

      const dd = {
        pageSize: "A4",
        pageOrientation: "landscape",
        pageMargins: [28, 28, 28, 28],

        content: [
          {
            text: "Beneficiary Detail",
            style: "pageTitle",
            alignment: "center",
            margin: [0, 0, 0, 10],
          },
          {
            columns: [
              { width: "*", text: "" },
              {
                width: "auto",
                table: {
                  headerRows: 1,
                  widths: tableWidths,  // ← use dynamic widths
                  body: [tableHeader].concat(tableRows).concat([totalRow]),
                },
                layout: {
                  hLineWidth: function () { return 0.6; },
                  vLineWidth: function () { return 0.6; },
                  hLineColor: function () { return "#aaaaaa"; },
                  vLineColor: function () { return "#aaaaaa"; },
                  fillColor: function (rowIndex) {
                    if (rowIndex === 0) return "#dce6f1";
                    return (rowIndex % 2 === 0) ? "#f5f7fb" : null;
                  },
                  paddingLeft: function () { return 4; },
                  paddingRight: function () { return 4; },
                  paddingTop: function () { return 4; },
                  paddingBottom: function () { return 4; },
                },
              },
              { width: "*", text: "" },
            ],
          },
        ],

        styles: {
          pageTitle: { fontSize: 13, bold: true, font: "Roboto", color: "#1a237e" },
          th: { fontSize: 8, bold: true, font: "Roboto" },
          td: { fontSize: 8, bold: false, font: "Roboto" },
        },

        defaultStyle: { font: "Roboto", fontSize: 8 },
      };

      window.pdfMake.createPdf(dd).download("Beneficiary_Detail.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    } finally {
      // Reset downloading state after PDF is generated
      setIsDownloading(false);
    }
  };

  console.log("apiRes::::::::", apiRes, "  submittedBillList::::", submittedBillList);

  return (
    <div className="card shadow-sm">
      {/* Dark navy header */}
      <div className="card-header">
        <h5 className="mb-0 fw-bold">Bill Submission Process</h5>
      </div>

      {/* Card body */}
      <div className="card-body">
        {/* Bill Details Table - One row per field */}
        <div className="table-responsive">
          <table className="table table-bordered" style={{ borderCollapse: 'collapse' }}>
            <tbody>
              {/* Scheme Name */}
              <tr>
                <td className="fw-bold" style={{ width: '30%', padding: '10px', backgroundColor: '#f8f9fa' }}>
                  Scheme Name
                </td>
                <td style={{ padding: '10px' }}>
                  {billDetails.schemeName}
                </td>
              </tr>

              {/* DDO Code - hide if N/A or SNO role */}
              {billDetails.ddoCode && billDetails.ddoCode !== 'N/A' && (
                <tr>
                  <td className="fw-bold" style={{ padding: '10px', backgroundColor: '#f8f9fa' }}>
                    DDO Code
                  </td>
                  <td style={{ padding: '10px' }}>
                    {billDetails.ddoCode}
                  </td>
                </tr>
              )}

              {/* Bill Number */}
              <tr>
                <td className="fw-bold" style={{ padding: '10px', backgroundColor: '#f8f9fa' }}>
                  Bill Number
                </td>
                <td style={{ padding: '10px' }}>
                  {billDetails.billNumber}
                </td>
              </tr>

              {/* Allocated Beneficiary */}
              <tr>
                <td className="fw-bold" style={{ padding: '10px', backgroundColor: '#f8f9fa' }}>
                  Allocated Beneficiary
                </td>
                <td style={{ padding: '10px' }}>
                  {billDetails.allocatedBeneficiary}
                </td>
              </tr>

              {/* Scheme Code */}
              <tr>
                <td className="fw-bold" style={{ padding: '10px', backgroundColor: '#f8f9fa' }}>
                  Scheme Code
                </td>
                <td style={{ padding: '10px' }}>
                  {billDetails.schemeCode}
                </td>
              </tr>

              {/* Allocated Amount */}
              <tr>
                <td className="fw-bold" style={{ padding: '10px', backgroundColor: '#f8f9fa' }}>
                  Allocated Amount
                </td>
                <td style={{ padding: '10px' }}>
                  {formatAmount(billDetails.allocatedAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Beneficiary List with Download Button */}
        <div className="mt-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold mb-0">Beneficiary List ({beneficiaryList.length} records)</h6>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={generatePDF}
              disabled={beneficiaryList.length === 0 || loadingBeneficiaries || isDownloading}
            >
              {isDownloading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  Generating PDF...
                </>
              ) : (
                <>
                  <i className="bi bi-download me-1"></i>
                  Download PDF
                </>
              )}
            </button>
          </div>

          {/* Loading state */}
          {loadingBeneficiaries ? (
            <div className="alert alert-info">
              Loading beneficiary data...
            </div>
          ) : beneficiaryList.length === 0 ? (
            <div className="alert alert-info">
              No beneficiary data available.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm table-bordered">
                <thead>
                  <tr>
                    <th>Sr. No.</th>
                    <th>Application No</th>
                    <th>Applicant Name</th>
                    <th>Allocated Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {beneficiaryList.slice(0, 5).map((item) => (
                    <tr key={item.srNo}>
                      <td>{item.srNo}</td>
                      <td>{item.applicationNo}</td>
                      <td>{item.applicantName}</td>
                      <td className="text-end">{formatAmount(item.allocatedAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {beneficiaryList.length > 5 && (
                <div className="text-muted small">
                  Showing first 5 of {beneficiaryList.length} beneficiaries. Download PDF for complete list.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Verification Message */}
        <div className="alert alert-light border mt-3">
          The above bill downloaded and verified. The counts of beneficiaries and amount shown on the screen and in pdf are matching. Further submitting this Bill to BEAMS for further processing.
        </div>

        {/* Agreement Checkbox */}
        <div className="form-check mt-3">
<input
  type="checkbox"
  className="form-check-input me-2"
  id="agreeCheckbox"
  checked={isAgreed}
  onChange={(e) => setIsAgreed(e.target.checked)}
/>
          <label className="form-check-label" htmlFor="agreeCheckbox">
            I Agree
          </label>
        </div>

        {/* Submit Button - Right Aligned */}
        <div className="mt-4 d-flex justify-content-end">
          <button
  type="button"
  className="btn btn-primary px-4"
  onClick={handleSubmit}
  disabled={beneficiaryList.length === 0 || loadingBeneficiaries || !isAgreed}
>
  Submit Bill
</button>
        </div>
      </div>
    </div>
  );
};

export default APLBillSubmission;