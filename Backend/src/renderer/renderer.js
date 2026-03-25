/**
 * renderer.js
 *
 * Changes from original:
 *  - Added `bypassCSP: true` to browser.newContext()
 *
 * WHY: Sites with strict Content-Security-Policy (e.g. GFG, large news sites)
 * block all runtime script injection — including page.evaluate(source) and
 * page.addScriptTag(). bypassCSP: true tells Chromium to ignore those headers.
 * This is safe and correct for an audit bot that never runs in user sessions.
 *
 * Everything else is identical to the original renderer.js.
 */

const { chromium } = require('playwright');

class Renderer {
  constructor() {
    this.browser = null;
  }

  async launch() {
    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });
  }

  async renderPage(url) {
    if (!this.browser) {
      throw new Error('Browser not launched. Call renderer.launch() first.');
    }

    const context = await this.browser.newContext({
      userAgent:
        'Mozilla/5.0 (compatible; AccessibilityAuditBot/1.0; +https://yourdomain.com/bot)',
      viewport:   { width: 1280, height: 800 },
      bypassCSP:  true,   // ← THE ONLY CHANGE: allows axe-core injection on CSP-protected sites
    });

    const page = await context.newPage();
    const navigationStart = Date.now();

    try {
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout:   20000,
      });
    } catch (err) {
      console.warn(`[Renderer] Navigation warning for ${url}: ${err.message}`);
    }

    const navigationEnd = Date.now();

    const timings = await page.evaluate(() => {
      const t = performance.timing;
      if (!t) return null;
      return {
        domContentLoaded: t.domContentLoadedEventEnd - t.navigationStart,
        load:             t.loadEventEnd - t.navigationStart,
        ttfb:             t.responseStart - t.navigationStart,
      };
    }).catch(() => null);

    return {
      page,
      context,
      timings: {
        wallClockMs: navigationEnd - navigationStart,
        ...(timings || {}),
      },
    };
  }

  async closeContext(context) {
    try { await context.close(); } catch { /* ignore */ }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = Renderer;