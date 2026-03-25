const Crawler = require("../crawler/crawler");
const Renderer = require("../renderer/renderer");
const Extractor = require("../extractor/extractor");
const ConsoleMonitor = require("../monitors/consoleMonitor");
const NetworkMonitor = require("../monitors/networkMonitor");
const Screenshotter = require("../screenshot/screenshot");
const { prepareAxe, runAxe } = require("../axe/axeRunner");

const DEFAULT_OPTIONS = {
  maxDepth: 2,
  maxPages: 20,
  captureScreenshots: true,
  screenshotDir: "./output/screenshots",
  axe: {
    runOnly: ["wcag2a", "wcag2aa"],
    disabledRules: [],
    includeIncomplete: false,
    includePasses: false,
  },
};

async function runAudit(startUrl, userOptions = {}) {
  const options = {
    ...DEFAULT_OPTIONS,
    ...userOptions,
    axe: {
      ...DEFAULT_OPTIONS.axe,
      ...(userOptions.axe || {}),
    },
  };

  const crawler = new Crawler(startUrl, {
    maxDepth: options.maxDepth,
    maxPages: options.maxPages,
  });

  const renderer = new Renderer();
  const extractor = new Extractor();
  const screenshotter = options.captureScreenshots
    ? new Screenshotter(options.screenshotDir)
    : null;

  const pageResults = [];
  const errors = [];
  const auditStart = Date.now();

  await renderer.launch();
  crawler.seed();

  while (crawler.hasNext()) {
    const nextItem = crawler.next();
    if (!nextItem) break;

    const { url, depth } = nextItem;
    let context = null;

    const consoleMonitor = new ConsoleMonitor();
    const networkMonitor = new NetworkMonitor();

    try {
      context = await renderer.browser.newContext({
        viewport: { width: 1280, height: 800 },
        bypassCSP: true,
        userAgent: "Mozilla/5.0 (compatible; AccessibilityAuditBot/1.0)",
      });

      const page = await context.newPage();

      await prepareAxe(page);
      consoleMonitor.attach(page);
      networkMonitor.attach(page);

      const navStart = Date.now();

      await page.goto(url, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      await page.waitForTimeout(1500);

      const wallClockMs = Date.now() - navStart;

      const perfTimings = await page
        .evaluate(() => {
          const nav = performance.getEntriesByType("navigation")[0];
          if (!nav) return null;

          return {
            domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
            load: Math.round(nav.loadEventEnd),
            ttfb: Math.round(nav.responseStart),
          };
        })
        .catch(() => null);

      const domData = await extractor.extract(page);
      const axeResults = await runAxe(page, options.axe);

      let screenshot = null;
      if (screenshotter) {
        screenshot = await screenshotter.capture(page, url);
      }

      const hrefs = domData.links.map((item) => item.href).filter(Boolean);
      crawler.enqueueLinks(hrefs, depth);

      const consoleData = consoleMonitor.getSummary();
      const networkData = networkMonitor.getSummary();

      pageResults.push({
        url,
        depth,
        timings: {
          wallClockMs,
          ...(perfTimings || {}),
        },
        meta: domData.meta,
        dom: {
          headings: domData.headings,
          images: domData.images,
          buttons: domData.buttons,
          links: domData.links,
          forms: domData.forms,
          landmarks: domData.landmarks,
        },
        axeResults,
        screenshot,
        console: {
          totalLogs: consoleData.totalLogs,
          totalErrors: consoleData.totalErrors,
          totalWarnings: consoleData.totalWarnings,
          errors: consoleData.errors,
          warnings: consoleData.warnings,
          jsErrors: consoleData.jsErrors,
        },
        rawConsoleLogs: consoleData.logs,
        network: networkData,
        crawledAt: new Date().toISOString(),
      });
    } catch (err) {
      errors.push({
        url,
        depth,
        error: err.message,
        timestamp: new Date().toISOString(),
      });
    } finally {
      if (context) {
        try {
          await context.close();
        } catch {
          // ignore
        }
      }
    }
  }

  await renderer.close();

  return {
    auditId: generateAuditId(),
    startUrl,
    options,
    summary: {
      totalPagesCrawled: pageResults.length,
      totalErrors: errors.length,
      durationMs: Date.now() - auditStart,
      startedAt: new Date(auditStart).toISOString(),
      completedAt: new Date().toISOString(),
      accessibility: buildAccessibilitySummary(pageResults),
    },
    pages: pageResults,
    errors,
  };
}

function buildAccessibilitySummary(pageResults) {
  const totals = {
    totalIssues: 0,
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
    issuesPerRule: {},
  };

  for (const page of pageResults) {
    const axe = page.axeResults;
    if (!axe || !axe.summary) continue;

    totals.totalIssues += axe.summary.totalIssues;
    totals.critical += axe.summary.critical;
    totals.serious += axe.summary.serious;
    totals.moderate += axe.summary.moderate;
    totals.minor += axe.summary.minor;

    for (const [ruleId, count] of Object.entries(axe.summary.issuesPerRule || {})) {
      totals.issuesPerRule[ruleId] = (totals.issuesPerRule[ruleId] || 0) + count;
    }
  }

  totals.issuesPerRule = Object.fromEntries(
    Object.entries(totals.issuesPerRule).sort((a, b) => b[1] - a[1])
  );

  return totals;
}

function generateAuditId() {
  return `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

module.exports = { runAudit };