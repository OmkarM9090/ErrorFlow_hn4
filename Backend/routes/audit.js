/**
 * routes/audit.js
 *
 * Express route for triggering an accessibility audit.
 *
 * POST /api/audit
 * Body: { url: string, maxDepth?: number, maxPages?: number, screenshots?: boolean }
 *
 * Keeps route handler thin:
 *  - Validate input
 *  - Call the service
 *  - Return structured JSON
 *  - Handle errors with proper HTTP status codes
 */

const express = require('express');
const router = express.Router();
const { runAudit } = require('../src/services/scraperService');
const { isValidUrl } = require('../utils/routeValidation');
const {
  createPdfBuffer,
  createExcelBuffer,
  saveSharedReport,
  getSharedReport,
} = require('../src/services/reportExportService');
const { generateAIInsights } = require('../controllers/insightsEngine');

/**
 * POST /api/audit
 *
 * Kicks off a full accessibility audit crawl.
 * This is synchronous for now — for production, move to a job queue (Bull, BullMQ)
 * and return a job ID immediately, then poll for results.
 */
router.post('/', async (req, res) => {
  const {
    url,
    maxDepth = 2,
    maxPages = 20,
    screenshots = true,
    standard = 'WCAG2AA', // Default standard
  } = req.body;

  // ── Input validation ────────────────────────────────────────────────────
  if (!url || typeof url !== 'string') {
    return res.status(400).json({
      error: 'Missing required field: url (string)',
    });
  }

  if (!isValidUrl(url)) {
    return res.status(400).json({
      error: 'Invalid URL. Must be an absolute http:// or https:// URL.',
    });
  }

  if (typeof maxDepth !== 'number' || maxDepth < 1 || maxDepth > 5) {
    return res.status(400).json({
      error: 'maxDepth must be a number between 1 and 5.',
    });
  }

  if (typeof maxPages !== 'number' || maxPages < 1 || maxPages > 100) {
    return res.status(400).json({
      error: 'maxPages must be a number between 1 and 100.',
    });
  } 

  // Map standard to axe-core tags
  let runOnly = ['wcag2a', 'wcag2aa', 'best-practice'];
  const std = standard.toUpperCase();
  
  if (std === 'WCAG2AAA') {
    runOnly = ['wcag2a', 'wcag2aa', 'wcag2aaa'];
  } else if (std === 'SECTION508') {
    runOnly = ['section508'];
  } else if (std === 'EN301549') {
    runOnly = ['wcag2a', 'wcag2aa', 'best-practice']; // EN 301 549 maps mostly to WCAG 2.1 AA
  }

  // ── Run audit ───────────────────────────────────────────────────────────
  try {
    const result = await runAudit(url, {
      maxDepth,
      maxPages,
      captureScreenshots: screenshots,
      standard, // Pass the standard to the service
      axe: {
        runOnly,
      }
    });

    return res.status(200).json(result);

  } catch (err) {
    console.error('[Route /api/audit] Unhandled error:', err);
    return res.status(500).json({
      error: 'Audit failed due to an internal error.',
      detail: err.message,
    });
  }
});

/**
 * POST /api/audit/export/pdf
 * Exports a normalized report payload as a PDF file.
 */
router.post('/export/pdf', async (req, res) => {
  try {
    const report = req.body?.report;
    if (!report || typeof report !== 'object') {
      return res.status(400).json({
        error: 'Missing required field: report (object)',
      });
    }

    const pdfBuffer = await createPdfBuffer(report);
    const filename = `accessibility-report-${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(pdfBuffer);
  } catch (err) {
    console.error('[Route /api/audit/export/pdf] Unhandled error:', err);
    return res.status(500).json({
      error: 'Unable to generate PDF report.',
      detail: err.message,
    });
  }
});

/**
 * POST /api/audit/export/excel
 * Exports a normalized report payload as an XLSX file.
 */
router.post('/export/excel', async (req, res) => {
  try {
    const report = req.body?.report;
    if (!report || typeof report !== 'object') {
      return res.status(400).json({
        error: 'Missing required field: report (object)',
      });
    }

    const excelBuffer = await createExcelBuffer(report);
    const filename = `accessibility-report-${Date.now()}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(excelBuffer);
  } catch (err) {
    console.error('[Route /api/audit/export/excel] Unhandled error:', err);
    return res.status(500).json({
      error: 'Unable to generate Excel report.',
      detail: err.message,
    });
  }
});

/**
 * POST /api/audit/share
 * Creates an expiring share ID for a report payload.
 */
router.post('/share', (req, res) => {
  try {
    const report = req.body?.report;
    if (!report || typeof report !== 'object') {
      return res.status(400).json({
        error: 'Missing required field: report (object)',
      });
    }

    const shared = saveSharedReport(report);
    const frontendBaseUrl = (process.env.FRONTEND_BASE_URL || req.headers.origin || '').replace(/\/$/, '');
    const shareUrl = frontendBaseUrl
      ? `${frontendBaseUrl}/?sharedReport=${shared.shareId}`
      : `/api/audit/share/${shared.shareId}`;

    return res.status(201).json({
      shareId: shared.shareId,
      shareUrl,
      expiresAt: new Date(shared.expiresAt).toISOString(),
    });
  } catch (err) {
    console.error('[Route /api/audit/share] Unhandled error:', err);
    return res.status(500).json({
      error: 'Unable to create share link.',
      detail: err.message,
    });
  }
});

/**
 * GET /api/audit/share/:shareId
 * Fetches a shared report by share ID.
 */
router.get('/share/:shareId', (req, res) => {
  const { shareId } = req.params;
  const shared = getSharedReport(shareId);

  if (!shared) {
    return res.status(404).json({
      error: 'Shared report not found or expired.',
    });
  }

  return res.status(200).json(shared);
});

/**
 * POST /api/audit/insights
 * Generates AI-powered accessibility insights from audit data using Gemini.
 */
router.post('/insights', generateAIInsights);

/**
 * GET /api/audit/health
 * Simple health check for the audit service.
 */
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'audit' });
});

module.exports = router;