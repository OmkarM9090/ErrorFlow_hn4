import { chromium } from "playwright";

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    u.hash = "";
    return u.toString().replace(/\/$/, "") || u.toString();
  } catch {
    return null;
  }
}

function isSameOrigin(baseUrl, candidate) {
  try {
    return new URL(baseUrl).origin === new URL(candidate).origin;
  } catch {
    return false;
  }
}

export async function crawlSite(startUrl, maxPages = 5) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const queue = [normalizeUrl(startUrl)];
  const visited = new Set();
  const found = [];

  while (queue.length && found.length < maxPages) {
    const url = queue.shift();
    if (!url || visited.has(url)) continue;

    visited.add(url);

    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

      found.push(url);

      const links = await page.$$eval("a[href]", (anchors) =>
        anchors.map((a) => a.href).filter(Boolean)
      );

      for (const link of links) {
        const normalized = normalizeUrl(link);
        if (!normalized) continue;
        if (!isSameOrigin(startUrl, normalized)) continue;
        if (visited.has(normalized)) continue;
        if (!queue.includes(normalized)) queue.push(normalized);
      }
    } catch (e) {
      console.warn("Crawl skip:", url, e.message);
    }
  }

  await browser.close();
  return found;
}