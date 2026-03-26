(() => {
  const ROOT_ID = "__accesslens_overlay_root__";

  function clearOverlays() {
    const root = document.getElementById(ROOT_ID);
    if (root) root.remove();

    document.querySelectorAll("[data-accesslens-highlight='true']").forEach((el) => {
      el.style.outline = "";
      el.style.outlineOffset = "";
      el.removeAttribute("data-accesslens-highlight");
    });
  }

  function createOverlayRoot() {
    clearOverlays();

    const root = document.createElement("div");
    root.id = ROOT_ID;
    root.style.position = "fixed";
    root.style.left = "0";
    root.style.top = "0";
    root.style.width = "100%";
    root.style.height = "100%";
    root.style.pointerEvents = "none";
    root.style.zIndex = "2147483647";

    document.documentElement.appendChild(root);
    return root;
  }

  async function ensureAxeLoaded() {
    if (window.axe) return true;

    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("injected/axe.min.js");

    const loaded = new Promise((resolve, reject) => {
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error("Failed to load axe.min.js"));
    });

    (document.head || document.documentElement).appendChild(script);
    await loaded;
    script.remove();

    return !!window.axe;
  }

  function drawViolations(violations) {
    const root = createOverlayRoot();

    for (const violation of violations || []) {
      for (const node of violation.nodes || []) {
        try {
          const selector = node.target?.[0];
          if (!selector) continue;

          const el = document.querySelector(selector);
          if (!el) continue;

          const rect = el.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) continue;

          el.style.outline = "3px solid #ef4444";
          el.style.outlineOffset = "2px";
          el.setAttribute("data-accesslens-highlight", "true");

          const badge = document.createElement("div");
          badge.textContent = violation.id;
          badge.style.position = "fixed";
          badge.style.left = `${Math.max(8, rect.left)}px`;
          badge.style.top = `${Math.max(8, rect.top - 26)}px`;
          badge.style.background = "rgba(17, 24, 39, 0.95)";
          badge.style.color = "#fff";
          badge.style.padding = "4px 8px";
          badge.style.borderRadius = "999px";
          badge.style.fontSize = "11px";
          badge.style.fontWeight = "700";
          badge.style.border = "1px solid rgba(255,255,255,0.15)";
          badge.style.boxShadow = "0 8px 24px rgba(0,0,0,0.35)";
          badge.style.pointerEvents = "none";

          root.appendChild(badge);
        } catch (error) {
          console.warn("[CONTENT] Failed to draw overlay:", error);
        }
      }
    }
  }

  async function runAxeAudit() {
    await ensureAxeLoaded();

    if (!window.axe) {
      throw new Error("axe-core not available on page");
    }

    const result = await window.axe.run(document, {
      resultTypes: ["violations", "incomplete", "passes"],
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"]
      }
    });

    drawViolations(result.violations || []);

    return {
      ok: true,
      title: document.title,
      url: location.href,
      result
    };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "PING") {
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "CLEAR_OVERLAYS") {
      clearOverlays();
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "RUN_AXE") {
      (async () => {
        try {
          const response = await runAxeAudit();
          sendResponse(response);
        } catch (error) {
          console.error("[CONTENT] RUN_AXE failed:", error);
          sendResponse({ ok: false, error: error.message });
        }
      })();

      return true;
    }
  });
})();