// src/components/VisualPreview.jsx
import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Eye, AlertTriangle, ExternalLink, Code2, Info, ZoomIn, ZoomOut, Maximize2
} from 'lucide-react';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

// ── Impact color mapping ─────────────────────────────────────────────────────
const impactStyles = {
    critical: {
        border: 'border-rose-500',
        bg: 'bg-rose-500/20',
        hoverBg: 'bg-rose-500/40',
        badge: 'bg-rose-500 text-white',
        text: 'text-rose-600',
        dot: 'bg-rose-500',
    },
    serious: {
        border: 'border-orange-500',
        bg: 'bg-orange-500/20',
        hoverBg: 'bg-orange-500/40',
        badge: 'bg-orange-500 text-white',
        text: 'text-orange-600',
        dot: 'bg-orange-500',
    },
    moderate: {
        border: 'border-amber-500',
        bg: 'bg-amber-500/15',
        hoverBg: 'bg-amber-500/35',
        badge: 'bg-amber-500 text-white',
        text: 'text-amber-600',
        dot: 'bg-amber-500',
    },
    minor: {
        border: 'border-sky-500',
        bg: 'bg-sky-500/15',
        hoverBg: 'bg-sky-500/30',
        badge: 'bg-sky-500 text-white',
        text: 'text-sky-600',
        dot: 'bg-sky-500',
    },
};

const getImpactStyle = (impact) => impactStyles[impact] || impactStyles.moderate;

// ── Main Component ───────────────────────────────────────────────────────────
export default function VisualPreview({ auditData }) {
    const [imageSize, setImageSize] = useState(null);
    const [hoveredNode, setHoveredNode] = useState(null);
    const [selectedPage, setSelectedPage] = useState(0);
    const [zoom, setZoom] = useState(1);
    const containerRef = useRef(null);

    // Extract pages from audit data
    const pages = auditData?.pages || [];
    const currentPage = pages[selectedPage] || {};

    const screenshotFileName = currentPage?.screenshot?.filename;
    const violations = currentPage?.axeResults?.violations || [];

    // Collect all nodes with bounding boxes across all violations
    const allNodes = [];
    violations.forEach((violation) => {
        (violation.nodes || []).forEach((node) => {
            if (node.boundingBox && node.boundingBox.width > 0 && node.boundingBox.height > 0) {
                allNodes.push({
                    ...node,
                    violationId: violation.id,
                    violationDescription: violation.description,
                    violationHelp: violation.help,
                    violationHelpUrl: violation.helpUrl,
                    violationImpact: violation.impact,
                    violationTags: violation.tags,
                });
            }
        });
    });

    const handleImageLoad = useCallback((e) => {
        setImageSize({
            naturalWidth: e.target.naturalWidth,
            naturalHeight: e.target.naturalHeight,
        });
    }, []);

    // ── No screenshot available ────────────────────────────────────────────────
    if (!screenshotFileName) {
        return (
            <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-300 bg-white/60 p-16 backdrop-blur">
                <div className="mb-4 inline-flex rounded-2xl bg-slate-100 p-4">
                    <Eye size={32} className="text-slate-400" />
                </div>
                <h3 className="font-serif text-2xl text-slate-900 mb-2">No Visual Preview Available</h3>
                <p className="text-sm text-slate-500 max-w-md text-center">
                    Run an audit with screenshots enabled to see a visual overlay of accessibility violations on the page.
                </p>
            </div>
        );
    }

    const screenshotUrl = `${API_BASE_URL}/screenshots/${screenshotFileName}`;

    return (
        <div className="space-y-4">
            {/* Page selector (if multiple pages) */}
            {pages.length > 1 && (
                <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                    {pages.map((pg, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => { setSelectedPage(idx); setImageSize(null); setHoveredNode(null); setZoom(1); }}
                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${selectedPage === idx
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {new URL(pg.url).pathname || '/'}
                        </button>
                    ))}
                </div>
            )}

            {/* Stats bar */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-5 py-3 shadow-sm">
                <div className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                        <AlertTriangle size={14} className="text-rose-500" />
                        <strong className="text-slate-900">{allNodes.length}</strong> visual markers
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                        <Code2 size={14} className="text-indigo-500" />
                        <strong className="text-slate-900">{violations.length}</strong> violation rules
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
                        <ZoomOut size={16} />
                    </button>
                    <span className="text-xs font-semibold text-slate-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
                    <button type="button" onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
                        <ZoomIn size={16} />
                    </button>
                    <button type="button" onClick={() => setZoom(1)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
                        <Maximize2 size={16} />
                    </button>
                </div>
            </div>

            {/* Main layout: screenshot + detail panel */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">

                {/* Screenshot with overlays */}
                <div
                    ref={containerRef}
                    className="relative overflow-auto rounded-2xl border border-slate-200 bg-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
                    style={{ maxHeight: '75vh' }}
                >
                    <div className="relative inline-block" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
                        <img
                            src={screenshotUrl}
                            alt={`Screenshot of ${currentPage.url}`}
                            onLoad={handleImageLoad}
                            className="block max-w-none"
                            draggable={false}
                        />

                        {/* Bounding box overlays */}
                        {imageSize && allNodes.map((node, idx) => {
                            const { x, y, width, height } = node.boundingBox;
                            const style = getImpactStyle(node.violationImpact);
                            const isHovered = hoveredNode === idx;

                            return (
                                <div
                                    key={idx}
                                    onMouseEnter={() => setHoveredNode(idx)}
                                    onMouseLeave={() => setHoveredNode(null)}
                                    className={`absolute border-2 ${style.border} ${isHovered ? style.hoverBg : style.bg} rounded-lg cursor-pointer transition-all duration-150`}
                                    style={{
                                        top: `${(y / imageSize.naturalHeight) * 100}%`,
                                        left: `${(x / imageSize.naturalWidth) * 100}%`,
                                        width: `${(width / imageSize.naturalWidth) * 100}%`,
                                        height: `${(height / imageSize.naturalHeight) * 100}%`,
                                        zIndex: isHovered ? 20 : 10,
                                    }}
                                    title={node.violationHelp}
                                >
                                    {/* Impact badge on hover */}
                                    {isHovered && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`absolute -top-6 left-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.badge} shadow-lg whitespace-nowrap`}
                                        >
                                            {node.violationImpact} — {node.violationId}
                                        </motion.div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Error Detail Panel */}
                <div className="rounded-2xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden self-start" style={{ maxHeight: '75vh' }}>
                    <div className="border-b border-slate-100 px-5 py-4">
                        <h3 className="font-serif text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <Eye size={18} className="text-indigo-600" />
                            Error Details
                        </h3>
                    </div>

                    <div className="overflow-y-auto px-5 py-4" style={{ maxHeight: 'calc(75vh - 60px)' }}>
                        {hoveredNode !== null && allNodes[hoveredNode] ? (() => {
                            const node = allNodes[hoveredNode];
                            const style = getImpactStyle(node.violationImpact);
                            return (
                                <motion.div
                                    key={hoveredNode}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="space-y-4"
                                >
                                    {/* Impact badge */}
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${style.badge}`}>
                                            <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                                            {node.violationImpact}
                                        </span>
                                    </div>

                                    {/* Rule ID */}
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Rule ID</p>
                                        <p className="text-sm font-mono font-semibold text-slate-800">{node.violationId}</p>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Description</p>
                                        <p className="text-sm text-slate-700 leading-relaxed">{node.violationDescription}</p>
                                    </div>

                                    {/* Help text */}
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">How to Fix</p>
                                        <p className="text-sm text-slate-700 leading-relaxed">{node.violationHelp}</p>
                                    </div>

                                    {/* HTML snippet */}
                                    {node.html && (
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">HTML Snippet</p>
                                            <pre className="overflow-x-auto rounded-xl bg-slate-900 p-3 text-xs text-emerald-400 font-mono leading-relaxed">
                                                {node.html}
                                            </pre>
                                        </div>
                                    )}

                                    {/* Failure summary */}
                                    {node.failureSummary && (
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Failure Summary</p>
                                            <p className="text-sm text-slate-600 leading-relaxed">{node.failureSummary}</p>
                                        </div>
                                    )}

                                    {/* Help URL */}
                                    {node.violationHelpUrl && (
                                        <a
                                            href={node.violationHelpUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-100"
                                        >
                                            <ExternalLink size={12} />
                                            Learn more on Deque
                                        </a>
                                    )}

                                    {/* Bounding box coordinates */}
                                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Bounding Box</p>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                                            <span>X: <strong className="text-slate-800">{Math.round(node.boundingBox.x)}px</strong></span>
                                            <span>Y: <strong className="text-slate-800">{Math.round(node.boundingBox.y)}px</strong></span>
                                            <span>W: <strong className="text-slate-800">{Math.round(node.boundingBox.width)}px</strong></span>
                                            <span>H: <strong className="text-slate-800">{Math.round(node.boundingBox.height)}px</strong></span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })() : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="mb-3 inline-flex rounded-xl bg-slate-100 p-3">
                                    <Info size={24} className="text-slate-400" />
                                </div>
                                <p className="text-sm font-semibold text-slate-700">Hover over a marker</p>
                                <p className="mt-1 text-xs text-slate-400 max-w-[200px]">
                                    Hover over any colored bounding box on the screenshot to see the full error details here.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Violations summary list */}
            {violations.length > 0 && (
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <h3 className="mb-3 font-serif text-lg font-semibold text-slate-900">All Violations ({violations.length} rules)</h3>
                    <div className="space-y-2">
                        {violations.map((v, i) => {
                            const style = getImpactStyle(v.impact);
                            const nodeCount = (v.nodes || []).filter(n => n.boundingBox && n.boundingBox.width > 0).length;
                            return (
                                <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">{v.id}</p>
                                        <p className="text-xs text-slate-500 truncate">{v.help}</p>
                                    </div>
                                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${style.badge}`}>
                                        {v.impact}
                                    </span>
                                    <span className="shrink-0 text-xs text-slate-500">
                                        {nodeCount} marker{nodeCount !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
