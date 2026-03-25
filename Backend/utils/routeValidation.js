/**
 * utils/routeValidation.js
 *
 * Simple input validation helpers for route handlers.
 * Keep these pure and dependency-free.
 */

/**
 * Returns true if the string is a valid absolute http/https URL.
 * @param {string} str
 * @returns {boolean}
 */
function isValidUrl(str) {
  try {
    const { protocol } = new URL(str);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

module.exports = { isValidUrl };
