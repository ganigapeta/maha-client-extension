import React, { useEffect, useMemo, useState } from 'react'; import BeneficiaryFilter from './BeneficiaryFilter';
import { getUserRolesById } from '../api/fetch-role';
import BeneficiaryTable from './BeneficiaryTable';
const BeneficiaryList = () => {
  const [scheme, setScheme] = useState(null);
  const [loginUserId, setLoginUserId] = useState(null);
  const [roles, setRoles] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchData, setSearchData] = useState([])

  const [activeTab, setActiveTab] = useState("generate-rft");

  const [showRFTModal, setShowRFTModal] = useState(false);
  const [rftPassword, setRFTPassword] = useState("");
  const [rftError, setRFTError] = useState("");
  const [showRFTPassword, setShowRFTPassword] = useState(false);

  const [rftRows, setRftRows] = useState([]);
  const [rftLoading, setRftLoading] = useState(false);
  const [rftCurrentPage, setRftCurrentPage] = useState(1);
  const rftRowsPerPage = 5;
  const rftTotalPages = Math.ceil(rftRows.length / rftRowsPerPage);
  const rftCurrentRows = rftRows.slice(
    (rftCurrentPage - 1) * rftRowsPerPage,
    rftCurrentPage * rftRowsPerPage
  );
  const [selectedRftRow, setSelectedRftRow] = useState(null);

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 4000);
  };

  const openRFTModal = (row) => {
    setSelectedRftRow(row);
    setRFTPassword("");
    setRFTError("");
    setShowRFTPassword(false);
    setShowRFTModal(true);
  };

  const closeRFTModal = () => {
    setShowRFTModal(false);
  };

  const SNO_ROLES = ["pension sno", "assistance sno", "stipend sno", "pre matric sno", "pension ddo", "assistance ddo"];
  const hasSNORole = Array.isArray(roles)
    ? roles.some((role) =>
      SNO_ROLES.some(sno =>
        String(role?.name || "").trim().toLowerCase().includes(sno)
      )
    )
    : false;

  const matchedRoleName = Array.isArray(roles)
    ? (
      roles.find((role) => {
        const roleName = String(role?.name || "").trim().toLowerCase();
        return (
          roleName.includes("pension ddo") ||
          roleName.includes("assistance ddo")
        );
      })?.name || ""
    )
    : "";

  const isDDORole = useMemo(() => {
    const normalized = String(matchedRoleName || "").trim().toLowerCase();
    return (
      normalized.includes("pension ddo") ||
      normalized.includes("assistance ddo")
    );
  }, [matchedRoleName]);

  const isPensionRole = String(matchedRoleName).toLowerCase().includes("pension ddo");

  useEffect(() => {
    const fetchUserRoles = async () => {
      try {
        if (window.Liferay?.ThemeDisplay?.isSignedIn()) {
          const userId = window.Liferay.ThemeDisplay.getUserId();
          setLoginUserId(userId);
          const userData = await getUserRolesById(userId);
          console.log("userData roleBriefs", userData?.roleBriefs, userData);
          setRoles(userData?.roleBriefs);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUserRoles();
  }, []);

  const isRftSigned = (row) => {
    return row?.submittedStatus === "Signed by DDO";
  };

  const hasSignedRft = rftRows.some((item) => isRftSigned(item));

  const handleViewRft = (row) => {
    if (row?.beamsPdfUrl) {
      window.open(row.beamsPdfUrl, "_blank");
      return;
    }

    showToast("RFT file is not available.", "error");
  };

  useEffect(() => {
    const fetchRftRows = async () => {
      if (!isDDORole) return;

      setRftLoading(true);
      try {
        const schemeType = isPensionRole
          ? "Pension Schemes"
          : "Special Assistance Schemes";

        // Step 1: get schemeConfigurators filtered by schemeType to get scheme codes
        const schemeRes = await fetch(
          `/o/c/schemeconfigurators?filter=${encodeURIComponent(`schemeType eq '${schemeType}'`)}&pageSize=200`,
          {
            headers: {
              Accept: "application/json",
              "x-csrf-token": window.Liferay?.authToken || "",
            },
            credentials: "include",
          }
        );
        const schemeData = await schemeRes.json();
        const schemeItems = schemeData?.items || [];
        const schemeCodes = schemeItems.map((s) => s.schemeCode).filter(Boolean);

        // Build a map of schemeCode -> description for quick lookup
        const schemeNameMap = {};
        schemeItems.forEach((s) => {
          if (s.schemeCode) schemeNameMap[s.schemeCode] = s.description || s.schemeCode;
        });

        if (schemeCodes.length === 0) {
          setRftRows([]);
          setRftLoading(false);
          return;
        }

        // Step 2: fetch billmanagements filtered by those scheme codes + status
        const schemeFilter = schemeCodes
          .map((code) => `schemeCode eq '${code}'`)
          .join(" or ");

        const filterStr = `(submittedStatus eq 'Completed' or submittedStatus eq 'Signed by DDO') and (${schemeFilter})`;

        const res = await fetch(
          `/o/c/billmanagements?filter=${encodeURIComponent(filterStr)}&pageSize=200&sort=dateCreated:desc`,
          {
            headers: {
              Accept: "application/json",
              "x-csrf-token": window.Liferay?.authToken || "",
            },
            credentials: "include",
          }
        );

        const data = await res.json();
        const items = data?.items || [];

        // Step 3: enrich each bill with scheme name from the map
        const enriched = items.map((bill) => ({
          ...bill,
          schemeName: schemeNameMap[bill.schemeCode] || bill.schemeCode,
        }));

        setRftRows(enriched);
      } catch (err) {
        console.error("Error fetching RFT rows:", err);
        setRftRows([]);
      } finally {
        setRftLoading(false);
      }
    };

    fetchRftRows();
  }, [isDDORole, isPensionRole]);

  return (
    console.log("searchResults in Beneficiary List Component::::", searchResults),
    <>
      <div className="container mt-5">
        {isDDORole ? (
          <>
            <ul className="nav nav-tabs mb-3">
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link ${activeTab === "generate-rft" ? "active" : ""}`}
                  onClick={() => setActiveTab("generate-rft")}
                >
                  Sign RFT
                </button>
              </li>

              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link ${activeTab === "generate-xml" ? "active" : ""}`}
                  onClick={() => setActiveTab("generate-xml")}
                >
                  Generate XML
                </button>
              </li>
            </ul>

            {activeTab === "generate-xml" && (
              <>
                {hasSignedRft ? (
                  <>
                    <BeneficiaryFilter
                      roles={roles}
                      setSearchResults={setSearchResults}
                      setSearchData={setSearchData}
                      setScheme={setScheme}
                      isPensionDDO={isPensionRole}
                      isAssistanceDDO={!isPensionRole && isDDORole}
                    />
                    <BeneficiaryTable
                      data={searchResults}
                      scheme={scheme}
                      hasSNORole={hasSNORole}
                      isPensionRole={isPensionRole}
                      roleName={matchedRoleName}
                    />
                  </>
                ) : (
                  <div className="alert alert-info">
                    Please sign the RFT first. Beneficiaries will be visible in Generate XML only after the document is digitally signed.
                  </div>
                )}
              </>
            )}

            {activeTab === "generate-rft" && (
              <div className="table-responsive">
                <table className="table table-bordered table-striped table-hover">
                  <thead className="table-primary">
                    <tr>
                      <th>Bill Number</th>
                      <th>Scheme Name</th>
                      <th>Total Beneficiaries</th>
                      <th>Allocated Amount</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rftLoading ? (
                      <tr>
                        <td colSpan={5} className="text-center">Loading...</td>
                      </tr>
                    ) : rftRows.length > 0 ? (
                      rftCurrentRows.map((item) => {
                        const signed = isRftSigned(item);

                        return (
                          <tr key={item.id}>
                            <td>{item.billNumber || "-"}</td>
                            <td>{item.schemeName || item.schemeCode || "-"}</td>                            <td>{item.beneficiaryCount || "0"}</td>
                            <td className="text-end">Rs {Number(item.allocatedAmount || 0).toFixed(2)}</td>
                            <td>
                              <div className="d-flex gap-2 align-items-center">
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary btn-sm"
                                  onClick={() => handleViewRft(item)}
                                  title={signed ? "View Signed RFT Document" : "View RFT Document"}
                                  style={{ padding: "4px 8px" }}
                                >
                                  <i className="bi bi-eye"></i>
                                </button>

                                {!signed && (
                                  <button
                                    type="button"
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={() => openRFTModal(item)}
                                    title="Sign RFT Document"
                                    style={{ padding: "4px 8px" }}
                                  >
                                    <i className="bi bi-pen"></i>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center">No RFT available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {rftRows.length > rftRowsPerPage && (
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div className="text-muted small">
                      Showing {(rftCurrentPage - 1) * rftRowsPerPage + 1} to {Math.min(rftCurrentPage * rftRowsPerPage, rftRows.length)} of {rftRows.length} entries
                    </div>
                    <nav>
                      <ul className="pagination pagination-sm mb-0">
                        <li className={`page-item ${rftCurrentPage === 1 ? "disabled" : ""}`}>
                          <button className="page-link" onClick={() => setRftCurrentPage(p => p - 1)}>Previous</button>
                        </li>
                        {[...Array(rftTotalPages)].map((_, i) => (
                          <li key={i} className={`page-item ${rftCurrentPage === i + 1 ? "active" : ""}`}>
                            <button className="page-link" onClick={() => setRftCurrentPage(i + 1)}>{i + 1}</button>
                          </li>
                        ))}
                        <li className={`page-item ${rftCurrentPage === rftTotalPages ? "disabled" : ""}`}>
                          <button className="page-link" onClick={() => setRftCurrentPage(p => p + 1)}>Next</button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <BeneficiaryFilter
              roles={roles}
              setSearchResults={setSearchResults}
              setSearchData={setSearchData}
              setScheme={setScheme}
              isPensionDDO={false}
              isAssistanceDDO={false}
            />
            <BeneficiaryTable
              data={searchResults}
              scheme={scheme}
              hasSNORole={hasSNORole}
              isPensionRole={isPensionRole}
              roleName={matchedRoleName}
            />
          </>
        )}
        {showRFTModal && (
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
                    <h5 className="modal-title">Generate Digital Signature</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={closeRFTModal}
                    ></button>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();

                      if (rftPassword !== "chef$123") {
                        setRFTError("Invalid password");
                        return;
                      }

                      setRFTError("");
                      setShowRFTModal(false);

                      if (!selectedRftRow) return;

                      try {
                        // Step 1: fetch existing PDF from beamsPdfUrl as blob → base64
                        const pdfRes = await fetch(selectedRftRow.beamsPdfUrl, {
                          credentials: "include",
                        });
                        const pdfBlob = await pdfRes.blob();
                        const base64Pdf = await new Promise((resolve, reject) => {
                          const reader = new FileReader();
                          reader.onload = () => resolve(reader.result.split(",")[1]);
                          reader.onerror = reject;
                          reader.readAsDataURL(pdfBlob);
                        });

                        const fileName = `RFT_SIGNED_${selectedRftRow.billNumber || selectedRftRow.id}.pdf`;

                        // Step 2: call headless sign API
                        const signRes = await fetch("/o/mhdbt-headless-service/v1.0/pdf/sign", {
                          method: "POST",
                          headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json",
                            "x-csrf-token": window.Liferay?.authToken || "",
                          },
                          credentials: "include",
                          body: JSON.stringify({
                            base64Pdf,
                            fileName,
                            password: rftPassword,
                            billId: selectedRftRow.id,
                          }),
                        });

                        const signJson = await signRes.json();

                        if (!signRes.ok || signJson?.statusCode !== "200") {
                          throw new Error(signJson?.message || "Signing failed");
                        }

                        // Step 3: patch billmanagements with signed URL + status "Signed by DDO"
                        await fetch(`/o/c/billmanagements/${selectedRftRow.id}`, {
                          method: "PATCH",
                          headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json",
                            "x-csrf-token": window.Liferay?.authToken || "",
                          },
                          credentials: "include",
                          body: JSON.stringify({
                            beamsPdfUrl: signJson.downloadUrl,
                            beamsPdfId: signJson.fileEntryId,
                            submittedStatus: "Signed by DDO",
                          }),
                        });

                        // Step 4: refresh rftRows
                        setRftRows((prev) =>
                          prev.map((r) =>
                            r.id === selectedRftRow.id
                              ? { ...r, beamsPdfUrl: signJson.downloadUrl, beamsPdfId: signJson.fileEntryId, submittedStatus: "Signed by DDO" }
                              : r
                          )
                        );

                        showToast("RFT signed successfully by DDO.", "success");
                      } catch (err) {
                        console.error("RFT signing error:", err);
                        showToast("Failed to sign RFT. Please try again.", "error");
                      }
                    }}
                  >
                    <div className="modal-body">
                      <label className="form-label">Enter password</label>

                      <div className="input-group">
                        <input
                          type={showRFTPassword ? "text" : "password"}
                          className="form-control"
                          value={rftPassword}
                          onChange={(e) => setRFTPassword(e.target.value)}
                          placeholder="Enter password"
                        />

                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowRFTPassword((prev) => !prev)}
                        >
                          {showRFTPassword ? "Hide" : "Show"}
                        </button>
                      </div>

                      {rftError && (
                        <div className="text-danger small mt-2">{rftError}</div>
                      )}
                    </div>

                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={closeRFTModal}
                      >
                        Cancel
                      </button>

                      <button type="submit" className="btn btn-primary">
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
      </div>
      {toast.show && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 9999,
            minWidth: "300px",
          }}
          className={`alert ${toast.type === "success" ? "alert-success" : "alert-danger"} shadow d-flex align-items-center gap-2`}
          role="alert"
        >
          <span>{toast.message}</span>
          <button
            type="button"
            className="btn-close ms-auto"
            onClick={() => setToast({ show: false, message: "", type: "success" })}
          />
        </div>
      )}
    </>
  );
};

export default BeneficiaryList;
