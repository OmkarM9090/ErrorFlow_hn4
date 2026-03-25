import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import {
  Download,
  Sparkles,
  AlertTriangle,
  Gauge,
  Timer,
  Boxes,
  Globe,
  Accessibility,
  Brain,
  Code2,
  Activity,
} from 'lucide-react';

const severityColors = {
  critical: '#e11d48',
  serious: '#f97316',
  moderate: '#eab308',
  minor: '#3b82f6',
  pass: '#10b981',
};

const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'impact', label: 'User Impact' },
  { key: 'dom', label: 'DOM Visuals' },
  { key: 'performance', label: 'Performance' },
  { key: 'ai', label: 'AI Fixes' },
];

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const cleanUrl = (url) => {
  if (!url || typeof url !== 'string') return 'Unknown URL';
  return url;
};

const ringColorByScore = (score) => {
  if (score >= 90) return severityColors.pass;
  if (score >= 75) return severityColors.minor;
  if (score >= 60) return severityColors.moderate;
  if (score >= 40) return severityColors.serious;
  return severityColors.critical;
};

const scoreFromAxeSummary = (summary) => {
  const critical = toNumber(summary?.critical);
  const serious = toNumber(summary?.serious);
  const moderate = toNumber(summary?.moderate);
  const minor = toNumber(summary?.minor);

  const penalty = critical * 12 + serious * 8 + moderate * 5 + minor * 2;
  const score = Math.max(0, 100 - penalty);
  return Math.min(100, Math.round(score));
};

const getPrimaryPage = (auditData) => {
  if (Array.isArray(auditData?.pages) && auditData.pages.length > 0) {
    return auditData.pages[0];
  }
  return {};
};

const buildDashboardModel = (auditData, simulateErrors) => {
  const page = getPrimaryPage(auditData);
  const summary = auditData?.summary || {};
  const axeSummary = page?.axeResults?.summary || summary?.accessibility || {};

  const headings = Array.isArray(page?.headings) ? page.headings : [];
  const images = Array.isArray(page?.images) ? page.images : [];
  const buttons = Array.isArray(page?.buttons) ? page.buttons : [];
  const links = Array.isArray(page?.links) ? page.links : [];

  const h1 = headings.filter((h) => toNumber(h?.level) === 1).length;
  const h2 = headings.filter((h) => toNumber(h?.level) === 2).length;
  const h3 = headings.filter((h) => toNumber(h?.level) === 3).length;

  const baseCritical = toNumber(axeSummary?.critical);
  const baseSerious = toNumber(axeSummary?.serious);
  const baseModerate = toNumber(axeSummary?.moderate);
  const baseMinor = toNumber(axeSummary?.minor);

  const critical = simulateErrors ? Math.max(baseCritical, 4) : baseCritical;
  const serious = simulateErrors ? Math.max(baseSerious, 7) : baseSerious;
  const moderate = simulateErrors ? Math.max(baseModerate, 9) : baseModerate;
  const minor = simulateErrors ? Math.max(baseMinor, 12) : baseMinor;

  const computedScore = simulateErrors
    ? 72
    : scoreFromAxeSummary({ critical, serious, moderate, minor });

  const totalErrors = simulateErrors
    ? Math.max(toNumber(summary?.totalErrors), 8)
    : toNumber(summary?.totalErrors);

  const domContentLoaded = toNumber(page?.timings?.domContentLoaded, 0);
  const ttfb = toNumber(page?.timings?.ttfb, 0);
  const load = toNumber(page?.timings?.load, domContentLoaded);

  const totalElementsScanned = headings.length + images.length + buttons.length + links.length;

  const severityData = [
    { name: 'Critical', value: critical, color: severityColors.critical },
    { name: 'Serious', value: serious, color: severityColors.serious },
    { name: 'Moderate', value: moderate, color: severityColors.moderate },
    { name: 'Minor', value: minor, color: severityColors.minor },
  ];

  const pourData = [
    {
      dimension: 'Perceivable',
      score: Math.max(0, 100 - critical * 8 - serious * 3),
    },
    {
      dimension: 'Operable',
      score: Math.max(0, 100 - serious * 5 - moderate * 2),
    },
    {
      dimension: 'Understandable',
      score: Math.max(0, 100 - moderate * 4 - minor * 2),
    },
    {
      dimension: 'Robust',
      score: Math.max(0, 100 - critical * 3 - minor * 2),
    },
  ];

  const impactMatrix = [
    {
      label: 'Visual',
      value: Math.max(0, Math.min(100, 100 - critical * 11 - serious * 4)),
      color: '#e11d48',
    },
    {
      label: 'Motor',
      value: Math.max(0, Math.min(100, 100 - serious * 7 - moderate * 3)),
      color: '#f97316',
    },
    {
      label: 'Cognitive',
      value: Math.max(0, Math.min(100, 100 - moderate * 6 - minor * 2)),
      color: '#eab308',
    },
    {
      label: 'Auditory',
      value: Math.max(0, Math.min(100, 100 - minor * 2)),
      color: '#3b82f6',
    },
  ];

  const elementDistribution = [
    { name: 'Images', value: images.length, color: '#4f46e5' },
    { name: 'Buttons', value: buttons.length, color: '#06b6d4' },
    { name: 'Links', value: links.length, color: '#f59e0b' },
  ];

  const headingHierarchy = [
    { level: 'H1', count: h1 },
    { level: 'H2', count: h2 },
    { level: 'H3', count: h3 },
  ];

  const perfTimeline = [
    { stage: 'TTFB', value: ttfb || 0 },
    { stage: 'DOM Ready', value: domContentLoaded || ttfb || 0 },
    { stage: 'Full Load', value: Math.max(load || 0, domContentLoaded || 0) },
  ];

  const firstImage = images[0];
  const empathyMessages = [
    `Blind users may miss context from ${images.filter((img) => img?.altMissing || img?.altEmpty).length} image(s) without usable alt text.`,
    `Keyboard-only users may struggle with ${buttons.filter((btn) => btn?.hasNoAccessibleName).length} unlabeled interactive control(s).`,
    `Screen-reader users may lose page structure if heading order is inconsistent across ${headings.length} heading node(s).`,
  ];

  const codeDiffOriginal = `<img src=\"${firstImage?.src || 'profile.jpg'}\">\n<button></button>\n<a href=\"/contact\"></a>`;
  const codeDiffSuggested = `<img src=\"${firstImage?.src || 'profile.jpg'}\" alt=\"Team profile\">\n<button aria-label=\"Open menu\">Menu</button>\n<a href=\"/contact\" aria-label=\"Contact support\">Contact</a>`;

  return {
    url: cleanUrl(auditData?.startUrl || page?.url),
    score: computedScore,
    totalErrors,
    domContentLoaded,
    totalElementsScanned,
    severityData,
    pourData,
    impactMatrix,
    elementDistribution,
    headingHierarchy,
    perfTimeline,
    empathyMessages,
    codeDiffOriginal,
    codeDiffSuggested,
  };
};

const TabPanel = ({ tabKey, activeTab, children }) => (
  <AnimatePresence mode="wait">
    {activeTab === tabKey ? (
      <motion.div
        key={tabKey}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    ) : null}
  </AnimatePresence>
);

const MetricCard = ({ icon: Icon, label, value, suffix = '' }) => (
  <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
    <div className="mb-3 inline-flex rounded-xl bg-slate-50 p-2 text-slate-500">
      <Icon size={18} />
    </div>
    <p className="text-sm text-slate-500">{label}</p>
    <p className="mt-2 font-serif text-3xl text-slate-900">
      {value}
      <span className="ml-1 text-lg text-slate-500">{suffix}</span>
    </p>
  </div>
);

export default function AccessibilityDashboard({ auditData }) {
  const [simulateErrors, setSimulateErrors] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const model = useMemo(
    () => buildDashboardModel(auditData || {}, simulateErrors),
    [auditData, simulateErrors]
  );

  const scoreColor = ringColorByScore(model.score);
  const circumference = 2 * Math.PI * 66;
  const strokeDashoffset = circumference * (1 - model.score / 100);

  return (
    <section className="relative min-h-screen overflow-x-hidden bg-[#fafafa] px-4 py-8 md:px-8">
      <div
        className="pointer-events-none fixed inset-0 opacity-70"
        style={{
          backgroundImage:
            'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative mx-auto max-w-7xl space-y-6">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-[2rem] border border-slate-100 bg-white/80 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                <Sparkles size={14} />
                Accessibility Intelligence
              </p>
              <h1 className="font-serif text-3xl text-slate-900 md:text-4xl">
                Report for {model.url}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setSimulateErrors((prev) => !prev)}
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                  simulateErrors
                    ? 'border-rose-200 bg-rose-500 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <AlertTriangle size={16} />
                Simulate Errors
              </button>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20"
              >
                <Download size={16} />
                Export AI Report
              </button>
            </div>
          </div>
        </motion.header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative rounded-[2rem] border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="pointer-events-none absolute inset-0 -z-0 m-auto h-36 w-36 rounded-full bg-indigo-300/30 blur-3xl" />
            <p className="text-sm text-slate-500">Overall Score</p>
            <div className="mt-5 flex items-center justify-center">
              <svg width="170" height="170" className="-rotate-90">
                <circle cx="85" cy="85" r="66" stroke="#e2e8f0" strokeWidth="12" fill="none" />
                <circle
                  cx="85"
                  cy="85"
                  r="66"
                  stroke={scoreColor}
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>
              <div className="absolute text-center">
                <p className="font-serif text-4xl text-slate-900">{model.score}</p>
                <p className="text-xs uppercase tracking-wider text-slate-500">out of 100</p>
              </div>
            </div>
          </div>

          <MetricCard icon={AlertTriangle} label="Total Flaws" value={model.totalErrors} />
          <MetricCard icon={Timer} label="DOM Load Time" value={model.domContentLoaded} suffix="ms" />
          <MetricCard icon={Boxes} label="Elements Scanned" value={model.totalElementsScanned} />
        </div>

        <div className="rounded-[2rem] border border-slate-100 bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <div className="flex min-w-max gap-2">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? 'text-indigo-600'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                    {isActive ? (
                      <motion.span
                        layoutId="tab-indicator"
                        className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-indigo-600"
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <TabPanel tabKey="overview" activeTab={activeTab}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="h-[360px] rounded-[2rem] border border-slate-100 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="mb-4 font-serif text-2xl text-slate-900">Violation Severity</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={model.severityData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 8, 8]}>
                    {model.severityData.map((entry) => (
                      <Cell key={`severity-${entry.name}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="h-[360px] rounded-[2rem] border border-slate-100 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="mb-4 font-serif text-2xl text-slate-900">WCAG P.O.U.R Profile</h3>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={model.pourData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" />
                  <Radar dataKey="score" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.28} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabPanel>

        <TabPanel tabKey="impact" activeTab={activeTab}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="mb-5 inline-flex items-center gap-2 font-serif text-2xl text-slate-900">
                <Accessibility size={22} className="text-indigo-600" />
                Inclusive Experience Matrix
              </h3>
              <div className="space-y-4">
                {model.impactMatrix.map((row) => (
                  <div key={row.label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{row.label}</span>
                      <span className="font-semibold text-slate-900">{row.value}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${row.value}%`, backgroundColor: row.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.25)]">
              <h3 className="mb-5 inline-flex items-center gap-2 font-serif text-2xl text-white">
                <Brain size={22} className="text-violet-300" />
                Empathy Translator
              </h3>
              <div className="space-y-3">
                {model.empathyMessages.map((message, index) => (
                  <div key={`empathy-${index}`} className="rounded-xl border border-slate-700 bg-slate-800/80 p-3 text-sm text-slate-200">
                    {message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabPanel>

        <TabPanel tabKey="dom" activeTab={activeTab}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="h-[360px] rounded-[2rem] border border-slate-100 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="mb-4 font-serif text-2xl text-slate-900">Element Distribution</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={model.elementDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={72}
                    outerRadius={110}
                    paddingAngle={3}
                  >
                    {model.elementDistribution.map((entry) => (
                      <Cell key={`pie-${entry.name}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="h-[360px] rounded-[2rem] border border-slate-100 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="mb-4 font-serif text-2xl text-slate-900">Heading Hierarchy</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={model.headingHierarchy} margin={{ top: 5, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="level" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4f46e5" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabPanel>

        <TabPanel tabKey="performance" activeTab={activeTab}>
          <div className="h-[380px] rounded-[2rem] border border-slate-100 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h3 className="mb-4 inline-flex items-center gap-2 font-serif text-2xl text-slate-900">
              <Activity size={22} className="text-indigo-600" />
              Performance Timeline
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={model.perfTimeline} margin={{ top: 8, right: 20, left: 0, bottom: 12 }}>
                <defs>
                  <linearGradient id="perfFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="stage" />
                <YAxis unit="ms" />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#4f46e5" fill="url(#perfFill)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </TabPanel>

        <TabPanel tabKey="ai" activeTab={activeTab}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-slate-800 bg-[#0b1220] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.28)]">
              <h3 className="mb-4 inline-flex items-center gap-2 font-serif text-2xl text-white">
                <Code2 size={22} className="text-rose-300" />
                Original Code (Detected)
              </h3>
              <pre className="overflow-auto rounded-xl bg-[#020617] p-4 text-sm text-rose-200">
                <code>{model.codeDiffOriginal}</code>
              </pre>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-[#0b1220] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.28)]">
              <h3 className="mb-4 inline-flex items-center gap-2 font-serif text-2xl text-white">
                <Globe size={22} className="text-emerald-300" />
                AI Suggested Fix
              </h3>
              <pre className="overflow-auto rounded-xl bg-[#020617] p-4 text-sm text-emerald-200">
                <code>{model.codeDiffSuggested}</code>
              </pre>
            </div>
          </div>
        </TabPanel>
      </div>
    </section>
  );
}
