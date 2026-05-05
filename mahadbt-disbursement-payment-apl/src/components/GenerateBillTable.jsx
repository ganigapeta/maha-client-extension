import React, { useState } from 'react';
import GenerateBill from '../modal/GenerateBill';
import BillManagementTable from './BillManagementTable';

const GenerateBillTable = ({ selectedBeneficiaries = [], apiRes, allocateInputData, isPensionRole = false, searchData }) => {  const [showGenerateModal, setShowGenerateModal] = useState({
    show: false,
    isConform: false
  });

  console.log("selectedBeneficiaries::::::::", selectedBeneficiaries)
  // console.log("Data received in GenerateBillTable:", selectedBeneficiaries);

  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPageState, setEntriesPerPageState] = useState(5);

  // Calculate pagination
  const indexOfLastEntry = currentPage * entriesPerPageState;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPageState;
  const currentEntries = selectedBeneficiaries.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(selectedBeneficiaries.length / entriesPerPageState);

  // Generate page numbers
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

  const handleGenerateBill = () => {
    setShowGenerateModal({
      show: true,
      isConform: false
    })
  };

  // console.log("showGenerateModal::::::::::::",showGenerateModal)
  return (
    <>
      {
        showGenerateModal.show && (<>
          <GenerateBill showGenerateModal={showGenerateModal} setShowGenerateModal={setShowGenerateModal} />
        </>)
      }
      {/* Show entries dropdown */}
      {selectedBeneficiaries.length > 0 && (
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

      {/* Table */}
      <div className="table-responsive">
        <table className="table table-bordered table-striped table-hover">
          <thead className="table-primary">
            <tr>
              <th>S.No</th>
              <th>Application ID</th>
              <th>Applicant Name</th>
              <th>Beneficiary Amount</th>
            </tr>
          </thead>
          <tbody>
            {selectedBeneficiaries.length > 0 ? (
              currentEntries.length > 0 ? (
                currentEntries.map((item, index) => (
                  <tr key={item.id || index}>
                    <td>{indexOfFirstEntry + index + 1}</td>
                    <td>{item.applicationNo || item.applicationreferencenumber || 'N/A'}</td>
                    <td>{item.applicantName || 'N/A'}</td>
                    <td>₹{parseFloat(item.finalAmount || item.installment1 || item.installment2 || 0).toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center">No data for current page</td>
                </tr>
              )
            ) : (
              <tr>
                <td colSpan="4" className="text-center">No data available</td>
              </tr>
            )}
          </tbody>

          {/* Summary row */}
          {selectedBeneficiaries.length > 0 && (
            <tfoot className="table-secondary">
              <tr>
                <td colSpan="3" className="text-end fw-bold">Total Amount:</td>
                <td className="text-end fw-bold">
                  ₹{selectedBeneficiaries
                    .reduce((sum, item) => {
                      const amount = parseFloat(item.finalAmount) || parseFloat(item.installment1) || parseFloat(item.installment2) || 0;
                      return sum + amount;
                    }, 0)
                    .toFixed(2)}
                </td>
              </tr>
              <tr>
                <td colSpan="3" className="text-end fw-bold">Action</td>
                <td className="text-start">
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => handleGenerateBill()}
                  >
                    Generate Bill
                  </button>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination and entries info */}
      {selectedBeneficiaries.length > 0 && totalPages > 0 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="text-muted">
            Showing {selectedBeneficiaries.length > 0 ? indexOfFirstEntry + 1 : 0} to{' '}
            {Math.min(indexOfLastEntry, selectedBeneficiaries.length)} of {selectedBeneficiaries.length} entries
          </div>

          <nav>
            <ul className="pagination">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={prevPage} disabled={currentPage === 1}>
                  Previous
                </button>
              </li>

              {pageNumbers.map((number) => (
                <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                  <button onClick={() => paginate(number)} className="page-link">
                    {number}
                  </button>
                </li>
              ))}

              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button className="page-link" onClick={nextPage} disabled={currentPage === totalPages}>
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {
        showGenerateModal.isConform && (<>
<BillManagementTable selectedBeneficiaries={selectedBeneficiaries} apiRes={apiRes} allocateInputData={allocateInputData} isPensionRole={isPensionRole} searchData={searchData} />        </>)
      }
    </>
  );
};

export default GenerateBillTable;
