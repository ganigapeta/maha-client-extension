import React, { useState, useEffect } from 'react';
import { getObjectName } from '../../api/fetch-scheme';
import { getPicklistDefinitionByExternalReferenceCode } from '../../api/fetch-picklist';
import { checkBalanceApi, getDDORecordUsingId } from '../../api/beneficiary-list';
import AllocateBeneficiaries from '../AllocateBeneficiaries';

const APLBeneficiaryTable = ({
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
  hasCoopRole
}) => {
  // console.log("Data received in APLBeneficiaryTable searchData:", searchData);
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
          const collegeName = await getObjectName("colleges", "id", item.collegenameschoolname);
          const districtName = isNaN(Number(item.district))
            ? item.district
            : await getObjectName("districts", "id", item.district);

          // Check renewal — same applicationreferencenumber in different financial year
          let isRenewal = "No";
          try {
            const appRef = item.applicationreferencenumber || "";
            const currentFY = item.financialyear || item.academicyear || "";
            const loginUserId = item.loginuserid || 0;
            const schemeCode = item.kpiData?.schemeCode || "";

            if (loginUserId && schemeCode && currentFY) {
              const res = await fetch(
                `/o/c/citizendashboardkpis?filter=loginUserId eq ${loginUserId} and schemeCode eq '${schemeCode}'&pageSize=200`,
                {
                  headers: {
                    "Accept": "application/json",
                    "x-csrf-token": window.Liferay?.authToken || ""
                  },
                  credentials: "include"
                }
              );
              const data = await res.json();
              const allEntries = data?.items || [];

              // Get all unique applicationrefencenumbers for this student+scheme
              // Check if any entry has a different year prefix in applicationrefencenumber
              const currentYearPrefix = appRef.substring(0, 4); // e.g. "2526"
              const hasDifferentYear = allEntries.some(entry => {
                const entryRef = entry.applicationrefencenumber || "";
                const entryYearPrefix = entryRef.substring(0, 4);
                return entryYearPrefix && entryYearPrefix !== currentYearPrefix;
              });

              isRenewal = hasDifferentYear ? "Yes" : "No";
            }
          } catch (e) {
            console.error("Error checking renewal:", e);
          }

          return {
            ...item,
            collegeName,
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

  console.log("Enriched Data:", enrichedData,"serachResults::::", enrichedData[0]);

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
              {!isSnoRole && !hasCoopRole && <th>Institute Name</th>}
              <th>District</th>
              {/* <th>{searchData?.installment === "1st Installment" ? "1st Installment" : searchData?.installment === "2nd Installment" ? "2nd Installment" : "Installment"}</th> */}
              <th>Renewal Application</th>
              <th>Approval Date</th>
              <th>Application Status</th>
              {isSnoRole ? (
                <th>Monthly Benefit (₹)</th>
              ):
               hasCoopRole?(
                <>
                <th>One-time Interest Subsidy (₹)</th>
                </>
               )
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
                    <td>{formatDate(item.dateModified)}</td>
                    <td>
                      {item?.name || item?.farmername || item?.fullname || item?.applicantfullname || `${item?.creator?.givenName || ''} ${item?.creator?.familyName || ''}`.trim() || 'N/A'}                    </td>
                    {!isSnoRole && !hasCoopRole && <td>{item.collegeName}</td>}
                    <td>{item.districtName}</td>
                    {/* <td className="text-end">
                      ₹{(searchData?.installment === "1st Installment"
                        ? (item?.installment1 ?? 0)
                        : searchData?.installment === "2nd Installment"
                          ? (item?.installment2 ?? 0)
                          : 0
                      ).toLocaleString("en-IN")}
                    </td> */}
                    <td>{item.isRenewal || "No"}</td>
                    <td>{formatDate(item.dateModified)}</td>
                    <td>{item.status?.label_i18n || "-"}</td>
                    {isPensionRole ? (
                  <td className="text-end">₹ {(item?.installment1 ?? 0).toLocaleString("en-IN")}</td>
                ) : 
                  hasCoopRole? (
                    <td className="text-end">₹ {(item?.installment1 ?? 0).toLocaleString("en-IN")}</td>
                  ):
                (
                  <>
                    <td className="text-end">₹ {(item?.installment1 ?? 0).toLocaleString("en-IN")}</td>
                    <td className="text-end">₹ {(item?.installment2 ?? 0).toLocaleString("en-IN")}</td>
                  </>
                )}
                <td className="text-end">₹ {((item?.installment1 ?? 0) + (item?.installment2 ?? 0)).toLocaleString("en-IN")}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isSnoRole || hasCoopRole ? "9" : "10"} className="text-center">No data for current page</td>
                </tr>
              )
            ) : (
              <tr>
                <td colSpan={isSnoRole || hasCoopRole ? "9" : "11"} className="text-center">No data available</td>
              </tr>
            )}
          </tbody>
          {/* Total row */}
          {enrichedData.length > 0 && (
            <tfoot className="table-secondary">
              <tr>
                <td colSpan={isSnoRole || hasCoopRole ? "9" : "11"} className="text-end fw-bold">Total Beneficiary Amount:</td>
                <td className="text-end fw-bold">₹ {totalBeneficiaryAmount.toFixed(2)}</td>
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
          checkBalance={checkBalance?.data}
          apiRes={apiRes}
          searchResults={searchResults}
          setSearchResults={setSearchResults}
          setBackupSearchData={setBackupSearchData}
          backupSearchData={backupSearchData}
          searchData={searchData}
          isPensionRole={isPensionRole}
          hideUpperTable={enablePensionActions}
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
export default APLBeneficiaryTable;
