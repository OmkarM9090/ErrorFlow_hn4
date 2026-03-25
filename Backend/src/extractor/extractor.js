/**
 * extractor.js
 *
 * Responsible ONLY for:
 *  - Extracting structured data from an already-rendered Playwright `page`
 *  - DOM-level accessibility extraction (landmarks, roles, aria attrs)
 *  - Using Playwright's built-in accessibility snapshot where helpful
 *
 * NOT responsible for:
 *  - Navigating to pages
 *  - Screenshots
 *  - Console/network monitoring
 *  - Scoring or grading the accessibility results
 *  - Storing data
 */

class Extractor {
  /**
   * Run all extractors against a live Playwright page.
   *
   * @param {Page} page - Playwright page object (already navigated)
   * @returns {Promise<object>} Structured extraction result
   */
  async extract(page) {
    // Run all extractions in parallel where possible
    const [
      meta,
      headings,
      images,
      buttons,
      links,
      forms,
      landmarks,
      ariaSnapshot,
    ] = await Promise.all([
      this._extractMeta(page),
      this._extractHeadings(page),
      this._extractImages(page),
      this._extractButtons(page),
      this._extractLinks(page),
      this._extractForms(page),
      this._extractLandmarks(page),
      this._extractAriaSnapshot(page),
    ]);

    return {
      url: page.url(),
      meta,
      headings,
      images,
      buttons,
      links,
      forms,
      landmarks,
      ariaSnapshot,
    };
  }

  // ---------------------------------------------------------------------------
  // Private extraction methods
  // ---------------------------------------------------------------------------

  /**
   * Page title + meta description
   */
  async _extractMeta(page) {
    return page.evaluate(() => ({
      title: document.title || null,
      description:
        document.querySelector('meta[name="description"]')?.content || null,
      lang: document.documentElement.lang || null,
      charset:
        document.querySelector('meta[charset]')?.getAttribute('charset') ||
        null,
      viewport:
        document.querySelector('meta[name="viewport"]')?.content || null,
    }));
  }

  /**
   * All headings h1–h6 with their level and text
   */
  async _extractHeadings(page) {
    return page.evaluate(() =>
      Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(h => ({
        level: parseInt(h.tagName.replace('H', ''), 10),
        text: h.innerText?.trim() || null,
        id: h.id || null,
      }))
    );
  }

  /**
   * All images — flag missing alt text immediately
   */
  async _extractImages(page) {
    return page.evaluate(() =>
      Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.src || null,
        alt: img.alt ?? null,            // null = attr missing entirely
        altMissing: !img.hasAttribute('alt'),
        altEmpty: img.hasAttribute('alt') && img.alt === '',
        role: img.getAttribute('role') || null,
        ariaLabel: img.getAttribute('aria-label') || null,
        ariaHidden: img.getAttribute('aria-hidden') === 'true',
        width: img.naturalWidth || null,
        height: img.naturalHeight || null,
      }))
    );
  }

  /**
   * All buttons — flag missing accessible names
   */
  async _extractButtons(page) {
    return page.evaluate(() =>
      Array.from(document.querySelectorAll('button, [role="button"]')).map(btn => ({
        text: btn.innerText?.trim() || null,
        ariaLabel: btn.getAttribute('aria-label') || null,
        ariaExpanded: btn.getAttribute('aria-expanded') || null,
        ariaControls: btn.getAttribute('aria-controls') || null,
        disabled: btn.disabled || btn.getAttribute('aria-disabled') === 'true',
        type: btn.getAttribute('type') || null,
        // Flag: button has no accessible name at all
        hasNoAccessibleName:
          !btn.innerText?.trim() &&
          !btn.getAttribute('aria-label') &&
          !btn.getAttribute('aria-labelledby') &&
          !btn.title,
      }))
    );
  }

  /**
   * All anchor links — used by crawler for href discovery too
   */
  async _extractLinks(page) {
    return page.evaluate(() =>
      Array.from(document.querySelectorAll('a')).map(a => ({
        href: a.href || null,
        text: a.innerText?.trim() || null,
        ariaLabel: a.getAttribute('aria-label') || null,
        rel: a.rel || null,
        target: a.target || null,
        hasNoText: !a.innerText?.trim() && !a.getAttribute('aria-label'),
      }))
    );
  }

  /**
   * All form fields with their associated labels
   */
  async _extractForms(page) {
    return page.evaluate(() => {
      const forms = Array.from(document.querySelectorAll('form')).map(form => {
        const fields = Array.from(
          form.querySelectorAll('input, select, textarea')
        ).map(field => {
          // Try to find the associated label
          let labelText = null;
          if (field.id) {
            const label = document.querySelector(`label[for="${field.id}"]`);
            if (label) labelText = label.innerText?.trim();
          }
          if (!labelText) {
            // Check for wrapping label
            const parent = field.closest('label');
            if (parent) labelText = parent.innerText?.trim();
          }

          return {
            tagName: field.tagName.toLowerCase(),
            type: field.type || null,
            name: field.name || null,
            id: field.id || null,
            placeholder: field.placeholder || null,
            ariaLabel: field.getAttribute('aria-label') || null,
            ariaRequired: field.getAttribute('aria-required') || null,
            required: field.required,
            labelText,
            hasNoLabel:
              !labelText &&
              !field.getAttribute('aria-label') &&
              !field.getAttribute('aria-labelledby') &&
              !field.title,
          };
        });

        return {
          id: form.id || null,
          action: form.action || null,
          method: form.method || 'get',
          fields,
        };
      });

      return forms;
    });
  }

  /**
   * Semantic landmark elements (nav, main, header, footer, aside, section)
   */
  async _extractLandmarks(page) {
    return page.evaluate(() => {
      const LANDMARK_SELECTORS = [
        'header', 'nav', 'main', 'footer', 'aside', 'section', 'article',
        '[role="banner"]', '[role="navigation"]', '[role="main"]',
        '[role="contentinfo"]', '[role="complementary"]', '[role="search"]',
        '[role="form"]', '[role="region"]',
      ];

      return Array.from(
        document.querySelectorAll(LANDMARK_SELECTORS.join(','))
      ).map(el => ({
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role') || null,
        ariaLabel: el.getAttribute('aria-label') || null,
        ariaLabelledby: el.getAttribute('aria-labelledby') || null,
        id: el.id || null,
      }));
    });
  }

  /**
   * Playwright's built-in accessibility tree snapshot.
   * Gives a hierarchical view of the accessibility tree — very useful for
   * auditing tools. Returns null if it fails (some pages block it).
   */
  async _extractAriaSnapshot(page) {
    try {
      // This is a Playwright-native API — one of the reasons to prefer it
      return await page.accessibility.snapshot({ interestingOnly: false });
    } catch {
      return null;
    }
  }
}

module.exports = Extractor;
