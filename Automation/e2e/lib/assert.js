/**
 * NAVADA Edge E2E — Lightweight assertion helpers
 * No dependencies. Each returns { pass: boolean, error?: string }
 */

function assertEqual(actual, expected, label) {
  if (actual === expected) return { pass: true };
  return { pass: false, error: `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}` };
}

function assertOk(value, label) {
  if (value) return { pass: true };
  return { pass: false, error: `${label}: expected truthy, got ${JSON.stringify(value)}` };
}

function assertContains(str, substr, label) {
  if (typeof str === 'string' && str.includes(substr)) return { pass: true };
  return { pass: false, error: `${label}: expected to contain "${substr}"` };
}

function assertLessThan(actual, threshold, label) {
  if (actual < threshold) return { pass: true };
  return { pass: false, error: `${label}: ${actual} >= ${threshold}` };
}

function assertStatusCode(actual, expected, label) {
  if (actual === expected) return { pass: true };
  return { pass: false, error: `${label}: HTTP ${actual}, expected ${expected}` };
}

function assertType(value, type, label) {
  if (typeof value === type) return { pass: true };
  return { pass: false, error: `${label}: expected type ${type}, got ${typeof value}` };
}

module.exports = { assertEqual, assertOk, assertContains, assertLessThan, assertStatusCode, assertType };
