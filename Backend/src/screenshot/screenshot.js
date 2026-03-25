/**
 * screenshot.js
 *
 * Responsible ONLY for:
 *  - Taking full-page or viewport screenshots via Playwright
 *  - Writing screenshots to disk with organized naming
 *  - Returning the file path for inclusion in audit results
 *
 * NOT responsible for:
 *  - Navigation
 *  - DOM extraction
 *  - Image accessibility analysis (that's extractor.js / scorer)
 *
 * USAGE:
 *   const screenshotter = new Screenshotter('./output/screenshots');
 *   const result = await screenshotter.capture(page, 'https://example.com');
 *   // result.path => './output/screenshots/example.com_1234567890.png'
 */

const fs = require('fs');
const path = require('path');
const { slugifyUrl } = require('../../utils/urlUtils');

class Screenshotter {
  /**
   * @param {string} outputDir - Directory where screenshots will be saved
   */
  constructor(outputDir = './output/screenshots') {
    this.outputDir = outputDir;
    this._ensureDir();
  }

  /**
   * Capture a full-page screenshot of a Playwright page.
   *
   * @param {Page}   page    - Playwright page (already navigated)
   * @param {string} pageUrl - URL of the page (used to generate filename)
   * @param {object} options - { fullPage: bool, type: 'png'|'jpeg' }
   * @returns {Promise<{ path: string, filename: string }>}
   */
  async capture(page, pageUrl, options = {}) {
    const {
      fullPage = true,
      type = 'png',
    } = options;

    const filename = this._buildFilename(pageUrl, type);
    const filePath = path.join(this.outputDir, filename);

    try {
      await page.screenshot({
        path: filePath,
        fullPage,
        type,
      });

      return {
        path: filePath,
        filename,
        url: pageUrl,
      };
    } catch (err) {
      console.warn(`[Screenshot] Failed to capture ${pageUrl}: ${err.message}`);
      return {
        path: null,
        filename: null,
        url: pageUrl,
        error: err.message,
      };
    }
  }

  /**
   * Build a safe filename from a URL + timestamp.
   * e.g. "https://example.com/about" => "example.com_about_1234567890.png"
   */
  _buildFilename(url, ext) {
    const slug = slugifyUrl(url);
    const ts = Date.now();
    return `${slug}_${ts}.${ext}`;
  }

  /**
   * Create output directory if it doesn't exist.
   */
  _ensureDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }
}

module.exports = Screenshotter;
