const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { randomUUID } = require('crypto');

const SHARE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_SHARED_REPORTS = 250;
const sharedReports = new Map();

function normalizeReport(reportInput = {}) {
  const report = typeof reportInput === 'object' && reportInput !== null ? reportInput : {};

  return {
    title: stringValue(report.title, 'Accessibility AI Report'),
    sourceUrl: stringValue(report.sourceUrl, 'Unknown URL'),
    generatedAt: stringValue(report.generatedAt, new Date().toISOString()),
    scanStatus: stringValue(report.scanStatus, 'UNKNOWN'),
    overallScore: numberValue(report.overallScore),
    totalFlaws: numberValue(report.totalFlaws),
    domLoadTimeMs: numberValue(report.domLoadTimeMs),
    elementsScanned: numberValue(report.elementsScanned),
    pageCount: numberValue(report.pageCount),
    severity: arrayValue(report.severity).map((item) => ({
      name: stringValue(item?.name),
      value: numberValue(item?.value),
    })),
    pour: arrayValue(report.pour).map((item) => ({
      dimension: stringValue(item?.dimension),
      score: numberValue(item?.score),
    })),
    impact: arrayValue(report.impact).map((item) => ({
      label: stringValue(item?.label),
      value: numberValue(item?.value),
    })),
    pageSummaries: arrayValue(report.pageSummaries).map((item) => ({
      url: stringValue(item?.url),
      issues: numberValue(item?.issues),
      incomplete: numberValue(item?.incomplete),
      domContentLoaded: numberValue(item?.domContentLoaded),
    })),
    aiFixes: {
      original: stringValue(report?.aiFixes?.original),
      suggested: stringValue(report?.aiFixes?.suggested),
    },
  };
}

async function createPdfBuffer(reportInput) {
  const report = normalizeReport(reportInput);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text(report.title, { underline: true });
    doc.moveDown(0.6);
    doc.fontSize(11).text(`Generated: ${report.generatedAt}`);
    doc.text(`Target URL: ${report.sourceUrl}`);
    doc.text(`Scan Status: ${report.scanStatus}`);
    doc.moveDown(0.5);

    doc.fontSize(14).text('Key Metrics');
    doc.fontSize(11);
    doc.text(`Overall Score: ${report.overallScore}`);
    doc.text(`Total Flaws: ${report.totalFlaws}`);
    doc.text(`DOM Load Time: ${report.domLoadTimeMs} ms`);
    doc.text(`Elements Scanned: ${report.elementsScanned}`);
    doc.text(`Pages Crawled: ${report.pageCount}`);

    doc.moveDown(0.7);
    doc.fontSize(14).text('Severity Breakdown');
    doc.fontSize(11);
    report.severity.forEach((row) => {
      doc.text(`- ${row.name}: ${row.value}`);
    });

    doc.moveDown(0.7);
    doc.fontSize(14).text('User Impact');
    doc.fontSize(11);
    report.impact.forEach((row) => {
      doc.text(`- ${row.label}: ${row.value}%`);
    });

    doc.moveDown(0.7);
    doc.fontSize(14).text('P.O.U.R Dimensions');
    doc.fontSize(11);
    report.pour.forEach((row) => {
      doc.text(`- ${row.dimension}: ${row.score}`);
    });

    if (report.pageSummaries.length > 0) {
      doc.moveDown(0.7);
      doc.fontSize(14).text('Page Summary');
      doc.fontSize(10);
      report.pageSummaries.slice(0, 20).forEach((page, index) => {
        doc.text(
          `${index + 1}. ${page.url || 'Unknown'} | issues: ${page.issues}, incomplete: ${page.incomplete}, dom: ${page.domContentLoaded} ms`
        );
      });
    }

    if (report.aiFixes.original || report.aiFixes.suggested) {
      doc.moveDown(0.7);
      doc.fontSize(14).text('AI Suggested Fixes');
      doc.fontSize(10).text('Detected snippet:');
      doc.fontSize(9).text(report.aiFixes.original || '-', { width: 510 });
      doc.moveDown(0.3);
      doc.fontSize(10).text('Suggested snippet:');
      doc.fontSize(9).text(report.aiFixes.suggested || '-', { width: 510 });
    }

    doc.end();
  });
}

async function createExcelBuffer(reportInput) {
  const report = normalizeReport(reportInput);
  const workbook = new ExcelJS.Workbook();

  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 45 },
  ];
  summarySheet.addRows([
    { metric: 'Generated At', value: report.generatedAt },
    { metric: 'Target URL', value: report.sourceUrl },
    { metric: 'Scan Status', value: report.scanStatus },
    { metric: 'Overall Score', value: report.overallScore },
    { metric: 'Total Flaws', value: report.totalFlaws },
    { metric: 'DOM Load Time (ms)', value: report.domLoadTimeMs },
    { metric: 'Elements Scanned', value: report.elementsScanned },
    { metric: 'Pages Crawled', value: report.pageCount },
  ]);

  const severitySheet = workbook.addWorksheet('Severity');
  severitySheet.columns = [
    { header: 'Severity', key: 'name', width: 24 },
    { header: 'Count', key: 'value', width: 16 },
  ];
  report.severity.forEach((row) => severitySheet.addRow(row));

  const impactSheet = workbook.addWorksheet('Impact');
  impactSheet.columns = [
    { header: 'Category', key: 'label', width: 24 },
    { header: 'Score (%)', key: 'value', width: 16 },
  ];
  report.impact.forEach((row) => impactSheet.addRow(row));

  const pagesSheet = workbook.addWorksheet('Pages');
  pagesSheet.columns = [
    { header: 'URL', key: 'url', width: 60 },
    { header: 'Issue Nodes', key: 'issues', width: 14 },
    { header: 'Incomplete Rules', key: 'incomplete', width: 16 },
    { header: 'DOM Loaded (ms)', key: 'domContentLoaded', width: 16 },
  ];
  report.pageSummaries.forEach((row) => pagesSheet.addRow(row));

  const aiSheet = workbook.addWorksheet('AI Fixes');
  aiSheet.columns = [
    { header: 'Type', key: 'type', width: 24 },
    { header: 'Code', key: 'code', width: 120 },
  ];
  aiSheet.addRows([
    { type: 'Detected', code: report.aiFixes.original || '-' },
    { type: 'Suggested', code: report.aiFixes.suggested || '-' },
  ]);

  return workbook.xlsx.writeBuffer();
}

function saveSharedReport(reportInput) {
  pruneExpired();
  enforceSizeLimit();

  const report = normalizeReport(reportInput);
  const shareId = randomUUID();
  const sharedAt = Date.now();
  const expiresAt = sharedAt + SHARE_TTL_MS;

  sharedReports.set(shareId, {
    report,
    sharedAt,
    expiresAt,
  });

  return {
    shareId,
    sharedAt,
    expiresAt,
  };
}

function getSharedReport(shareId) {
  if (!shareId || typeof shareId !== 'string') {
    return null;
  }

  pruneExpired();
  const entry = sharedReports.get(shareId);
  if (!entry) {
    return null;
  }

  return {
    report: entry.report,
    sharedAt: new Date(entry.sharedAt).toISOString(),
    expiresAt: new Date(entry.expiresAt).toISOString(),
  };
}

function pruneExpired() {
  const now = Date.now();
  for (const [id, entry] of sharedReports.entries()) {
    if (!entry || now >= entry.expiresAt) {
      sharedReports.delete(id);
    }
  }
}

function enforceSizeLimit() {
  if (sharedReports.size < MAX_SHARED_REPORTS) {
    return;
  }

  const ordered = [...sharedReports.entries()].sort((a, b) => a[1].sharedAt - b[1].sharedAt);
  const removeCount = sharedReports.size - MAX_SHARED_REPORTS + 1;

  for (let i = 0; i < removeCount; i += 1) {
    sharedReports.delete(ordered[i][0]);
  }
}

function arrayValue(value) {
  return Array.isArray(value) ? value : [];
}

function numberValue(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function stringValue(value, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

module.exports = {
  createPdfBuffer,
  createExcelBuffer,
  saveSharedReport,
  getSharedReport,
};
