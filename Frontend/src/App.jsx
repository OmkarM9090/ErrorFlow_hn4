import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import AuthPage from './components/AuthPage.jsx';
import AccessibilityDashboard from './components/AccessibilityDashboard.jsx';
import AuditUrlPrompt from './components/AuditUrlPrompt.jsx';
import AccessibilityControls from './components/AccessibilityControls';
import { Loader2 } from 'lucide-react'; // Added for a premium loading spinner
import AuditLoader from './components/common/AuditLoader.jsx';

import './App.css';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
// const DEFAULT_AUDIT_URL = 'https://portfolio-50590.web.app/'; 

function App() {
  const [view, setView] = useState('landing');
  const [auditData, setAuditData] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);

  // Main API Call Function
  const fetchAuditAndOpenDashboard = async (targetUrl = DEFAULT_AUDIT_URL, standard = 'WCAG2AA') => {
    setAuditLoading(true);
    setAuditError('');
    setUrlModalOpen(false); // Modal turant close karein loading start hote hi

    try {
      const response = await fetch(`${API_BASE_URL}/api/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Pura payload hata kar sirf URL bhejein taaki backend default values use kare
        body: JSON.stringify({
          url: targetUrl,
          standard
        }),
      });

      // Handle non-200 responses safely
      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch (e) {
          // If response is not JSON
          console.log(errorData)
        }
        throw new Error(errorData.error || errorData.message || `Audit failed with status: ${response.status}`);
      }

      const data = await response.json();
      
      setAuditData(data);
      console.log("Audit Data:", data);
      setView('dashboard'); // Success par dashboard view set karein

    } catch (error) {
      console.error("Audit Error:", error);
      setAuditError(error.message || 'Unable to load audit dashboard data. Please try again.');
      setView('landing'); // Error aane par wapas landing page par bhej dein
    } finally {
      setAuditLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      
      {/* Accessibility Tools (Global) */}
      <AccessibilityControls />

      {/* 1. LOADING OVERLAY (Full Screen) */}
      {auditLoading ? (
        <AuditLoader />
      ) : null}

      {/* 2. LANDING PAGE VIEW */}
      {!auditLoading && view === 'landing' ? (
        <>
          {auditError ? (
            <div className="fixed left-1/2 top-5 z-[70] w-[min(92vw,640px)] -translate-x-1/2 flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-lg">
              <span>{auditError}</span>
              <button onClick={() => setAuditError('')} className="underline font-bold hover:text-rose-900">Dismiss</button>
            </div>
          ) : null}
          <LandingPage
            onOpenAuth={() => setView('auth')}
            onRunAudit={() => setUrlModalOpen(true)}
          />
        </>
      ) : null}

      {/* 3. AUTH PAGE VIEW */}
      {!auditLoading && view === 'auth' ? (
        <AuthPage
          onBackToLanding={() => setView('landing')}
          onAuthSuccess={(payload) => {
            setSessionUser(payload || null);
            setView('url-input');
          }}
        />
      ) : null}

      {/* 4. URL INPUT VIEW (After Login) */}
      {!auditLoading && view === 'url-input' ? (
        <main className="min-h-screen flex items-center justify-center bg-[#fafafa]">
          {/* REMOVED the max-w-3xl wrapper so the Bento layout can stretch properly */}
          <div className="w-full">
            <AuditUrlPrompt
              title="Choose Target Website"
              subtitle={`Enter the website URL to audit${sessionUser?.email ? `, ${sessionUser.email}` : ''}.`}
              submitLabel="Start AI Audit"
              onSubmit={(targetUrl, standard) => fetchAuditAndOpenDashboard(targetUrl, standard)}
              onCancel={() => setView('landing')}
            />
          </div>
        </main>
      ) : null}

      {/* 5. DASHBOARD VIEW */}
      {!auditLoading && view === 'dashboard' ? (
        <div className="relative">
          <div className="absolute right-4 top-8 z-[80] md:right-8">
            <button
              type="button"
              onClick={() => {
                setAuditData(null);
                if (sessionUser) {
                  setView('url-input');
                } else {
                  setView('landing');
                  setUrlModalOpen(true);
                }
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-indigo-200 hover:text-indigo-600 transition"
            >
              &larr; Analyze New URL
            </button>
          </div>
          {/* Main Dashboard Component passing the fetched data */}
          <AccessibilityDashboard auditData={auditData || {}} />
        </div>
      ) : null}

      {/* 6. URL INPUT MODAL (Triggered from Landing Page) */}
      {urlModalOpen && !auditLoading ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl animate-in fade-in zoom-in duration-200">
            <AuditUrlPrompt
              compact
              initialUrl={DEFAULT_AUDIT_URL}
              title="Run Accessibility Audit"
              subtitle="Provide a target URL and start a live crawl before opening the dashboard."
              submitLabel="Run Audit"
              onSubmit={(targetUrl, standard) => {
                fetchAuditAndOpenDashboard(targetUrl, standard);
              }}
              onCancel={() => setUrlModalOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;