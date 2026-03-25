import { chromium } from "playwright";
import fs from "fs/promises";
import path from "path";
import axeSource from "axe-core";

export async function runAxeAuditForPages(urls) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const results = [];

  await fs.mkdir("reports", { recursive: true });

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];

    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
      await page.addScriptTag({ content: axeSource.source });

      const axeResult = await page.evaluate(async () => {
        return await window.axe.run(document, {
          resultTypes: ["violations", "incomplete", "passes"],
          runOnly: {
            type: "tag",
            values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"]
          }
        });
      });

      const fileName = `page-${i + 1}.png`;
      const screenshotPath = path.join("reports", fileName);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      results.push({
        title: await page.title(),
        violations: axeResult.violations,
        incomplete: axeResult.incomplete,
        passesCount: axeResult.passes.length,
        screenshotPath
      });
    } catch (error) {
      results.push({
        title: url,
        violations: [],
        incomplete: [],
        passesCount: 0,
        screenshotPath: null,
        error: error.message
      });
    }
  }

  await browser.close();
  return results;
}