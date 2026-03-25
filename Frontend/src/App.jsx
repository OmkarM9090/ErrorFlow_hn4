// import Homepage from './components/homepage.jsx'

// function App() {
//   return <Homepage />
// }

// export default App

import React from 'react';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      <LandingPage />
    </div>
  );
}

export default App;