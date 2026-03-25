/**
 * crawler.js  — SPA-aware BFS crawler
 *
 * Key fixes vs original:
 *  1. Accepts a Playwright `page` to do LIVE route discovery on SPAs
 *     by intercepting history.pushState / replaceState and clicking
 *     nav items to collect client-side routes.
 *  2. Falls back to static href extraction for traditional multi-page sites.
 *  3. Strips #hash fragments before deduplication (hash = same page in SPAs).
 *  4. Rejects obviously malformed "URLs" that are really dotted strings
 *     (e.g. "authentication-2792005.web.app" appended to the origin).
 *  5. URL normalisation strips trailing slashes consistently.
 */

const { normalizeUrl, isSameDomain, isSkippableHref } = require('../../utils/urlUtils');

const DEFAULT_OPTIONS = {
  maxDepth: 3,
  maxPages: 50,
};

class Crawler {
  constructor(startUrl, options = {}) {
    this.startUrl  = normalizeUrl(startUrl);
    this.origin    = new URL(this.startUrl).origin;   // e.g. https://portfolio-50590.web.app
    this.options   = { ...DEFAULT_OPTIONS, ...options };
    this.visited   = new Set();
    this.queue     = [];
  }

  seed() {
    this._enqueue(this.startUrl, 0);
  }

  hasNext() {
    return this.queue.length > 0 && this.visited.size < this.options.maxPages;
  }

  next() {
    return this.queue.shift();
  }

  /**
   * Standard static-href enqueue — called after DOM extraction.
   * Handles traditional multi-page sites.
   */
  enqueueLinks(hrefs, currentDepth) {
    if (currentDepth >= this.options.maxDepth) return;
    if (this.visited.size >= this.options.maxPages) return;

    for (const href of hrefs) {
      if (!href || isSkippableHref(href)) continue;

      let normalized;
      try {
        normalized = this._normalize(href);
      } catch {
        continue;
      }

      if (!normalized) continue;
      if (!isSameDomain(normalized, this.startUrl)) continue;
      if (this._isMalformedPath(normalized)) continue;
      if (this.visited.has(normalized)) continue;

      this._enqueue(normalized, currentDepth + 1);
    }
  }

  /**
   * SPA route discovery — navigates the live Playwright page and
   * intercepts pushState / replaceState to collect routes the React
   * Router (or similar) exposes without real <a href> attributes.
   *
   * Also clicks nav items and checks the resulting URL.
   *
   * @param {Page} page - Playwright page already loaded at startUrl
   * @returns {string[]} Array of unique same-domain URLs discovered
   */
  async discoverSpaRoutes(page) {
    const discovered = new Set();

    // ── 1. Intercept history API calls via CDP / evaluate ──────────────────
    const routes = await page.evaluate(() => {
      const seen = new Set();
      const orig_push    = history.pushState.bind(history);
      const orig_replace = history.replaceState.bind(history);

      function capture(url) {
        if (url) seen.add(String(url));
      }

      history.pushState = function(state, title, url) {
        capture(url);
        return orig_push(state, title, url);
      };
      history.replaceState = function(state, title, url) {
        capture(url);
        return orig_replace(state, title, url);
      };

      // Also harvest any <a href> that are actual paths (not null/empty)
      document.querySelectorAll('a[href]').forEach(a => {
        const h = a.getAttribute('href');
        if (h && !h.startsWith('http') && !h.startsWith('mailto') &&
            !h.startsWith('tel') && !h.startsWith('#') && h !== '/') {
          seen.add(h);
        }
      });

      // React Router / Vue Router data attributes
      document.querySelectorAll('[data-to],[to],[href]').forEach(el => {
        const v = el.getAttribute('data-to') || el.getAttribute('to');
        if (v && v.startsWith('/')) seen.add(v);
      });

      return [...seen];
    }).catch(() => []);

    // ── 2. Click nav-like buttons / links and capture URL changes ──────────
    const navSelectors = [
      'nav a', 'nav button', '[role="navigation"] a',
      'header a', 'header button',
      '.navbar a', '.nav a', '.menu a', '.sidebar a',
    ];

    for (const sel of navSelectors) {
      let elements;
      try {
        elements = await page.$$(sel);
      } catch {
        continue;
      }

      for (const el of elements.slice(0, 20)) {
        try {
          await el.click({ force: true, timeout: 2000 }).catch(() => {});
          await page.waitForTimeout(300);
          const url = page.url();
          if (url && url !== 'about:blank') {
            const clean = this._stripHash(url);
            if (isSameDomain(clean, this.startUrl) && !this._isMalformedPath(clean)) {
              discovered.add(clean);
            }
          }
        } catch {
          // ignore click failures
        }
      }
    }

    // Navigate back to start after clicking around
    try {
      await page.goto(this.startUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch { /* ignore */ }

    // ── 3. Merge results ────────────────────────────────────────────────────
    for (const r of [...routes, ...discovered]) {
      try {
        const abs = this._normalize(r);
        if (abs && isSameDomain(abs, this.startUrl) &&
            !this._isMalformedPath(abs) && !this.visited.has(abs)) {
          this._enqueue(abs, 1);
        }
      } catch { /* skip */ }
    }

    return [...this.visited];
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  _enqueue(url, depth) {
    this.visited.add(url);
    this.queue.push({ url, depth });
  }

  /** Resolve href against origin, strip hash, normalise trailing slash */
  _normalize(href) {
    // If it's already absolute use it directly, else resolve against origin
    const abs = href.startsWith('http') ? href : new URL(href, this.origin).href;
    return this._stripHash(normalizeUrl(abs));
  }

  _stripHash(url) {
    try {
      const u = new URL(url);
      u.hash = '';
      // Remove trailing slash from path (except bare origin)
      if (u.pathname !== '/') u.pathname = u.pathname.replace(/\/$/, '');
      return u.href;
    } catch {
      return url;
    }
  }

  /**
   * Detect paths that look like a domain string erroneously appended to the
   * origin — e.g. /authentication-2792005.web.app
   * Heuristic: path segment that contains multiple dots and "web.app" / ".com"
   */
  _isMalformedPath(url) {
    try {
      const { pathname } = new URL(url);
      const parts = pathname.split('/').filter(Boolean);
      return parts.some(p =>
        /\.[a-z]{2,}(\.[a-z]{2,})+$/.test(p)   // looks like a domain
      );
    } catch {
      return false;
    }
  }

  get discoveredCount() {
    return this.visited.size;
  }
}

module.exports = Crawler;