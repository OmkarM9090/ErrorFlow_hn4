/**
 * networkMonitor.js
 *
 * Responsible ONLY for:
 *  - Attaching Playwright network event listeners BEFORE navigation
 *  - Tracking all outgoing requests
 *  - Recording failed requests (DNS failure, timeout, HTTP 4xx/5xx)
 *  - Recording blocked/cancelled requests
 *
 * NOT responsible for:
 *  - Console monitoring (see consoleMonitor.js)
 *  - DOM extraction
 *  - Navigation
 *
 * USAGE:
 *   const monitor = new NetworkMonitor();
 *   monitor.attach(page);                   // BEFORE page.goto()
 *   await page.goto(url, ...);
 *   const summary = monitor.getSummary();   // after navigation
 */

// Resource types we care about for an accessibility audit
// (skip fonts, media, websocket etc. unless needed later)
const TRACKED_TYPES = new Set([
  'document', 'script', 'stylesheet', 'image', 'fetch', 'xhr',
]);

class NetworkMonitor {
  constructor() {
    this._requests = new Map();  // requestId → request info
    this._failed = [];
    this._blocked = [];
  }

  /**
   * Attach network listeners to a Playwright page.
   * Must be called BEFORE page.goto() to capture all requests.
   *
   * @param {Page} page - Playwright page object
   */
  attach(page) {
    // Track every request that goes out
    page.on('request', (request) => {
      const id = request._guid || request.url(); // Playwright internal ID or URL fallback
      this._requests.set(id, {
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        timestamp: Date.now(),
      });
    });

    // Capture failed requests (network-level failures)
    page.on('requestfailed', (request) => {
      if (!TRACKED_TYPES.has(request.resourceType())) return;

      this._failed.push({
        url: request.url(),
        resourceType: request.resourceType(),
        method: request.method(),
        failureText: request.failure()?.errorText || 'unknown failure',
        timestamp: Date.now(),
      });
    });

    // Capture HTTP-level errors (4xx, 5xx) — these are "finished" but with bad status
    page.on('response', (response) => {
      const status = response.status();
      if (status >= 400) {
        const resourceType = response.request().resourceType();
        if (!TRACKED_TYPES.has(resourceType)) return;

        this._failed.push({
          url: response.url(),
          resourceType,
          method: response.request().method(),
          status,
          failureText: `HTTP ${status}`,
          timestamp: Date.now(),
        });
      }
    });
  }

  /**
   * Returns all network-failed requests (connection errors + HTTP 4xx/5xx).
   * @returns {object[]}
   */
  getFailedRequests() {
    return [...this._failed];
  }

  /**
   * Returns total request count observed.
   * @returns {number}
   */
  getTotalRequestCount() {
    return this._requests.size;
  }

  /**
   * Returns a combined summary object for audit output.
   * @returns {{ failedRequests: object[], totalRequests: number }}
   */
  getSummary() {
    return {
      totalRequests: this.getTotalRequestCount(),
      failedRequests: this.getFailedRequests(),
    };
  }

  /**
   * Clear all state. Create a new instance per page instead.
   */
  reset() {
    this._requests.clear();
    this._failed = [];
    this._blocked = [];
  }
}

module.exports = NetworkMonitor;
