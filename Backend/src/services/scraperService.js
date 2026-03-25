/**
 * scraperService.js
 *
 * THE ORCHESTRATOR — ties all modules together.
 *
 * Responsible for:
 *  - Accepting a start URL + options from the API layer
 *  - Initializing Crawler, Renderer, Extractor, Monitors, Screenshotter
 *  - Running the crawl loop
 *  - Assembling per-page results into a structured audit object
 *  - Returning the final result to the caller (route handler)
 *
 * NOT responsible for:
 *  - HTTP routing (Express handles that)
 *  - Saving to DB (caller does that)
 *  - Accessibility scoring (a separate scorer module does that)
 *  - Any UI rendering
 */

const Crawler       = require('../crawler/crawler');
const Renderer      = require('../renderer/renderer');
const Extractor     = require('../extractor/extractor');
const ConsoleMonitor  = require('../monitors/consoleMonitor');
const NetworkMonitor  = require('../monitors/networkMonitor');
const Screenshotter = require('../screenshot/screenshot');

const DEFAULT_OPTIONS = {
  maxDepth: 2,
  maxPages: 20,
  captureScreenshots: true,
  screenshotDir: './output/screenshots',
};

/**
 * Run a full accessibility audit crawl starting from `startUrl`.
 *
 * @param {string} startUrl   - The seed URL
 * @param {object} userOptions - Override defaults
 * @returns {Promise<AuditResult>}
 */
async function runAudit(startUrl, userOptions = {}) {
  const options = { ...DEFAULT_OPTIONS, ...userOptions };

  // ── Initialize modules ────────────────────────────────────────────────────
  const crawler      = new Crawler(startUrl, { maxDepth: options.maxDepth, maxPages: options.maxPages });
  const renderer     = new Renderer();
  const extractor    = new Extractor();
  const screenshotter = options.captureScreenshots
    ? new Screenshotter(options.screenshotDir)
    : null;

  const auditStartTime = Date.now();
  const pageResults = [];
  const errors = [];

  // ── Launch browser once for entire crawl ──────────────────────────────────
  await renderer.launch();

  // ── Seed the crawler ──────────────────────────────────────────────────────
  crawler.seed();

  // ── Crawl loop ────────────────────────────────────────────────────────────
  while (crawler.hasNext()) {
    const { url, depth } = crawler.next();
    console.log(`[ScraperService] Crawling (depth=${depth}): ${url}`);

    // Fresh monitors per page — never reuse across pages
    const consoleMonitor = new ConsoleMonitor();
    const networkMonitor = new NetworkMonitor();

    let context = null;

    try {
      // 1. Open page + attach monitors BEFORE navigation
      const { page, context: ctx, timings } = await renderer.renderPage(url);
      context = ctx;

      // Attach monitors retroactively — Playwright buffers some events,
      // but for best coverage, refactor renderer to accept pre-attach hooks
      // if you need every single early event.
      consoleMonitor.attach(page);
      networkMonitor.attach(page);

      // 2. Extract DOM/accessibility data
      const domData = await extractor.extract(page);

      // 3. Screenshot
      let screenshotResult = null;
      if (screenshotter) {
        screenshotResult = await screenshotter.capture(page, url);
      }

      // 4. Feed discovered links back to crawler
      const hrefs = domData.links.map(l => l.href).filter(Boolean);
      crawler.enqueueLinks(hrefs, depth);

      // 5. Assemble page result
      pageResults.push({
        url,
        depth,
        timings,
        ...domData,
        screenshot: screenshotResult,
        console: consoleMonitor.getSummary(),
        network: networkMonitor.getSummary(),
        crawledAt: new Date().toISOString(),
      });

    } catch (err) {
      console.error(`[ScraperService] Failed on ${url}: ${err.message}`);
      errors.push({ url, error: err.message, depth });
    } finally {
      // Always close the context to free browser memory
      if (context) await renderer.closeContext(context);
    }
  }

  // ── Shut down browser ─────────────────────────────────────────────────────
  await renderer.close();

  // ── Assemble final audit result ───────────────────────────────────────────
  return {
    auditId: generateAuditId(),
    startUrl,
    options,
    summary: {
      totalPagesCrawled: pageResults.length,
      totalErrors: errors.length,
      durationMs: Date.now() - auditStartTime,
      startedAt: new Date(auditStartTime).toISOString(),
      completedAt: new Date().toISOString(),
    },
    pages: pageResults,
    errors,
  };
}

/**
 * Simple audit ID generator.
 * Replace with UUID library (uuid npm package) in production.
 */
function generateAuditId() {
  return `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

module.exports = { runAudit };
