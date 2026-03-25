/**
 * scraperService.js  — SPA-aware full-site audit
 *
 * Key fixes vs original:
 *  1. After loading the seed page, calls crawler.discoverSpaRoutes(page)
 *     to intercept React Router / pushState navigation and find all routes.
 *  2. Keeps one persistent browser context for route discovery, then creates
 *     fresh contexts per page (CSP bypass + axe pre-injection).
 *  3. axe violations are now fully expanded: issuesPerRule counts NODES
 *     (actual element instances) not just rule occurrences.
 *  4. Malformed paths (e.g. /authentication-2792005.web.app) are rejected
 *     by the crawler's _isMalformedPath guard.
 *  5. includeIncomplete: true  — captures "needs review" issues too.
 *  6. All WCAG 2.0 A/AA + best-practice tags included.
 */

const Crawler        = require('../crawler/crawler');
const Renderer       = require('../renderer/renderer');
const Extractor      = require('../extractor/extractor');
const ConsoleMonitor = require('../monitors/consoleMonitor');
const NetworkMonitor = require('../monitors/networkMonitor');
const Screenshotter  = require('../screenshot/screenshot');
const { runAxe, prepareAxe } = require('../axe/axeRunner');
const { slugifyUrl }  = require('../../utils/urlUtils');
const fs   = require('fs');
const path = require('path');

const DEFAULT_OPTIONS = {
  maxDepth:           3,
  maxPages:           50,
  captureScreenshots: true,
  screenshotDir:      './output/screenshots',
  discoverSpaRoutes:  true,   // NEW — intercept pushState on SPAs
  axe: {
    runOnly:           ['wcag2a', 'wcag2aa', 'best-practice'],
    disabledRules:     [],
    includeIncomplete: true,   // capture "needs review" items too
    includePasses:     false,
  },
};

// ─────────────────────────────────────────────────────────────────────────────

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

  // ── SPA Route Discovery pass ─────────────────────────────────────────────
  if (options.discoverSpaRoutes) {
    console.log('[ScraperService] Running SPA route discovery on:', startUrl);
    let discoveryContext = null;
    try {
      discoveryContext = await renderer.browser.newContext({
        userAgent: _userAgent(),
        viewport:  { width: 1280, height: 800 },
        bypassCSP: true,
      });
      const discoveryPage = await discoveryContext.newPage();
      await prepareAxe(discoveryPage);   // needed for init script; not used yet
      try {
        await discoveryPage.goto(startUrl, { waitUntil: 'networkidle', timeout: 25000 });
      } catch (e) {
        console.warn('[ScraperService] Discovery navigation warning:', e.message);
      }
      const found = await crawler.discoverSpaRoutes(discoveryPage);
      console.log(`[ScraperService] SPA discovery found ${found.length} total routes`);
    } catch (e) {
      console.warn('[ScraperService] SPA discovery failed (non-fatal):', e.message);
    } finally {
      if (discoveryContext) {
        try { await discoveryContext.close(); } catch { /* ignore */ }
      }
    }
  }

  // ── Main audit loop ───────────────────────────────────────────────────────
  while (crawler.hasNext()) {
    const { url, depth } = crawler.next();
    console.log(`[ScraperService] Auditing (depth=${depth}): ${url}`);

    const consoleMonitor = new ConsoleMonitor();
    const networkMonitor = new NetworkMonitor();
    let context = null;

    try {
      context = await renderer.browser.newContext({
        userAgent: _userAgent(),
        viewport:  { width: 1280, height: 800 },
        bypassCSP: true,
      });

      const page = await context.newPage();

      // ── Network interception: save CSS & JS assets ──────────────────────
      const assetDir = path.resolve('./output/assets');
      fs.mkdirSync(assetDir, { recursive: true });

      page.on('response', async (response) => {
        try {
          const resourceType = response.request().resourceType();
          if (resourceType === 'stylesheet' || resourceType === 'script') {
            const reqUrl = response.url();
            const ext = resourceType === 'stylesheet' ? '.css' : '.js';
            // Extract a safe filename from the URL
            let filename;
            try {
              const parsed = new URL(reqUrl);
              filename = parsed.pathname.split('/').pop() || `asset_${Date.now()}`;
            } catch {
              filename = `asset_${Date.now()}`;
            }
            // Ensure extension
            if (!filename.endsWith(ext)) filename += ext;
            // Deduplicate with timestamp suffix
            const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
            const assetPath = path.join(assetDir, safeName);
            // Only save if file doesn't already exist (avoid duplicates across pages)
            if (!fs.existsSync(assetPath)) {
              const body = await response.body();
              fs.writeFileSync(assetPath, body);
              console.log(`[AssetSaver] Saved ${resourceType}: ${safeName}`);
            }
          }
        } catch {
          // Silently ignore CORS errors, aborted requests, etc.
        }
      });

      // Inject axe BEFORE navigation (CSP-safe)
      await prepareAxe(page);

      consoleMonitor.attach(page);
      networkMonitor.attach(page);

      const navStart = Date.now();
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 25000 });
      } catch (navErr) {
        console.warn(`[ScraperService] Nav warning ${url}: ${navErr.message}`);
      }
      const wallClockMs = Date.now() - navStart;

      // Wait a bit extra for dynamic content / lazy renders
      await page.waitForTimeout(500).catch(() => {});

      const timings = await page.evaluate(() => {
        const t = performance?.timing;
        if (!t) return null;
        return {
          domContentLoaded: t.domContentLoadedEventEnd - t.navigationStart,
          load:             t.loadEventEnd             - t.navigationStart,
          ttfb:             t.responseStart            - t.navigationStart,
        };
      }).catch(() => null);

      // DOM extraction
      const domData = await extractor.extract(page);

      // axe audit — comprehensive
      const axeResults = await runAxe(page, options.axe);

      // Screenshot
      let screenshotResult = null;
      if (screenshotter) {
        screenshotResult = await screenshotter.capture(page, url);
      }

      // ── Save full HTML ─────────────────────────────────────────────────
      let htmlPath = null;
      try {
        const htmlDir = path.resolve('./output/html');
        fs.mkdirSync(htmlDir, { recursive: true });
        const htmlFilename = `${slugifyUrl(url)}.html`;
        htmlPath = path.join(htmlDir, htmlFilename);
        const htmlContent = await page.content();
        fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
        console.log(`[HTMLSaver] Saved: ${htmlFilename}`);
      } catch (htmlErr) {
        console.warn(`[HTMLSaver] Failed for ${url}: ${htmlErr.message}`);
      }

      // Feed discovered href links back to crawler (for multi-page sites)
      const hrefs = domData.links.map(l => l.href).filter(Boolean);
      crawler.enqueueLinks(hrefs, depth);

      pageResults.push({
        url,
        depth,
        timings: { wallClockMs, ...(timings || {}) },
        meta:        domData.meta,
        headings:    domData.headings,
        images:      domData.images,
        buttons:     domData.buttons,
        links:       domData.links,
        forms:       domData.forms,
        landmarks:   domData.landmarks,
        ariaSnapshot: domData.ariaSnapshot,
        axeResults,
        screenshot: screenshotResult,
        htmlPath,
        console:    consoleMonitor.getSummary(),
        network:    networkMonitor.getSummary(),
        crawledAt:  new Date().toISOString(),
      });

    } catch (err) {
      console.error(`[ScraperService] Failed on ${url}: ${err.message}`);
      errors.push({ url, error: err.message, depth, stack: err.stack });
    } finally {
      if (context) {
        try { await context.close(); } catch { /* ignore */ }
      }
    }
  }

  await renderer.close();

  // ── Save final JSON report ──────────────────────────────────────────────
  const auditId = _generateAuditId();
  const report = {
    auditId,
    startUrl,
    options,
    summary: {
      totalPagesCrawled:    pageResults.length,
      totalErrors:          errors.length,
      durationMs:           Date.now() - auditStartTime,
      startedAt:            new Date(auditStartTime).toISOString(),
      completedAt:          new Date().toISOString(),
      accessibility:        _buildAccessibilitySummary(pageResults),
      pagesWithIssues:      pageResults.filter(p => p.axeResults?.summary?.totalIssues > 0).length,
      pagesWithIncomplete:  pageResults.filter(p => (p.axeResults?.incomplete?.length ?? 0) > 0).length,
    },
    pages:  pageResults,
    errors,
  };

  try {
    const reportsDir = path.resolve('./output/reports');
    fs.mkdirSync(reportsDir, { recursive: true });
    const reportPath = path.join(reportsDir, `${auditId}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`[ReportSaver] Saved audit report: ${auditId}.json`);
  } catch (reportErr) {
    console.warn(`[ReportSaver] Failed to save report: ${reportErr.message}`);
  }

  return report;
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary builder — counts NODES (element instances), not just rule occurrences
// ─────────────────────────────────────────────────────────────────────────────

function _buildAccessibilitySummary(pageResults) {
  const totals  = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  const perRule = {};   // ruleId → { count, impact, description, helpUrl }
  let totalViolationNodes = 0;
  let totalIncomplete     = 0;

  for (const page of pageResults) {
    const axe = page.axeResults;
    if (!axe || axe.skipped) continue;

    // Count violation NODES (not violations)
    for (const v of (axe.violations || [])) {
      const nodeCount = v.nodes?.length ?? 0;
      totalViolationNodes += nodeCount;
      const impact = v.impact || 'minor';
      totals[impact] = (totals[impact] || 0) + nodeCount;

      if (!perRule[v.id]) {
        perRule[v.id] = {
          count:       0,
          impact:      v.impact,
          description: v.description,
          helpUrl:     v.helpUrl,
          pages:       [],
        };
      }
      perRule[v.id].count += nodeCount;
      if (!perRule[v.id].pages.includes(page.url)) {
        perRule[v.id].pages.push(page.url);
      }
    }

    totalIncomplete += (axe.incomplete?.length ?? 0);
  }

  // Sort by count desc
  const issuesPerRule = Object.fromEntries(
    Object.entries(perRule).sort(([, a], [, b]) => b.count - a.count)
  );

  return {
    totalViolationNodes,
    totalIncomplete,
    ...totals,
    issuesPerRule,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

function _userAgent() {
  return 'Mozilla/5.0 (compatible; AccessibilityAuditBot/1.0; +https://yourdomain.com/bot)';
}

function _generateAuditId() {
  return `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

module.exports = { runAudit };