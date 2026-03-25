/**
 * consoleMonitor.js
 *
 * Responsible ONLY for:
 *  - Attaching event listeners to a Playwright `page` BEFORE navigation
 *  - Collecting browser console output (log, warn, error, info, debug)
 *  - Collecting uncaught JavaScript runtime errors
 *
 * NOT responsible for:
 *  - Network monitoring (see networkMonitor.js)
 *  - Navigation
 *  - Any DOM extraction
 *
 * USAGE:
 *   const monitor = new ConsoleMonitor();
 *   monitor.attach(page);               // attach BEFORE page.goto()
 *   await page.goto(url, ...);
 *   const logs = monitor.getLogs();     // collect after navigation
 */

class ConsoleMonitor {
  constructor() {
    this._logs = [];
    this._jsErrors = [];
  }

  /**
   * Attach console and error listeners to a Playwright page.
   * Must be called BEFORE page.goto() to capture all events.
   *
   * @param {Page} page - Playwright page object
   */
  attach(page) {
    // Capture all console.* calls from the page
    page.on('console', (msg) => {
      this._logs.push({
        type: msg.type(),      // 'log' | 'warn' | 'error' | 'info' | 'debug' etc.
        text: msg.text(),
        location: msg.location(), // { url, lineNumber, columnNumber }
        timestamp: Date.now(),
      });
    });

    // Capture uncaught JS exceptions (runtime errors)
    page.on('pageerror', (err) => {
      this._jsErrors.push({
        message: err.message,
        stack: err.stack || null,
        timestamp: Date.now(),
      });
    });
  }

  /**
   * Returns all captured console messages.
   * @returns {object[]}
   */
  getLogs() {
    return [...this._logs];
  }

  /**
   * Returns only console.error() messages (not uncaught exceptions).
   * Useful for quick severity filtering.
   * @returns {object[]}
   */
  getErrors() {
    return this._logs.filter(l => l.type === 'error');
  }

  /**
   * Returns uncaught JavaScript runtime errors.
   * @returns {object[]}
   */
  getJsErrors() {
    return [...this._jsErrors];
  }

  /**
   * Returns a combined summary object suitable for inclusion in audit output.
   * @returns {{ consoleLogs: object[], jsErrors: object[] }}
   */
  getSummary() {
    return {
      consoleLogs: this.getLogs(),
      jsErrors: this.getJsErrors(),
    };
  }

  /**
   * Clear all captured data (useful if reusing monitor across pages — not recommended,
   * better to create a fresh instance per page).
   */
  reset() {
    this._logs = [];
    this._jsErrors = [];
  }
}

module.exports = ConsoleMonitor;
