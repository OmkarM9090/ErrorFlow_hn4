// src/utils/dashboardModel.js

export const severityColors = {
  critical: '#e11d48',
  serious: '#f97316',
  moderate: '#eab308',
  minor: '#3b82f6',
  pass: '#10b981',
};

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const ringColorByScore = (score) => {
  if (score >= 90) return severityColors.pass;
  if (score >= 75) return severityColors.minor;
  if (score >= 60) return severityColors.moderate;
  if (score >= 40) return severityColors.serious;
  return severityColors.critical;
};

export const buildDashboardModel = (auditData, simulateErrors) => {
  const summaryData = auditData?.summary || {};
  const accessSummary = summaryData.accessibility || {};
  const page = auditData?.pages?.[0] || {};
  const axeResults = page.axeResults || {};
  const startUrl = auditData?.startUrl || page.url || "Unknown URL";

  const headings = Array.isArray(page.headings) ? page.headings : [];
  const images = Array.isArray(page.images) ? page.images : [];
  const buttons = Array.isArray(page.buttons) ? page.buttons : [];
  const links = Array.isArray(page.links) ? page.links : [];

  const h1 = headings.filter((h) => toNumber(h?.level) === 1).length;
  const h2 = headings.filter((h) => toNumber(h?.level) === 2).length;
  const h3 = headings.filter((h) => toNumber(h?.level) === 3).length;

  const critical = simulateErrors ? Math.max(accessSummary.critical || 0, 4) : toNumber(accessSummary.critical);
  const serious = simulateErrors ? Math.max(accessSummary.serious || 0, 7) : toNumber(accessSummary.serious);
  const moderate = simulateErrors ? Math.max(accessSummary.moderate || 0, 9) : toNumber(accessSummary.moderate);
  const minor = simulateErrors ? Math.max(accessSummary.minor || 0, 12) : toNumber(accessSummary.minor);

  const totalErrors = simulateErrors 
    ? Math.max(accessSummary.totalViolationNodes || 0, 15) 
    : toNumber(accessSummary.totalViolationNodes);

  // Scoring Logic
  const totalPenalty = (critical * 4) + (serious * 2) + (moderate * 0.5) + (minor * 0.1);
  const computedScore = simulateErrors ? 72 : Math.max(0, Math.min(100, Math.round(100 - totalPenalty)));

  const domContentLoaded = toNumber(page.timings?.domContentLoaded, 0);
  const ttfb = toNumber(page.timings?.ttfb, 0);
  const load = toNumber(page.timings?.load, domContentLoaded);
  const totalElementsScanned = headings.length + images.length + buttons.length + links.length;

  // Chart Data Arrays
  const severityData = [
    { name: 'Critical', value: critical, color: severityColors.critical },
    { name: 'Serious', value: serious, color: severityColors.serious },
    { name: 'Moderate', value: moderate, color: severityColors.moderate },
    { name: 'Minor', value: minor, color: severityColors.minor },
  ];

  const pourData = [
    { dimension: 'Perceivable', score: Math.max(0, Math.round(100 - (critical * 3) - (serious * 1.5))) },
    { dimension: 'Operable', score: Math.max(0, Math.round(100 - (serious * 2.5) - (moderate * 0.5))) },
    { dimension: 'Understandable', score: Math.max(0, Math.round(100 - (moderate * 1) - (minor * 0.5))) },
    { dimension: 'Robust', score: Math.max(0, Math.round(100 - (critical * 2) - (minor * 0.5))) },
  ];

  const impactMatrix = [
    { label: 'Visual', value: Math.max(0, Math.round(100 - (critical * 3) - (serious * 2))), color: '#e11d48' },
    { label: 'Motor', value: Math.max(0, Math.round(100 - (serious * 2) - (moderate * 0.5))), color: '#f97316' },
    { label: 'Cognitive', value: Math.max(0, Math.round(100 - (moderate * 1) - (minor * 0.5))), color: '#eab308' },
    { label: 'Auditory', value: Math.max(0, Math.round(100 - (minor * 1))), color: '#3b82f6' },
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

  const empathyMessages = [];
  const rules = accessSummary.issuesPerRule || {};
  if (rules['button-name']) empathyMessages.push(`Screen reader users are confused by ${rules['button-name'].count} button(s) lacking an accessible name.`);
  if (rules['color-contrast']) empathyMessages.push(`Visually impaired users struggle to read text on ${rules['color-contrast'].count} element(s) due to low contrast.`);
  if (rules['link-name']) empathyMessages.push(`Users relying on assistive tech cannot determine the destination of ${rules['link-name'].count} link(s).`);
  if (rules['region'] || rules['landmark-one-main']) empathyMessages.push(`Keyboard navigators miss crucial page structure because landmarks are missing or misconfigured.`);
  if (empathyMessages.length === 0) empathyMessages.push("Your website is generally accessible, providing a good baseline experience for disabled users.");

  let codeDiffOriginal = `<img src="profile.jpg">\n<button></button>\n<a href="/contact"></a>`;
  let codeDiffSuggested = `<img src="profile.jpg" alt="Team profile">\n<button aria-label="Open menu">Menu</button>\n<a href="/contact" aria-label="Contact support">Contact</a>`;

  if (axeResults.violations && axeResults.violations.length > 0) {
    const sampleViolation = axeResults.violations.find(v => v.nodes && v.nodes.length > 0);
    if (sampleViolation) {
      const node = sampleViolation.nodes[0];
      codeDiffOriginal = node.html || codeDiffOriginal;
      if (sampleViolation.id === 'button-name') codeDiffSuggested = codeDiffOriginal.replace('>', ' aria-label="Descriptive action">');
      else if (sampleViolation.id === 'link-name') codeDiffSuggested = codeDiffOriginal.replace('>', ' aria-label="Link destination">');
      else codeDiffSuggested = `\n${codeDiffOriginal}`;
    }
  }

  return {
    url: startUrl,
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