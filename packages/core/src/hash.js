/**
 * XCFE Hashing v1
 *
 * Implements deterministic hashing:
 * - sha256(utf8(canonical_json))
 * - Byte-exact: JSON.stringify(obj, null, 0), UTF-8, no key sorting
 *
 * @artifact xcfe://spec/hash/v1
 */

import crypto from "crypto";
import { err } from "./errors.js";

/**
 * Convert an object to canonical JSON bytes
 * Byte-exact: JSON.stringify(obj, null, 0), UTF-8, no key sorting
 *
 * @param {object} obj
 * @returns {Buffer}
 */
export function canonicalJsonBytes(obj) {
  const s = JSON.stringify(obj, null, 0);
  if (typeof s !== "string") throw err("E_CANON_JSON", "Failed to stringify");
  return Buffer.from(s, "utf8");
}

/**
 * Hash an AST document
 *
 * @param {object} ast - Canonical AST document
 * @returns {string} Hash string in format "sha256:<hex>"
 */
export function hashAst(ast) {
  const bytes = canonicalJsonBytes(ast);
  return "sha256:" + crypto.createHash("sha256").update(bytes).digest("hex");
}

/**
 * Hash a UTF-8 string
 *
 * @param {string} prefix - Hash prefix (e.g., "sha256:")
 * @param {string} s - String to hash
 * @returns {string}
 */
export function sha256Utf8(prefix, s) {
  const h = crypto.createHash("sha256").update(Buffer.from(s, "utf8")).digest("hex");
  return prefix + h;
}

/**
 * Hash raw bytes
 *
 * @param {string} prefix - Hash prefix (e.g., "sha256:")
 * @param {Buffer} b - Bytes to hash
 * @returns {string}
 */
export function sha256Bytes(prefix, b) {
  const h = crypto.createHash("sha256").update(b).digest("hex");
  return prefix + h;
}

/**
 * Verify that a hash matches expected
 *
 * @param {string} actual - Actual hash
 * @param {string} expected - Expected hash
 * @returns {boolean}
 */
export function verifyHash(actual, expected) {
  return actual === expected;
}
