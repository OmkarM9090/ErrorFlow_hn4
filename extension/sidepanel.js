let lastCurrentScan = null;
let lastDeepScan = null;

function $(id) {
  return document.getElementById(id);
}

function setStatus(message) {
  const el = $("globalStatus");
  if (el) el.textContent = message;
}

function setLoading(isLoading, message = "Working...") {
  const bar = $("loadingBar");
  const issuesLoading = $("issuesLoading");

  if (bar) bar.classList.toggle("hidden", !isLoading);
  if (issuesLoading) issuesLoading.classList.toggle("hidden", !isLoading);

  setStatus(isLoading ? message : "Idle");
}

function setQuickStats({
  pages = 0,
  violations = 0,
  critical = 0,
  score = "—"
} = {}) {
  if ($("statPages")) $("statPages").textContent = pages;
  if ($("statViolations")) $("statViolations").textContent = violations;
  if ($("statCritical")) $("statCritical").textContent = critical;
  if ($("statScore")) $("statScore").textContent = score ?? "—";
}

async function getActiveTab() {
  console.log("[EXT] GET_ACTIVE_TAB called");
  return chrome.runtime.sendMessage({ type: "GET_ACTIVE_TAB" });
}

async function ensureContentScript(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { type: "PING" });
    console.log("[EXT] Content script already loaded");
  } catch {
    console.log("[EXT] Injecting content.js into tab:", tabId);
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"]
    });
    console.log("[EXT] content.js injected");
  }
}

async function callAiRemediation(payload) {
  console.log("[EXT][AI] Sending payload:", payload);

  const response = await fetch("http://localhost:8787/api/ai/remediate-issue", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  console.log("[EXT][AI] Response:", data);

  return data;
}

async function checkAiHealth() {
  const result = await chrome.runtime.sendMessage({ type: "CHECK_AI_HEALTH" });
  console.log("[EXT] AI health:", result);
  return result;
}

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function countCriticalIssues(items = []) {
  return items.filter((x) => x.impact === "critical").length;
}

function buildIssuePayload(item, pageUrl, pageTitle, framework) {
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

function renderAiFix(aiData) {
  const box = $("aiFixBox");

  if (!aiData?.ok) {
    box.textContent = aiData?.error || "AI fix generation failed.";
    return;
  }

  const r = aiData.result || {};

  box.textContent = [
    `Title: ${r.title || ""}`,
    `Severity: ${r.severity || ""}`,
    ``,
    `Summary:`,
    r.summary || "",
    ``,
    `Why it matters:`,
    r.whyItMatters || "",
    ``,
    `Likely user impact:`,
    ...(r.likelyUserImpact || []).map((x) => `- ${x}`),
    ``,
    `Root cause:`,
    r.rootCause || "",
    ``,
    `Fix strategy:`,
    ...(r.fixStrategy || []).map((x) => `- ${x}`),
    ``,
    `HTML fix:`,
    r.htmlFix || "",
    ``,
    `React fix:`,
    r.reactFix || "",
    ``,
    `ARIA fallback:`,
    r.ariaFallback || "",
    ``,
    `Testing checklist:`,
    ...(r.testingChecklist || []).map((x) => `- ${x}`),
    ``,
    `Assumptions:`,
    ...(r.assumptions || []).map((x) => `- ${x}`),
    ``,
    `Confidence: ${r.confidence ?? ""}`
  ].join("\n");
}

function createIssueCard(item, pageUrl, pageTitle) {
  const el = document.createElement("div");
  el.className = "issue";

  const nodeCount = (item.nodes || []).length;
  const helpUrl = item.helpUrl || "";
  const impact = item.impact || "unknown";

  el.innerHTML = `
    <div><strong>${escapeHtml(item.id)}</strong></div>
    <div>${escapeHtml(item.help || "")}</div>
    <div class="meta">Impact: ${escapeHtml(impact)} | Nodes: ${nodeCount}</div>
    <div class="meta">${escapeHtml(helpUrl)}</div>
    <div class="issue-actions">
      <button class="btn btn-primary ai-fix-btn">Generate AI Fix</button>
    </div>
  `;

  const btn = el.querySelector(".ai-fix-btn");
  btn.addEventListener("click", async () => {
    const framework = $("framework")?.value || "html";
    const aiBox = $("aiFixBox");
    aiBox.textContent = `Generating AI fix for "${item.id}"...`;

    const payload = buildIssuePayload(item, pageUrl, pageTitle, framework);

    try {
      setLoading(true, "Generating AI remediation...");
      const aiResponse = await callAiRemediation(payload);
      renderAiFix(aiResponse);
    } catch (error) {
      console.error("[EXT][AI] Failed:", error);
      aiBox.textContent = error.message || "AI request failed.";
    } finally {
      setLoading(false);
    }
  });

  return el;
}

function renderCurrentScan(data) {
  lastCurrentScan = data;

  const summary = $("summary");
  const issues = $("issues");

  const violations = data.result?.violations || [];
  const incomplete = data.result?.incomplete || [];
  const totalShown = violations.length + incomplete.length;

  summary.innerHTML = `
    <div><strong>${escapeHtml(data.title || "Untitled Page")}</strong></div>
    <div>${escapeHtml(data.url || "")}</div>
    <div style="margin-top:8px">Violations: <strong>${violations.length}</strong></div>
    <div>Needs review: <strong>${incomplete.length}</strong></div>
  `;

  issues.innerHTML = "";

  if (!totalShown) {
    issues.innerHTML = "<div>No issues found on this page.</div>";
    setQuickStats({
      pages: 1,
      violations: 0,
      critical: 0,
      score: "—"
    });
    return;
  }

  for (const item of violations) {
    issues.appendChild(createIssueCard(item, data.url, data.title));
  }

  for (const item of incomplete) {
    issues.appendChild(createIssueCard(item, data.url, data.title));
  }

  setQuickStats({
    pages: 1,
    violations: violations.length,
    critical: countCriticalIssues(violations),
    score: "—"
  });
}

function renderDeepScan(data) {
  lastDeepScan = data;

  const summary = $("summary");
  const issues = $("issues");
  const deepBox = $("deepScanResult");

  deepBox.textContent = JSON.stringify(data, null, 2);

  const firstPage = data?.pages?.[0];
  const pageUrl = firstPage?.url || data?.baseUrl || "";
  const pageTitle = firstPage?.axe?.title || "Deep Scan Result";
  const violations = firstPage?.axe?.violations || [];
  const incomplete = firstPage?.axe?.incomplete || [];
  const s = data?.summary || {};

  summary.innerHTML = `
    <div><strong>${escapeHtml(pageTitle)}</strong></div>
    <div>${escapeHtml(pageUrl)}</div>
    <div style="margin-top:8px">Pages scanned: <strong>${s.pagesScanned ?? 0}</strong></div>
    <div>Total violations: <strong>${s.totalViolations ?? 0}</strong></div>
    <div>Accessibility score: <strong>${s.avgAccessibilityScore ?? "N/A"}</strong></div>
  `;

  issues.innerHTML = "";

  if (!violations.length && !incomplete.length) {
    issues.innerHTML = "<div>No issues found in deep scan.</div>";
  } else {
    for (const item of violations) {
      issues.appendChild(createIssueCard(item, pageUrl, pageTitle));
    }

    for (const item of incomplete) {
      issues.appendChild(createIssueCard(item, pageUrl, pageTitle));
    }
  }

  setQuickStats({
    pages: s.pagesScanned || 0,
    violations: s.totalViolations || 0,
    critical: s.criticalCount || 0,
    score: s.avgAccessibilityScore ?? "—"
  });
}

async function onScanCurrentPage() {
  console.log("[EXT] Scan Current Page clicked");

  const { tab } = await getActiveTab();
  if (!tab?.id) {
    console.warn("[EXT] No active tab");
    return;
  }

  try {
    setLoading(true, "Scanning current page...");
    await ensureContentScript(tab.id);

    const response = await chrome.tabs.sendMessage(tab.id, { type: "RUN_AXE" });
    console.log("[EXT] RUN_AXE response:", response);

    if (!response?.ok) {
      $("summary").textContent = response?.error || "Scan failed";
      return;
    }

    renderCurrentScan(response);
  } catch (error) {
    console.error("[EXT] Current page scan failed:", error);
    $("summary").textContent = error.message || "Scan failed";
  } finally {
    setLoading(false);
  }
}

async function onClearHighlights() {
  console.log("[EXT] Clear Highlights clicked");

  const { tab } = await getActiveTab();
  if (!tab?.id) return;

  try {
    await ensureContentScript(tab.id);
    await chrome.tabs.sendMessage(tab.id, { type: "CLEAR_OVERLAYS" });
  } catch (error) {
    console.error("[EXT] Failed to clear overlays:", error);
  }
}

async function onDeepScan() {
  console.log("[EXT] Deep Scan clicked");

  const { tab } = await getActiveTab();
  if (!tab?.url) {
    console.warn("[EXT] No active tab URL");
    return;
  }

  const projectName = $("projectName")?.value.trim() || "Untitled Project";
  const maxPages = Number($("maxPages")?.value || 5);

  try {
    setLoading(true, "Running deep scan...");

    const response = await chrome.runtime.sendMessage({
      type: "RUN_DEEP_SCAN",
      payload: {
        url: tab.url,
        projectName,
        maxPages
      }
    });

    console.log("[EXT] Deep scan response:", response);

    if (!response?.ok) {
      $("deepScanResult").textContent = response?.error || "Deep scan failed";
      return;
    }

    renderDeepScan(response);
  } catch (error) {
    console.error("[EXT] Deep scan failed:", error);
    $("deepScanResult").textContent = error.message || "Deep scan failed";
  } finally {
    setLoading(false);
  }
}

async function boot() {
  console.log("[EXT] AccessLens AI booting");

  setQuickStats({
    pages: 0,
    violations: 0,
    critical: 0,
    score: "—"
  });

  setStatus("Checking AI health...");

  try {
    const ai = await checkAiHealth();
    if (ai?.ok) {
      setStatus("AI connected");
    } else {
      setStatus(`AI unavailable: ${ai?.error || "unknown error"}`);
    }
  } catch (error) {
    console.error("[EXT] AI health check failed:", error);
    setStatus("AI unavailable");
  }

  $("scanCurrentBtn")?.addEventListener("click", onScanCurrentPage);
  $("clearBtn")?.addEventListener("click", onClearHighlights);
  $("deepScanBtn")?.addEventListener("click", onDeepScan);
}

document.addEventListener("DOMContentLoaded", boot);