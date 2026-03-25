import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const apiKey = process.env.FEATHERLESS_API_KEY;
const baseURL = process.env.FEATHERLESS_BASE_URL || "https://api.featherless.ai/v1";
const model = process.env.FEATHERLESS_MODEL || "Qwen/Qwen2.5-7B-Instruct";

const client = new OpenAI({
  apiKey,
  baseURL
});

function extractJsonBlock(text) {
  if (!text) return "";

  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

function repairAlmostJson(text) {
  let s = extractJsonBlock(text);

  // Replace smart quotes
  s = s
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");

  // Convert single-quoted key names to double-quoted keys
  s = s.replace(/'([^']+?)'\s*:/g, '"$1":');

  // Convert : 'value' to : "value"
  // Handles escaped single quotes inside string loosely
  s = s.replace(/:\s*'((?:\\'|[^'])*)'/g, (_m, val) => {
    const fixed = val
      .replace(/\\"/g, '"')
      .replace(/"/g, '\\"')
      .replace(/\\'/g, "'");
    return `: "${fixed}"`;
  });

  // Convert array items like ['a', 'b'] to ["a", "b"]
  s = s.replace(/(\[|,)\s*'((?:\\'|[^'])*)'\s*(?=,|\])/g, (_m, prefix, val) => {
    const fixed = val
      .replace(/\\"/g, '"')
      .replace(/"/g, '\\"')
      .replace(/\\'/g, "'");
    return `${prefix} "${fixed}"`;
  });

  // Remove trailing commas before } or ]
  s = s.replace(/,\s*([}\]])/g, "$1");

  return s;
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    const repaired = repairAlmostJson(text);
    return JSON.parse(repaired);
  }
}

function buildIssueMessages(payload) {
  const {
    issueId,
    help,
    description,
    impact,
    helpUrl,
    tags = [],
    selector = "",
    htmlSnippet = "",
    pageUrl = "",
    pageTitle = "",
    framework = "html"
  } = payload;

  return [
    {
      role: "system",
      content: `
You are a senior accessibility remediation assistant.

Return STRICT VALID JSON only.
No markdown.
No code fences.
No explanation outside JSON.
Every JSON string value MUST use double quotes.
Never use single quotes for JSON strings.
Escape quotes inside code strings properly.

Return exactly this shape:
{
  "issueId": "string",
  "title": "string",
  "severity": "string",
  "summary": "string",
  "whyItMatters": "string",
  "likelyUserImpact": ["string"],
  "rootCause": "string",
  "fixStrategy": ["string"],
  "htmlFix": "string",
  "reactFix": "string",
  "ariaFallback": "string",
  "testingChecklist": ["string"],
  "assumptions": ["string"],
  "confidence": 0.95
}

Rules:
- Prefer semantic HTML first.
- Use ARIA only when needed.
- Keep code practical and short.
- Be specific to the provided selector/snippet.
- If snippet is incomplete, mention assumptions.
- htmlFix and reactFix must be strings containing escaped code.
- confidence must be a number between 0 and 1.
      `.trim()
    },
    {
      role: "user",
      content: `
Generate an accessibility remediation.

Page title: ${pageTitle}
Page URL: ${pageUrl}
Preferred framework: ${framework}

Issue ID: ${issueId}
Help: ${help}
Description: ${description}
Impact: ${impact}
Help URL: ${helpUrl}
Tags: ${tags.join(", ")}

Selector:
${selector || "N/A"}

HTML snippet:
${htmlSnippet || "N/A"}
      `.trim()
    }
  ];
}

export async function testFeatherlessConnection() {
  if (!apiKey) {
    throw new Error("Missing FEATHERLESS_API_KEY in server/.env");
  }

  console.log("[FEATHERLESS TEST] sending request");

  const response = await client.chat.completions.create({
    model,
    temperature: 0,
    max_tokens: 80,
    messages: [
      {
        role: "system",
        content: `
Return exactly this valid JSON and nothing else:
{"ok":true,"message":"featherless working"}
        `.trim()
      },
      {
        role: "user",
        content: "Return the JSON now."
      }
    ]
  });

  const content = response.choices?.[0]?.message?.content?.trim();

  console.log("[FEATHERLESS TEST] raw response:", content);

  if (!content) {
    throw new Error("Featherless returned empty content");
  }

  return {
    provider: "featherless",
    model,
    raw: content,
    parsed: safeJsonParse(content)
  };
}

export async function generateIssueRemediation(payload) {
  if (!apiKey) {
    throw new Error("Missing FEATHERLESS_API_KEY in server/.env");
  }

  console.log("[FEATHERLESS REMEDIATE] payload received:");
  console.log(JSON.stringify(payload, null, 2));

  const response = await client.chat.completions.create({
    model,
    temperature: 0,
    max_tokens: 1400,
    messages: buildIssueMessages(payload)
  });

  const content = response.choices?.[0]?.message?.content?.trim();

  console.log("[FEATHERLESS REMEDIATE] raw model response:");
  console.log(content);

  if (!content) {
    throw new Error("Featherless returned empty content");
  }

  const parsed = safeJsonParse(content);

  // Normalize confidence to 0..1 if model returns 95 instead of 0.95
  if (typeof parsed.confidence === "number" && parsed.confidence > 1) {
    parsed.confidence = Math.max(0, Math.min(1, parsed.confidence / 100));
  }

  // Ensure required fields exist
  parsed.issueId ??= payload.issueId;
  parsed.title ??= payload.help || payload.issueId;
  parsed.severity ??= payload.impact || "unknown";
  parsed.summary ??= "";
  parsed.whyItMatters ??= "";
  parsed.likelyUserImpact ??= [];
  parsed.rootCause ??= "";
  parsed.fixStrategy ??= [];
  parsed.htmlFix ??= "";
  parsed.reactFix ??= "";
  parsed.ariaFallback ??= "";
  parsed.testingChecklist ??= [];
  parsed.assumptions ??= [];
  parsed.confidence ??= 0.7;

  console.log("[FEATHERLESS REMEDIATE] parsed JSON:");
  console.log(JSON.stringify(parsed, null, 2));

  return {
    provider: "featherless",
    model,
    result: parsed
  };
}