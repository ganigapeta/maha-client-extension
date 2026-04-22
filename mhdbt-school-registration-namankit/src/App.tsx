import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";

import SchoolMasterForm from "./schools/SchoolMasterForm";

// import { HashRouter as Router, Routes, Route } from 'react-router-dom';

const App = () => {
  return (
    <HashRouter>
      <Routes>
        {/* <Route path="/" element={<CourseFeeForm />} /> */}
        <Route path="/"   element={<SchoolMasterForm onBack={() => window.history.back()} />} 
/>

      </Routes>
    </HashRouter>
  );
};



export default App;