
chrome.runtime.onInstalled.addListener(async () => {
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_ACTIVE_TAB") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse({ ok: true, tab: tabs[0] });
    });
    return true;
  }

  if (message.type === "RUN_DEEP_SCAN") {
    fetch("http://localhost:8787/api/scan/deep", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(message.payload)
    })
      .then(async (res) => {
        const data = await res.json();
        sendResponse(data);
      })
      .catch((err) => {
        sendResponse({ ok: false, error: err.message });
      });

    return true;
  }

  if (message.type === "GET_PROJECTS") {
    fetch("http://localhost:8787/api/projects")
      .then(async (res) => sendResponse(await res.json()))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }
});
