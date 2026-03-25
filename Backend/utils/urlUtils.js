/**
 * urlUtils.js
 *
 * Pure utility functions for URL handling.
 * No side effects. No external dependencies beyond Node built-ins.
 *
 * Covers:
 *  - Normalizing URLs (remove hash, trailing slash, resolve relative)
 *  - Checking same-domain
 *  - Filtering skippable hrefs
 *  - Slugifying URL for filenames
 */

const { URL } = require('url');

// Protocols we never want to crawl
const SKIPPABLE_PROTOCOLS = new Set([
  'mailto:', 'tel:', 'javascript:', 'ftp:', 'data:',
]);

/**
 * Normalize a URL:
 *  - Resolve relative URLs against a base
 *  - Remove hash fragments (#section)
 *  - Remove trailing slash (except root)
 *  - Lowercase the hostname
 *
 * @param {string} href    - The URL to normalize
 * @param {string} [base]  - Base URL for resolving relative hrefs
 * @returns {string}       - Normalized absolute URL
 * @throws {TypeError}     - If URL is invalid and can't be resolved
 */
function normalizeUrl(href, base) {
  const resolved = base ? new URL(href, base) : new URL(href);

  // Strip hash
  resolved.hash = '';

  // Lowercase hostname
  resolved.hostname = resolved.hostname.toLowerCase();

  // Remove trailing slash from pathname (except root "/")
  if (resolved.pathname.length > 1 && resolved.pathname.endsWith('/')) {
    resolved.pathname = resolved.pathname.slice(0, -1);
  }

  return resolved.toString();
}

/**
 * Returns true if `url` is on the same hostname+port as `baseUrl`.
 *
 * @param {string} url
 * @param {string} baseUrl
 * @returns {boolean}
 */
function isSameDomain(url, baseUrl) {
  try {
    const a = new URL(url);
    const b = new URL(baseUrl);
    return a.hostname === b.hostname && a.port === b.port;
  } catch {
    return false;
  }
}

/**
 * Returns true if the href should NOT be crawled:
 *  - Empty or null
 *  - Has a skippable protocol (mailto:, tel:, javascript:, etc.)
 *  - Is a hash-only link (#anchor)
 *
 * @param {string} href
 * @returns {boolean}
 */
function isSkippableHref(href) {
  if (!href || typeof href !== 'string') return true;

  const trimmed = href.trim();

  // Hash-only
  if (trimmed.startsWith('#')) return true;

  // Empty after trim
  if (!trimmed) return true;

  // Skippable protocols
  for (const proto of SKIPPABLE_PROTOCOLS) {
    if (trimmed.toLowerCase().startsWith(proto)) return true;
  }

  return false;
}

/**
 * Convert a URL into a filesystem-safe slug for use in filenames.
 * e.g. "https://example.com/about?x=1" => "example.com_about"
 *
 * @param {string} url
 * @returns {string}
 */
function slugifyUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/\./g, '_');
    const path = parsed.pathname
      .replace(/^\//, '')           // remove leading slash
      .replace(/\//g, '_')          // slashes → underscores
      .replace(/[^a-zA-Z0-9_-]/g, '') // remove remaining special chars
      .slice(0, 60);                // cap length

    return path ? `${host}_${path}` : host;
  } catch {
    // Fallback for invalid URLs
    return url.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 60);
  }
}

module.exports = {
  normalizeUrl,
  isSameDomain,
  isSkippableHref,
  slugifyUrl,
};
