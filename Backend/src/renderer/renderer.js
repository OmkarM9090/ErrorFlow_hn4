/**
 * renderer.js
 *
 * Responsible ONLY for:
 *  - Launching and managing Playwright browser instances
 *  - Navigating to a URL and waiting for JS to settle
 *  - Returning the live `page` object to other modules
 *  - Graceful browser lifecycle (open/close)
 *
 * NOT responsible for:
 *  - DOM extraction
 *  - Screenshots
 *  - Console/network monitoring (those modules attach to the page handle)
 *  - Any business logic
 *
 * WHY PLAYWRIGHT over Puppeteer:
 *  - Built-in support for Chromium, Firefox, WebKit
 *  - More stable auto-wait mechanics (no manual waitForSelector needed as often)
 *  - Better network interception API
 *  - Actively maintained with faster release cadence
 *  - `page.accessibility.snapshot()` built-in (huge for this use case)
 */

const { chromium } = require('playwright');

class Renderer {
  constructor() {
    this.browser = null;
  }

  /**
   * Launch a headless Chromium browser.
   * Call once before starting a crawl session.
   */
  async launch() {
    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Prevents crashes in Docker/low-memory envs
      ],
    });
  }

  /**
   * Open a new browser page, navigate to `url`, and return the page object.
   * Callers are responsible for attaching monitors BEFORE calling this,
   * or right after if they need the page reference first.
   *
   * @param {string} url
   * @returns {{ page: Page, context: BrowserContext, timings: object }}
   */
  async renderPage(url) {
    if (!this.browser) {
      throw new Error('Browser not launched. Call renderer.launch() first.');
    }

    // Isolated context per page — avoids cookie/session bleed between pages
    const context = await this.browser.newContext({
      userAgent:
        'Mozilla/5.0 (compatible; AccessibilityAuditBot/1.0; +https://yourdomain.com/bot)',
      viewport: { width: 1280, height: 800 },
    });

    const page = await context.newPage();

    // Capture high-level navigation timing
    const navigationStart = Date.now();

    try {
      await page.goto(url, {
        waitUntil: 'networkidle',  // Wait until no more than 0 network connections for 500ms
        timeout: 20000,
      });
    } catch (err) {
      // Page might still be partially loaded — don't hard-fail
      // Let callers decide what to do with partial data
      console.warn(`[Renderer] Navigation warning for ${url}: ${err.message}`);
    }

    const navigationEnd = Date.now();

    // Basic performance timing from the browser's own API
    const timings = await page.evaluate(() => {
      const t = performance.timing;
      if (!t) return null;
      return {
        domContentLoaded: t.domContentLoadedEventEnd - t.navigationStart,
        load: t.loadEventEnd - t.navigationStart,
        ttfb: t.responseStart - t.navigationStart,
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

  /**
   * Close a specific browser context (frees memory after each page).
   * @param {BrowserContext} context
   */
  async closeContext(context) {
    try {
      await context.close();
    } catch {
      // Ignore errors on close
    }
  }

  /**
   * Shut down the browser entirely.
   * Call once after all crawling is done.
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = Renderer;
