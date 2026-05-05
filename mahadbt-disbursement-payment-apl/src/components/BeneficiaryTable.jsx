import React, { useState, useEffect } from 'react';
import { getObjectName, getObjectDetail } from '../api/fetch-scheme';
import { getPicklistDefinitionByExternalReferenceCode } from '../api/fetch-picklist';
import { checkBalanceApi, getDDORecordUsingId } from '../api/beneficiary-list';
import AllocateBeneficiaries from './AllocateBeneficiaries';

const BeneficiaryTable = ({
  searchResults = [],
  searchData,
  setShowLoader,
  entriesPerPage = 5,
  enablePensionActions = false,
  isPensionRole = false,
  apiRes,
  setApiRes,
  setCheckBalance,
  checkBalance,
  setSearchResults,
  setBackupSearchData,
  backupSearchData,
  onReset,
  hasCoopRole,
  hasMapsRole
}) => {
  // console.log("Data received in BeneficiaryTable searchData:", searchData);
  // console.log("First item fields:", Object.keys(searchResults?.[0] || {}));
  // console.log("First item data:", JSON.stringify(searchResults?.[0], null, 2));s
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPageState, setEntriesPerPageState] = useState(entriesPerPage);
  const [enrichedData, setEnrichedData] = useState([]);
  const [showAllocateBeneficiaries, setShowAllocateBeneficiaries] = useState(false);
  const SNO_ROLES = ["pension sno", "assistance sno", "stipend sno", "pre matric sno"];
  const isSnoRole = isPensionRole; // already passed as prop

  // Safe check for data
  const safeData = searchResults || [];
  if (safeData.length === 0) {
    setShowLoader(false);
  }

  // Calculate total beneficiary amount
  const totalBeneficiaryAmount = safeData.reduce((total, item) => {
    return total + (parseFloat(item?.installment1) || 0) + (parseFloat(item?.installment2) || 0);
  }, 0);

  // Fetch college and district names for each item
  useEffect(() => {
    const enrichData = async () => {
      const enriched = await Promise.all(
        safeData.map(async (item) => {
          const college = await getObjectDetail("colleges", "id", item.collegenameschoolname);

          const collegeName = await getObjectName("colleges", "id", item.collegenameschoolname);
          // const collegeName = college?.name || null;
          const departmentCode = college?.departmentCode || college?.aisheCode || college?.code || null;
          // console.log("collegecode ::: ", collegecode);
          //const departmentCode = await.getObjectName("colleges", "id", item.collegenameschoolname);


          const districtName = isNaN(Number(item.district))
            ? item.district
            : await getObjectName("districts", "id", item.district);

          const appRef = String(item.applicationreferencenumber || "").trim();
          const refYearCode = appRef.substring(0, 4);
          const savedFinancialYear = String(item.financialyear || item.academicyear || "").trim();
          const isRenewal =
            /^\d{4}$/.test(refYearCode) &&
              savedFinancialYear.length >= 4 &&
              refYearCode !== savedFinancialYear.substring(0, 4)
              ? "Yes"
              : "No";

          return {
            ...item,
            collegeName,
            departmentCode,
            districtName,
            isRenewal
          };
        })
      );
      setEnrichedData(enriched);
      setShowLoader(false);
    };

    if (safeData.length > 0) {
      enrichData();
    } else {
      setEnrichedData([]);
    }
  }, [safeData]);

  // Calculate pagination
  const indexOfLastEntry = currentPage * entriesPerPageState;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPageState;
  const currentEntries = enrichedData.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(enrichedData.length / entriesPerPageState);

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
    setCurrentPage(1); // Reset to first page
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

  console.log("Enriched Data:", enrichedData, "serachResults::::", enrichedData[0]);

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

      {/* Table */}
      <div className="table-responsive">
        <table className="table table-bordered table-striped table-hover">
          <thead className="table-primary">
            <tr>
              <th>S.No</th>
              <th>Application ID</th>
              <th>Application Date</th>
              <th>Applicant Name</th>
              {!isSnoRole && !hasCoopRole && !hasMapsRole && <th>Institute Name</th>}
              {!isSnoRole && !hasCoopRole && !hasMapsRole && <th>Department Code</th>}
              {!hasMapsRole && <th>District</th>}

              {/* <th>{searchData?.installment === "1st Installment" ? "1st Installment" : searchData?.installment === "2nd Installment" ? "2nd Installment" : "Installment"}</th> */}
              <th>Renewal Application</th>
              {!isSnoRole && !hasCoopRole && !hasMapsRole && <th>Approval Date</th>}
              {!isSnoRole && !hasCoopRole && !hasMapsRole && <th>Institute/Department Approval Date</th>}
              <th>Application Status</th>
              {isSnoRole && String(searchData?.installment || '').startsWith('Installment') ? (
                <th>Installment Amount (₹)</th>
              ) : isSnoRole ? (
                <th>{searchData?.installment === "One-time Benefit" ? "One-time Benefit (₹)" : "Monthly Benefit (₹)"}</th>
              ) :
                hasCoopRole ? (
                  <>
                    <th>One-time Interest Subsidy (₹)</th>
                  </>
                ) :
                  hasMapsRole ? (<>
                    <th>Monthly Reimbursement (₹)</th>
                  </>)
                    : (
                      <>
                        <th>1st Installment (₹)</th>
                        <th>2nd Installment (₹)</th>
                      </>
                    )}
              <th>Total Amount Payable (₹)</th>
            </tr>
          </thead>
          <tbody>
            {enrichedData.length > 0 ? (
              currentEntries.length > 0 ? (
                currentEntries.map((item, index) => (
                  <tr key={index}>
                    <td>{indexOfFirstEntry + index + 1}</td>
                    <td>{item.applicationreferencenumber}</td>
                    <td>{formatDate(item.dateCreated)}</td>
                    <td>
                      {item?.beneficiaryfullnameasinaadhaar || item?.name || item?.farmername || item?.fullname || item?.applicantfullname || `${item?.creator?.givenName || ''} ${item?.creator?.familyName || ''}`.trim() || 'N/A'}</td>
                    {!isSnoRole && !hasCoopRole && !hasMapsRole && <td>{item.collegeName}</td>}
                    {!isSnoRole && !hasCoopRole && !hasMapsRole && <td>{item.departmentCode}</td>}
                    {!hasMapsRole && <td>{item.districtName}</td>}

                    {/* <td className="text-end">
                      ₹{(searchData?.installment === "1st Installment"
                        ? (item?.installment1 ?? 0)
                        : searchData?.installment === "2nd Installment"
                          ? (item?.installment2 ?? 0)
                          : 0
                      ).toLocaleString("en-IN")}
                    </td> */}
                    <td>{item.isRenewal || "No"}</td>
                    {!isSnoRole && !hasCoopRole && !hasMapsRole && <td>{formatDate(item.approvalDate)}</td>}
                    {!isSnoRole && !hasCoopRole && !hasMapsRole && <td>{formatDate(item.instituteApprovalDate)}</td>}
                    <td>{item.status?.label_i18n || "-"}</td>
                    {isPensionRole ? (
                      <td className="text-end">₹{(item?.installment1 ?? 0).toLocaleString("en-IN")}</td>
                    ) :
                      hasCoopRole ? (
                        <td className="text-end">₹{(item?.installment1 ?? 0).toLocaleString("en-IN")}</td>
                      ) :
                        hasMapsRole ? (<>
                          <td className="text-end">₹{(item?.installment1 ?? 0).toLocaleString("en-IN")}</td>
                        </>)
                          :
                          (
                            <>
                              <td className="text-end">₹{(item?.installment1 ?? 0).toLocaleString("en-IN")}</td>
                              <td className="text-end">₹{(item?.installment2 ?? 0).toLocaleString("en-IN")}</td>
                            </>
                          )}
                    <td className="text-end">₹{((item?.installment1 ?? 0) + (item?.installment2 ?? 0)).toLocaleString("en-IN")}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isSnoRole || hasCoopRole ? "9" : hasMapsRole ? "8" : "14"} className="text-center">No data for current page</td>
                </tr>
              )
            ) : (
              <tr>
                <td colSpan={isSnoRole || hasCoopRole ? "9" : hasMapsRole ? "8" : "14"} className="text-center">No data available</td>
              </tr>
            )}
          </tbody>
          {/* Total row */}
          {enrichedData.length > 0 && (
            <tfoot className="table-secondary">
              <tr>
                <td colSpan={isSnoRole || hasCoopRole ? "8" : hasMapsRole ? "7" : "13"} className="text-end fw-bold">Total Beneficiary Amount:</td>
                <td className="text-end fw-bold">₹{totalBeneficiaryAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {enablePensionActions && searchResults.length > 0 && (
        <div className="mt-3 mb-3 d-flex justify-content-end">
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => setShowAllocateBeneficiaries(true)}
          >
            Generate RFT
          </button>
        </div>
      )}

      {enablePensionActions && showAllocateBeneficiaries && (
        <AllocateBeneficiaries
          checkBalance={checkBalance?.data || checkBalance}
          apiRes={apiRes}
          searchResults={searchResults}
          setSearchResults={setSearchResults}
          setBackupSearchData={setBackupSearchData}
          backupSearchData={backupSearchData}
          searchData={searchData}
          isPensionRole={isPensionRole}
          hideUpperTable={enablePensionActions}
          onReset={onReset}
        />
      )}

      {/* Pagination controls - only show if there's data and more than one page */}
      {enrichedData.length > 0 && totalPages > 0 && !showAllocateBeneficiaries && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="text-muted">
            Showing {enrichedData.length > 0 ? indexOfFirstEntry + 1 : 0} to{' '}
            {Math.min(indexOfLastEntry, enrichedData.length)} of {enrichedData.length} entries
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
    </>
  );
};
export default BeneficiaryTable;
