// src/components/AccessibilityDashboard.jsx
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, AreaChart, Area, CartesianGrid
} from 'recharts';
import { Download, Sparkles, AlertTriangle, Timer, Boxes, Accessibility, Brain, Activity, ShieldCheck, ChevronUp, ChevronDown } from 'lucide-react';
import InsightsPanel from './InsightsPanel';
import VisualPreview from './VisualPreview';

import { buildDashboardModel, ringColorByScore } from '../utils/dashboardLogic.js';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'impact', label: 'User Impact' },
  { key: 'preview', label: 'Visual Preview' },
  { key: 'dom', label: 'DOM Visuals' },
  { key: 'performance', label: 'Performance' },
  { key: 'ai', label: 'AI Fixes' },
  { key: 'optimized', label: 'Optimized Code' },
];

const TabPanel = ({ tabKey, activeTab, children }) => (
  <AnimatePresence mode="wait">
    {activeTab === tabKey ? (
      <motion.div
        key={tabKey}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    ) : null}
  </AnimatePresence>
);

const MetricCard = ({ icon: Icon, label, value, suffix = '', delay = 0 }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -5 }}
    className="group rounded-[2rem] border border-slate-100 bg-white p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all"
  >
    <div className="mb-4 inline-flex rounded-2xl bg-slate-50 p-2.5 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
      <Icon size={20} strokeWidth={2.5} />
    </div>
    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</p>
    <p className="mt-2 font-serif text-4xl text-slate-900 font-bold">
      {value}<span className="ml-1 text-xl text-slate-400 font-normal">{suffix}</span>
    </p>
  </motion.div>
);

export default function AccessibilityDashboard({ auditData }) {
  const [simulateErrors, setSimulateErrors] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedUrl, setOptimizedUrl] = useState(null);
  const [isPushing, setIsPushing] = useState(false);
  const [prUrl, setPrUrl] = useState(null);
  const [showPrModal, setShowPrModal] = useState(false);
  const [repoInput, setRepoInput] = useState('');
  const [optimizedCode, setOptimizedCode] = useState(null);

  const model = useMemo(
    () => buildDashboardModel(auditData || {}, simulateErrors),
    [auditData, simulateErrors]
  );

  const scoreColor = ringColorByScore(model.score);
  const circumference = 2 * Math.PI * 66;
  const strokeDashoffset = circumference * (1 - model.score / 100);

  const handleGenerateInsights = async () => {
    setAiLoading(true);
    setAiError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/audit/insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditData }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Request failed (${response.status})`);
      }
      const data = await response.json();
      setAiInsights(data);
    } catch (err) {
      setAiError(err.message || 'Failed to generate AI insights.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/audit/export/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report: model }),
      });
      
      if (!response.ok) throw new Error("Failed to generate PDF report");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `accessibility_report_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(err);
      alert('Failed to export PDF report. Please try again.');
    }
  };

  const handleOptimizePreview = async () => {
    setIsOptimizing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/audit/optimize-output`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Optimization failed');
      }
      const data = await response.json();
      
      const previewUrl = `${API_BASE_URL}/api/audit/optimized-preview-page`;
      setOptimizedUrl(previewUrl);
      setOptimizedCode(data.data?.code || null);
      setActiveTab('optimized');
    } catch (error) {
      console.error(error);
      alert("Failed to optimize website. Please try again.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleOpenPrModal = () => {
    const defaultOwner = window.localStorage.getItem('connectedGithubId') || 'OmkarM9090';
    setRepoInput(`${defaultOwner}/ErrorFlow_hn4`);
    setShowPrModal(true);
  };

  const handleGithubPush = async (e) => {
    e.preventDefault();
    const repoFullName = repoInput.trim();
    
    if (!repoFullName) return;

    setIsPushing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/github/push-pr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoFullName })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to push to GitHub');
      }

      const data = await response.json();
      setPrUrl(data.prUrl);
      alert('Pull Request created successfully!');
      setShowPrModal(false);
    } catch (error) {
      console.error(error);
      alert(error.message || 'Failed to send PR. Check console for details.');
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <section className="relative min-h-screen overflow-x-hidden bg-[#fafafa] px-4 py-10 md:px-12 font-sans">
      {/* Dynamic Grid Background matched to image_d1a3c7 */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.4]" style={{ backgroundImage: 'linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)', backgroundSize: '36px 36px' }} />

      <div className="relative mx-auto max-w-7xl space-y-10">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2.5rem] border border-white/60 bg-white/70 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] backdrop-blur-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
        >
          <div className="space-y-1">
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/80 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-indigo-600">
              <Sparkles size={14} fill="currentColor" />
              Accessibility Intelligence
            </p>
            <h1 className="font-serif text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">
              Report for <span className="text-slate-500 font-normal truncate max-w-md inline-block align-bottom">{model.url}</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setSimulateErrors(!simulateErrors)}
              className={`inline-flex items-center gap-2.5 rounded-2xl border-2 px-6 py-3 text-sm font-bold transition-all ${simulateErrors
                ? 'border-rose-500 bg-rose-500 text-white shadow-lg'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <AlertTriangle size={18} />
              Simulate Errors
            </button>

            <button
              onClick={handleExportPdf}
              className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 px-7 py-3 text-sm font-bold text-white shadow-xl hover:shadow-indigo-500/40 active:scale-95 transition-all"
            >
              <Download size={18} />
              Export PDF Report
            </button>
          </div>
        </motion.header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-[2.5rem] border border-slate-100 bg-white p-7 shadow-lg flex flex-col items-center overflow-hidden"
          >
            <div className="pointer-events-none absolute inset-0 m-auto h-40 w-40 rounded-full bg-indigo-500/10 blur-[80px]" />
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 self-start">Overall Score</p>
            <div className="mt-4 relative flex items-center justify-center">
              <svg width="170" height="170" className="-rotate-90">
                <circle cx="85" cy="85" r="66" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                <motion.circle 
                  cx="85" cy="85" r="66" stroke={scoreColor} strokeWidth="12" fill="none" strokeLinecap="round" 
                  strokeDasharray={circumference} 
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute text-center">
                <p className="font-serif text-5xl font-bold text-slate-900">{model.score}</p>
                <p className="text-[10px] font-bold text-slate-400">OUT OF 100</p>
              </div>
            </div>
          </motion.div>

          <MetricCard icon={AlertTriangle} label="Total Flaws" value={model.totalErrors} delay={0.1} />
          <MetricCard icon={Timer} label="DOM Load Time" value={model.domContentLoaded} suffix="ms" delay={0.2} />
          <MetricCard icon={Boxes} label="Elements Scanned" value={model.totalElementsScanned} delay={0.3} />
        </div>

        <nav className="rounded-3xl border border-white/60 bg-white/50 p-2 shadow-sm backdrop-blur-md inline-flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-8 py-3.5 text-sm font-bold transition-all rounded-2xl ${activeTab === tab.key
                ? 'text-indigo-600 bg-white shadow-md'
                : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <motion.div layoutId="activeTab" className="absolute inset-0 border-2 border-indigo-100 rounded-2xl pointer-events-none" />
              )}
            </button>
          ))}
        </nav>

        <TabPanel tabKey="overview" activeTab={activeTab}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-[2.5rem] border bg-white p-8 shadow-lg">
              <h3 className="mb-8 font-serif text-2xl font-bold text-slate-900 flex items-center gap-3">
                <ShieldCheck className="text-indigo-500" /> Violation Severity
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={model.severityData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="value" radius={[0, 12, 12, 0]} barSize={32}>
                      {model.severityData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-[2.5rem] border bg-white p-8 shadow-lg">
              <h3 className="mb-8 font-serif text-2xl font-bold text-slate-900">WCAG P.O.U.R Profile</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={model.pourData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                    <Radar dataKey="score" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.15} strokeWidth={3} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabPanel>

        <TabPanel tabKey="impact" activeTab={activeTab}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-lg">
              <h3 className="mb-8 font-serif text-2xl font-bold text-slate-900 flex items-center gap-3">
                <Accessibility size={24} className="text-indigo-600" />
                Inclusive Experience Matrix
              </h3>
              <div className="space-y-10">
                {model.impactMatrix.map((row) => (
                  <div key={row.label}>
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-700 tracking-wide uppercase">{row.label}</span>
                      <span className="text-sm font-black text-slate-900">{row.value}%</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-50 border border-slate-100">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${row.value}%` }}
                        transition={{ duration: 1.2, ease: "circOut" }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: row.color }}
                      />
                    </div>
                    {/* DETAILS: Dynamic Reasons List matched to image_d21061 */}
                    {row.reasons && row.reasons.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1">
                        {row.reasons.map((reason, idx) => (
                          <div 
                            key={idx} 
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm"
                          >
                            <span className="font-black" style={{ color: row.color }}>-{reason.count}</span>
                            <span>{reason.message}</span>
                            <span className="rounded bg-slate-200/50 px-1.5 py-0.5 text-[9px] font-black text-slate-400 uppercase">
                              WCAG {reason.wcag}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2.5rem] border border-slate-800 bg-slate-900 p-8 shadow-2xl relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 blur-[100px]" />
              <h3 className="mb-8 font-serif text-2xl font-bold text-white flex items-center gap-3">
                <Brain size={24} className="text-violet-400" />
                Empathy Translator
              </h3>
              <div className="space-y-4">
                {model.empathyMessages.map((msg, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-2xl border border-slate-700/50 bg-white/5 p-5 text-sm text-slate-300 font-medium leading-relaxed"
                  >
                    {msg}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </TabPanel>

        <TabPanel tabKey="preview" activeTab={activeTab}>
          <VisualPreview auditData={auditData} />
        </TabPanel>

        <TabPanel tabKey="dom" activeTab={activeTab}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-[2.5rem] border bg-white p-8 shadow-lg h-[400px]">
              <h3 className="mb-4 font-serif text-2xl font-bold text-slate-900">Element Distribution</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={model.elementDistribution} dataKey="value" nameKey="name" innerRadius={80} outerRadius={120} paddingAngle={5}>
                    {model.elementDistribution.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-[2.5rem] border bg-white p-8 shadow-lg h-[400px]">
              <h3 className="mb-4 font-serif text-2xl font-bold text-slate-900">Heading Hierarchy</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={model.headingHierarchy}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="level" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabPanel>

        <TabPanel tabKey="performance" activeTab={activeTab}>
          <div className="rounded-[2.5rem] border bg-white p-8 shadow-lg h-[450px]">
            <h3 className="mb-6 font-serif text-2xl font-bold text-slate-900 flex items-center gap-3">
              <Activity className="text-indigo-600" /> Performance Timeline
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={model.perfTimeline}>
                <defs>
                  <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="stage" axisLine={false} tickLine={false} />
                <YAxis unit="ms" axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={4} fill="url(#perfGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </TabPanel>

        <TabPanel tabKey="ai" activeTab={activeTab}>
          <InsightsPanel
            insights={aiInsights}
            loading={aiLoading}
            error={aiError}
            onGenerate={handleGenerateInsights}
            hasAuditData={!!auditData}
          />
        </TabPanel>

        <TabPanel tabKey="optimized" activeTab={activeTab}>
          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="mb-6 flex flex-col items-start gap-4 border-b border-slate-100 pb-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="inline-flex items-center gap-2 font-serif text-2xl text-slate-900">
                  <Code2 size={24} className="text-emerald-500" /> Optimized Outputs
                </h3>
                <p className="mt-1 text-sm text-slate-500">AI-generated raw code modifications ready for integration.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleOptimizePreview}
                  disabled={isOptimizing}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition disabled:cursor-not-allowed disabled:opacity-75"
                >
                  <Eye size={18} />
                  {isOptimizing ? 'Optimizing...' : 'Optimize & Preview'}
                </button>

                {optimizedUrl && (
                  <>
                    <a
                      href={optimizedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700"
                    >
                      <Eye size={18} />
                      Preview Full Site
                    </a>
                    
                    {!prUrl && (
                      <button
                        type="button"
                        onClick={handleOpenPrModal}
                        disabled={isPushing}
                        className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition disabled:cursor-not-allowed disabled:opacity-75"
                      >
                        <Code2 size={18} />
                        {isPushing ? 'Pushing...' : 'Send PR'}
                      </button>
                    )}

                    {prUrl && (
                      <a
                        href={prUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        <Code2 size={18} />
                        View Pull Request
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>

            {optimizedCode ? (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {['html', 'css', 'js'].map((ext) => (
                  <div key={ext} className="flex h-[500px] flex-col">
                    <div className="flex items-center justify-between rounded-t-2xl border border-b-0 border-slate-800 bg-slate-900 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-300">
                      <span>{ext.toUpperCase()}</span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(optimizedCode[ext] || '')}
                        className="cursor-pointer transition hover:text-white"
                        title={`Copy ${ext.toUpperCase()}`}
                      >
                        Copy
                      </button>
                    </div>
                    <div className="custom-scrollbar flex-1 overflow-auto rounded-b-2xl border border-slate-800 bg-[#0f172a] p-4">
                      <pre className="break-words whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-slate-300">
                        {optimizedCode[ext] || `/* No ${ext.toUpperCase()} output generated */`}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50/50 py-20 text-center">
                <div className="mb-4 rounded-full bg-white p-4 shadow-sm">
                  <Code2 size={32} className="text-slate-400" />
                </div>
                <h3 className="font-serif text-xl text-slate-700">No Code Optimized Yet</h3>
                <p className="mt-2 max-w-sm text-sm text-slate-500">Click the "Optimize & Preview" button above to process your assets and view the generated code.</p>
              </div>
            )}
          </div>
        </TabPanel>
      </div>

      {/* Send PR Modal */}
      {showPrModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 transition-opacity"
            onClick={() => !isPushing && setShowPrModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="w-full max-w-md mx-auto rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8 shadow-[0_16px_50px_rgba(15,23,42,0.08)] pointer-events-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-2xl text-slate-900">Send Pull Request</h3>
                <button
                  type="button"
                  onClick={() => setShowPrModal(false)}
                  disabled={isPushing}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>

              <form className="space-y-5" onSubmit={handleGithubPush}>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="repo-input">
                    Target Repository
                  </label>
                  <p className="text-xs text-slate-500 mb-2">Format exactly as: <strong>owner/repo</strong></p>
                  <input
                    id="repo-input"
                    type="text"
                    required
                    value={repoInput}
                    onChange={(e) => setRepoInput(e.target.value)}
                    placeholder="e.g. OmkarM9090/ErrorFlow_hn4"
                    disabled={isPushing}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 px-4 text-slate-900 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isPushing || !repoInput.trim()}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <Code2 size={16} />
                    {isPushing ? 'Sending PR...' : 'Send PR'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPrModal(false)}
                    disabled={isPushing}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

    </section>
  );
}