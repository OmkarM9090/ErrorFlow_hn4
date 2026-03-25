(() => {
  const ROOT_ID = "__a11y_overlay_root__";

  function clearOverlays() {
    const existing = document.getElementById(ROOT_ID);
    if (existing) existing.remove();

    document.querySelectorAll("[data-a11y-highlight='true']").forEach((el) => {
      el.style.outline = "";
      el.removeAttribute("data-a11y-highlight");
    });
  }

  function createRoot() {
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

    const done = new Promise((resolve, reject) => {
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error("Failed to load axe.min.js"));
    });

    (document.head || document.documentElement).appendChild(script);
    await done;
    script.remove();

    return !!window.axe;
  }

  function drawViolations(violations) {
    const root = createRoot();

    for (const violation of violations) {
      for (const node of violation.nodes) {
        try {
          const selector = node.target && node.target[0];
          if (!selector) continue;

          const el = document.querySelector(selector);
          if (!el) continue;

          const rect = el.getBoundingClientRect();
          if (!rect.width && !rect.height) continue;

          el.style.outline = "3px solid red";
          el.setAttribute("data-a11y-highlight", "true");

          const label = document.createElement("div");
          label.textContent = violation.id;
          label.style.position = "fixed";
          label.style.left = `${Math.max(rect.left, 0)}px`;
          label.style.top = `${Math.max(rect.top - 22, 0)}px`;
          label.style.background = "#111";
          label.style.color = "#fff";
          label.style.padding = "2px 6px";
          label.style.fontSize = "11px";
          label.style.fontWeight = "700";
          label.style.borderRadius = "6px";
          label.style.pointerEvents = "none";

          root.appendChild(label);
        } catch (e) {
          console.warn("Overlay draw failed:", e);
        }
      }
    }
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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

          drawViolations(result.violations);

          sendResponse({
            ok: true,
            title: document.title,
            url: location.href,
            result
          });
        } catch (error) {
          sendResponse({
            ok: false,
            error: error.message
          });
        }
      })();

      return true;
    }
  });
})();