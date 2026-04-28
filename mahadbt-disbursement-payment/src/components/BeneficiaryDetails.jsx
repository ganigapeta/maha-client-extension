import React, { useState } from "react";
import { getPicklistDefinitionByExternalReferenceCode } from "../api/fetch-picklist";
import { checkBalanceApi, getDDORecordUsingId } from "../api/beneficiary-list";
import AllocateBeneficiaries from "./AllocateBeneficiaries";
const BeneficiaryDetails = ({
  searchResults,
  apiRes,
  searchData,
  setCheckBalance,
  setApiRes,
  checkBalance,
  setSearchResults,
  setBackupSearchData,
  backupSearchData,
  onReset,
}) => {
  const [show, setShow] = useState(false);
  const handleGetCheckBalance = async () => {
    try {
      const picklistRes =
        await getPicklistDefinitionByExternalReferenceCode("DBT-ACADEMIC-YEAR");

      let ddoRecord = await getDDORecordUsingId(searchData.schemeName);
      // console.log("ddoRecord::::::::",ddoRecord)
      const picklistData = picklistRes?.listTypeEntries || [];

      const fy =
        picklistData.find((item) => item.key == searchData.financialYear)
          ?.name || "";

      const [fromYear = "", toYear = ""] = fy.split("-");

      console.log("searchData:::::::", searchData);
      // const payload = {
      //   fromYear,
      //   toYear,
      //   schemeCode: ddoRecord?.integrationSchemeCode,
      //   ddoCode: ddoRecord?.dDOCode,
      //   detailsHead: ddoRecord?.detailHead
      // };
      const payload = {
        fromYear: "2025",
        toYear: "2026",
        schemeCode: "22030748",
        ddoCode: "7101002015",
        detailsHead: "34",
      };
      

      setApiRes((prev) => ({
        ...prev,
        checkBalance: payload,
      }));
      const res = await checkBalanceApi(payload);

      if (res) {
        // If API returns data wrapped in a data property, use it. Otherwise use res directly.
        const balanceData = res.data || res;
        setCheckBalance(balanceData);

        setApiRes((prev) => ({
          ...prev,
          ddoRecord: ddoRecord,
        }));
        setShow(true);
      }

      console.log("Response:", res);
      console.log("Payload:", payload);
    } catch (err) {
      console.error("Check Balance Error:", err);
    }
  };

  const totalBeneficiaryAmount = () => {
    const isFirstInstallment = searchData?.installment === "1st Installment";

    return searchResults
      .reduce((total, item) => {
        const amount = isFirstInstallment
          ? parseFloat(item?.installment1) || 0
          : parseFloat(item?.installment2) || 0;

        return total + amount;
      }, 0)
      .toFixed(2);
  };

  return (
    <>
      <div className="card">
        {/* Dark navy header */}
        <div className="card-header">
          <h5 className="mb-0 fw-bold">Beneficiary Details</h5>
        </div>

        {/* Card body */}
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-bordered table-striped table-hover">
              <thead className="table-primary">
                <tr>
                  <th>Total No. of Beneficiaries</th>
                  <th>Total Beneficiary Amount (₹)</th>
                  {/*<th>Scheme Code</th>*/}
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.length > 0 && (
                  <tr>
                    <td>{searchResults.length}</td>
                    <td>₹{totalBeneficiaryAmount()}</td>
                    {/*<td>{apiRes?.schemeData.schemeCode || ''}</td>*/}
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={handleGetCheckBalance}
                      >
                        Check Balance
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div />
        </div>
      </div>
      {show && (
        <AllocateBeneficiaries
          checkBalance={checkBalance}
          apiRes={apiRes}
          searchResults={searchResults}
          setSearchResults={setSearchResults}
          setBackupSearchData={setBackupSearchData}
          backupSearchData={backupSearchData}
          searchData={searchData}
          onReset={onReset}
        />
      )}
    </>
  );
};

export default BeneficiaryDetails;
