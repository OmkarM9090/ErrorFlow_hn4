import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import AuthPage from './components/AuthPage.jsx';
import AccessibilityDashboard from './components/AccessibilityDashboard.jsx';
import AuditUrlPrompt from './components/AuditUrlPrompt.jsx';

import './App.css';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

const DEFAULT_AUDIT_URL = 'https://www.geeksforgeeks.org/dsa/dsa-tutorial-learn-data-structures-and-algorithms/';

function App() {
  const [view, setView] = useState('landing');
  const [auditData, setAuditData] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);

  const fetchAuditAndOpenDashboard = async (targetUrl = DEFAULT_AUDIT_URL) => {
    setAuditLoading(true);
    setAuditError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: targetUrl,
          maxDepth: 1,
          maxPages: 1,
          screenshots: false,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || `Audit request failed: ${response.status}`);
      }

      setAuditData(data);
      setView('dashboard');
    } catch (error) {
      setAuditError(error.message || 'Unable to load audit dashboard data');
      setView('landing');
    } finally {
      setAuditLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {auditLoading ? (
        <div className="min-h-screen grid place-items-center px-6">
          <div className="rounded-3xl border border-slate-200 bg-white px-8 py-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <p className="text-sm font-semibold text-indigo-600">Running accessibility audit...</p>
            <p className="mt-2 text-slate-600">Please wait while we fetch live dashboard data.</p>
          </div>
        </div>
      ) : null}

      {!auditLoading && view === 'landing' ? (
        <>
          {auditError ? (
            <div className="fixed left-1/2 top-5 z-[70] w-[min(92vw,640px)] -translate-x-1/2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-lg">
              {auditError}
            </div>
          ) : null}
          <LandingPage
            onOpenAuth={() => setView('auth')}
            onRunAudit={() => setUrlModalOpen(true)}
          />
        </>
      ) : null}

      {!auditLoading && view === 'auth' ? (
        <AuthPage
          onBackToLanding={() => setView('landing')}
          onAuthSuccess={(payload) => {
            setSessionUser(payload || null);
            setView('url-input');
          }}
        />
      ) : null}

      {!auditLoading && view === 'url-input' ? (
        <main className="min-h-screen grid place-items-center bg-[#fafafa] px-4 py-8">
          <AuditUrlPrompt
            initialUrl={DEFAULT_AUDIT_URL}
            title="Choose Target Website"
            subtitle={`Enter the website URL to audit${sessionUser?.email ? `, ${sessionUser.email}` : ''}.`}
            submitLabel="Audit Website"
            onSubmit={(targetUrl) => fetchAuditAndOpenDashboard(targetUrl)}
            onCancel={() => setView('landing')}
          />
        </main>
      ) : null}

      {!auditLoading && view === 'dashboard' ? (
        <>
          <div className="fixed right-4 top-4 z-[80]">
            <button
              type="button"
              onClick={() => setView('landing')}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-slate-300"
            >
              Back to Home
            </button>
          </div>
          <AccessibilityDashboard auditData={auditData || {}} />
        </>
      ) : null}

      {urlModalOpen && !auditLoading ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/35 px-4 backdrop-blur-sm">
          <AuditUrlPrompt
            compact
            initialUrl={DEFAULT_AUDIT_URL}
            title="Run Accessibility Audit"
            subtitle="Provide a target URL and start a live crawl before opening the dashboard."
            submitLabel="Run Audit"
            onSubmit={(targetUrl) => {
              setUrlModalOpen(false);
              fetchAuditAndOpenDashboard(targetUrl);
            }}
            onCancel={() => setUrlModalOpen(false)}
          />
        </div>
      ) : null}
    </div>
  );
}

export default App;