import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import SchemeSearch from './SchemeSearch';
import { fetchOfficeDetails, getUserRolesById } from '../services/fetch-masters';
import { getLiferayUserId } from '../config';


function Dashboard() {
  const [userType, setUserType] = useState({});
  const [loginUserId, setLoginUserId] = useState(null);
  const [userOfficeData, setUserOfficeData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get user roles from Liferay
  useEffect(() => {
    const fetchUserRoles = async () => {
      try {
        // Get user ID from Liferay
         // Get user ID from Liferay
        // const userId = 3068014//3068014 -AFSO; //window.Liferay?.ThemeDisplay?.getUserId();
        //const userId = 3068039//3068039 -DFSO; //window.Liferay?.ThemeDisplay?.getUserId();

        const userId = getLiferayUserId();

        if (!userId) {
          console.warn('No user ID found from Liferay');
          setLoading(false);
          return;
        }

        setLoginUserId(userId);
        
        // Fetch user data from Liferay API
        const userData = await getUserRolesById(userId);

        if (!userData) {
          setLoading(false);
          return;
        }

        // Check user roles
        const isAFSO = userData?.roleBriefs?.some(
          (r) => r.name === 'AFSO'
        );
        const isDFSO = userData?.roleBriefs?.some(
          (r) => r.name === 'DFSO'
        );

        if (isAFSO) {
          setUserType({ isAFSO });
          // Fetch AFSO office details from API
            const officeData = await fetchOfficeDetails('AFSO', userId);
            setUserOfficeData(officeData);
        
        } else if (isDFSO) {
          setUserType({ isDFSO });
          // Fetch DFSO office details from API
          const officeData = await fetchOfficeDetails('DFSO', userId);
          setUserOfficeData(officeData);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching user roles:', err);
        setLoading(false);
      }
    };

    fetchUserRoles();
  }, []);


  console.log('userType:', userType);
  console.log('userOfficeData:', userOfficeData);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {userType.isAFSO ? (
        <Router>
          <Routes>
            <Route 
              path="/" 
              element={
                <SchemeSearch 
                  userRole="AFSO" 
                  userId={loginUserId}
                  officeData={userOfficeData}
                />
              } 
            />
            <Route 
              path="/search" 
              element={
                <SchemeSearch 
                  userRole="AFSO" 
                  userId={loginUserId}
                  officeData={userOfficeData}
                />
              } 
            />
          </Routes>
        </Router>
      ) : userType.isDFSO ? (
        <Router>
          <Routes>
            <Route 
              path="/" 
              element={
                <SchemeSearch 
                  userRole="DFSO" 
                  userId={loginUserId}
                  officeData={userOfficeData}
                />
              } 
            />
            <Route 
              path="/search" 
              element={
                <SchemeSearch 
                  userRole="DFSO" 
                  userId={loginUserId}
                  officeData={userOfficeData}
                />
              } 
            />
          </Routes>
        </Router>
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Unauthorized Access</h1>
            <p className="text-gray-600">You do not have the required permissions to access this application.</p>
            <p className="text-sm text-gray-500 mt-2">Please contact your administrator if you believe this is an error.</p>
          </div>
        </div>
      )}
    </>
  );
}

export default Dashboard;
