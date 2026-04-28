import React, { useState, useEffect } from 'react';
import './App.css';
import BeneficiaryList from './components/BeneficiaryList';
import Dashboard from "./components/old_writer/Dashboard";
import BeneficiaryRegistereTable from './components/old_writer/BeneficiaryRegistereTable';
import { HashRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { getUserRolesById } from './api/fetch-role';

function App() {
  const [userType, setUserType] = useState({});
  const [loginUserId, setLoginUserId] = useState(null);
  const [loading, setLoading] = useState(true); //  important

  useEffect(() => {
    const fetchUserRoles = async () => {
      try {
        const userId = window.Liferay?.ThemeDisplay?.getUserId();
        if (!userId) return;

        setLoginUserId(userId);

        const userData = await getUserRolesById(userId);

        const isOldWriter = userData?.roleBriefs?.some(
          r => r.name === "Old Writer SNO"
        );

        setUserType({ isOldWriter: !!isOldWriter });

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false); //  stop loading
      }
    };

    fetchUserRoles();
  }, []);

  //  WAIT until API completes
  if (loading) {
    return <div>Loading...</div>;
  }

  return userType?.isOldWriter ? (
     <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/beneficiary-list" element={<BeneficiaryRegistereTable />} />
        
      </Routes>
    </Router>
  
  ) : (
    <BeneficiaryList />
  );
}

export default App;