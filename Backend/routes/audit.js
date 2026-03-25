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

  // ── Run audit ───────────────────────────────────────────────────────────
  try {
    const result = await runAudit(url, {
      maxDepth,
      maxPages,
      captureScreenshots: screenshots,
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
 * GET /api/audit/health
 * Simple health check for the audit service.
 */
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'audit' });
});

module.exports = router;