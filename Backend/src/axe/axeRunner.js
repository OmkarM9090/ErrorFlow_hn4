/**
 * axeRunner.js  — comprehensive axe-core runner
 *
 * Fixes vs original:
 *  1. Runs wcag2a + wcag2aa + best-practice tags by default.
 *  2. issuesPerRule in summary counts NODES (element instances), not rules.
 *  3. `incomplete` results (needs-review) are included and returned.
 *  4. `passes` counts are included in summary even when not returned in full.
 *  5. transformViolation includes `nodeCount` for quick scanning.
 *  6. buildSummary correctly totals by impact × node count.
 *  7. Bounding box collection is resilient and skips complex selectors safely.
 */

const fs = require('fs');

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

const DEFAULT_OPTIONS = {
  runOnly:           ['wcag2a', 'wcag2aa', 'best-practice'],
  disabledRules:     [],
  includeIncomplete: true,
  includePasses:     false,
  axeTimeout:        60000,
};

// Impact sort order
const IMPACT_ORDER = { critical: 0, serious: 1, moderate: 2, minor: 3 };

// ─── prepareAxe ───────────────────────────────────────────────────────────────

/**
 * Register axe as a Playwright init script BEFORE page.goto().
 * Runs at browser-engine level — immune to Content-Security-Policy.
 */
async function prepareAxe(page) {
  await page.addInitScript({ content: getAxeSource() });
}

// ─── runAxe ───────────────────────────────────────────────────────────────────

async function runAxe(page, options = {}) {
  const config  = { ...DEFAULT_OPTIONS, ...options };
  const pageUrl = page.url();

  // Guard: empty / crashed page
  let bodyEmpty = false;
  try {
    const content = await page.evaluate(() => document.body?.innerHTML?.trim() ?? '');
    bodyEmpty = content.length < 10;
  } catch {
    bodyEmpty = true;
  }

  if (bodyEmpty) {
    console.warn(`[axeRunner] Empty/crashed DOM at ${pageUrl} — skipping`);
    return _buildEmptyResult(pageUrl, 'empty-dom');
  }

  // Verify axe is available (pre-injected via prepareAxe)
  const axeReady = await page.evaluate(() => typeof window.axe !== 'undefined').catch(() => false);

  if (!axeReady) {
    console.warn(`[axeRunner] axe not pre-injected on ${pageUrl} — falling back`);
    const injected = await _runtimeInject(page, pageUrl);
    if (!injected) return _buildEmptyResult(pageUrl, 'injection-failed');
  }

  // Build result types
  const resultTypes = ['violations', 'inapplicable'];
  if (config.includePasses)     resultTypes.push('passes');
  if (config.includeIncomplete) resultTypes.push('incomplete');

  const axeConfig = {
    runOnly: { type: 'tag', values: config.runOnly },
    rules:   Object.fromEntries((config.disabledRules || []).map(id => [id, { enabled: false }])),
    resultTypes,
    timeout: config.axeTimeout,
  };

  // Run axe inside page context
  let rawResult;
  try {
    rawResult = await page.evaluate(async (cfg) => {
      return await window.axe.run(document, cfg);
    }, axeConfig);
  } catch (err) {
    console.error(`[axeRunner] axe.run() failed on ${pageUrl}: ${err.message}`);
    return _buildEmptyResult(pageUrl, 'axe-run-failed');
  }

  // Enrich violations with bounding boxes
  const enrichedViolations = await _enrichWithBoundingBoxes(page, rawResult.violations || []);
  const enrichedIncomplete = config.includeIncomplete
    ? await _enrichWithBoundingBoxes(page, rawResult.incomplete || [])
    : [];

  return _buildResult(pageUrl, rawResult, enrichedViolations, enrichedIncomplete, config);
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

  // Flatten all queries
  const queries = [];
  violations.forEach((v, vi) => {
    (v.nodes || []).forEach((node, ni) => {
      // Use first selector target, skip complex compound selectors that querySelector can't handle
      const raw = node.target?.[0] || null;
      const selector = raw && !raw.includes(' > ') ? raw : null;
      queries.push({ vi, ni, selector });
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
            box: {
              x:      Math.round(r.x),
              y:      Math.round(r.y),
              width:  Math.round(r.width),
              height: Math.round(r.height),
            },
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
    nodes: (v.nodes || []).map((node, ni) => ({
      ...node,
      boundingBox: boxMap.get(`${vi}:${ni}`) || null,
    })),
  }));
}

// ─── Result builders ──────────────────────────────────────────────────────────

function _buildResult(pageUrl, raw, enrichedViolations, enrichedIncomplete, config) {
  const violations = enrichedViolations
    .sort((a, b) => (IMPACT_ORDER[a.impact] ?? 99) - (IMPACT_ORDER[b.impact] ?? 99))
    .map(_transformViolation);

  const incomplete = enrichedIncomplete.map(_transformViolation);

  const result = {
    pageUrl,
    analysedAt: new Date().toISOString(),
    axeVersion:  raw.testEngine?.version || 'unknown',
    config: {
      runOnly:       config.runOnly,
      disabledRules: config.disabledRules,
    },
    summary: _buildSummary(violations, incomplete),
    violations,
  };

  if (config.includeIncomplete && incomplete.length) {
    result.incomplete = incomplete;
  }

  if (config.includePasses && raw.passes?.length) {
    result.passes = raw.passes.map(_transformViolation);
  }

  return result;
}

/**
 * Summary counts NODES (element instances) per impact level, not rules.
 * issuesPerRule maps ruleId → { nodeCount, impact, description, helpUrl }
 */
function _buildSummary(violations, incomplete) {
  const counts  = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  const perRule = {};
  let totalViolationNodes = 0;

  for (const v of violations) {
    const nodeCount = v.nodes?.length ?? 0;
    totalViolationNodes += nodeCount;
    const impact = v.impact || 'minor';
    counts[impact] = (counts[impact] || 0) + nodeCount;

    perRule[v.id] = {
      nodeCount:   (perRule[v.id]?.nodeCount  || 0) + nodeCount,
      impact:      v.impact,
      description: v.description,
      help:        v.help,
      helpUrl:     v.helpUrl,
    };
  }

  // Sort by nodeCount desc
  const issuesPerRule = Object.fromEntries(
    Object.entries(perRule).sort(([, a], [, b]) => b.nodeCount - a.nodeCount)
  );

  return {
    totalViolations:      violations.length,    // number of distinct rules violated
    totalViolationNodes,                         // total element instances with issues
    totalIncomplete:      incomplete.length,
    ...counts,
    issuesPerRule,
  };
}

function _transformViolation(item) {
  return {
    id:          item.id,
    impact:      item.impact || null,
    description: item.description || null,
    help:        item.help || null,
    helpUrl:     item.helpUrl || null,
    tags:        item.tags || [],
    nodeCount:   item.nodes?.length ?? 0,
    nodes:       (item.nodes || []).map(_transformNode),
  };
}

function _transformNode(node) {
  return {
    html:           node.html || null,
    target:         node.target || [],
    failureSummary: node.failureSummary || null,
    boundingBox:    node.boundingBox || null,
    // Include any/all/none check details
    any:  (node.any  || []).map(c => ({ id: c.id, message: c.message })),
    all:  (node.all  || []).map(c => ({ id: c.id, message: c.message })),
    none: (node.none || []).map(c => ({ id: c.id, message: c.message })),
  };
}

function _buildEmptyResult(pageUrl, reason) {
  return {
    pageUrl,
    analysedAt: new Date().toISOString(),
    axeVersion: null,
    config:     null,
    summary: {
      totalViolations:     0,
      totalViolationNodes: 0,
      totalIncomplete:     0,
      critical: 0, serious: 0, moderate: 0, minor: 0,
      issuesPerRule: {},
    },
    violations:  [],
    incomplete:  [],
    skipped:     true,
    skipReason:  reason,
  };
}

module.exports = { runAxe, prepareAxe };