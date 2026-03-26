// src/components/landing/AuditUrlPrompt.jsx
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Search, ArrowLeft, ShieldCheck, Zap, CheckCircle2, ChevronDown, AlertCircle, Sparkles } from 'lucide-react';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const isValidHttpUrl = (value) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const isValidGithubId = (value) => {
  const trimmed = value.trim();
  return trimmed.length > 0 && /^[a-zA-Z0-9-]+$/.test(trimmed);
};

export default function AuditUrlPrompt({
  initialUrl,
  title = "Choose Target Website",
  subtitle,
  submitLabel = 'Start AI Audit',
  onSubmit,
  onCancel,
  onGithubConnect,
  compact = false,
}) {
  // ==========================================
  // BACKEND LOGIC (UNCHANGED)
  // ==========================================
  const [url, setUrl] = useState(initialUrl || '');
  const [standard, setStandard] = useState('WCAG2AA');
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const [showGithubModal, setShowGithubModal] = useState(false);
  const [githubId, setGithubId] = useState('');
  const [githubError, setGithubError] = useState('');
  const [connectedGithubId, setConnectedGithubId] = useState('');
  const [isConnectingGithub, setIsConnectingGithub] = useState(false);

  const normalizedUrl = useMemo(() => url.trim(), [url]);

  const handleGithubConnect = () => {
    setShowGithubModal(true);
  };

  const handleGithubCancel = () => {
    setShowGithubModal(false);
    setGithubId('');
    setGithubError('');
  };

  const handleGithubSubmit = async (event) => {
    event.preventDefault();
    let trimmedId = githubId.trim();
    
    // Extract username from URL if provided
    if (trimmedId.includes('github.com/')) {
      trimmedId = trimmedId.split('github.com/')[1].split('/')[0];
    }
    
    if (!isValidGithubId(trimmedId)) {
      setGithubError('Enter a valid GitHub username or URL.');
      return;
    }
    setGithubError('');
    setIsConnectingGithub(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/github/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ githubId: trimmedId, url: normalizedUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to save GitHub account.');
      }

      setConnectedGithubId(trimmedId);
      window.localStorage.setItem('connectedGithubId', trimmedId);
      
      if (typeof onGithubConnect === 'function') {
        onGithubConnect(trimmedId);
      }
      setShowGithubModal(false);
      setGithubId('');
    } catch (err) {
      console.error(err);
      setGithubError('Could not save GitHub account. Please try again.');
    } finally {
      setIsConnectingGithub(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!normalizedUrl) {
      setError('Please enter a target URL.');
      return;
    }

    if (!isValidHttpUrl(normalizedUrl)) {
      setError('Enter a valid URL starting with http:// or https://');
      return;
    }

    setError('');
    if (typeof onSubmit === 'function') {
      onSubmit(normalizedUrl, standard);
    }
  };

  // ==========================================
  // PROFESSIONAL UI (LEFT & RIGHT PANEL ONLY)
  // ==========================================
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full ${compact ? 'max-w-4xl' : 'max-w-5xl'} mx-auto rounded-[2.5rem] border border-slate-200 bg-white shadow-[0_30px_70px_rgba(15,23,42,0.12)] overflow-hidden flex flex-col md:flex-row`}
    >
      
      {/* LEFT PANEL: Input Form Section */}
      <div className="flex-1 p-8 md:p-12">
        <div className="mb-8">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/80 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-widest text-indigo-600 shadow-sm">
                <Search size={14} strokeWidth={3} />
                Target Scanner
            </p>

            <h2 className="font-serif text-4xl font-bold text-slate-900 tracking-tight leading-tight">
                {title}
            </h2>
            <p className="mt-2.5 text-slate-500 font-medium text-sm">
                {subtitle || `Enter the website URL to audit for WCAG 2.1 compliance.`}
            </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* URL Field */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-700 uppercase tracking-wide" htmlFor="audit-url-input">
              Website URL
            </label>
            <div className={`relative transition-all duration-300 rounded-2xl border-2 ${isFocused ? 'border-indigo-600 ring-4 ring-indigo-600/10 bg-white' : 'border-slate-100 bg-slate-50'}`}>
              <Globe size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isFocused ? 'text-indigo-600' : 'text-slate-400'}`} />
              <input
                id="audit-url-input"
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="https://example.com"
                className="w-full bg-transparent py-4 pl-12 pr-4 text-slate-900 font-bold placeholder:text-slate-400 placeholder:font-normal outline-none"
              />
            </div>
          </div>

          {/* Standard Selection */}
          <div className="space-y-2">
             <label className="text-[13px] font-bold text-slate-700 uppercase tracking-wide">Compliance Standard</label>
             <div className="relative">
                <select 
                    value={standard} 
                    onChange={(e) => setStandard(e.target.value)}
                    className="w-full appearance-none rounded-2xl border-2 border-slate-100 bg-slate-50 py-4 px-5 text-[15px] font-bold text-slate-700 outline-none transition-all focus:border-indigo-600 focus:bg-white cursor-pointer"
                >
                    <option value="WCAG2AA">WCAG 2.1 AA (Default)</option>
                    <option value="WCAG2AAA">WCAG 2.1 AAA (Strict)</option>
                    <option value="SECTION508">Section 508 (US Gov)</option>
                    <option value="EN301549">EN 301 549 (EU Standard)</option>
                </select>
                <ChevronDown size={18} className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-500" />
             </div>
          </div>

          <AnimatePresence>
            {error && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600"
                >
                    <AlertCircle size={16} />
                    {error}
                </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-slate-50">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-10 py-4 text-sm font-black text-white shadow-xl shadow-indigo-500/30 transition-all hover:bg-indigo-700 hover:scale-[1.02] active:scale-95"
            >
              <Zap size={18} fill="currentColor" />
              {submitLabel}
            </button>

            {typeof onCancel === 'function' ? (
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300"
              >
                <ArrowLeft size={18} />
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </div>

      {/* RIGHT PANEL: Engine Details Section */}
      <div className="w-full md:w-5/12 bg-slate-50/50 border-l border-slate-100 p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-[60px]" />
        
        <div className="relative z-10">
            <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6 shadow-sm">
                <ShieldCheck size={32} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-4">Analysis Engine Active</h3>
            <p className="text-slate-500 text-[14px] leading-relaxed mb-8 font-medium">
                Once initiated, our engine will traverse your DOM, matching elements against 50+ WCAG 2.1 strict criteria.
            </p>

            <ul className="space-y-4">
                {[
                    'Semantic DOM & HTML Structure',
                    'Color Contrast (WCAG AA/AAA)',
                    'ARIA Roles & Screen Reader Flow',
                    'Keyboard Navigation Traps',
                    'Missing Alt-Text & Metadata'
                ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                        <CheckCircle2 size={18} className="text-emerald-500" />
                        {item}
                    </li>
                ))}
            </ul>
        </div>

        <div className="mt-12 relative z-10">
            <div className="rounded-[1.5rem] bg-indigo-600 p-6 text-white shadow-2xl shadow-indigo-600/30">
                <div className="flex items-center gap-2 mb-3">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">AI Remediation</p>
                    <Sparkles size={12} className="text-amber-300" />
                </div>
                <p className="text-sm font-bold leading-relaxed">
                    Audits are just step one. Our platform will automatically generate optimized code snippets to fix any flaws detected.
                </p>
            </div>
        </div>
      </div>

    </motion.div>
  );
}