/**
 * scraperService.js (updated)
 *
 * Changes from previous version:
 *  - Imports prepareAxe in addition to runAxe
 *  - Creates page context manually (instead of via renderer.renderPage)
 *    so we can call prepareAxe(page) BEFORE page.goto()
 *  - Adds bypassCSP: true to every context
 *
 * Correct call order for CSP bypass:
 *   1. browser.newContext({ bypassCSP: true })
 *   2. context.newPage()
 *   3. prepareAxe(page)      ← registers axe as init script (pre-navigation)
 *   4. page.goto(url)        ← axe loads before page JS; CSP is irrelevant
 *   5. runAxe(page, options) ← axe.run() succeeds
 */

const Crawler        = require('../crawler/crawler');
const Renderer       = require('../renderer/renderer');
const Extractor      = require('../extractor/extractor');
const ConsoleMonitor = require('../monitors/consoleMonitor');
const NetworkMonitor = require('../monitors/networkMonitor');
const Screenshotter  = require('../screenshot/screenshot');
const { runAxe, prepareAxe } = require('../axe/axeRunner');

const DEFAULT_OPTIONS = {
  maxDepth:           2,
  maxPages:           20,
  captureScreenshots: true,
  screenshotDir:      './output/screenshots',
  axe: {
    runOnly:           ['wcag2a', 'wcag2aa'],
    disabledRules:     [],
    includeIncomplete: false,
    includePasses:     false,
  },
};

async function runAudit(startUrl, userOptions = {}) {
  const options = {
    ...DEFAULT_OPTIONS,
    ...userOptions,
    axe: { ...DEFAULT_OPTIONS.axe, ...(userOptions.axe || {}) },
  };

  const crawler      = new Crawler(startUrl, { maxDepth: options.maxDepth, maxPages: options.maxPages });
  const renderer     = new Renderer();
  const extractor    = new Extractor();
  const screenshotter = options.captureScreenshots
    ? new Screenshotter(options.screenshotDir)
    : null;

  const auditStartTime = Date.now();
  const pageResults    = [];
  const errors         = [];

  await renderer.launch();
  crawler.seed();

  while (crawler.hasNext()) {
    const { url, depth } = crawler.next();
    console.log(`[ScraperService] Crawling (depth=${depth}): ${url}`);

    const consoleMonitor = new ConsoleMonitor();
    const networkMonitor = new NetworkMonitor();
    let context = null;

    try {
      // ── Create context + page manually so we can inject axe before goto ──
      context = await renderer.browser.newContext({
        userAgent: 'Mozilla/5.0 (compatible; AccessibilityAuditBot/1.0; +https://yourdomain.com/bot)',
        viewport:  { width: 1280, height: 800 },
        bypassCSP: true,   // tells Chromium to ignore CSP headers — required for axe injection
      });

      const page = await context.newPage();

      // Register axe as an init script BEFORE navigation.
      // addInitScript runs at browser-engine level, before any page script,
      // and is immune to CSP. axe will be in window.axe when goto() resolves.
      await prepareAxe(page);

      // Attach monitors before navigation for complete event capture
      consoleMonitor.attach(page);
      networkMonitor.attach(page);

      // Navigate
      const navStart = Date.now();
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
      } catch (navErr) {
        console.warn(`[ScraperService] Navigation warning for ${url}: ${navErr.message}`);
      }
      const wallClockMs = Date.now() - navStart;

      const timings = await page.evaluate(() => {
        const t = performance.timing;
        return t ? {
          domContentLoaded: t.domContentLoadedEventEnd - t.navigationStart,
          load:             t.loadEventEnd - t.navigationStart,
          ttfb:             t.responseStart - t.navigationStart,
        } : null;
      }).catch(() => null);

      // DOM extraction
      const domData = await extractor.extract(page);

      // axe-core — axe is already injected, no CSP issue
      const axeResults = await runAxe(page, options.axe);

      // Screenshot
      let screenshotResult = null;
      if (screenshotter) {
        screenshotResult = await screenshotter.capture(page, url);
      }

      // Feed discovered links back to crawler
      const hrefs = domData.links.map(l => l.href).filter(Boolean);
      crawler.enqueueLinks(hrefs, depth);

      pageResults.push({
        url,
        depth,
        timings: { wallClockMs, ...(timings || {}) },
        ...domData,
        axeResults,
        screenshot: screenshotResult,
        console:    consoleMonitor.getSummary(),
        network:    networkMonitor.getSummary(),
        crawledAt:  new Date().toISOString(),
      });

    } catch (err) {
      console.error(`[ScraperService] Failed on ${url}: ${err.message}`);
      errors.push({ url, error: err.message, depth });
    } finally {
      if (context) {
        try { await context.close(); } catch { /* ignore */ }
      }
    }
  }

  await renderer.close();

  const accessibilitySummary = buildAccessibilitySummary(pageResults);

  return {
    auditId:  generateAuditId(),
    startUrl,
    options,
    summary: {
      totalPagesCrawled: pageResults.length,
      totalErrors:       errors.length,
      durationMs:        Date.now() - auditStartTime,
      startedAt:         new Date(auditStartTime).toISOString(),
      completedAt:       new Date().toISOString(),
      accessibility:     accessibilitySummary,
    },
    pages:  pageResults,
    errors,
  };
}

function buildAccessibilitySummary(pageResults) {
  const totals  = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  const perRule = {};
  let totalIssues = 0;

  for (const page of pageResults) {
    const axe = page.axeResults;
    if (!axe || axe.skipped) continue;
    totalIssues     += axe.summary.totalIssues;
    totals.critical += axe.summary.critical;
    totals.serious  += axe.summary.serious;
    totals.moderate += axe.summary.moderate;
    totals.minor    += axe.summary.minor;
    for (const [id, count] of Object.entries(axe.summary.issuesPerRule || {})) {
      perRule[id] = (perRule[id] || 0) + count;
    }
  }

  const issuesPerRule = Object.fromEntries(
    Object.entries(perRule).sort(([, a], [, b]) => b - a)
  );

  return { totalIssues, ...totals, issuesPerRule };
}

function generateAuditId() {
  return `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

module.exports = { runAudit };