import React, { useEffect, useState } from 'react';
import { getBeneficiaryRegistered } from '../../old_writer_api/fetch_beneficiary_registered';
import { useLocation, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveBeneficiaryDetails } from '../../old_writer_api/save_beneficiary';

function BeneficiaryRegistereTable() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationState = location.state || {};
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(Number(navigationState.pageSize) || 5);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfMakeLoaded, setPdfMakeLoaded] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
  const [rftModal, setRftModal] = useState({ show: false, type: 'confirm', message: '' });
  const [isGeneratingRft, setIsGeneratingRft] = useState(false);
  const [generatedRftNumber, setGeneratedRftNumber] = useState('');

  const selectedMonth = Number(navigationState.monthFrom || navigationState.month) || new Date().getMonth() + 1;
  const selectedTransYear = Number(navigationState.transYear) || 2025;
  const selectedMonthLabel =
    navigationState.monthLabel ||
    new Date(2000, selectedMonth - 1, 1).toLocaleString('en-US', { month: 'short' });
  const selectedFinancialYear = navigationState.financialYear || `${selectedTransYear - 1}-${selectedTransYear}`;
  const selectedSchemeName = navigationState.schemeName || '';
  const totalBeneficiary = Number(navigationState.totalBeneficiary) || totalCount;
  const totalAmount = Number(navigationState.totalAmount) || 0;

  useEffect(() => {
    const fetchRegisteredBeneficiaries = async () => {
      setIsLoading(true);

      try {
        const payload = {
          monthFrom: selectedMonth,
          monthTo: selectedMonth,
          pageNumber: currentPage,
          pageSize: entriesPerPage,
          transYear: selectedTransYear,
        };

        const response = await getBeneficiaryRegistered(payload);

        setTableData(response?.beneficiaryDatas || []);
        setTotalCount(Number(response?.totalCount) || 0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRegisteredBeneficiaries();
  }, [currentPage, entriesPerPage, selectedMonth, selectedTransYear]);

  useEffect(() => {
    const loadPdfMake = () => {
      if (window.pdfMake) {
        setPdfMakeLoaded(true);
        return;
      }

      const existingPdfMake = document.querySelector('script[data-pdfmake="main"]');
      const existingVfs = document.querySelector('script[data-pdfmake="vfs"]');

      if (existingPdfMake && existingVfs && window.pdfMake) {
        setPdfMakeLoaded(true);
        return;
      }

      if (!existingPdfMake) {
        const pdfMakeScript = document.createElement('script');
        pdfMakeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js';
        pdfMakeScript.async = true;
        pdfMakeScript.dataset.pdfmake = 'main';
        pdfMakeScript.onload = () => {
          if (document.querySelector('script[data-pdfmake="vfs"]')) {
            setPdfMakeLoaded(true);
            return;
          }

          const vfsScript = document.createElement('script');
          vfsScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js';
          vfsScript.async = true;
          vfsScript.dataset.pdfmake = 'vfs';
          vfsScript.onload = () => setPdfMakeLoaded(true);
          document.body.appendChild(vfsScript);
        };
        document.body.appendChild(pdfMakeScript);
        return;
      }

      if (!existingVfs) {
        const vfsScript = document.createElement('script');
        vfsScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js';
        vfsScript.async = true;
        vfsScript.dataset.pdfmake = 'vfs';
        vfsScript.onload = () => setPdfMakeLoaded(true);
        document.body.appendChild(vfsScript);
      }
    };

    loadPdfMake();
  }, []);

  const totalPages = Math.ceil(totalCount / entriesPerPage);
  const indexOfFirstEntry = totalCount === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1;
  const indexOfLastEntry = Math.min(currentPage * entriesPerPage, totalCount);

  const handleEntriesPerPageChange = (event) => {
    setEntriesPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

  const formatAmount = (value) => {
    const numericValue = Number(value) || 0;
    return numericValue.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const normalizeDateForApi = (value) => {
    const rawValue = String(value || '').trim();

    if (!rawValue || rawValue === '-') {
      return null;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
      return rawValue;
    }

    const slashDateMatch = rawValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashDateMatch) {
      const [, day, month, year] = slashDateMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    const dashDateMatch = rawValue.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (dashDateMatch) {
      const [, day, month, year] = dashDateMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    const parsedDate = new Date(rawValue);
    if (!Number.isNaN(parsedDate.getTime())) {
      const year = parsedDate.getFullYear();
      const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
      const day = String(parsedDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return null;
  };

  const getDownloadPayload = (pageSize) => ({
    monthFrom: selectedMonth,
    monthTo: selectedMonth,
    pageNumber: 1,
    pageSize,
    transYear: selectedTransYear,
  });

  const fetchAllBeneficiariesForDownload = async () => {
    const fullCount = Number(navigationState.totalBeneficiary) || totalCount || entriesPerPage;
    const response = await getBeneficiaryRegistered(getDownloadPayload(fullCount));
    return response?.beneficiaryDatas || [];
  };

  const mapExportRows = (rows) =>
    rows.map((item, index) => ({
      'Sr. No.': index + 1,
      'Beneficiary Number': item?.beneficiaryNumber || '-',
      'Beneficiary Name': item?.nameAsPerAadhaar || '-',
      Address: item?.address || '-',
      'Village Name': item?.villageName || '-',
      'Taluka Name': item?.talukaName || '-',
      'District Name': item?.districtName || '-',
      'Date of Birth': item?.dateOfBirth || '-',
      'Birth Year': item?.birthYear || '-',
      'Legal Heir Name': item?.legalHeirSpouseName || '-',
      Age: item?.age || '-',
      Gender: item?.gender || '-',
      'Mobile Number': item?.mobileNumber || '-',
      'Aadhaar Number': item?.aadhaarNumber || '-',
      'Beneficiary Type of Art': item?.beneficiaryTypeOfArt || '-',
      'Beneficiary Cast Category': item?.castCategory || '-',
      'Disability Type': item?.disabilityType || '-',
      'Percent of Disability': item?.percentOfDisability || '-',
      'Annual Income': item?.annualIncome || '-',
      'Application Date': item?.applicationDate || '-',
      'Bank Name': item?.bankName || '-',
      'Account Number': item?.accountNumber || '-',
      'IFSC Code': item?.ifscCode || '-',
      'Honororium/Mandhan Amount': formatAmount(item?.mandhanAmt),
    }));

  const handleExcelDownload = async () => {
    setIsDownloadingExcel(true);

    try {
      const rows = await fetchAllBeneficiariesForDownload();

      if (!rows.length) {
        alert('No beneficiary data available to export.');
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(mapExportRows(rows));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Beneficiaries');
      XLSX.writeFile(
        workbook,
        `Beneficiary_List_${selectedFinancialYear}_${selectedMonthLabel}_${Date.now()}.xlsx`
      );
    } catch (error) {
      console.error('Error generating beneficiary excel:', error);
      alert('Failed to generate Excel. Please try again.');
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  const handlePdfDownload = async () => {
    setIsDownloadingPdf(true);

    try {
      if (!pdfMakeLoaded || !window.pdfMake) {
        alert('PDF generator is loading. Please try again in a moment.');
        return;
      }

      const rows = await fetchAllBeneficiariesForDownload();

      if (!rows.length) {
        alert('No beneficiary data available to export.');
        return;
      }

      const exportRows = mapExportRows(rows);
      const pdfColumns = [
        { key: 'Sr. No.', header: 'Sr. No.', width: 28, alignment: 'center' },
        { key: 'Beneficiary Number', header: 'Beneficiary Number', width: 90, alignment: 'center' },
        { key: 'Beneficiary Name', header: 'Beneficiary Name', width: 120 },
        { key: 'District Name', header: 'District Name', width: 80 },
        { key: 'Age', header: 'Age', width: 34, alignment: 'center' },
        { key: 'Gender', header: 'Gender', width: 42, alignment: 'center' },
        { key: 'Mobile Number', header: 'Mobile Number', width: 88, alignment: 'center' },
        { key: 'Address', header: 'Address', width: 180 },
        {
          key: 'Honororium/Mandhan Amount',
          header: 'Honororium/Mandhan Amount',
          width: 88,
          alignment: 'right',
        },
      ];

      const buildPdfTable = (columns) => ({
        stack: [
          {
            text: 'Beneficiary Detail',
            style: 'pageTitle',
            alignment: 'center',
            margin: [0, 0, 0, 8],
          },
          {
            text: `Year: ${selectedFinancialYear}    Month: ${selectedMonthLabel}    Total Beneficiary: ${totalBeneficiary}    Total Amount: ${formatAmount(totalAmount)}`,
            fontSize: 8,
            margin: [0, 0, 0, 8],
          },
          {
            columns: [
              { width: '*', text: '' },
              {
                width: 'auto',
                table: {
                  headerRows: 1,
                  widths: columns.map((column) => column.width),
                  body: [
                    columns.map((column) => ({
                      text: column.header,
                      style: 'th',
                      alignment: column.alignment || 'left',
                    })),
                    ...exportRows.map((item) =>
                      columns.map((column) => ({
                        text: String(item[column.key] ?? '-'),
                        style: 'td',
                        alignment: column.alignment || 'left',
                      }))
                    ),
                  ],
                  dontBreakRows: true,
                },
                layout: {
                  hLineWidth: () => 0.6,
                  vLineWidth: () => 0.6,
                  hLineColor: () => '#aaaaaa',
                  vLineColor: () => '#aaaaaa',
                  fillColor: (rowIndex) => {
                    if (rowIndex === 0) return '#dce6f1';
                    return rowIndex % 2 === 0 ? '#f5f7fb' : null;
                  },
                  paddingLeft: () => 2,
                  paddingRight: () => 2,
                  paddingTop: () => 2,
                  paddingBottom: () => 2,
                },
              },
              { width: '*', text: '' },
            ],
          },
        ],
      });

      const docDefinition = {
        pageSize: 'A4',
        pageOrientation: 'landscape',
        pageMargins: [28, 18, 28, 18],
        content: [buildPdfTable(pdfColumns)],
        styles: {
          pageTitle: { fontSize: 12, bold: true, font: 'Roboto', color: '#1a237e' },
          th: { fontSize: 7, bold: true, font: 'Roboto' },
          td: { fontSize: 7, font: 'Roboto' },
        },
        defaultStyle: { font: 'Roboto', fontSize: 7 },
      };

      window.pdfMake.createPdf(docDefinition).download(
        `Beneficiary_List_${selectedFinancialYear}_${selectedMonthLabel}.pdf`
      );
    } catch (error) {
      console.error('Error generating beneficiary pdf:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleGenerateRftBill = () => {
    setRftModal({
      show: true,
      type: 'confirm',
      message: 'Are you sure you want to generate RFT / Bill for all beneficiaries?',
    });
  };

  const generateUniqueRftNumber = () => {
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const timePart = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `RFT${datePart}${timePart}${randomPart}`;
  };

  const saveRftPayloadsInBatches = async (payloads, batchSize = 25) => {
    const responses = [];

    for (let start = 0; start < payloads.length; start += batchSize) {
      const batch = payloads.slice(start, start + batchSize);
      const batchResponses = await Promise.all(
        batch.map((payload) => saveBeneficiaryDetails(payload))
      );

      responses.push(...batchResponses);

      if (batchResponses.some((response) => !response)) {
        break;
      }
    }

    return responses;
  };

  const buildRftPayload = (item, rftNumber) => ({
    aadhaarNumber: item?.aadhaarNumber || '',
    accountNumber: item?.accountNumber || '',
    address: item?.address || '',
    age: String(item?.age || ''),
    annualIncome: String(item?.annualIncome || ''),
    applicationDate: normalizeDateForApi(item?.applicationDate),
    bankName: item?.bankName || '',
    beneficiaryNumber: item?.beneficiaryNumber || '',
    beneficiaryType: item?.beneficiaryType || '',
    beneficiaryTypeOfArt: item?.beneficiaryTypeOfArt || '',
    birthYear: String(item?.birthYear || ''),
    castCategory: item?.castCategory || '',
    dateOfBirth: normalizeDateForApi(item?.dateOfBirth),
    disabilityType: item?.disabilityType || '',
    districtCode: item?.districtCode || '',
    districtName: item?.districtName || '',
    firstName: item?.firstName || '',
    gender: item?.gender || '',
    ifscCode: item?.ifscCode || '',
    lastName: item?.lastName || '',
    legalHeirSpouseName: item?.legalHeirSpouseName || '',
    mandhanAmt: String(item?.mandhanAmt || ''),
    middleName: item?.middleName || '',
    mobileNumber: item?.mobileNumber || '',
    month: String(selectedMonthLabel || ''),
    nameAsPerAadhaar: item?.nameAsPerAadhaar || '',
    percentOfDisability: String(item?.percentOfDisability || ''),
    rftNumber,
    rftStatus: 0,
    schemeName: selectedSchemeName,
    talukaCode: item?.talukaCode || '',
    talukaName: item?.talukaName || '',
    villageCode: item?.villageCode || '',
    villageName: item?.villageName || '',
    year: String(selectedFinancialYear || ''),
  });

  const handleConfirmGenerateRft = async () => {
    setRftModal({
      show: true,
      type: 'processing',
      message: 'Generating RFT / Bill and saving beneficiary records...',
    });
    setIsGeneratingRft(true);

    try {
      const allRows = await fetchAllBeneficiariesForDownload();

      if (!allRows.length) {
        throw new Error('No beneficiary data available for RFT generation.');
      }

      const rftNumber = generateUniqueRftNumber();
      const payloads = allRows.map((item) => buildRftPayload(item, rftNumber));
      const responses = await saveRftPayloadsInBatches(payloads);
      const hasFailure = responses.some((response) => !response);

      if (hasFailure) {
        throw new Error('Some beneficiary records failed to save during batch processing.');
      }

      setGeneratedRftNumber(rftNumber);
      setRftModal({
        show: true,
        type: 'success',
        message: `RFT generated successfully. RFT Number: ${rftNumber}`,
      });
    } catch (error) {
      console.error('Error generating RFT / Bill:', error);
      setRftModal({
        show: true,
        type: 'error',
        message: error.message || 'Failed to generate RFT / Bill.',
      });
    } finally {
      setIsGeneratingRft(false);
    }
  };

  return (
    <div className="card mt-4">
      {rftModal.show && (
        <>
          <div
            className="modal-backdrop fade show"
            style={{ zIndex: 1040 }}
          ></div>
          <div
            className="modal fade show d-block"
            style={{ zIndex: 1050 }}
            tabIndex="-1"
            aria-modal="true"
            role="dialog"
          >
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '520px' }}>
              <div className="modal-content border-0 shadow-lg">
                <div
                  className={`modal-header text-white py-3 px-4 border-0 ${
                    rftModal.type === 'success'
                      ? 'bg-success'
                      : rftModal.type === 'error'
                        ? 'bg-danger'
                        : 'bg-primary'
                  }`}
                >
                  <h5 className="modal-title fw-bold mb-0">
                    {rftModal.type === 'confirm'
                      ? 'Generate RFT / Bill'
                      : rftModal.type === 'processing'
                        ? 'Processing'
                        : rftModal.type === 'success'
                          ? 'Success'
                          : 'Error'}
                  </h5>
                </div>
                <div className="modal-body p-4 text-center">
                  {rftModal.type === 'processing' && (
                    <div className="spinner-border text-primary mb-3" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  )}
                  <p className="mb-0 fw-semibold">{rftModal.message}</p>
                  {rftModal.type === 'success' && generatedRftNumber && (
                    <div className="mt-3">
                      <span className="badge bg-success-subtle text-success border px-3 py-2">
                        {generatedRftNumber}
                      </span>
                    </div>
                  )}
                </div>
                <div className="modal-footer border-top pt-3 pb-4 px-4">
                  <div className="w-100 d-flex justify-content-between">
                    {rftModal.type === 'confirm' ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-outline-secondary px-4"
                          onClick={() => setRftModal({ show: false, type: 'confirm', message: '' })}
                        >
                          Close
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary px-4"
                          onClick={handleConfirmGenerateRft}
                        >
                          Ok
                        </button>
                      </>
                    ) : rftModal.type === 'processing' ? (
                      <button
                        type="button"
                        className="btn btn-primary px-4 ms-auto"
                        disabled
                      >
                        Submitting...
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={`btn px-4 ms-auto ${rftModal.type === 'success' ? 'btn-success' : 'btn-danger'}`}
                        onClick={() => setRftModal({ show: false, type: 'confirm', message: '' })}
                      >
                        Close
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      <div className="card-header">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <h5 className="mb-0 fw-bold">Total Beneficiary Registered Details</h5>
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => navigate('/')}
          >
            <i className="bi bi-arrow-left me-1"></i>Back to Dashboard
          </button>
        </div>
      </div>

      <div className="card-body">
        <>
          <div className="row g-3 mb-4">
            <div className="col-md-3 col-sm-6">
              <div className="border rounded p-3 h-100 bg-light">
                <div className="small mb-1">Total Beneficiary</div>
                <div className="fw-bold fs-5">{totalBeneficiary}</div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="border rounded p-3 h-100 bg-light">
                <div className="small mb-1">Total Amount</div>
                <div className="fw-bold fs-5">{formatAmount(totalAmount)}</div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="border rounded p-3 h-100 bg-light">
                <div className="small mb-1">Year</div>
                <div className="fw-bold fs-5">{selectedFinancialYear}</div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="border rounded p-3 h-100 bg-light">
                <div className="small mb-1">Month</div>
                <div className="fw-bold fs-5">{selectedMonthLabel}</div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div
              className="d-flex flex-column justify-content-center align-items-center"
              style={{ minHeight: '240px' }}
            >
              <div
                className="spinner-border text-primary mb-3"
                style={{ width: '3rem', height: '3rem' }}
                role="status"
              >
                <span className="visually-hidden">Loading...</span>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 500, color: '#475569' }}>
                Loading beneficiary details...
              </div>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-bordered table-striped table-hover">
                  <thead className="table-primary">
                    <tr>
                      <th>Beneficiary Number</th>
                      <th>Beneficiary Name</th>
                      <th>Address</th>
                      <th>Village Name</th>
                      <th>Taluka Name</th>
                      <th>District Name</th>
                      <th>Date of Birth</th>
                      <th>Birth Year</th>
                      <th>Legal Heir Name</th>
                      <th>Age</th>
                      <th>Gender</th>
                      <th>Mobile Number</th>
                      <th>Aadhaar Number</th>
                      <th>Beneficiary Type of Art</th>
                      <th>Beneficiary Cast Category</th>
                      <th>Disability Type</th>
                      <th>Percent of Disability</th>
                      <th>Annual Income</th>
                      <th>Application Date</th>
                      <th>Bank Name</th>
                      <th>Account Number</th>
                      <th>IFSC Code</th>
                      <th>Honororium/Mandhan Amount</th>
                      <th>DLC Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.length > 0 ? (
                      tableData.map((item, index) => (
                        <tr key={`${item.beneficiaryNumber}-${index}`}>
                          <td>{item?.beneficiaryNumber || '-'}</td>
                          <td>{item?.nameAsPerAadhaar || '-'}</td>
                          <td>{item?.address || '-'}</td>
                          <td>{item?.villageName || '-'}</td>
                          <td>{item?.talukaName || '-'}</td>
                          <td>{item?.districtName || '-'}</td>
                          <td>{item?.dateOfBirth || '-'}</td>
                          <td>{item?.birthYear || '-'}</td>
                          <td>{item?.legalHeirSpouseName || '-'}</td>
                          <td>{item?.age || '-'}</td>
                          <td>{item?.gender || '-'}</td>
                          <td>{item?.mobileNumber || '-'}</td>
                          <td>{item?.aadhaarNumber || '-'}</td>
                          <td>{item?.beneficiaryTypeOfArt || '-'}</td>
                          <td>{item?.castCategory || '-'}</td>
                          <td>{item?.disabilityType || '-'}</td>
                          <td>{item?.percentOfDisability || '-'}</td>
                          <td>{item?.annualIncome || '-'}</td>
                          <td>{item?.applicationDate || '-'}</td>
                          <td>{item?.bankName || '-'}</td>
                          <td>{item?.accountNumber || '-'}</td>
                          <td>{item?.ifscCode || '-'}</td>
                          <td className="text-end">{formatAmount(item?.mandhanAmt)}</td>
                          <td>Success</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="24" className="text-center">
                          No data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="d-flex align-items-center">
                      <label className="me-2 mb-0">Show entries:</label>
                      <select
                        className="form-select w-auto"
                        value={entriesPerPage}
                        onChange={handleEntriesPerPageChange}
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                    </div>

                    <div className="text-muted">
                      Showing {indexOfFirstEntry} to {indexOfLastEntry} of {totalCount} entries
                    </div>
                  </div>

                  <nav>
                    <ul className="pagination mb-0">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button
                          type="button"
                          className="page-link"
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </button>
                      </li>

                      {Array.from({ length: totalPages }, (_, index) => index + 1)
                        .filter((page) => {
                          if (totalPages <= 5) return true;
                          return (
                            page === 1 ||
                            page === totalPages ||
                            Math.abs(page - currentPage) <= 1
                          );
                        })
                        .map((page, index, pages) => (
                          <React.Fragment key={page}>
                            {index > 0 && page - pages[index - 1] > 1 && (
                              <li className="page-item disabled">
                                <span className="page-link">...</span>
                              </li>
                            )}
                            <li className={`page-item ${currentPage === page ? 'active' : ''}`}>
                              <button
                                type="button"
                                className="page-link"
                                onClick={() => setCurrentPage(page)}
                              >
                                {page}
                              </button>
                            </li>
                          </React.Fragment>
                        ))}

                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button
                          type="button"
                          className="page-link"
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}

              {totalPages === 0 && (
                <div className="d-flex justify-content-start align-items-center mt-3">
                  <label className="me-2 mb-0">Show entries:</label>
                  <select
                    className="form-select w-auto"
                    value={entriesPerPage}
                    onChange={handleEntriesPerPageChange}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              )}

              {tableData.length > 0 && (
                <div className="d-flex flex-wrap justify-content-end gap-3 mt-5">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleExcelDownload}
                    disabled={isDownloadingExcel || isDownloadingPdf}
                    style={{ minWidth: '190px' }}
                  >
                    {isDownloadingExcel ? 'Downloading Excel...' : 'Beneficiary List Excel'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handlePdfDownload}
                    disabled={isDownloadingPdf || isDownloadingExcel}
                    style={{ minWidth: '190px' }}
                  >
                    {isDownloadingPdf ? 'Generating PDF...' : 'Beneficiary List Pdf'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleGenerateRftBill}
                    disabled={isGeneratingRft}
                    style={{ minWidth: '190px' }}
                  >
                    Generate RFT / Bill
                  </button>
                </div>
              )}
            </>
          )}
        </>
      </div>
    </div>
  );
}

export default BeneficiaryRegistereTable;
