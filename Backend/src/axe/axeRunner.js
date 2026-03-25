/**
 * axeRunner.js
 *
 * Responsible ONLY for:
 *  - Injecting axe-core into an already-rendered Playwright page
 *  - Running accessibility analysis on the fully-rendered DOM
 *  - Transforming raw axe output into a clean, structured JSON result
 *  - Collecting bounding boxes for each violating node
 *
 * NOT responsible for:
 *  - Navigation / crawling / screenshots / monitors / DB / API routing
 *
 * ── WHY injection-failed happens ────────────────────────────────────────────
 * Sites like GFG set strict Content-Security-Policy (CSP) headers that block
 * eval() and inline <script> injection at runtime. Both page.evaluate(source)
 * and page.addScriptTag({ content }) hit this wall.
 *
 * ── THE FIX (two parts) ──────────────────────────────────────────────────────
 *
 * PART 1 — renderer.js:
 *   Add `bypassCSP: true` to browser.newContext(). This instructs Chromium
 *   to ignore CSP response headers entirely. Safe for an audit bot.
 *
 * PART 2 — axeRunner.js (this file):
 *   Export `prepareAxe(page)` and call it in scraperService BEFORE
 *   renderer.renderPage(). It uses page.addInitScript() which registers
 *   a script at the browser-engine level — it runs before any page JS
 *   and is completely immune to CSP.
 *
 * ── CALL ORDER IN scraperService ─────────────────────────────────────────────
 *   const page  = await context.newPage();
 *   await prepareAxe(page);          // ← register init script BEFORE goto
 *   await page.goto(url, ...);       // ← axe is now available immediately
 *   ...
 *   const axeResults = await runAxe(page, options.axe);
 *
 * USAGE:
 *   const { runAxe, prepareAxe } = require('./axeRunner');
 */

const fs = require('fs');

// ─── Cache axe-core source — read once at startup, reuse for every page ──────
let _axeSource = null;

function getAxeSource() {
  if (_axeSource) return _axeSource;
  try {
    const axePath = require.resolve('axe-core');
    _axeSource = fs.readFileSync(axePath, 'utf8');
    return _axeSource;
  } catch (err) {
    throw new Error(`[axeRunner] axe-core not found. Run: npm install axe-core\n${err.message}`);
  }
}

// ─── Default config ───────────────────────────────────────────────────────────
const DEFAULT_OPTIONS = {
  runOnly:           ['wcag2a', 'wcag2aa'],
  disabledRules:     [],
  includeIncomplete: false,
  includePasses:     false,
  axeTimeout:        30000,
};

const IMPACT_ORDER = { critical: 0, serious: 1, moderate: 2, minor: 3 };

// ─── prepareAxe ───────────────────────────────────────────────────────────────

/**
 * Pre-inject axe-core into a Playwright page via addInitScript().
 *
 * MUST be called BEFORE page.goto(). addInitScript() registers a script
 * that runs at the very start of every navigation, before any page scripts,
 * at the browser engine level — completely bypassing CSP headers.
 *
 * This is the Playwright-recommended way to inject testing/audit libraries
 * into pages that use Content-Security-Policy.
 *
 * @param {Page} page - Playwright page object (before navigation)
 */
async function prepareAxe(page) {
  await page.addInitScript({ content: getAxeSource() });
}

// ─── runAxe ───────────────────────────────────────────────────────────────────

/**
 * Run axe-core on a fully rendered Playwright page.
 *
 * Assumes prepareAxe(page) was called before page.goto().
 * If axe is somehow not present, falls back to runtime injection.
 *
 * @param {Page}   page    - Playwright page (already navigated)
 * @param {object} options - Override DEFAULT_OPTIONS
 * @returns {Promise<AxeResult>}
 */
async function runAxe(page, options = {}) {
  const config  = { ...DEFAULT_OPTIONS, ...options };
  const pageUrl = page.url();

  // ── Guard: empty / crashed page ───────────────────────────────────────────
  let bodyEmpty = false;
  try {
    const content = await page.evaluate(() => document.body?.innerHTML?.trim() || '');
    bodyEmpty = !content;
  } catch {
    bodyEmpty = true;
  }

  if (bodyEmpty) {
    console.warn(`[axeRunner] Empty DOM at ${pageUrl} — skipping`);
    return buildEmptyResult(pageUrl, 'empty-dom');
  }

  // ── Verify axe is available ───────────────────────────────────────────────
  const axeReady = await page.evaluate(() => typeof window.axe !== 'undefined').catch(() => false);

  if (!axeReady) {
    // prepareAxe() wasn't called before navigation — try runtime injection as
    // a fallback (works on pages without strict CSP).
    console.warn(`[axeRunner] axe not pre-injected on ${pageUrl} — falling back to runtime injection`);
    const injected = await _runtimeInject(page, pageUrl);
    if (!injected) return buildEmptyResult(pageUrl, 'injection-failed');
  }

  // ── Build axe run config ──────────────────────────────────────────────────
  const resultTypes = ['violations'];
  if (config.includePasses)     resultTypes.push('passes');
  if (config.includeIncomplete) resultTypes.push('incomplete');

  const axeConfig = {
    runOnly:     { type: 'tag', values: config.runOnly },
    rules:       Object.fromEntries(config.disabledRules.map(id => [id, { enabled: false }])),
    resultTypes,
    timeout:     config.axeTimeout,
  };

  // ── Run axe inside the page context ──────────────────────────────────────
  let rawResult;
  try {
    rawResult = await page.evaluate(async (cfg) => {
      return await window.axe.run(document, cfg);
    }, axeConfig);
  } catch (err) {
    console.error(`[axeRunner] axe.run() failed on ${pageUrl}: ${err.message}`);
    return buildEmptyResult(pageUrl, 'axe-run-failed');
  }

  // ── Enrich nodes with bounding boxes in one round-trip ───────────────────
  const enrichedViolations = await _enrichWithBoundingBoxes(page, rawResult.violations);

  return buildResult(pageUrl, rawResult, enrichedViolations, config);
}

// ─── Runtime injection fallback ───────────────────────────────────────────────

async function _runtimeInject(page, pageUrl) {
  try {
    await page.evaluate(getAxeSource());
    return true;
  } catch {
    try {
      await page.addScriptTag({ content: getAxeSource() });
      return true;
    } catch (err) {
      console.error(`[axeRunner] Runtime injection failed on ${pageUrl}: ${err.message}`);
      return false;
    }
  }
}

// ─── Bounding boxes ───────────────────────────────────────────────────────────

async function _enrichWithBoundingBoxes(page, violations) {
  if (!violations?.length) return [];

  const queries = [];
  violations.forEach((v, vi) => {
    v.nodes.forEach((node, ni) => {
      queries.push({ vi, ni, selector: node.target?.[0] || null });
    });
  });

  let boxes = [];
  try {
    boxes = await page.evaluate((qs) => {
      return qs.map(({ vi, ni, selector }) => {
        if (!selector) return { vi, ni, box: null };
        try {
          const el = document.querySelector(selector);
          if (!el) return { vi, ni, box: null };
          const r = el.getBoundingClientRect();
          return {
            vi, ni,
            box: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) },
          };
        } catch {
          return { vi, ni, box: null };
        }
      });
    }, queries);
  } catch {
    console.warn('[axeRunner] Bounding box collection failed (non-fatal)');
  }

  const boxMap = new Map(boxes.map(b => [`${b.vi}:${b.ni}`, b.box]));

  return violations.map((v, vi) => ({
    ...v,
    nodes: v.nodes.map((node, ni) => ({ ...node, boundingBox: boxMap.get(`${vi}:${ni}`) || null })),
  }));
}

// ─── Result builders ──────────────────────────────────────────────────────────

function buildResult(pageUrl, raw, enrichedViolations, config) {
  const violations = enrichedViolations
    .sort((a, b) => (IMPACT_ORDER[a.impact] ?? 99) - (IMPACT_ORDER[b.impact] ?? 99))
    .map(transformViolation);

  const result = {
    pageUrl,
    analysedAt: new Date().toISOString(),
    axeVersion: raw.testEngine?.version || 'unknown',
    config:     { runOnly: config.runOnly, disabledRules: config.disabledRules },
    summary:    buildSummary(violations),
    violations,
  };

  if (config.includePasses     && raw.passes?.length)     result.passes     = raw.passes.map(transformViolation);
  if (config.includeIncomplete && raw.incomplete?.length) result.incomplete = raw.incomplete.map(transformViolation);

  return result;
}

function buildSummary(violations) {
  const counts  = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  const perRule = {};
  for (const v of violations) {
    const impact = v.impact || 'minor';
    counts[impact] = (counts[impact] || 0) + 1;
    perRule[v.id]  = (perRule[v.id]  || 0) + 1;
  }
  return { totalIssues: violations.length, ...counts, issuesPerRule: perRule };
}

function transformViolation(item) {
  return {
    id:          item.id,
    impact:      item.impact || null,
    description: item.description || null,
    help:        item.help || null,
    helpUrl:     item.helpUrl || null,
    tags:        item.tags || [],
    nodes:       (item.nodes || []).map(transformNode),
  };
}

function transformNode(node) {
  return {
    html:           node.html || null,
    target:         node.target || [],
    failureSummary: node.failureSummary || null,
    boundingBox:    node.boundingBox || null,
  };
}

function buildEmptyResult(pageUrl, reason) {
  return {
    pageUrl,
    analysedAt:  new Date().toISOString(),
    axeVersion:  null,
    config:      null,
    summary:     { totalIssues: 0, critical: 0, serious: 0, moderate: 0, minor: 0, issuesPerRule: {} },
    violations:  [],
    skipped:     true,
    skipReason:  reason,
  };
}

module.exports = { runAxe, prepareAxe };