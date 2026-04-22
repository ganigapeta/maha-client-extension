import React, { useState } from 'react';
import { generateAndDownloadXML } from '../api/generate-xml';
import { generateAndDownloadPensionSNOXML } from '../api/generate-pension-sno-xml';

const BeneficiaryTable = ({
  data = [],
  entriesPerPage = 5,
  scheme = null,
  hasSNORole = false,
  isPensionRole = false,
  roleName = "",
}) => {
  //console.log("Data received in BeneficiaryTable:", data);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPageState, setEntriesPerPageState] = useState(entriesPerPage);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [xmlPassword, setXmlPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
    setPasswordError("");
    setShowPassword(false);
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
  };

  const handleConfirmGenerate = async () => {
    try {
      if (!hasSNORole) {
        if (xmlPassword !== "chef$123") {
          setPasswordError("Invalid password. Please try again.");
          return;
        }
      }

      setPasswordError("");
      setShowPasswordModal(false);
      const xmlGenerator = hasSNORole
        ? generateAndDownloadPensionSNOXML
        : generateAndDownloadXML;

      await xmlGenerator({
        scheme,
        totalAmount: totalBeneficiaryAmount,
        beneficiaries: safeData
      });

    } catch (error) {
      console.error(error);
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

          <div className="table-responsive">
            <table className="table table-bordered table-striped table-hover">
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

            <div className="col-md-4 mb-3 d-flex align-items-end">
              <div className="d-flex gap-3 w-100">
                <button
                  type="button"
                  className="btn btn-outline-primary flex-fill"
                  onClick={openPasswordModal}
                >
                  Generate XML
                </button>
              </div>
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
                          Enter password
                        </label>
                        <div className="input-group">
                          <input
                            id="pfmsXmlPassword"
                            name="pfmsXmlPassword"
                            autoComplete="current-password"
                            type={showPassword ? "text" : "password"}
                            className="form-control"
                            value={xmlPassword}
                            onChange={(e) => setXmlPassword(e.target.value)}
                            placeholder="Enter password"
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setShowPassword((prev) => !prev)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
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

