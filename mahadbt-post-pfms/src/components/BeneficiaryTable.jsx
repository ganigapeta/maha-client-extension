import React, { useState } from 'react';
import { generateAndDownloadXMLWithPfx } from '../api/generate-xml';
import { generateAndDownloadPensionSNOXML } from '../api/generate-pension-sno-xml';
import { sendSMS } from '../api/send-sms';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const SMS_TEMPLATE = "Dear Student,\n\nYour Approved DBT Scheme Benefit Amount of {installment} installment of the Year {year} is Disbursed for your application ‘{applicationId}’.";

const BeneficiaryTable = ({
  data = [],
  entriesPerPage = 5,
  scheme = null,
  hasSNORole = false,
  isPensionRole = false,
  roleName = "",
  setSearchResults,
}) => {
  //console.log("Data received in BeneficiaryTable:", data);
  const MAX_PFX_FILE_SIZE = 2 * 1024 * 1024;
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPageState, setEntriesPerPageState] = useState(entriesPerPage);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [xmlPassword, setXmlPassword] = useState("");
  const [confirmXmlPassword, setConfirmXmlPassword] = useState("");
  const [selectedPfxFile, setSelectedPfxFile] = useState(null);
  const [passwordError, setPasswordError] = useState("");
  const [fileError, setFileError] = useState("");
  const [showXmlPassword, setShowXmlPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const safeData = data || [];
  const normalizedRoleName = String(roleName || "").toLowerCase();

  const hidePensionColumns =
    Boolean(isPensionRole) ||
    normalizedRoleName.includes("pension ddo") ||
    normalizedRoleName.includes("assistance ddo");
  const getBeneficiaryAmount = (item) =>
    parseFloat(item.allocatedAmount ?? item.finalAmount ?? item.tentitiveAmount ?? 0) || 0;

  const totalBeneficiaryAmount = safeData.reduce((total, item) => {
    return total + getBeneficiaryAmount(item);
  }, 0);

  const indexOfLastEntry = currentPage * entriesPerPageState;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPageState;
  const currentEntries = safeData.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(safeData.length / entriesPerPageState);

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleEntriesPerPageChange = (e) => {
    setEntriesPerPageState(Number(e.target.value));
    setCurrentPage(1);
  };

  const openPasswordModal = () => {
    if (hasSNORole) {
      handleConfirmGenerate();
      return;
    }
    setXmlPassword("");
    setConfirmXmlPassword("");
    setSelectedPfxFile(null);
    setPasswordError("");
    setFileError("");
    setShowXmlPassword(false);
    setShowConfirmPassword(false);
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setXmlPassword("");
    setConfirmXmlPassword("");
    setSelectedPfxFile(null);
    setPasswordError("");
    setFileError("");
    setShowXmlPassword(false);
    setShowConfirmPassword(false);
  };

  const handleConfirmGenerate = async () => {
    try {
      if (!hasSNORole) {
        if (!selectedPfxFile) {
          setFileError("Please choose a PFX file.");
          return;
        }

        if (!xmlPassword || !confirmXmlPassword) {
          setPasswordError("Please enter and confirm the PFX password.");
          return;
        }

        if (xmlPassword !== confirmXmlPassword) {
          setPasswordError("Password and confirmation password do not match.");
          return;
        }
      }

      setPasswordError("");
      setFileError("");

      if (hasSNORole) {
        setShowPasswordModal(false);
        await generateAndDownloadPensionSNOXML({
          scheme,
          totalAmount: totalBeneficiaryAmount,
          beneficiaries: safeData
        });
        await markBillsAsXmlGenerated();
        if (setSearchResults) setSearchResults([]);
        sendSMSToAllBeneficiaries(safeData, scheme);
        return;
      }

      setShowPasswordModal(false);
      await generateAndDownloadXMLWithPfx({
        scheme,
        totalAmount: totalBeneficiaryAmount,
        beneficiaries: safeData,
        pfxFile: selectedPfxFile,
        password: xmlPassword,
        confirmPassword: confirmXmlPassword
      });
      await markBillsAsXmlGenerated();
      if (setSearchResults) setSearchResults([]);
      sendSMSToAllBeneficiaries(safeData, scheme);

    } catch (error) {
      console.error(error);
      setShowPasswordModal(true);
      setPasswordError(error?.message || "Failed to generate PFMS XML with uploaded PFX");
    }
  };

  const sendSMSToAllBeneficiaries = async (beneficiaries, schemeInfo) => {
    console.log("Sending SMS to all beneficiaries...", beneficiaries.length);

    const installment = schemeInfo?.installment || "First/Second";
    const academicYear = schemeInfo?.academicYear || "XXXXXX";

    for (const item of beneficiaries) {
      const mobileNumber = item.mobileNo || item.mobileNumber || item.phoneNumber || item.creator?.mobileNumber;
      const applicationId = item.applicationNo || item.applicationreferencenumber || "N/A";

      if (mobileNumber) {
        const message = SMS_TEMPLATE
          .replace("{installment}", installment)
          .replace("{year}", academicYear)
          .replace("{applicationId}", applicationId);

        console.log(`Sending SMS to Mobile: ${mobileNumber} | Application ID: ${applicationId}`);
        console.log(`Message Content: ${message}`);

        sendSMS(mobileNumber, message);
      } else {
        console.warn(`No mobile number found for beneficiary: ${applicationId}`);
      }
    }
  };

  const getExportColumns = () => {
    const cols = ['S.No', 'Application No', 'Applicant Name'];
    if (!hidePensionColumns) cols.push('DDO Code');
    cols.push('Allocated Amount (Rs)');
    return cols;
  };

  const getExportRows = () =>
    safeData.map((item, index) => {
      const row = [
        index + 1,
        item.applicationNo || item.applicationreferencenumber || '-',
        item.applicantName || item.creator?.name || '-',
      ];
      if (!hidePensionColumns) row.push(item.ddoCode || item.officeID || '-');
      row.push(getBeneficiaryAmount(item).toFixed(2));
      return row;
    });

  const exportCSV = () => {
    const columns = getExportColumns();
    const rows = getExportRows();
    const csvContent = [columns, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `beneficiary-list.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const columns = getExportColumns();
    const rows = getExportRows();
    const worksheetData = [columns, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Beneficiaries');
    XLSX.writeFile(wb, 'beneficiary-list.xlsx');
  };

  const exportPDF = () => {
    const columns = getExportColumns();
    const rows = getExportRows();
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(13);
    doc.text('Beneficiary List', 14, 15);
    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 22,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [13, 38, 102], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 243, 255] },
    });
    doc.save('beneficiary-list.pdf');
  };

  const markBillsAsXmlGenerated = async () => {
    try {
      // Get unique bill IDs from the current beneficiary list
      const uniqueBillNumbers = [...new Set(
        safeData.map(item => String(item.batchID || item.billNumber || '').trim()).filter(Boolean)
      )];

      if (uniqueBillNumbers.length === 0) return;

      // Fetch the billmanagements records for these bill numbers
      const filter = uniqueBillNumbers.map(b => `billNumber eq '${b}'`).join(' or ');
      const res = await fetch(
        `/o/c/billmanagements?filter=${encodeURIComponent(filter)}&pageSize=200`,
        {
          headers: {
            Accept: 'application/json',
            'x-csrf-token': window.Liferay?.authToken || ''
          },
          credentials: 'include'
        }
      );
      const data = await res.json();
      const bills = data?.items || [];

      // PATCH each bill to "XML Generated"
      await Promise.all(bills.map(bill =>
        fetch(`/o/c/billmanagements/${bill.id}`, {
          method: 'PATCH',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'x-csrf-token': window.Liferay?.authToken || ''
          },
          credentials: 'include',
          body: JSON.stringify({ submittedStatus: 'XML Generated' })
        })
      ));

      console.log(`Marked ${bills.length} bill(s) as XML Generated`);
    } catch (error) {
      console.error('Error marking bills as XML Generated:', error);
    }
  };

  return (
    <>
      {safeData.length > 0 && (
        <div className="row mb-3">
          <div className="col-md-6">
            <div className="d-flex align-items-center">
              <label className="me-2">Show entries:</label>
              <select
                className="form-select w-auto"
                value={entriesPerPageState}
                onChange={handleEntriesPerPageChange}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

      )}
      <div className="table-responsive terms-card">
        <table className="table">
          <thead className="table-primary">
            <tr>
              <th>S.No</th>
              <th>Application No</th>
              <th>Applicant Name</th>
              {/* <th>Mobile No</th> */}
              {!hidePensionColumns && <th>DDO Code</th>}
              {/* {!hidePensionColumns && <th>Caste</th>}
              {!hidePensionColumns && <th>Course Name</th>}
              {!hidePensionColumns && <th>College Name</th>} */}
              <th>Allocated Amount (Rs)</th>
            </tr>
          </thead>
          <tbody>
            {safeData.length > 0 ? (
              currentEntries.length > 0 ? (
                currentEntries.map((item, index) => (
                  <tr key={item.id || index}>
                    <td>{indexOfFirstEntry + index + 1}</td>
                    <td>{item.applicationNo || item.applicationreferencenumber || "-"}</td>
                    <td>{item.applicantName || item.creator?.name || "-"}</td>
                    {/* <td>{item.mobileNo || "-"}</td> */}
                    {!hidePensionColumns && <td>{item.ddoCode || item.officeID || "-"}</td>}
                    {/* {!hidePensionColumns && <td>{item.casteName || "-"}</td>}
                    {!hidePensionColumns && <td>{item.courseName || "-"}</td>}
                    {!hidePensionColumns && <td>{item.collegeName || "-"}</td>} */}
                    <td className="text-end">Rs {getBeneficiaryAmount(item).toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={hidePensionColumns ? 4 : 5} className="text-center">
                    No data for current page
                  </td>                </tr>
              )
            ) : (
              <tr>
                <td colSpan={hidePensionColumns ? 4 : 5} className="text-center">
                  No data available
                </td>              </tr>
            )}
          </tbody>
          {safeData.length > 0 && (
            <tfoot className="table-secondary">
              <tr>
                <td colSpan={hidePensionColumns ? 3 : 4} className="text-end fw-bold">
                  Total Amount Payable:
                </td>
                <td className="text-end fw-bold">Rs {totalBeneficiaryAmount.toFixed(2)}</td>
              </tr>
            </tfoot>
          )}
        </table>

        <div className="d-flex flex-wrap gap-2 align-items-center mb-3 mt-2 mx-2">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={openPasswordModal}
          >
            Generate XML
          </button>

          {safeData.length > 0 && (
            <>
              <button
                type="button"
                className="btn btn-outline-success"
                onClick={exportExcel}
                title="Export to Excel"
              >
                <i className="bi bi-file-earmark-excel me-1"></i>Excel
              </button>
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={exportPDF}
                title="Export to PDF"
              >
                <i className="bi bi-file-earmark-pdf me-1"></i>PDF
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={exportCSV}
                title="Export to CSV"
              >
                <i className="bi bi-file-earmark-text me-1"></i>CSV
              </button>
            </>
          )}
        </div>
      </div>

      {showPasswordModal && (
        <>
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Generate XML</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closePasswordModal}
                    aria-label="Close"
                  ></button>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleConfirmGenerate();
                  }}
                >
                  <div className="modal-body">
                    <label htmlFor="pfmsPfxFile" className="form-label">
                      Select PFX file to upload <span className="text-danger">*</span>
                    </label>
                    <input
                      id="pfmsPfxFile"
                      name="pfmsPfxFile"
                      type="file"
                      className="form-control mb-3"
                      accept=".pfx,.p12,application/x-pkcs12"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;

                        if (!file) {
                          setSelectedPfxFile(null);
                          setFileError("");
                          return;
                        }

                        const isValidPfxFile =
                          /\.(pfx|p12)$/i.test(file.name) ||
                          file.type === "application/x-pkcs12" ||
                          file.type === "application/pkcs12";

                        if (!isValidPfxFile) {
                          setSelectedPfxFile(null);
                          setFileError("Please upload only .pfx or .p12 file.");
                          e.target.value = "";
                          return;
                        }

                        if (file.size > MAX_PFX_FILE_SIZE) {
                          setSelectedPfxFile(null);
                          setFileError("PFX file size must be 2 MB or less.");
                          e.target.value = "";
                          return;
                        }

                        setSelectedPfxFile(file);
                        setFileError("");
                      }}
                    />
                    {selectedPfxFile && (
                      <div className="small text-muted mb-2">
                        Selected file: {selectedPfxFile.name}
                      </div>
                    )}
                    <div className="small text-muted mb-2">
                      Maximum PFX size: 2 MB
                    </div>
                    {fileError && <div className="text-danger small mb-2">{fileError}</div>}

                    <input
                      type="text"
                      name="username"
                      autoComplete="username"
                      value="pfms-user"
                      readOnly
                      tabIndex={-1}
                      aria-hidden="true"
                      className="visually-hidden"
                    />
                    <label htmlFor="pfmsXmlPassword" className="form-label">
                      Enter Password of PFX file <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <input
                        id="pfmsXmlPassword"
                        name="pfmsXmlPassword"
                        autoComplete="current-password"
                        type={showXmlPassword ? "text" : "password"}
                        className="form-control"
                        value={xmlPassword}
                        onChange={(e) => {
                          setXmlPassword(e.target.value);
                          setPasswordError("");
                        }}
                        placeholder=" Enter Password of PFX file"
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowXmlPassword((prev) => !prev)}
                        aria-label={showXmlPassword ? "Hide password" : "Show password"}
                      >
                        <i className={`bi ${showXmlPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                      </button>
                    </div>
                    <br />
                    <label htmlFor="pfmsConfirmXmlPassword" className="form-label">
                      Enter Confirmation Password of PFX file <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <input
                        id="pfmsConfirmXmlPassword"
                        name="pfmsConfirmXmlPassword"
                        autoComplete="new-password"
                        type={showConfirmPassword ? "text" : "password"}
                        className="form-control"
                        value={confirmXmlPassword}
                        onChange={(e) => {
                          setConfirmXmlPassword(e.target.value);
                          setPasswordError("");
                        }}
                        placeholder="Enter Confirmation Password of PFX file"
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        <i className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                      </button>
                    </div>
                    {passwordError && (
                      <div className="text-danger small mt-2">{passwordError}</div>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={closePasswordModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                    >
                      Confirm
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {safeData.length > 0 && totalPages > 0 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="text-muted">
            Showing {safeData.length > 0 ? indexOfFirstEntry + 1 : 0} to{" "}
            {Math.min(indexOfLastEntry, safeData.length)} of {safeData.length} entries
          </div>

          <nav>
            <ul className="pagination">
              <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                <button className="page-link" onClick={prevPage} disabled={currentPage === 1}>
                  Previous
                </button>
              </li>

              {pageNumbers.map((number) => (
                <li key={number} className={`page-item ${currentPage === number ? "active" : ""}`}>
                  <button onClick={() => paginate(number)} className="page-link">
                    {number}
                  </button>
                </li>
              ))}

              <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </>
  );
};

export default BeneficiaryTable;
