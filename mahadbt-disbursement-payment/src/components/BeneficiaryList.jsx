import React,{useEffect, useState} from 'react';
import BeneficiaryFilter from './BeneficiaryFilter';
import PensionDashboard from './PensionDashboard';

import {getUserRolesById } from '../api/fetch-role';


const BeneficiaryList = () => {
  const[apiRes,setApiRes]=useState({
    schemeData:[],
    ddoRecord:[]
  });
 const [loginUserId, setLoginUserId] = useState(null);
const [roles, setRoles] = useState(null);
const [searchResults, setSearchResults] = useState([]);
const [searchData,setSearchData]=useState([])
const [checkBalance,setCheckBalance]=useState({})

const SNO_ROLES = ["pension sno", "assistance sno", "stipend sno", "pre matric sno"];
const COOP_ROLES = ["coop ddo"];

const isSnoRole = window.Liferay?.ThemeDisplay?.getUserRoles?.()
  ?.some(role => SNO_ROLES.includes(role?.toLowerCase())) || false;

const isCoopRole = window.Liferay?.ThemeDisplay?.getUserRoles?.()
  ?.some(role => COOP_ROLES.includes(role?.toLowerCase())) || false;

const hasSNORole = Array.isArray(roles)
  ? roles.some((role) =>
      SNO_ROLES.some(sno =>
        String(role?.name || "")
          .trim()
          .toLowerCase()
          .includes(sno)
      )
    )
  : false;

const hasCoopRole = Array.isArray(roles)
  ? roles.some((role) =>
      COOP_ROLES.some(coop =>
        String(role?.name || "")
          .trim()
          .toLowerCase()
          .includes(coop)
      )
    )
  : false;

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

console.log("apiRes::::", apiRes)

  return (
    
   <>
    <div className="container mt-5">
      {hasSNORole ? (
        <PensionDashboard
          roles={roles}
          setSearchResults={setSearchResults}
          setSearchData={setSearchData}
          setApiRes={setApiRes}
          loginUserId={loginUserId}
          searchData={searchData}
          searchResults={searchResults}
          apiRes={apiRes}
          setCheckBalance={setCheckBalance}
          checkBalance={checkBalance}
        />
      ) : (
        <BeneficiaryFilter
          roles={roles}
          setSearchResults={setSearchResults}
          setSearchData={setSearchData}
          setApiRes={setApiRes}
          loginUserId={loginUserId}
          searchData={searchData}
          searchResults={searchResults}
          apiRes={apiRes}
          setCheckBalance={setCheckBalance}
          checkBalance={checkBalance}
          hasCoopRole={hasCoopRole}
        />
      )}
      {/* <BeneficiaryTable searchResults={searchResults} installment={searchData.installment}/>
      <BeneficiaryDetails searchResults={searchResults}   apiRes={apiRes} searchData={searchData} setCheckBalance={setCheckBalance} setApiRes={setApiRes} /> */}
      {/* <AllocateBeneficiaries checkBalance={checkBalance.data} apiRes={apiRes}  searchResults={searchResults}/> */}
      {/* <BillManagementTable/> */}
      {/* <BillSubmission/> */}
    </div>
   </>
  );
};

export default BeneficiaryList;
