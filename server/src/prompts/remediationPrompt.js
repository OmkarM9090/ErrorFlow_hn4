export function buildRemediationMessages(payload) {
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

  const system = `
You are a senior accessibility engineer and remediation assistant.

Your task:
- Explain the accessibility issue clearly.
- Generate a safe, practical remediation.
- Prefer semantic HTML first.
- Use ARIA only when semantic HTML alone is not enough.
- Return strict JSON only.
- Do not include markdown fences.
- Do not include any text outside JSON.

Rules:
- Assume the user is a web developer.
- Be specific to the provided selector and snippet.
- If the snippet is incomplete, state assumptions clearly.
- Provide both framework-specific fix and generic fallback.
- Keep code concise and production-usable.
- Mention relevant WCAG concepts when helpful.
- Avoid inventing page structure that is not implied.

Return JSON with exactly this shape:
{
  "issueId": string,
  "title": string,
  "severity": string,
  "summary": string,
  "whyItMatters": string,
  "likelyUserImpact": [string],
  "rootCause": string,
  "fixStrategy": [string],
  "htmlFix": string,
  "reactFix": string,
  "ariaFallback": string,
  "testingChecklist": [string],
  "assumptions": [string],
  "confidence": number
}
`.trim();

  const user = `
Generate an accessibility remediation for this issue.

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
`.trim();

  return [
    { role: "system", content: system },
    { role: "user", content: user }
  ];
}