// src/components/InsightsPanel.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, Search, Heading1, Image, MousePointerClick,
    Layers, BarChart3, ShieldCheck, ListOrdered, Palette,
    ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, XCircle,
    Loader2, Sparkles, Info, Wrench, Copy, Check, X
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────
const typeConfig = {
    success: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: CheckCircle2, dot: 'bg-emerald-500' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: AlertTriangle, dot: 'bg-amber-500' },
    error: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', icon: XCircle, dot: 'bg-rose-500' },
};

const getConfig = (type) => typeConfig[type] || typeConfig.warning;

// ── Generate a copy-paste ready fix prompt ───────────────────────────────────
function generateFixPrompt(item) {
    const elements = Array.isArray(item.elements) && item.elements.length > 0
        ? item.elements.map((el) => `  - ${el}`).join('\n')
        : '  (No specific elements listed)';

    return `Fix the following accessibility issue in my website:

ISSUE: ${item.message}

AFFECTED ELEMENTS:
${elements}

INSTRUCTIONS:
- Find and fix all the affected elements listed above in my codebase.
- Follow WCAG 2.1 AA guidelines.
- Make minimal, targeted changes — do not refactor unrelated code.
- If the issue is about missing attributes (alt, aria-label, meta tags), add them with appropriate values.
- If the issue is about structural problems (e.g., multiple H1 tags), restructure the HTML to use proper semantic heading hierarchy.
- After making changes, briefly explain what was changed and why.
`;
}

// ── Fix Now Modal ────────────────────────────────────────────────────────────
function FixNowModal({ item, onClose }) {
    const [copied, setCopied] = useState(false);
    const prompt = generateFixPrompt(item);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(prompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = prompt;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="inline-flex rounded-lg bg-rose-100 p-2">
                            <Wrench size={18} className="text-rose-600" />
                        </div>
                        <div>
                            <h3 className="font-serif text-lg font-semibold text-slate-900">Fix Now — Copy Prompt</h3>
                            <p className="text-xs text-slate-500">Paste this into your AI coding agent to auto-fix the issue</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Prompt content */}
                <div className="px-6 py-4">
                    <pre className="max-h-[400px] overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 font-mono leading-relaxed">
                        {prompt}
                    </pre>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        onClick={handleCopy}
                        className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white shadow-lg transition ${copied
                                ? 'bg-emerald-500 shadow-emerald-500/25'
                                : 'bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-500/25 hover:shadow-xl'
                            }`}
                    >
                        {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Prompt</>}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ── Tiny reusable components ─────────────────────────────────────────────────

function InsightBadge({ item }) {
    const cfg = getConfig(item.type);
    const Icon = cfg.icon;
    const isError = item.type === 'error';
    const hasElements = item.type !== 'success' && Array.isArray(item.elements) && item.elements.length > 0;
    const MAX_VISIBLE = 6;
    const [showAll, setShowAll] = useState(false);
    const [showFixModal, setShowFixModal] = useState(false);
    const visibleElements = hasElements
        ? (showAll ? item.elements : item.elements.slice(0, MAX_VISIBLE))
        : [];
    const hasMore = hasElements && item.elements.length > MAX_VISIBLE;

    return (
        <>
            <div className={`rounded-xl ${cfg.bg} ${cfg.border} border`}>
                <div className="flex items-start gap-3 p-3">
                    <Icon size={16} className={`mt-0.5 shrink-0 ${cfg.text}`} />
                    <span className={`flex-1 text-sm leading-relaxed ${cfg.text}`}>{item.message}</span>
                    {isError && (
                        <button
                            type="button"
                            onClick={() => setShowFixModal(true)}
                            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700 hover:shadow-md"
                        >
                            <Wrench size={12} />
                            Fix Now
                        </button>
                    )}
                </div>
                {hasElements && (
                    <div className={`mx-3 mb-3 rounded-lg bg-white/60 border ${cfg.border} p-2.5`}>
                        <p className={`mb-1.5 text-[10px] font-bold uppercase tracking-widest ${cfg.text} opacity-60`}>
                            Affected Elements ({item.elements.length})
                        </p>
                        <div className="space-y-1">
                            {visibleElements.map((el, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs">
                                    <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dot}`} />
                                    <code className={`font-mono ${cfg.text}`}>{el}</code>
                                </div>
                            ))}
                        </div>
                        {hasMore && (
                            <button
                                type="button"
                                onClick={() => setShowAll((p) => !p)}
                                className={`mt-2 text-xs font-semibold ${cfg.text} hover:opacity-70 transition`}
                            >
                                {showAll ? '▲ Show less' : `▼ Show all ${item.elements.length} elements`}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Fix Now Modal */}
            <AnimatePresence>
                {showFixModal && (
                    <FixNowModal item={item} onClose={() => setShowFixModal(false)} />
                )}
            </AnimatePresence>
        </>
    );
}

function StatusDot({ status }) {
    const colors = { pass: 'bg-emerald-500', warning: 'bg-amber-500', fail: 'bg-rose-500' };
    return <span className={`inline-block h-2.5 w-2.5 rounded-full ${colors[status] || 'bg-slate-400'}`} />;
}

function CollapsibleSection({ icon: Icon, title, children, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-slate-50"
            >
                <div className="inline-flex rounded-lg bg-indigo-50 p-2 text-indigo-600">
                    <Icon size={18} />
                </div>
                <span className="flex-1 font-serif text-lg font-semibold text-slate-900">{title}</span>
                {open ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-3 px-5 pb-5">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Color-coded list for cross-cutting insights ──────────────────────────────
function ColorCodedList({ items, color }) {
    const cfg = { green: typeConfig.success, yellow: typeConfig.warning, red: typeConfig.error }[color] || typeConfig.warning;
    if (!items || items.length === 0) return null;
    return (
        <div className="space-y-2">
            {items.map((msg, i) => (
                <div key={i} className={`flex items-start gap-3 rounded-lg ${cfg.bg} ${cfg.border} border p-3`}>
                    <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${cfg.dot}`} />
                    <span className={`text-sm ${cfg.text}`}>{msg}</span>
                </div>
            ))}
        </div>
    );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function InsightsPanel({ insights, loading, error, onGenerate, hasAuditData }) {

    /* ---- Loading state ---- */
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center rounded-[2rem] border border-slate-100 bg-white p-16 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
                <p className="font-serif text-lg text-slate-900">Generating AI Insights...</p>
                <p className="mt-2 text-sm text-slate-500">Gemini is analyzing your audit data across 10 categories.</p>
            </div>
        );
    }

    /* ---- Not generated yet ---- */
    if (!insights) {
        return (
            <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-300 bg-white/60 p-16 backdrop-blur">
                <div className="mb-4 inline-flex rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 p-4">
                    <Sparkles size={32} className="text-indigo-600" />
                </div>
                <h3 className="font-serif text-2xl text-slate-900 mb-2">AI-Powered Insights</h3>
                <p className="text-sm text-slate-500 mb-6 max-w-md text-center">
                    Get comprehensive, Gemini-powered analysis covering performance, SEO, accessibility, WCAG compliance, and prioritized fix recommendations.
                </p>
                {error && (
                    <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {error}
                    </div>
                )}
                <button
                    type="button"
                    onClick={onGenerate}
                    disabled={!hasAuditData}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:shadow-xl hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Sparkles size={16} />
                    Generate AI Insights
                </button>
            </div>
        );
    }

    /* ---- Insights rendered ---- */
    const {
        overallScore, executiveSummary,
        performanceHealth, seoMetadata, headingStructure,
        imageAccessibility, buttonInteractive,
        crossCuttingInsights, aggregateReport,
        wcagCompliance, priorityFixes, uiuxRecommendations
    } = insights;

    return (
        <div className="space-y-4">

            {/* ── Executive Summary ── */}
            <div className="rounded-[2rem] border border-slate-100 bg-gradient-to-br from-indigo-50/60 to-violet-50/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="flex items-center gap-3 mb-3">
                    <div className="inline-flex rounded-full bg-indigo-100 p-2">
                        <Sparkles size={18} className="text-indigo-600" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                        AI Executive Summary {insights.provider === 'fallback-analyzer' ? '(Fallback)' : ''}
                    </span>
                </div>
                <p className="font-serif text-xl text-slate-800 leading-relaxed">{executiveSummary}</p>
                {overallScore != null && (
                    <p className="mt-3 text-sm text-slate-500">
                        AI Score: <span className="font-bold text-slate-900">{overallScore}/100</span>
                    </p>
                )}
            </div>

            {/* ── Category Sections ── */}
            <CollapsibleSection icon={Zap} title="Performance & Technical Health" defaultOpen>
                {renderInsightsAndRecs(performanceHealth)}
            </CollapsibleSection>

            <CollapsibleSection icon={Search} title="SEO & Metadata Quality">
                {renderInsightsAndRecs(seoMetadata)}
            </CollapsibleSection>

            <CollapsibleSection icon={Heading1} title="Heading Structure Analysis">
                {renderInsightsAndRecs(headingStructure)}
            </CollapsibleSection>

            <CollapsibleSection icon={Image} title="Image Accessibility Audit">
                {renderInsightsAndRecs(imageAccessibility)}
            </CollapsibleSection>

            <CollapsibleSection icon={MousePointerClick} title="Button & Interactive Elements">
                {renderInsightsAndRecs(buttonInteractive)}
            </CollapsibleSection>

            {/* ── Cross-Cutting Insights ── */}
            <CollapsibleSection icon={Layers} title="Cross-Cutting Insights">
                {crossCuttingInsights && (crossCuttingInsights.green?.length > 0 || crossCuttingInsights.yellow?.length > 0 || crossCuttingInsights.red?.length > 0) ? (
                    <>
                        <ColorCodedList items={crossCuttingInsights.green} color="green" />
                        <ColorCodedList items={crossCuttingInsights.yellow} color="yellow" />
                        <ColorCodedList items={crossCuttingInsights.red} color="red" />
                    </>
                ) : (
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                        <Info size={16} className="shrink-0" />
                        No cross-cutting insights found.
                    </div>
                )}
            </CollapsibleSection>

            {/* ── Aggregate Report ── */}
            <CollapsibleSection icon={BarChart3} title="Aggregate Report">
                {aggregateReport && (aggregateReport.passed?.length > 0 || aggregateReport.warnings?.length > 0 || aggregateReport.critical?.length > 0 || aggregateReport.topIssues?.length > 0) ? (
                    <>
                        {aggregateReport.passed?.length > 0 && (
                            <div>
                                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-600">✅ Passed</p>
                                {aggregateReport.passed.map((p, i) => (
                                    <div key={i} className="mb-1 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-sm text-emerald-700">{p}</div>
                                ))}
                            </div>
                        )}
                        {aggregateReport.warnings?.length > 0 && (
                            <div>
                                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-600">⚠️ Warnings</p>
                                {aggregateReport.warnings.map((w, i) => (
                                    <div key={i} className="mb-1 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-sm text-amber-700">{w}</div>
                                ))}
                            </div>
                        )}
                        {aggregateReport.critical?.length > 0 && (
                            <div>
                                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-rose-600">❌ Critical</p>
                                {aggregateReport.critical.map((c, i) => (
                                    <div key={i} className="mb-1 rounded-lg bg-rose-50 border border-rose-100 px-3 py-2 text-sm text-rose-700">{c}</div>
                                ))}
                            </div>
                        )}
                        {aggregateReport.topIssues?.length > 0 && (
                            <div>
                                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">📊 Top Issues</p>
                                <div className="overflow-hidden rounded-xl border border-slate-200">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 text-left">
                                            <tr>
                                                <th className="px-3 py-2 font-semibold text-slate-600">#</th>
                                                <th className="px-3 py-2 font-semibold text-slate-600">Issue</th>
                                                <th className="px-3 py-2 font-semibold text-slate-600">Affected</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {aggregateReport.topIssues.map((issue, i) => (
                                                <tr key={i} className="border-t border-slate-100">
                                                    <td className="px-3 py-2 font-medium text-slate-900">{issue.rank}</td>
                                                    <td className="px-3 py-2 text-slate-700">{issue.issue}</td>
                                                    <td className="px-3 py-2 text-slate-500">{issue.affectedElements}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                        <Info size={16} className="shrink-0" />
                        No aggregate report data found.
                    </div>
                )}
            </CollapsibleSection>

            {/* ── WCAG Compliance ── */}
            {wcagCompliance?.length > 0 && (
                <CollapsibleSection icon={ShieldCheck} title="WCAG Compliance Report">
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-left">
                                <tr>
                                    <th className="px-3 py-2 font-semibold text-slate-600">Criterion</th>
                                    <th className="px-3 py-2 font-semibold text-slate-600">Status</th>
                                    <th className="px-3 py-2 font-semibold text-slate-600">Detail</th>
                                </tr>
                            </thead>
                            <tbody>
                                {wcagCompliance.map((row, i) => (
                                    <tr key={i} className="border-t border-slate-100">
                                        <td className="px-3 py-2 font-medium text-slate-900">{row.criterion}</td>
                                        <td className="px-3 py-2">
                                            <span className="inline-flex items-center gap-1.5">
                                                <StatusDot status={row.status} />
                                                <span className="capitalize text-slate-700">{row.status}</span>
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-slate-500">{row.detail}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CollapsibleSection>
            )}

            {/* ── Priority Fixes ── */}
            {priorityFixes?.length > 0 && (
                <CollapsibleSection icon={ListOrdered} title="Priority Fix List" defaultOpen>
                    <div className="space-y-2">
                        {priorityFixes.map((fix, i) => {
                            const impactColor = { high: 'bg-rose-100 text-rose-700 border-rose-200', medium: 'bg-amber-100 text-amber-700 border-amber-200', low: 'bg-slate-100 text-slate-600 border-slate-200' }[fix.impact] || 'bg-slate-100 text-slate-600 border-slate-200';
                            return (
                                <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700">
                                        {fix.priority}
                                    </span>
                                    <span className="flex-1 text-sm text-slate-800">{fix.fix}</span>
                                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${impactColor}`}>
                                        {fix.impact}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </CollapsibleSection>
            )}

            {/* ── UI/UX Recommendations ── */}
            {uiuxRecommendations?.length > 0 && (
                <CollapsibleSection icon={Palette} title="UI/UX Recommendations">
                    <div className="space-y-2">
                        {uiuxRecommendations.map((rec, i) => (
                            <InsightBadge key={i} item={rec} />
                        ))}
                    </div>
                </CollapsibleSection>
            )}

            {/* ── Regenerate button ── */}
            <div className="flex justify-center pt-2">
                <button
                    type="button"
                    onClick={onGenerate}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600"
                >
                    <Sparkles size={14} />
                    Regenerate Insights
                </button>
            </div>
        </div>
    );
}

// ── Helper to render insights + recommendations ──────────────────────────────
function renderInsightsAndRecs(section) {
    if (!section) return <p className="text-sm text-slate-400">No data available.</p>;
    return (
        <>
            {section.insights?.length > 0 && (
                <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Insights</p>
                    <div className="space-y-2">
                        {section.insights.map((item, i) => <InsightBadge key={i} item={item} />)}
                    </div>
                </div>
            )}
            {section.recommendations?.length > 0 && (
                <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Recommendations</p>
                    <div className="space-y-2">
                        {section.recommendations.map((item, i) => <InsightBadge key={i} item={item} />)}
                    </div>
                </div>
            )}
        </>
    );
}
