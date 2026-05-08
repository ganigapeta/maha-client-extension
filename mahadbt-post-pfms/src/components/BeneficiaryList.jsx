import React, { useEffect, useMemo, useState } from 'react'; import BeneficiaryFilter from './BeneficiaryFilter';
import { getUserRolesById } from '../api/fetch-role';
import BeneficiaryTable from './BeneficiaryTable';
import { buildHeaders, buildHeadersDocument, getLiferayUserId, isSignedIn } from '../config';
import { handleUpdateExternalBill } from '../utils/APLUpdate';
import APLBeneficiaryFilter from './APLBeneficiaryFilter';
import APLBeneficiaryTable from './APLBeneficiaryTable';
const BeneficiaryList = () => {
  const MAX_RFT_PFX_FILE_SIZE = 2 * 1024 * 1024;
  const [scheme, setScheme] = useState(null);
  const [loginUserId, setLoginUserId] = useState(null);
  const [roles, setRoles] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchData, setSearchData] = useState([])

  const [activeTab, setActiveTab] = useState("generate-rft");

  const [showRFTModal, setShowRFTModal] = useState(false);
  const [rftPfxFile, setRftPfxFile] = useState(null);
  const [rftPassword, setRFTPassword] = useState("");
  const [rftConfirmPassword, setRftConfirmPassword] = useState("");
  const [rftFileError, setRftFileError] = useState("");
  const [rftPasswordError, setRftPasswordError] = useState("");
  const [showRFTPassword, setShowRFTPassword] = useState(false);
  const [showRFTConfirmPassword, setShowRFTConfirmPassword] = useState(false);

  const [isAPL, setAPL] = useState(true);

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

  const resetRFTSignForm = () => {
    setRftPfxFile(null);
    setRFTPassword("");
    setRftConfirmPassword("");
    setRftFileError("");
    setRftPasswordError("");
    setShowRFTPassword(false);
    setShowRFTConfirmPassword(false);
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 4000);
  };

  const openRFTModal = (row) => {
    setSelectedRftRow(row);
    resetRFTSignForm();
    setShowRFTModal(true);
  };

  const closeRFTModal = () => {
    resetRFTSignForm();
    setSelectedRftRow(null);
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
          roleName.includes("assistance ddo") ||
          roleName.includes("apl ddo") ||
          roleName.includes("wcdd ddo")
        );
      })?.name || ""
    )
    : "";

  const isDDORole = useMemo(() => {
    const normalized = String(matchedRoleName || "").trim().toLowerCase();
    return (
      normalized.includes("pension ddo") ||
      normalized.includes("assistance ddo") ||
      normalized.includes("apl ddo") ||
      normalized.includes("wcdd ddo")
    );
  }, [matchedRoleName]);

  const isPensionRole = String(matchedRoleName).toLowerCase().includes("pension ddo");

  const isAPLRole = String(matchedRoleName).toLowerCase().includes("apl ddo");


  useEffect(() => {
    const fetchUserRoles = async () => {
      try {
        if (isSignedIn()) {
          const userId = getLiferayUserId();
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
          : isAPLRole? "Food Scheme" :"Special Assistance Schemes";

        // Step 1: get schemeConfigurators filtered by schemeType to get scheme codes
        const isWCDDDDO = String(matchedRoleName).toLowerCase().includes("wcdd ddo");
        const schemeFilter = isWCDDDDO
          ? `schemeType eq '${schemeType}' and department eq '7873729'`
          : `schemeType eq '${schemeType}'`;

        const schemeRes = await fetch(
          `/o/c/schemeconfigurators?filter=${encodeURIComponent(schemeFilter)}&pageSize=200`, {
          headers: buildHeaders(),
          credentials: "include",
        }
        );
        const schemeData = await schemeRes.json();
        const schemeItems = schemeData?.items || [];
        const schemeCodes = schemeItems.map((s) => s.schemeCode).filter(Boolean);

        // Build a map of schemeCode -> description for quick lookup
        const schemeNameMap = {};
        schemeItems.forEach((s) => {
          if (s.schemeCode) schemeNameMap[s.schemeCode] = s.schemeName || s.description || s.schemeCode;
        });

        if (schemeCodes.length === 0) {
          setRftRows([]);
          setRftLoading(false);
          return;
        }

        // Step 2: fetch billmanagements filtered by those scheme codes + status
        const billSchemeFilter = schemeCodes
          .map((code) => `schemeCode eq '${code}'`)
          .join(" or ");

        const filterStr = `(submittedStatus eq 'Completed' or submittedStatus eq 'Signed by DDO') and (${billSchemeFilter})`;

        const res = await fetch(
          `/o/c/billmanagements?filter=${encodeURIComponent(filterStr)}&pageSize=200&sort=dateCreated:desc`,
          {
            headers: buildHeaders(),
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
        {isAPL ? (
          <>
            <APLBeneficiaryFilter
              roles={roles}
              setSearchResults={setSearchResults}
              setSearchData={setSearchData}
              setScheme={setScheme}
              isPensionDDO={isPensionRole}
              isAssistanceDDO={!isPensionRole && isDDORole}
            />
            <APLBeneficiaryTable
              data={searchResults}
              scheme={scheme}
              hasSNORole={hasSNORole}
              isPensionRole={isPensionRole}
              roleName={matchedRoleName}
              setSearchResults={setSearchResults}
            />
          </>
        ) : (
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
              setSearchResults={setSearchResults}
            />
          </>
        )}
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
              setSearchResults={setSearchResults}
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

                      if (!selectedRftRow) {
                        setRftPasswordError("RFT row is not selected.");
                        return;
                      }

                      if (!rftPfxFile) {
                        setRftFileError("Please choose a PFX file.");
                        return;
                      }

                      const isValidPfxFile =
                        /\.(pfx|p12)$/i.test(rftPfxFile.name) ||
                        rftPfxFile.type === "application/x-pkcs12" ||
                        rftPfxFile.type === "application/pkcs12";

                      if (!isValidPfxFile) {
                        setRftPfxFile(null);
                        setRftFileError("Only PFX/P12 files are allowed. Please upload a .pfx or .p12 file.");
                        return;
                      }

                      if (rftPfxFile.size > MAX_RFT_PFX_FILE_SIZE) {
                        setRftPfxFile(null);
                        setRftFileError("PFX file size must be 2 MB or less.");
                        return;
                      }

                      if (!rftPassword || !rftConfirmPassword) {
                        setRftPasswordError("Please enter and confirm the PFX password.");
                        return;
                      }

                      if (rftPassword !== rftConfirmPassword) {
                        setRftPasswordError("Password and confirmation password do not match.");
                        return;
                      }

                      setRftFileError("");
                      setRftPasswordError("");

                      const pdfUrl = selectedRftRow.beamsPdfUrl;
                      if (!pdfUrl) {
                        setRftPasswordError("RFT file is not available.");
                        return;
                      }

                      try {
                        if(!isAPL){
                        // Step 1: fetch existing PDF from beamsPdfUrl as blob -> base64
                        console.log(pdfUrl, "PDF URL:::::")
                        const pdfRes = await fetch(pdfUrl, {
                          headers: buildHeadersDocument(),
                          credentials: "include",
                        });

                        if (!pdfRes.ok) {
                          throw new Error("Failed to load the RFT PDF");
                        }

                        const pdfBlob = await pdfRes.blob();
                        const base64Pdf = await new Promise((resolve, reject) => {
                          const reader = new FileReader();
                          reader.onload = () => resolve(reader.result.split(",")[1]);
                          reader.onerror = reject;
                          reader.readAsDataURL(pdfBlob);
                        });

                        const fileName = `RFT_SIGNED_${selectedRftRow.billNumber || selectedRftRow.id}.pdf`;
                        const requestBlob = new Blob(
                          [
                            JSON.stringify({
                              base64Pdf,
                              fileName,
                              password: rftPassword,
                              billId: selectedRftRow.id,
                            }),
                          ],
                          { type: "application/json" }
                        );

                        // Step 2: call headless sign API with uploaded PFX
                        const formData = new FormData();
                        formData.append("pdfPayload", requestBlob, "pdfPayload.json");
                        formData.append("pfxFile", rftPfxFile, rftPfxFile.name || "certificate.pfx");

                        const signRes = await fetch("/o/mhdbt-headless-service/v1.0/pdf/sign", {
                          method: "POST",
                          headers: buildHeadersDocument(),
                          credentials: "include",
                          body: formData,
                        });

                        const signJson = await signRes.json();

                        if (!signRes.ok || signJson?.statusCode !== "200") {
                          throw new Error(signJson?.message || "Signing failed");
                        }

                        // Step 3: patch billmanagements with signed URL + status "Signed by DDO"
                        await fetch(`/o/c/billmanagements/${selectedRftRow.id}`, {
                          method: "PATCH",
                          headers: buildHeaders(),
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
                      }else {

                         // Step 3: patch billmanagements with signed URL + status "Signed by DDO"
                        await fetch(`/o/c/billmanagements/${selectedRftRow.id}`, {
                          method: "PATCH",
                          headers: buildHeaders(),
                          credentials: "include",
                          body: JSON.stringify({
                            // beamsPdfUrl: selectedRftRow.beamsPdfUrl,
                            // beamsPdfId: signJson.fileEntryId,
                            submittedStatus: "Signed by DDO"
                          }),
                        });

                        // Step 4: refresh rftRows
                        setRftRows((prev) =>
                          prev.map((r) =>
                            r.id === selectedRftRow.id
                              ? { ...r, submittedStatus: "Signed by DDO" }
                              : r
                          )
                        );

                        // If APL DDO - Step 5: patch APL External Data with signed URL + status "Signed by DDO"
                        await handleUpdateExternalBill(selectedRftRow.billNumber);

                      }
                        closeRFTModal();
                        showToast("RFT signed successfully by DDO.", "success");
                      } catch (err) {
                        console.error("RFT signing error:", err);
                        setRftPasswordError(err?.message || "Failed to sign RFT. Please try again.");
                      }
                    }}
                  >
                    <div className="modal-body">
                      <label htmlFor="rftPfxFile" className="form-label">Select PFX file to upload <span className="text-danger">*</span></label>
                      <input
                        id="rftPfxFile"
                        name="rftPfxFile"
                        type="file"
                        className="form-control mb-3"
                        accept=".pfx,.p12,application/x-pkcs12"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;

                          if (!file) {
                            setRftPfxFile(null);
                            setRftFileError("");
                            return;
                          }

                          const isValidPfxFile =
                            /\.(pfx|p12)$/i.test(file.name) ||
                            file.type === "application/x-pkcs12" ||
                            file.type === "application/pkcs12";

                          if (!isValidPfxFile) {
                            setRftPfxFile(null);
                            setRftFileError("Please upload only .pfx or .p12 file.");
                            e.target.value = "";
                            return;
                          }

                          if (file.size > MAX_RFT_PFX_FILE_SIZE) {
                            setRftPfxFile(null);
                            setRftFileError("PFX file size must be 2 MB or less.");
                            e.target.value = "";
                            return;
                          }

                          setRftPfxFile(file);
                          setRftFileError("");
                        }}
                      />
                      {rftPfxFile && (
                        <div className="small text-muted mb-2">
                          Selected file: {rftPfxFile.name}
                        </div>
                      )}
                      <div className="small text-muted mb-2">
                        Maximum PFX size: 2 MB
                      </div>
                      {rftFileError && <div className="text-danger small mb-2">{rftFileError}</div>}

                      <label htmlFor="rftPassword" className="form-label">Enter Password of PFX file <span className="text-danger">*</span></label>

                      <div className="input-group">
                        <input
                          id="rftPassword"
                          name="rftPassword"
                          type={showRFTPassword ? "text" : "password"}
                          className="form-control"
                          value={rftPassword}
                          onChange={(e) => {
                            setRFTPassword(e.target.value);
                            setRftPasswordError("");
                          }}
                          placeholder="Enter password"
                        />

                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowRFTPassword((prev) => !prev)}
                          aria-label={showRFTPassword ? "Hide password" : "Show password"}
                        >
                          <i className={`bi ${showRFTPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                        </button>
                      </div>
                      <br />
                      <label htmlFor="rftConfirmPassword" className="form-label">Enter Confirmation Password of PFX file <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <input
                          id="rftConfirmPassword"
                          name="rftConfirmPassword"
                          autoComplete="new-password"
                          type={showRFTConfirmPassword ? "text" : "password"}
                          className="form-control"
                          value={rftConfirmPassword}
                          onChange={(e) => {
                            setRftConfirmPassword(e.target.value);
                            setRftPasswordError("");
                          }}
                          placeholder="Confirm password"
                        />

                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowRFTConfirmPassword((prev) => !prev)}
                          aria-label={showRFTConfirmPassword ? "Hide password" : "Show password"}
                        >
                          <i className={`bi ${showRFTConfirmPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                        </button>
                      </div>

                      {rftPasswordError && (
                        <div className="text-danger small mt-2">{rftPasswordError}</div>
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
