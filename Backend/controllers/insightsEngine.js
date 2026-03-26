/**
 * controllers/insightsEngine.js
 *
 * Real Gemini AI integration for comprehensive accessibility insights.
 * Falls back to a local analysis if the AI call fails.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// Load WCAG Rules for RAG
const wcagRulesPath = path.join(__dirname, '../data/wcagRules.json');
let wcagRules = {};
try {
  if (fs.existsSync(wcagRulesPath)) {
    wcagRules = JSON.parse(fs.readFileSync(wcagRulesPath, 'utf8'));
  }
} catch (error) {
  console.warn("Failed to load WCAG rules:", error.message);
}

// ── Lazy singleton ──────────────────────────────────────────────────────────
let geminiClient = null;

function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing in environment variables");
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return geminiClient;
}

// ── JSON extraction helper ──────────────────────────────────────────────────
function extractJson(text) {
  const cleaned = String(text || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to find the outermost JSON object
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("AI response is not valid JSON");
  }
}

// ── Compact audit data builder ──────────────────────────────────────────────
function buildCompactAuditData(auditData) {
  const pages = (auditData.pages || []).slice(0, 5).map((page) => ({
    url: page.url,
    depth: page.depth,
    status: page.status,
    timings: page.timings || {},
    meta: page.meta || {},
    headings: (page.headings || []).slice(0, 30),
    images: (page.images || []).slice(0, 20).map((img) => ({
      src: (img.src || "").substring(0, 80),
      alt: img.alt,
      hasAlt: img.hasAlt,
    })),
    buttons: (page.buttons || []).slice(0, 15).map((btn) => ({
      text: btn.text,
      ariaLabel: btn.ariaLabel,
      hasNoAccessibleName: btn.hasNoAccessibleName,
    })),
    links: (page.links || []).slice(0, 15).map((link) => ({
      text: link.text,
      href: (link.href || "").substring(0, 80),
      ariaLabel: link.ariaLabel,
    })),
    axeSummary: page.axeSummary || {},
  }));

  return {
    auditId: auditData.auditId || null,
    startUrl: auditData.startUrl || null,
    score: auditData.summary?.score ?? null,
    summary: auditData.summary || {},
    allIssues: auditData.allIssues || {},
    pages,
  };
}

// ── Prompt builder ──────────────────────────────────────────────────────────
function buildPrompt(compactData) {
  // RAG: Build knowledge base context from detected issues
  const detectedIssues = new Set();
  
  // Collect issues from allIssues object (flatten categories)
  if (compactData.allIssues) {
    Object.values(compactData.allIssues).forEach(categoryObj => {
      Object.keys(categoryObj).forEach(code => detectedIssues.add(code));
    });
  }

  let knowledgeBase = [];
  detectedIssues.forEach(code => {
    if (wcagRules && wcagRules[code]) {
      const r = wcagRules[code];
      knowledgeBase.push(`- ISSUE: "${code}" → WCAG ${r.level} Criterion ${r.ruleId} ("${r.name}").\n  Definition: ${r.description}\n  Fix Guidance: Check ${r.helpUrl}`);
    }
  });

  const ragContext = knowledgeBase.length > 0 
    ? `\n=== WCAG KNOWLEDGE BASE (RAG CONTEXT) ===\nUse these official rules to generate accurate technical fixes:\n${knowledgeBase.join('\n')}\n`
    : "";

  return `
You are an expert Web Accessibility (WCAG 2.1 AA) auditor, SEO analyst, and UX performance consultant.

Analyze the following website accessibility audit data and return ONLY valid JSON (no markdown, no extra text).

AUDIT DATA:
${JSON.stringify(compactData, null, 2)}

${ragContext}

OUTPUT SCHEMA — return exactly this structure:
{
  "overallScore": <number 0-100>,
  "executiveSummary": "<2-3 sentence overall verdict>",

  "performanceHealth": {
    "insights": [
      { "type": "success|warning|error", "message": "<insight>", "elements": ["<specific element or value, only for warning/error>"] }
    ],
    "recommendations": [
      { "type": "success|warning|error", "message": "<recommendation>", "elements": ["<specific element or value, only for warning/error>"] }
    ]
  },

  "seoMetadata": {
    "insights": [
      { "type": "success|warning|error", "message": "<insight>" }
    ],
    "recommendations": [
      { "type": "success|warning|error", "message": "<recommendation>" }
    ]
  },

  "headingStructure": {
    "insights": [
      { "type": "success|warning|error", "message": "<insight>", "elements": ["H1: Omkar Mahadik", "H1: Hello 👋"] }
    ],
    "recommendations": [
      { "type": "success|warning|error", "message": "<recommendation>", "elements": ["<specific heading text>"] }
    ]
  },

  "imageAccessibility": {
    "insights": [
      { "type": "success|warning|error", "message": "<insight>", "elements": ["img alt='Oggy' — too generic", "img with no alt"] }
    ],
    "recommendations": [
      { "type": "success|warning|error", "message": "<recommendation>", "elements": ["<specific image or alt text>"] }
    ]
  },

  "buttonInteractive": {
    "insights": [
      { "type": "success|warning|error", "message": "<insight>", "elements": ["<button> with no accessible name"] }
    ],
    "recommendations": [
      { "type": "success|warning|error", "message": "<recommendation>", "elements": ["<specific button text or selector>"] }
    ]
  },

  "crossCuttingInsights": {
    "green": ["<positive finding>"],
    "yellow": ["<warning>"],
    "red": ["<critical issue>"]
  },

  "aggregateReport": {
    "passed": ["<what passed>"],
    "warnings": ["<what needs attention>"],
    "critical": ["<what failed>"],
    "topIssues": [
      { "rank": 1, "issue": "<issue>", "affectedElements": <count> }
    ]
  },

  "wcagCompliance": [
    { "criterion": "1.1.1 Non-text Content", "status": "pass|warning|fail", "detail": "<detail>" }
  ],

  "priorityFixes": [
    { "priority": 1, "fix": "<what to fix>", "impact": "high|medium|low" }
  ],

  "uiuxRecommendations": [
    { "type": "success|warning|error", "message": "<recommendation>" }
  ]
}

RULES:
- Return ONLY valid JSON.
- No markdown fences, no explanations outside JSON.
- Provide at least 3 items in each array where data supports it.
- Be specific — reference actual element counts, timing values, and tag names from the audit data.
- For WCAG compliance, cover at least: 1.1.1, 1.3.1, 2.4.6, 4.1.2.
- Keep messages concise but actionable.

CRITICAL ELEMENT LISTING RULES:
- For EVERY "warning" or "error" insight/recommendation, you MUST include an "elements" array that lists ALL the specific problematic elements found in the audit data.
- DO NOT just say "Found 7 H1 tags" — you MUST list every single one by their text content in the "elements" array.
- Examples of what to include:
  * Headings: List each heading with its level and text → ["H1: Omkar Mahadik", "H1: Hello 👋", "H1: I am Omkar", "H1: Overview"]
  * Images: List each image with its alt text or src → ["img alt='Oggy' — vague/decorative", "img src='profile.jpg' — missing alt"]
  * Buttons: List each button by its text or lack thereof → ["<button> (no text, no aria-label)", "button 'Submit' — OK"]
  * Links: List each link by its text → ["<a href='/contact'> (empty link text)", "<a> 'Click here' — vague"]
  * Meta: List the specific meta issues → ["meta description: missing", "title: 'Omkar Mahadik' — too short"]
  * Performance: List specific metrics → ["wallClockMs: 2513ms", "TTFB: 17ms", "DOMContentLoaded: 198ms"]
- For "success" type items, the "elements" array can be empty [] or omitted entirely.
- For crossCuttingInsights red/yellow items, include the specific elements in the string itself.
- For aggregateReport topIssues, include exact element names/text in the "issue" field.
`;
}

// ── Fallback local analysis ─────────────────────────────────────────────────
function buildFallbackInsights(auditData) {
  const page = auditData.pages?.[0] || {};
  const summary = auditData.summary || {};
  const timings = page.timings || {};
  const meta = page.meta || {};
  const headings = page.headings || [];
  const images = page.images || [];
  const buttons = page.buttons || [];
  const issues = auditData.allIssues || {};

  const h1Tags = headings.filter((h) => h.level === 1);
  const h1Count = h1Tags.length;
  const missingAltImages = images.filter((i) => !i.alt && !i.hasAlt);
  const missingAltCount = missingAltImages.length;
  const noNameBtns = buttons.filter((b) => b.hasNoAccessibleName);
  const noNameButtons = noNameBtns.length;

  const performanceInsights = [];
  if (timings.ttfb) performanceInsights.push({
    type: timings.ttfb < 100 ? "success" : "warning",
    message: `TTFB is ${timings.ttfb}ms${timings.ttfb < 100 ? " — excellent server response." : " — consider optimizing server response time."}`,
    ...(timings.ttfb >= 100 ? { elements: [`TTFB: ${timings.ttfb}ms (target: < 100ms)`] } : {}),
  });
  if (timings.load) performanceInsights.push({
    type: timings.load < 2000 ? "success" : "warning",
    message: `Full page load: ${timings.load}ms${timings.load < 2000 ? " — within acceptable range." : " — aim for under 2 seconds."}`,
    ...(timings.load >= 2000 ? { elements: [`Load time: ${timings.load}ms (target: < 2000ms)`, `DOMContentLoaded: ${timings.domContentLoaded || 'N/A'}ms`] } : {}),
  });

  const seoInsights = [];
  if (!meta.description) seoInsights.push({
    type: "error",
    message: "No meta description found. Add one (50–160 chars) for better SEO.",
    elements: ["<meta name=\"description\" content=\"...\"> — missing from <head>"],
  });
  if (meta.title && meta.title.length < 20) seoInsights.push({
    type: "warning",
    message: `Page title "${meta.title}" is very short. Aim for 30-60 characters.`,
    elements: [`<title>${meta.title}</title> — only ${meta.title.length} chars`],
  });
  if (meta.lang) seoInsights.push({ type: "success", message: `Language attribute set to "${meta.lang}" — good for accessibility.` });
  if (meta.viewport) seoInsights.push({ type: "success", message: "Viewport meta tag configured — essential for mobile responsiveness." });

  const headingInsights = [];
  if (h1Count > 1) {
    headingInsights.push({
      type: "error",
      message: `Found ${h1Count} H1 tags. Use only one H1 per page.`,
      elements: h1Tags.map((h) => `H1: "${h.text || '(empty)'}"`),
    });
  } else if (h1Count === 1) {
    headingInsights.push({ type: "success", message: "Single H1 tag found — correct semantic structure." });
  } else {
    headingInsights.push({ type: "warning", message: "No H1 tag found. Each page should have exactly one H1.", elements: ["No <h1> element found in the page"] });
  }

  const imageInsights = [];
  if (missingAltCount > 0) {
    imageInsights.push({
      type: "error",
      message: `${missingAltCount} image(s) missing alt text.`,
      elements: missingAltImages.map((img) => {
        const src = (img.src || "").substring(0, 60);
        return `<img src="${src}"> — no alt attribute`;
      }),
    });
  } else if (images.length > 0) {
    imageInsights.push({ type: "success", message: "All images have alt text — passes WCAG 1.1.1." });
  }

  const buttonInsights = [];
  if (noNameButtons > 0) {
    buttonInsights.push({
      type: "error",
      message: `${noNameButtons} button(s) have no accessible name.`,
      elements: noNameBtns.map((btn, i) => {
        const label = btn.text || btn.ariaLabel || `(no text, no aria-label)`;
        return `Button #${i + 1}: ${label}`;
      }),
    });
  } else if (buttons.length > 0) {
    buttonInsights.push({ type: "success", message: "All buttons have accessible names." });
  }

  // Build priority fixes from issues
  const priorityFixes = [];
  let rank = 1;
  for (const [category, cats] of Object.entries(issues)) {
    for (const [code, issue] of Object.entries(cats || {})) {
      priorityFixes.push({
        priority: rank++,
        fix: `${code}: ${issue.description || issue.help || code} (${issue.count || 1} instance(s))`,
        impact: issue.impact === "critical" || issue.impact === "serious" ? "high" : issue.impact === "moderate" ? "medium" : "low",
      });
      if (rank > 8) break;
    }
    if (rank > 8) break;
  }

  return {
    overallScore: summary.score || 75,
    executiveSummary: `Fallback analysis (AI unavailable). Found ${headings.length} headings, ${images.length} images, ${buttons.length} buttons across audited pages.`,
    performanceHealth: { insights: performanceInsights, recommendations: [] },
    seoMetadata: { insights: seoInsights, recommendations: [] },
    headingStructure: { insights: headingInsights, recommendations: [] },
    imageAccessibility: { insights: imageInsights, recommendations: [] },
    buttonInteractive: { insights: buttonInsights, recommendations: [] },
    crossCuttingInsights: { green: [], yellow: [], red: [] },
    aggregateReport: { passed: [], warnings: [], critical: [], topIssues: [] },
    wcagCompliance: [],
    priorityFixes,
    uiuxRecommendations: [],
  };
}

// ── Main handler ────────────────────────────────────────────────────────────
const generateAIInsights = async (req, res) => {
  try {
    const { auditData } = req.body;

    if (!auditData) {
      return res.status(400).json({
        success: false,
        message: "Missing audit data",
      });
    }

    const compactData = buildCompactAuditData(auditData);
    const prompt = buildPrompt(compactData);

    let insightsData;
    let provider = "gemini";

    try {
      console.log("[AI Engine] Calling Gemini API...");
      const genAI = getGeminiClient();
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      console.log("[AI Engine] Gemini response received, parsing JSON...");
      insightsData = extractJson(text);
    } catch (aiError) {
      console.error("[AI Engine] Gemini API failed, using fallback:", aiError.message);
      provider = "fallback-analyzer";
      insightsData = buildFallbackInsights(auditData);
    }

    return res.status(200).json({
      success: true,
      provider,
      ...insightsData,
    });
  } catch (error) {
    console.error("[AI Engine] Failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "AI insights generation failed",
      error: error.message,
    });
  }
};

module.exports = { generateAIInsights };
