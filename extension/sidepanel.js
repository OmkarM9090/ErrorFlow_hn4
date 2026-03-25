let lastScanData = null;
let lastDeepScanData = null;

async function getActiveTab() {
  console.log("[EXT] GET_ACTIVE_TAB called");
  return chrome.runtime.sendMessage({ type: "GET_ACTIVE_TAB" });
}

async function ensureContentScript(tabId) {
  try {
    console.log("[EXT] Pinging content script:", tabId);
    await chrome.tabs.sendMessage(tabId, { type: "PING" });
    console.log("[EXT] Content script already present");
  } catch {
    console.log("[EXT] Injecting content.js:", tabId);
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"]
    });
    console.log("[EXT] content.js injected");
  }
}

async function callAiRemediation(payload) {
  console.log("[EXT][AI] Sending payload to /api/ai/remediate-issue");
  console.log("[EXT][AI] Payload:", JSON.stringify(payload, null, 2));

  const response = await fetch("http://localhost:8787/api/ai/remediate-issue", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  console.log("[EXT][AI] HTTP status:", response.status);

  const data = await response.json();
  console.log("[EXT][AI] Response JSON:", data);

  return data;
}

function renderAiFix(aiData) {
  const box = document.getElementById("aiFixBox");

  console.log("[EXT][AI] Rendering AI fix:", aiData);

  if (!aiData?.ok) {
    box.textContent = aiData?.error || "AI fix generation failed.";
    return;
  }

  const r = aiData.result;

  box.textContent = [
    `Title: ${r.title}`,
    `Severity: ${r.severity}`,
    ``,
    `Summary:`,
    r.summary,
    ``,
    `Why it matters:`,
    r.whyItMatters,
    ``,
    `Likely user impact:`,
    ...(r.likelyUserImpact || []).map((x) => `- ${x}`),
    ``,
    `Root cause:`,
    r.rootCause,
    ``,
    `Fix strategy:`,
    ...(r.fixStrategy || []).map((x) => `- ${x}`),
    ``,
    `HTML fix:`,
    r.htmlFix,
    ``,
    `React fix:`,
    r.reactFix,
    ``,
    `ARIA fallback:`,
    r.ariaFallback,
    ``,
    `Testing checklist:`,
    ...(r.testingChecklist || []).map((x) => `- ${x}`),
    ``,
    `Assumptions:`,
    ...(r.assumptions || []).map((x) => `- ${x}`),
    ``,
    `Confidence: ${r.confidence}`
  ].join("\n");
}

function makeIssuePayload({ item, pageUrl, pageTitle, framework }) {
  return {
    issueId: item.id,
    help: item.help,
    description: item.description || "",
    impact: item.impact || "",
    helpUrl: item.helpUrl || "",
    tags: item.tags || [],
    selector: item.nodes?.[0]?.target?.[0] || "",
    htmlSnippet: item.nodes?.[0]?.html || "",
    pageUrl: pageUrl || "",
    pageTitle: pageTitle || "",
    framework: framework || "html"
  };
}

function createIssueCard({ item, pageUrl, pageTitle }) {
  const el = document.createElement("div");
  el.className = "issue";

  const framework = () => document.getElementById("framework").value;
  const helpUrl = item.helpUrl || "";

  el.innerHTML = `
    <div><strong>${item.id}</strong></div>
    <div>${item.help}</div>
    <div class="meta">Impact: ${item.impact || "unknown"} | Nodes: ${(item.nodes || []).length}</div>
    <div class="meta">${helpUrl}</div>
    <button class="ai-fix-btn">Generate AI Fix</button>
  `;

  const btn = el.querySelector(".ai-fix-btn");
  btn.addEventListener("click", async () => {
    const aiBox = document.getElementById("aiFixBox");
    aiBox.textContent = `Generating AI fix for "${item.id}"...`;

    const payload = makeIssuePayload({
      item,
      pageUrl,
      pageTitle,
      framework: framework()
    });

    console.log("[EXT][AI] Generate AI Fix clicked");
    console.log("[EXT][AI] Final payload:", payload);

    try {
      const aiResponse = await callAiRemediation(payload);
      renderAiFix(aiResponse);
    } catch (error) {
      console.error("[EXT][AI] Request failed:", error);
      aiBox.textContent = error.message || "AI call failed.";
    }
  });

  return el;
}

function renderCurrentScan(data) {
  console.log("[EXT] renderCurrentScan called");
  console.log("[EXT] Current scan data:", data);

  lastScanData = data;

  const summary = document.getElementById("summary");
  const issues = document.getElementById("issues");

  const violations = data.result?.violations || [];
  const incomplete = data.result?.incomplete || [];

  summary.innerHTML = `
    <div><strong>${data.title}</strong></div>
    <div>${data.url}</div>
    <div style="margin-top:8px">Violations: <strong>${violations.length}</strong></div>
    <div>Needs review: <strong>${incomplete.length}</strong></div>
  `;

  issues.innerHTML = "";

  if (!violations.length && !incomplete.length) {
    issues.innerHTML = "<div>No issues found on this page.</div>";
    return;
  }

  for (const item of violations) {
    issues.appendChild(
      createIssueCard({
        item,
        pageUrl: data.url,
        pageTitle: data.title
      })
    );
  }

  for (const item of incomplete) {
    issues.appendChild(
      createIssueCard({
        item,
        pageUrl: data.url,
        pageTitle: data.title
      })
    );
  }
}

function renderDeepScanIssues(response) {
  console.log("[EXT] renderDeepScanIssues called");
  console.log("[EXT] Deep scan data:", response);

  lastDeepScanData = response;

  const issues = document.getElementById("issues");
  const summary = document.getElementById("summary");
  issues.innerHTML = "";

  const firstPage = response?.pages?.[0];
  const pageUrl = firstPage?.url || "";
  const pageTitle = firstPage?.axe?.title || "";

  const violations = firstPage?.axe?.violations || [];
  const incomplete = firstPage?.axe?.incomplete || [];
  const s = response?.summary || {};

  summary.innerHTML = `
    <div><strong>${pageTitle || "Deep Scan Result"}</strong></div>
    <div>${pageUrl}</div>
    <div style="margin-top:8px">Pages scanned: <strong>${s.pagesScanned ?? 0}</strong></div>
    <div>Total violations: <strong>${s.totalViolations ?? 0}</strong></div>
    <div>Accessibility score: <strong>${s.avgAccessibilityScore ?? "N/A"}</strong></div>
  `;

  if (!violations.length && !incomplete.length) {
    issues.innerHTML = "<div>No issues found in deep scan.</div>";
    return;
  }

  for (const item of violations) {
    issues.appendChild(
      createIssueCard({
        item,
        pageUrl,
        pageTitle
      })
    );
  }

  for (const item of incomplete) {
    issues.appendChild(
      createIssueCard({
        item,
        pageUrl,
        pageTitle
      })
    );
  }
}

document.getElementById("scanCurrentBtn").addEventListener("click", async () => {
  console.log("[EXT] Scan Current Page clicked");

  const { tab } = await getActiveTab();
  if (!tab || !tab.id) {
    console.warn("[EXT] No active tab found");
    return;
  }

  await ensureContentScript(tab.id);

  console.log("[EXT] Sending RUN_AXE to tab:", tab.id);
  const response = await chrome.tabs.sendMessage(tab.id, { type: "RUN_AXE" });
  console.log("[EXT] RUN_AXE response:", response);

  if (!response?.ok) {
    document.getElementById("summary").textContent = response?.error || "Scan failed";
    return;
  }

  renderCurrentScan(response);
});

document.getElementById("clearBtn").addEventListener("click", async () => {
  console.log("[EXT] Clear Highlights clicked");

  const { tab } = await getActiveTab();
  if (!tab || !tab.id) return;

  await ensureContentScript(tab.id);
  await chrome.tabs.sendMessage(tab.id, { type: "CLEAR_OVERLAYS" });
  console.log("[EXT] Overlays cleared");
});

document.getElementById("deepScanBtn").addEventListener("click", async () => {
  console.log("[EXT] Deep Scan clicked");

  const { tab } = await getActiveTab();
  if (!tab?.url) {
    console.warn("[EXT] No tab URL found");
    return;
  }

  const projectName = document.getElementById("projectName").value.trim() || "Untitled Project";
  const maxPages = Number(document.getElementById("maxPages").value || 5);

  const resultBox = document.getElementById("deepScanResult");
  resultBox.textContent = "Running deep scan...";

  const payload = {
    url: tab.url,
    projectName,
    maxPages
  };

  console.log("[EXT] Sending deep scan payload:", payload);

  const response = await chrome.runtime.sendMessage({
    type: "RUN_DEEP_SCAN",
    payload
  });

  console.log("[EXT] Deep scan response:", response);

  resultBox.textContent = JSON.stringify(response, null, 2);

  if (response?.ok) {
    renderDeepScanIssues(response);
  }
});