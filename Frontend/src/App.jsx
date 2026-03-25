import React from 'react';
// Import your pages/components at the top
import LandingPage from './pages/LandingPage';
import AuthPage from './components/AuthPage.jsx';
// import Homepage from './components/homepage.jsx'; 

import './App.css';

function App() {
  // To switch views, simply change which component is returned below
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      
      {/* Current Active Page */}
      <LandingPage />

      {/* Toggle these as needed during development:
          <AuthPage /> 
          <Homepage /> 
      */}
      
    </div>
  );
}

export default App;