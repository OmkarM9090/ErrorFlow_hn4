class ConsoleMonitor {
  constructor() {
    this._logs = [];
    this._jsErrors = [];
    this._attached = false;
  }

  attach(page) {
    if (this._attached) return;
    this._attached = true;

    page.on("console", async (msg) => {
      let args = [];

      try {
        args = await Promise.all(
          msg.args().map(async (arg) => {
            try {
              return await arg.jsonValue();
            } catch {
              return null;
            }
          })
        );
      } catch {
        args = [];
      }

      const location = typeof msg.location === "function" ? msg.location() : {};

      this._logs.push({
        type: msg.type(), // log, warn, error, info, debug
        text: msg.text(),
        args,
        location: {
          url: location?.url || null,
          lineNumber: location?.lineNumber ?? null,
          columnNumber: location?.columnNumber ?? null,
        },
        timestamp: new Date().toISOString(),
      });
    });

    page.on("pageerror", (err) => {
      this._jsErrors.push({
        type: "runtime",
        message: err?.message || "Unknown page error",
        stack: err?.stack || null,
        timestamp: new Date().toISOString(),
      });
    });
  }

  getLogs() {
    return [...this._logs];
  }

  getErrors() {
    return this._logs.filter((log) => log.type === "error");
  }

  getWarnings() {
    return this._logs.filter((log) => log.type === "warning" || log.type === "warn");
  }

  getJsErrors() {
    return [...this._jsErrors];
  }

  getSummary() {
    return {
      totalLogs: this._logs.length,
      totalErrors: this.getErrors().length,
      totalWarnings: this.getWarnings().length,
      logs: this.getLogs(),
      errors: this.getErrors(),
      warnings: this.getWarnings(),
      jsErrors: this.getJsErrors(),
    };
  }

  reset() {
    this._logs = [];
    this._jsErrors = [];
    this._attached = false;
  }
}

module.exports = ConsoleMonitor;