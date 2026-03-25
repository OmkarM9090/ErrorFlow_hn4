import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import AuthPage from './components/AuthPage.jsx';

import './App.css';

function App() {
  const [view, setView] = useState('landing');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {view === 'landing' ? (
        <LandingPage onOpenAuth={() => setView('auth')} />
      ) : (
        <AuthPage onBackToLanding={() => setView('landing')} />
      )}
    </div>
  );
}

export default App;