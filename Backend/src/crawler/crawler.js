/**
 * crawler.js
 *
 * Responsible ONLY for:
 *  - Managing the crawl queue (BFS)
 *  - Discovering internal links from each page
 *  - Normalizing and deduplicating URLs
 *  - Enforcing crawl depth + page count limits
 *  - Filtering out non-crawlable hrefs (mailto:, tel:, javascript:, hash-only)
 *
 * NOT responsible for:
 *  - Rendering pages
 *  - Extracting accessibility data
 *  - Screenshots, console logs, network monitoring
 */

const { normalizeUrl, isSameDomain, isSkippableHref } = require('../../utils/urlUtils');

const DEFAULT_OPTIONS = {
  maxDepth: 3,       // How many levels deep to crawl
  maxPages: 50,      // Hard cap on total pages visited
};

class Crawler {
  /**
   * @param {string} startUrl - The seed URL to begin crawling
   * @param {object} options   - { maxDepth, maxPages }
   */
  constructor(startUrl, options = {}) {
    this.startUrl = normalizeUrl(startUrl);
    this.options = { ...DEFAULT_OPTIONS, ...options };

    // Track visited URLs to avoid duplicates
    this.visited = new Set();

    // Queue entries: { url, depth }
    this.queue = [];
  }

  /**
   * Initialize the crawl queue with the seed URL.
   * Call this before starting the crawl loop.
   */
  seed() {
    this.queue.push({ url: this.startUrl, depth: 0 });
    this.visited.add(this.startUrl);
  }

  /**
   * Returns true if there are more pages to process.
   */
  hasNext() {
    return this.queue.length > 0 && this.visited.size <= this.options.maxPages;
  }

  /**
   * Returns the next { url, depth } item from the queue.
   */
  next() {
    return this.queue.shift();
  }

  /**
   * Given a raw list of href strings found on a page at `currentDepth`,
   * filter, normalize, deduplicate, and enqueue valid internal links.
   *
   * @param {string[]} hrefs       - Raw href values from DOM
   * @param {number}   currentDepth - Depth of the page these hrefs came from
   */
  enqueueLinks(hrefs, currentDepth) {
    if (currentDepth >= this.options.maxDepth) return;
    if (this.visited.size >= this.options.maxPages) return;

    for (const href of hrefs) {
      // Skip mailto:, tel:, javascript:, #hash-only, empty
      if (isSkippableHref(href)) continue;

      let normalized;
      try {
        normalized = normalizeUrl(href, this.startUrl);
      } catch {
        // Malformed URL — skip it
        continue;
      }

      // Only crawl same-domain URLs
      if (!isSameDomain(normalized, this.startUrl)) continue;

      // Skip already-visited or already-queued
      if (this.visited.has(normalized)) continue;

      this.visited.add(normalized);
      this.queue.push({ url: normalized, depth: currentDepth + 1 });
    }
  }

  /**
   * Returns the total count of URLs discovered so far (visited set size).
   */
  get discoveredCount() {
    return this.visited.size;
  }
}

module.exports = Crawler;
