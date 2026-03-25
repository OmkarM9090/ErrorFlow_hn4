// src/components/VisualPreview.jsx
import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Eye, AlertTriangle, ExternalLink, Code2, Info, ZoomIn, ZoomOut, Maximize2,
    CheckCircle2, Lightbulb, ShieldCheck, User, BookOpen, MousePointer2
} from 'lucide-react';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

// ── Guideline Enrichment (Hackathon/Judge Optimized Logic with Dynamic Links) ──
const getEnrichedDetails = (ruleId, htmlSnippet = '') => {
    const getTag = (snippet) => {
        if (!snippet) return 'element';
        const match = snippet.trim().match(/^<\s*([a-z0-9-]+)/i);
        return match ? match[1].toLowerCase() : 'element';
    };
    
    const tag = getTag(htmlSnippet);
    const isIconOnly = htmlSnippet && !htmlSnippet.replace(/<[^>]+>/g, '').trim();

    let data = {
        wcagCriteria: "WCAG 2.1 (General Compliance)",
        userImpact: "Users with cognitive or physical disabilities encounter significant barriers when interacting with this component.",
        devRecommendation: "Audit the element's DOM structure against standard semantic HTML5 practices.",
        alternativeFix: "Consider implementing ARIA attributes to bridge the semantic gap.",
        customHelpUrl: "https://www.w3.org/WAI/standards-guidelines/wcag/"
    };

    switch (ruleId) {
        case 'region':
            if (['p', 'span', 'i', 'b', 'strong', 'em', 'small', 'ul', 'ol', 'li'].includes(tag)) {
                data.wcagCriteria = "WCAG 1.3.1: Info and Relationships (A)";
                data.userImpact = "Navigating without landmarks is like reading a book without chapters. Screen reader users rely on landmarks to jump to content; they will completely miss this orphaned text.";
                data.devRecommendation = `Enclose this orphaned <${tag}> element within a semantic HTML5 landmark such as <main>, <section>, or <article>.`;
                data.alternativeFix = "If this text is part of the core page content, ensure its closest parent wrapper is upgraded from a generic <div> to a <main>.";
                data.customHelpUrl = "https://webaim.org/techniques/semanticstructure/";
            } else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
                data.wcagCriteria = "WCAG 2.4.1: Bypass Blocks (A)";
                data.userImpact = "Headings construct the Document Object Model (DOM) outline. An un-regioned heading breaks the mental map for visually impaired users utilizing rotor menus.";
                data.devRecommendation = `Nest this <${tag}> inside the relevant <section> or <main> landmark to restore the semantic hierarchy.`;
                data.alternativeFix = "Ensure the page possesses a unified <main> element that encapsulates all primary content, including this heading.";
                data.customHelpUrl = "https://www.w3.org/WAI/tutorials/page-structure/headings/";
            } else if (['div', 'section'].includes(tag)) {
                data.wcagCriteria = "WCAG 1.3.1: Info and Relationships (A)";
                data.userImpact = "Assistive technologies fail to interpret the purpose of this content block due to the absence of a semantic boundary or programmatic role.";
                data.devRecommendation = `This <${tag}> grouping lacks semantic meaning. Elevate it by placing it inside <main> or assign role="region" paired with an aria-label.`;
                data.alternativeFix = "If this div exists purely for visual CSS layout (Flexbox/Grid), ensure all its readable child content is wrapped in proper landmarks.";
                data.customHelpUrl = "https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/";
            } else {
                data.wcagCriteria = "WCAG 2.4.1: Bypass Blocks (A)";
                data.userImpact = "Content residing outside defined landmarks is practically invisible to quick-navigation commands used by screen readers.";
                data.devRecommendation = `Wrap the <${tag}> element in a designated semantic tag: <main>, <nav>, <aside>, or <section>.`;
                data.alternativeFix = "Assign an explicit role='region' and an identifying aria-label to the container.";
                data.customHelpUrl = "https://webaim.org/techniques/aria/#landmarks";
            }
            break;

        case 'color-contrast':
            if (['h1', 'h2', 'h3'].includes(tag)) {
                data.wcagCriteria = "WCAG 1.4.3: Contrast (Minimum) (AA)";
                data.userImpact = "Users with visual impairments (e.g., cataracts, low vision) or those in bright environments cannot perceive this heading as it blends into the background.";
                data.devRecommendation = "For large text (18pt+ or 14pt+ bold), ensure the contrast ratio between the foreground color and background is strictly at least 3.0:1.";
                data.alternativeFix = "Apply a subtle CSS text-shadow or a semi-transparent background overlay to force higher contrast readability.";
                data.customHelpUrl = "https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html";
            } else if (['button', 'a'].includes(tag)) {
                data.wcagCriteria = "WCAG 1.4.3: Contrast (Minimum) (AA)";
                data.userImpact = `Visually impaired users cannot easily identify this <${tag}> as an interactive element, leading to severe conversion drops.`;
                data.devRecommendation = "Darken the text or lighten the interactive element's background to surpass the strict 4.5:1 contrast ratio threshold.";
                data.alternativeFix = "Introduce a high-contrast CSS border or underline specifically for focus/active states.";
                data.customHelpUrl = "https://webaim.org/articles/contrast/";
            } else {
                data.wcagCriteria = "WCAG 1.4.3: Contrast (Minimum) (AA)";
                data.userImpact = `Users with color vision deficiencies struggle to decipher the <${tag}> text against its current background.`;
                data.devRecommendation = "Adjust the CSS color palette to achieve a minimum contrast ratio of 4.5:1 for standard body text.";
                data.alternativeFix = "If brand guidelines restrict color changes, significantly increase the font-weight or font-size.";
                data.customHelpUrl = "https://developer.mozilla.org/en-US/docs/Web/Accessibility/Understanding_Colors_and_Luminance";
            }
            break;

        case 'button-name':
            data.wcagCriteria = "WCAG 4.1.2: Name, Role, Value (A)";
            if (tag === 'button' && isIconOnly) {
                data.userImpact = "Voice control users cannot target this icon-only button via speech. Screen readers announce a generic \"Button\", leaving blind users guessing its action.";
                data.devRecommendation = `Inject a descriptive aria-label="[Action Name]" attribute directly into the <${tag}> to provide a programmatic name.`;
                data.alternativeFix = "Embed a visually hidden <span className='sr-only'>[Action Name]</span> inside the button element.";
                data.customHelpUrl = "https://www.w3.org/WAI/tutorials/forms/labels/#hidden-labels";
            } else {
                data.userImpact = "Assistive technologies recognize this as a clickable element but fail to communicate its purpose to the user.";
                data.devRecommendation = "Supply clear inner text for the button, or utilize the aria-labelledby attribute to point to a visible descriptive ID.";
                data.alternativeFix = "Verify that CSS (like display: none) isn't accidentally hiding the button's intended text from the accessibility tree.";
                data.customHelpUrl = "https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html";
            }
            break;

        case 'link-name':
            data.wcagCriteria = "WCAG 2.4.4: Link Purpose (In Context) (A)";
            if (tag === 'a' && isIconOnly) {
                data.userImpact = "Users utilizing a 'Links List' shortcut in their screen reader will merely hear 'link', lacking critical destination context.";
                data.devRecommendation = "Attach an explicit aria-label to the <a> tag defining the destination (e.g., aria-label='Navigate to Twitter Profile').";
                data.alternativeFix = "Include visually hidden descriptive text inside the anchor tag using a screen-reader-only utility class.";
                data.customHelpUrl = "https://webaim.org/techniques/hypertext/link_text#hidden_text";
            } else {
                data.userImpact = "Screen reader users navigating sequentially encounter ambiguous links (like \"Click here\"), degrading the UX.";
                data.devRecommendation = `Refactor the <${tag}> text to uniquely and accurately describe the exact destination.`;
                data.alternativeFix = "If the link encapsulates an image, guarantee the nested <img> possesses an accurate 'alt' attribute acting as the link name.";
                data.customHelpUrl = "https://webaim.org/techniques/hypertext/link_text";
            }
            break;

        case 'landmark-one-main':
            data.wcagCriteria = "WCAG 1.3.1: Info and Relationships (A)";
            data.userImpact = "Keyboard-only navigators and screen reader users are stripped of the ability to use the vital 'skip to main content' shortcut.";
            data.devRecommendation = "Audit the DOM to ensure there is exactly one unified <main> tag wrapping the primary content of the document.";
            data.alternativeFix = "If your SPA conditionally renders multiple <main> elements, ensure only the active one is injected into the DOM at any given time.";
            data.customHelpUrl = "https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/";
            break;
            
        case 'heading-order':
            data.wcagCriteria = "WCAG 1.3.1: Info and Relationships (A)";
            data.userImpact = "Skipping heading levels scrambles the conceptual map of the page, causing cognitive overload for users relying on assistive navigation.";
            data.devRecommendation = `Restructure this <${tag}> to follow a strictly logical, sequential order (e.g., H1 -> H2 -> H3) without omitting levels.`;
            data.alternativeFix = "If the heading tag was chosen purely for its visual size, revert to the semantically correct tag and use CSS utility classes for styling.";
            data.customHelpUrl = "https://webaim.org/techniques/semanticstructure/";
            break;
            
        case 'image-alt':
            data.wcagCriteria = "WCAG 1.1.1: Non-text Content (A)";
            data.userImpact = "Without an alt attribute, screen readers default to reading the raw image filename, creating a frustrating and confusing experience.";
            data.devRecommendation = `Inject an alt="..." attribute into the <${tag}> that concisely describes the image's function or visual data.`;
            data.alternativeFix = "If the image is strictly decorative, enforce alt=\"\" (empty string) to instruct assistive technologies to bypass it silently.";
            data.customHelpUrl = "https://webaim.org/techniques/alttext/";
            break;
    }
    return data;
};

// ── Impact color mapping ─────────────────────────────────────────────────────
const impactStyles = {
    critical: { border: 'border-rose-500', bg: 'bg-rose-500/20', hoverBg: 'bg-rose-500/40', badge: 'bg-rose-500 text-white', text: 'text-rose-600', dot: 'bg-rose-500' },
    serious: { border: 'border-orange-500', bg: 'bg-orange-500/20', hoverBg: 'bg-orange-500/40', badge: 'bg-orange-500 text-white', text: 'text-orange-600', dot: 'bg-orange-500' },
    moderate: { border: 'border-amber-500', bg: 'bg-amber-500/15', hoverBg: 'bg-amber-500/35', badge: 'bg-amber-500 text-white', text: 'text-amber-600', dot: 'bg-amber-500' },
    minor: { border: 'border-sky-500', bg: 'bg-sky-500/15', hoverBg: 'bg-sky-500/30', badge: 'bg-sky-500 text-white', text: 'text-sky-600', dot: 'bg-sky-500' },
};

const getImpactStyle = (impact) => impactStyles[impact] || impactStyles.moderate;

// ── Main Component ───────────────────────────────────────────────────────────
export default function VisualPreview({ auditData }) {
    const [imageSize, setImageSize] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedPage, setSelectedPage] = useState(0);
    const [zoom, setZoom] = useState(1);
    const containerRef = useRef(null);

    const pages = auditData?.pages || [];
    const currentPage = pages[selectedPage] || {};

    const screenshotFileName = currentPage?.screenshot?.filename;
    const violations = currentPage?.axeResults?.violations || [];

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
            {pages.length > 1 && (
                <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                    {pages.map((pg, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => { setSelectedPage(idx); setImageSize(null); setSelectedNode(null); setZoom(1); }}
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

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">

                {/* Screenshot with overlays */}
                <div
                    ref={containerRef}
                    className="relative overflow-auto rounded-2xl border border-slate-200 bg-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
                    style={{ maxHeight: '80vh' }}
                >
                    <div className="relative inline-block" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
                        <img
                            src={screenshotUrl}
                            alt={`Screenshot of ${currentPage.url}`}
                            onLoad={handleImageLoad}
                            className="block max-w-none"
                            draggable={false}
                        />

                        {imageSize && violations.map((violation, violationIndex) => (
                            (violation.nodes || [])
                                .filter((node) => node.boundingBox && node.boundingBox.width > 0 && node.boundingBox.height > 0)
                                .map((node, nodeIndex) => {
                                    const { x, y, width, height } = node.boundingBox;
                                    const style = getImpactStyle(violation.impact);
                                    const hoverKey = `${violationIndex}-${nodeIndex}`;
                                    const isSelected = selectedNode?.uniqueKey === hoverKey;

                                    return (
                                        <div
                                            key={hoverKey}
                                            onClick={() => setSelectedNode({ ...violation, specificNode: node, uniqueKey: hoverKey })}
                                            className={`absolute border-2 ${isSelected ? 'z-30 border-4 border-rose-600 bg-rose-500/40 shadow-[0_0_15px_rgba(225,29,72,0.5)]' : `${style.border} ${style.bg} z-10`} rounded-lg cursor-pointer transition-all duration-150 hover:bg-rose-500/40`}
                                            style={{
                                                top: `${(y / imageSize.naturalHeight) * 100}%`,
                                                left: `${(x / imageSize.naturalWidth) * 100}%`,
                                                width: `${(width / imageSize.naturalWidth) * 100}%`,
                                                height: `${(height / imageSize.naturalHeight) * 100}%`,
                                            }}
                                            title={violation.help}
                                        >
                                            {isSelected && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={`absolute -top-6 left-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.badge} shadow-lg whitespace-nowrap`}
                                                >
                                                    {violation.impact} — {violation.id}
                                                </motion.div>
                                            )}
                                        </div>
                                    );
                                })
                        ))}
                    </div>
                </div>

                {/* Error Detail Panel */}
                <div className="rounded-2xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden self-start flex flex-col" style={{ maxHeight: '80vh' }}>
                    <div className="border-b border-slate-100 px-5 py-4 bg-slate-50 shrink-0">
                        <h3 className="font-serif text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <Eye size={18} className="text-indigo-600" />
                            Error Details
                        </h3>
                    </div>

                    <div className="overflow-y-auto px-5 py-4 flex-1 bg-slate-50/50" style={{ maxHeight: 'calc(80vh - 60px)' }}>
                        {selectedNode ? (() => {
                            const style = getImpactStyle(selectedNode.impact);
                            const specificNode = selectedNode.specificNode || {};
                            const failureLines = (specificNode.failureSummary || '')
                                .split('\n')
                                .map((line) => line.trim())
                                .filter(Boolean);
                            const failureTitle = failureLines[0] || '';
                            const failureItems = failureLines.slice(1);
                            
                            // Using the Context-Aware helper to get specific links and guidance
                            const enriched = getEnrichedDetails(selectedNode.id, specificNode.html);

                            return (
                                <motion.div
                                    key={selectedNode.uniqueKey}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="space-y-5 pb-4"
                                >
                                    {/* Card 1: Issue Context */}
                                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                        <div className="mb-3 flex items-start justify-between">
                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style.badge}`}>
                                                <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                                                {selectedNode.impact}
                                            </span>
                                            <span className="font-mono text-xs font-semibold text-slate-500">{selectedNode.id}</span>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-800 mb-4">{selectedNode.description}</p>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                                                <div className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold text-indigo-500 uppercase tracking-wide">
                                                    <ShieldCheck size={12} /> Criteria
                                                </div>
                                                <p className="text-xs font-semibold text-indigo-700 leading-snug">{enriched.wcagCriteria}</p>
                                            </div>
                                            <div className="rounded-lg bg-rose-50 p-3 border border-rose-100">
                                                <div className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold text-rose-500 uppercase tracking-wide">
                                                    <User size={12} /> Impact
                                                </div>
                                                <p className="text-xs text-rose-700 leading-snug">{enriched.userImpact}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card 2: Code & Analysis */}
                                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                        <div className="mb-3 flex items-center gap-2">
                                            <Code2 size={14} className="text-slate-500" />
                                            <h4 className="font-semibold text-slate-900 text-sm">Code & Analysis</h4>
                                        </div>

                                        {specificNode.html && (
                                            <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-[11px] text-emerald-400 font-mono leading-relaxed border border-slate-800 scrollbar-thin">
                                                {specificNode.html}
                                            </pre>
                                        )}

                                        {failureLines.length > 0 && (
                                            <div className="mt-3 bg-rose-50/80 rounded-lg p-3 border border-rose-100">
                                                <div className="flex items-start gap-2 mb-1.5">
                                                    <AlertTriangle size={14} className="text-rose-500 mt-0.5 shrink-0" />
                                                    <p className="text-xs font-bold text-rose-800 leading-snug">{failureTitle}</p>
                                                </div>
                                                {failureItems.length > 0 && (
                                                    <ul className="list-disc pl-7 space-y-1 text-xs text-rose-700 font-medium">
                                                        {failureItems.map((line, idx) => (
                                                            <li key={`fail-${idx}`}>{line}</li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Card 3: Expert Recommendations */}
                                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4 shadow-sm">
                                        <div className="mb-3 flex items-center gap-2">
                                            <Lightbulb size={14} className="text-amber-500" />
                                            <h4 className="font-semibold text-slate-900 text-sm">Action Plan</h4>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex gap-3">
                                                <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Primary Fix</p>
                                                    <p className="text-sm font-medium text-slate-800 leading-snug">{enriched.devRecommendation}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <div className="w-3.5 h-3.5 border-2 border-slate-300 rounded-full mt-1 shrink-0" />
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Alternative</p>
                                                    <p className="text-xs text-slate-600 leading-snug">{enriched.alternativeFix}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <a
                                            // Uses our enriched link first, fallback to generic Axe-core link if not found
                                            href={enriched.customHelpUrl || selectedNode.helpUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-white border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-sm transition"
                                        >
                                            <BookOpen size={14} />
                                            Read Official Guidelines
                                        </a>
                                    </div>
                                </motion.div>
                            );
                        })() : (
                            <div className="flex h-full flex-col items-center justify-center text-center py-10 opacity-70">
                                <div className="mb-6 relative">
                                    <div className="absolute inset-0 bg-indigo-200 blur-xl opacity-50 rounded-full"></div>
                                    <MousePointer2 size={40} className="text-indigo-500 relative z-10" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Select an Element</h3>
                                <p className="text-sm text-slate-500 max-w-[240px] leading-relaxed">
                                    Click any highlighted box on the image to pin and view its specific accessibility analysis.
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