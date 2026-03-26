const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { randomUUID } = require('crypto');

const SHARE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_SHARED_REPORTS = 250;
const sharedReports = new Map();

function normalizeReport(reportInput = {}) {
  const input = reportInput || {};

  const get = (...keys) => {
    for (const k of keys) {
      if (input[k] !== undefined && input[k] !== null) return input[k];
    }
    return undefined;
  };

  return {
    title: get('title') || 'Accessibility Audit Report',
    url: get('url', 'sourceUrl', 'targetUrl') || 'Unknown URL',
    score: get('score', 'overallScore') || 0,
    totalErrors: get('totalErrors', 'totalFlaws') || 0,
    totalElementsScanned: get('totalElementsScanned', 'elementsScanned') || 0,
    domContentLoaded: get('domContentLoaded', 'domLoadTimeMs') || 0,
    pageCount: get('pageCount') || 0,
    generatedAt: get('generatedAt') || new Date().toLocaleString(),

    severityData: get('severityData', 'severity') || [],
    pourData: get('pourData', 'pour') || [],
    impactMatrix: get('impactMatrix', 'impact') || [],
    empathyMessages: get('empathyMessages') || [],
    elementDistribution: get('elementDistribution') || [],
    headingHierarchy: get('headingHierarchy') || [],
    perfTimeline: get('perfTimeline') || [],

    codeDiffOriginal: get('codeDiffOriginal') || (input.aiFixes ? input.aiFixes.original : null),
    codeDiffSuggested: get('codeDiffSuggested') || (input.aiFixes ? input.aiFixes.suggested : null),
  };
}

function safeNum(val) {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

function safeText(val) {
  if (val === undefined || val === null) return '';
  return String(val);
}

function safeArray(val) {
  return Array.isArray(val) ? val : [];
}

function clampScore(score) {
  return Math.max(0, Math.min(100, safeNum(score)));
}

function ensureSpace(doc, minHeight) {
  if (doc.y + minHeight > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }
}

function sectionTitle(doc, text) {
  ensureSpace(doc, 30);
  doc
    .font('Helvetica-Bold')
    .fontSize(16)
    .fillColor('#0f172a')
    .text(safeText(text), doc.page.margins.left, doc.y, {
      width: (doc.page.width - doc.page.margins.left - doc.page.margins.right) / 2,
      align: 'left',
    });
  doc.moveDown(0.35);
}

function drawBar(doc, x, y, width, height, ratio, fillColor) {
  const boundedRatio = Math.max(0, Math.min(1, ratio));
  // Background bar
  doc.fillColor('#e2e8f0').roundedRect(x, y, width, height, 3).fill();
  // Filled bar
  if (boundedRatio > 0) {
    doc.fillColor(fillColor || '#4f46e5').roundedRect(x, y, width * boundedRatio, height, 3).fill();
  }
}

function drawCodeBlock(doc, label, code, fillColor) {
  const content = safeText(code) || '-';
  const x = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  ensureSpace(doc, 120);
  
  // Label
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(fillColor)
    .text(label);
  doc.moveDown(0.3);

  // Calculate box height
  const textHeight = doc.heightOfString(content, {
    width: width - 20,
    align: 'left',
  });
  const boxH = Math.min(200, textHeight + 16);

  // Code box background
  const boxY = doc.y;
  doc.fillColor('#f8fafc').roundedRect(x, boxY, width, boxH, 6).fill();
  doc.strokeColor('#e2e8f0').lineWidth(1).roundedRect(x, boxY, width, boxH, 6).stroke();

  // Code text
  doc
    .font('Courier')
    .fontSize(9)
    .fillColor('#334155')
    .text(content, x + 10, boxY + 8, { width: width - 20, align: 'left' });

  doc.y = boxY + boxH + 10;
}

async function createPdfBuffer(reportInput) {
  const report = normalizeReport(reportInput);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
      const chunks = [];
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const left = doc.page.margins.left;

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.font('Helvetica-Bold').fontSize(26).fillColor('#0f172a').text(safeText(report.title), { align: 'center' });
      doc.moveDown(0.25);
      doc.font('Helvetica').fontSize(11).fillColor('#475569').text(`Target URL: ${safeText(report.url)}`, { align: 'center' });
      doc.text(`Generated: ${safeText(report.generatedAt)}`, { align: 'center' });
      doc.moveDown(1);

      // Executive summary card
      ensureSpace(doc, 120);
      const cardY = doc.y;
      const cardH = 100;
      const cardMargin = 15;
      
      // Draw card background
      doc.fillColor('#f8fafc').roundedRect(left, cardY, pageWidth, cardH, 8).fill();
      doc.strokeColor('#cbd5e1').lineWidth(1.5).roundedRect(left, cardY, pageWidth, cardH, 8).stroke();

      // Draw metrics inside card
      const metrics = [
        { label: 'Overall Score', value: safeNum(report.score), color: '#1d4ed8' },
        { label: 'Total Issues', value: safeNum(report.totalErrors), color: '#dc2626' },
        { label: 'Elements Scanned', value: safeNum(report.totalElementsScanned), color: '#2563eb' },
        { label: 'DOM Load (ms)', value: safeNum(report.domContentLoaded), color: '#0f766e' },
      ];

      const colW = pageWidth / metrics.length;
      const valueY = cardY + 15;
      const labelY = cardY + 55;

      metrics.forEach((metric, i) => {
        const colX = left + i * colW;
        // Value (large number)
        doc
          .fillColor(metric.color)
          .fontSize(32)
          .font('Helvetica-Bold')
          .text(safeText(metric.value), colX + cardMargin, valueY, {
            width: colW - 2 * cardMargin,
            align: 'center',
          });
        // Label
        doc
          .fillColor('#64748b')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(metric.label, colX + cardMargin, labelY, {
            width: colW - 2 * cardMargin,
            align: 'center',
          });
      });

      doc.y = cardY + cardH + 15;
      doc.fillColor('#0f172a');

      // Severity breakdown
      sectionTitle(doc, '1. Severity Breakdown');
      const severity = safeArray(report.severityData);
      const totalSeverity = severity.reduce((sum, s) => sum + safeNum(s.value), 0);
      if (severity.length === 0) {
        doc.font('Helvetica').fontSize(11).fillColor('#64748b').text('No severity data available.');
      } else {
        severity.forEach((item) => {
          ensureSpace(doc, 20);
          const value = safeNum(item.value);
          const percent = totalSeverity > 0 ? Math.round((value / totalSeverity) * 100) : 0;
          doc
            .font('Helvetica')
            .fontSize(11)
            .fillColor(item.color || '#334155')
            .text(`- ${safeText(item.name)}: ${value} issues (${percent}%)`);
        });
      }
      doc.moveDown(1);

      // POUR scores
      sectionTitle(doc, '2. WCAG POUR Score');
      const pour = safeArray(report.pourData);
      if (pour.length === 0) {
        doc.font('Helvetica').fontSize(11).fillColor('#64748b').text('No POUR data available.');
      } else {
        pour.forEach((item, idx) => {
          ensureSpace(doc, 24);
          const score = clampScore(item.score);
          
          const labelWidth = 140;
          const barX = left + labelWidth + 15;
          const barWidth = pageWidth - labelWidth - 100;
          const scoreX = left + pageWidth - 85;
          const rowH = 20;
          const rowY = doc.y;
          
          // Dimension label
          doc
            .font('Helvetica-Bold')
            .fontSize(11)
            .fillColor('#1e293b')
            .text(safeText(item.dimension), left, rowY, { width: labelWidth - 5 });
          
          // Progress bar
          drawBar(doc, barX, rowY + 4, barWidth, 12, score / 100, '#6366f1');
          
          // Score value
          doc
            .font('Helvetica-Bold')
            .fontSize(11)
            .fillColor('#4f46e5')
            .text(`${Math.round(score)}/100`, scoreX, rowY, { width: 80, align: 'right' });
          
          doc.y = rowY + rowH;
        });
      }
      doc.moveDown(1);

      // Impact matrix
      sectionTitle(doc, '3. User Impact Analysis');
      const impact = safeArray(report.impactMatrix);
      if (impact.length === 0) {
        doc.font('Helvetica').fontSize(11).fillColor('#64748b').text('No impact analysis available.');
      } else {
        impact.forEach((bucket) => {
          ensureSpace(doc, 70);
          const score = clampScore(bucket.value);
          const sectionY = doc.y;
          
          // Label + Score on same line
          doc
            .font('Helvetica-Bold')
            .fontSize(13)
            .fillColor('#1e293b')
            .text(safeText(bucket.label), left, sectionY, { width: 200 });
          
          doc
            .font('Helvetica')
            .fontSize(10)
            .fillColor('#64748b')
            .text(`Impact score: ${Math.round(score)}%`, left + 200, sectionY, { width: pageWidth - 200, align: 'right' });
          
          doc.moveDown(0.8);
          
          // Progress bar
          const barY = doc.y;
          drawBar(doc, left, barY, pageWidth, 10, score / 100, bucket.color || '#2563eb');
          doc.y = barY + 18;
          
          // Reasons
          const reasons = safeArray(bucket.reasons).slice(0, 4);
          if (reasons.length === 0) {
            doc
              .font('Helvetica')
              .fontSize(10)
              .fillColor('#059669')
              .text('No major issues detected for this category.', left + 10);
          } else {
            reasons.forEach((reason) => {
              ensureSpace(doc, 16);
              const msg = typeof reason === 'string' ? reason : safeText(reason.message);
              const count = typeof reason === 'object' && reason !== null ? safeNum(reason.count) : 0;
              const wcag = typeof reason === 'object' && reason !== null ? safeText(reason.wcag) : '';
              const suffix = wcag ? `, WCAG ${wcag}` : '';
              doc
                .font('Helvetica')
                .fontSize(10)
                .fillColor('#64748b')
                .text(`• ${msg} (${count}${suffix})`, left + 10);
            });
          }
          
          doc.moveDown(0.6);
        });
      }
      doc.moveDown(0.5);

      // Empathy summary
      doc.moveDown(0.5);
      sectionTitle(doc, '4. Empathy Summary');
      const empathy = safeArray(report.empathyMessages);
      if (empathy.length === 0) {
        doc.font('Helvetica').fontSize(11).fillColor('#64748b').text('No empathy summary generated.');
      } else {
        empathy.forEach((msg) => {
          ensureSpace(doc, 50);
          const boxY = doc.y;
          const boxH = 40;
          
          // Box background
          doc.fillColor('#f8fafc').roundedRect(left, boxY, pageWidth, boxH, 6).fill();
          doc.strokeColor('#e2e8f0').lineWidth(1).roundedRect(left, boxY, pageWidth, boxH, 6).stroke();
          
          // Text inside box
          doc
            .font('Helvetica-Oblique')
            .fontSize(10)
            .fillColor('#334155')
            .text(`"${safeText(msg)}"`, left + 12, boxY + 10, { width: pageWidth - 24, align: 'left' });
          
          doc.y = boxY + boxH + 8;
        });
      }
      doc.moveDown(0.3);

      // Remediation example
      if (safeText(report.codeDiffOriginal) || safeText(report.codeDiffSuggested)) {
        doc.moveDown(0.7);
        sectionTitle(doc, '5. Automated Remediation Example');
        drawCodeBlock(doc, 'Detected snippet', report.codeDiffOriginal || '-', '#b91c1c');
        drawCodeBlock(doc, 'Suggested fix', report.codeDiffSuggested || '-', '#15803d');
      }

      // Additional appendix with all available model sections
      const elements = safeArray(report.elementDistribution);
      if (elements.length > 0) {
        doc.moveDown(0.5);
        sectionTitle(doc, 'Appendix A. Element Distribution');
        elements.forEach((item) => {
          ensureSpace(doc, 14);
          doc
            .font('Helvetica')
            .fontSize(10)
            .fillColor('#475569')
            .text(`• ${safeText(item.name)}: ${safeNum(item.value)}`, left + 10);
        });
      }

      const headings = safeArray(report.headingHierarchy);
      if (headings.length > 0) {
        doc.moveDown(0.5);
        sectionTitle(doc, 'Appendix B. Heading Hierarchy');
        headings.forEach((item) => {
          ensureSpace(doc, 14);
          doc
            .font('Helvetica')
            .fontSize(10)
            .fillColor('#475569')
            .text(`• ${safeText(item.level)}: ${safeNum(item.count)}`, left + 10);
        });
      }

      const perf = safeArray(report.perfTimeline);
      if (perf.length > 0) {
        doc.moveDown(0.5);
        sectionTitle(doc, 'Appendix C. Performance Timeline');
        perf.forEach((item) => {
          ensureSpace(doc, 14);
          doc
            .font('Helvetica')
            .fontSize(10)
            .fillColor('#475569')
            .text(`• ${safeText(item.stage)}: ${safeNum(item.value)} ms`, left + 10);
        });
      }

      // Footer on all pages
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        const footerY = doc.page.height - 30;
        
        // Footer divider line
        doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(left, footerY - 5).lineTo(left + pageWidth, footerY - 5).stroke();
        
        // Footer text
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#94a3b8')
          .text('Generated by Accessibility AI', left, footerY, { width: pageWidth / 2 });
        
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#94a3b8')
          .text(`Page ${i + 1} of ${pageCount}`, left + pageWidth / 2, footerY, { width: pageWidth / 2, align: 'right' });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// Keep Excel simple for now, can be improved later
async function createExcelBuffer(reportInput) {
    const report = normalizeReport(reportInput);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Accessibility Report');
    
    worksheet.columns = [
        { header: 'Type', key: 'type', width: 20 },
        { header: 'Detail', key: 'detail', width: 80 },
        { header: 'Value', key: 'value', width: 20 },
    ];
    
    worksheet.addRow({ type: 'Meta', detail: 'URL', value: report.url });
    worksheet.addRow({ type: 'Meta', detail: 'Score', value: report.score });
    worksheet.addRow({ type: 'Meta', detail: 'Total Issues', value: report.totalErrors });
    
    report.severityData.forEach(s => {
        worksheet.addRow({ type: 'Severity', detail: s.name, value: s.value });
    });
    
    report.pourData.forEach(p => {
        worksheet.addRow({ type: 'POUR', detail: p.dimension, value: p.score });
    });

    return workbook.xlsx.writeBuffer();
}

async function saveSharedReport(report) {
    const id = randomUUID();
    sharedReports.set(id, {
        report,
        expiresAt: Date.now() + SHARE_TTL_MS
    });
    
    // Pruning
    if (sharedReports.size > MAX_SHARED_REPORTS) {
        const firstKey = sharedReports.keys().next().value;
        sharedReports.delete(firstKey);
    }
    
    return { shareId: id }; // Return object to match expected interface
}

async function getSharedReport(id) {
    const entry = sharedReports.get(id);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        sharedReports.delete(id);
        return null;
    }
    return entry.report;
}

module.exports = {
  createPdfBuffer,
  createExcelBuffer,
  saveSharedReport,
  getSharedReport,
};
