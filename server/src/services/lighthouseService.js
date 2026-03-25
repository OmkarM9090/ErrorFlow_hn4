import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

async function runSingleLighthouse(url) {
  let chrome;

  try {
    chrome = await chromeLauncher.launch({
      chromeFlags: [
        "--headless=new",
        "--no-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage"
      ]
    });

    const runnerResult = await lighthouse(url, {
      port: chrome.port,
      output: "json",
      logLevel: "error",
      onlyCategories: ["accessibility", "best-practices", "seo"],
      formFactor: "desktop",
      screenEmulation: {
        mobile: false,
        width: 1365,
        height: 768,
        deviceScaleFactor: 1,
        disabled: false
      }
    });

    const lhr = runnerResult?.lhr;

    return {
      ok: true,
      accessibility: Math.round((lhr?.categories?.accessibility?.score || 0) * 100),
      performance: null,
      bestPractices: Math.round((lhr?.categories?.["best-practices"]?.score || 0) * 100),
      seo: Math.round((lhr?.categories?.seo?.score || 0) * 100)
    };
  } catch (error) {
    return {
      ok: false,
      accessibility: null,
      performance: null,
      bestPractices: null,
      seo: null,
      error: error.message
    };
  } finally {
    if (chrome) {
      await chrome.kill();
    }
  }
}

export async function runLighthouseForPages(urls) {
  const results = [];

  for (const url of urls) {
    const result = await runSingleLighthouse(url);
    results.push(result);
  }

  return results;
}