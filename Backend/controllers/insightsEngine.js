/**
 * controllers/insightsEngine.js
 *
 * Real Gemini AI integration for comprehensive accessibility insights.
 * Falls back to a local analysis if the AI call fails.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

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
  return `
You are an expert Web Accessibility (WCAG 2.1 AA) auditor, SEO analyst, and UX performance consultant.

Analyze the following website accessibility audit data and return ONLY valid JSON (no markdown, no extra text).

AUDIT DATA:
${JSON.stringify(compactData, null, 2)}

OUTPUT SCHEMA — return exactly this structure:
{
  "overallScore": <number 0-100>,
  "executiveSummary": "<2-3 sentence overall verdict>",

  "performanceHealth": {
    "insights": [
      { "type": "success|warning|error", "message": "<insight>" }
    ],
    "recommendations": [
      { "type": "success|warning|error", "message": "<recommendation>" }
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
      { "type": "success|warning|error", "message": "<insight>" }
    ],
    "recommendations": [
      { "type": "success|warning|error", "message": "<recommendation>" }
    ]
  },

  "imageAccessibility": {
    "insights": [
      { "type": "success|warning|error", "message": "<insight>" }
    ],
    "recommendations": [
      { "type": "success|warning|error", "message": "<recommendation>" }
    ]
  },

  "buttonInteractive": {
    "insights": [
      { "type": "success|warning|error", "message": "<insight>" }
    ],
    "recommendations": [
      { "type": "success|warning|error", "message": "<recommendation>" }
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

  const h1Count = headings.filter((h) => h.level === 1).length;
  const missingAltCount = images.filter((i) => !i.alt && !i.hasAlt).length;
  const noNameButtons = buttons.filter((b) => b.hasNoAccessibleName).length;

  const performanceInsights = [];
  if (timings.ttfb) performanceInsights.push({ type: timings.ttfb < 100 ? "success" : "warning", message: `TTFB is ${timings.ttfb}ms${timings.ttfb < 100 ? " — excellent server response." : " — consider optimizing server response time."}` });
  if (timings.load) performanceInsights.push({ type: timings.load < 2000 ? "success" : "warning", message: `Full page load: ${timings.load}ms${timings.load < 2000 ? " — within acceptable range." : " — aim for under 2 seconds."}` });

  const seoInsights = [];
  if (!meta.description) seoInsights.push({ type: "error", message: "No meta description found. Add one (50–160 chars) for better SEO." });
  if (meta.lang) seoInsights.push({ type: "success", message: `Language attribute set to "${meta.lang}" — good for accessibility.` });
  if (meta.viewport) seoInsights.push({ type: "success", message: "Viewport meta tag configured — essential for mobile responsiveness." });

  const headingInsights = [];
  if (h1Count > 1) headingInsights.push({ type: "error", message: `Found ${h1Count} H1 tags. Use only one H1 per page.` });
  else if (h1Count === 1) headingInsights.push({ type: "success", message: "Single H1 tag found — correct semantic structure." });
  else headingInsights.push({ type: "warning", message: "No H1 tag found. Each page should have exactly one H1." });

  const imageInsights = [];
  if (missingAltCount > 0) imageInsights.push({ type: "error", message: `${missingAltCount} image(s) missing alt text.` });
  else if (images.length > 0) imageInsights.push({ type: "success", message: "All images have alt text — passes WCAG 1.1.1." });

  const buttonInsights = [];
  if (noNameButtons > 0) buttonInsights.push({ type: "error", message: `${noNameButtons} button(s) have no accessible name.` });
  else if (buttons.length > 0) buttonInsights.push({ type: "success", message: "All buttons have accessible names." });

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
