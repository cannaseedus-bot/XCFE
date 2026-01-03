/**
 * XCFE Canonicalization v1
 *
 * Implements Canonical JSON Serialization Rules v1:
 * - Removes `loc` before hashing
 * - Preserves insertion order (no key sorting)
 * - Emits one-line JSON, UTF-8, no BOM
 *
 * @artifact xcfe://spec/canonical/v1
 */

import { err } from "./errors.js";

/**
 * canonicalize(ast) ensures the AST is in canonical form for hashing.
 * v1: we do not sort keys; we do not add/remove fields; we only ensure required
 * fields exist and are in the right shape.
 *
 * @param {object} ast - AST document from lowerToAst()
 * @returns {object} Canonical AST document
 */
export function canonicalize(ast) {
  if (!ast || ast.type !== "document") throw err("E_CANON_INPUT", "Expected AST document");
  // In v1 the lowering already emits canonical structure. Keep as identity.
  return ast;
}

/**
 * Deep clone an object, removing location information
 * Used when preparing AST for hashing
 *
 * @param {object} obj
 * @returns {object}
 */
export function stripLocations(obj) {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(stripLocations);
  }

  const result = {};
  for (const key of Object.keys(obj)) {
    // Skip location fields
    if (key === "loc" || key === "location" || key === "line" || key === "column") {
      continue;
    }
    result[key] = stripLocations(obj[key]);
  }
  return result;
}

/**
 * Validates that an object is in canonical form
 *
 * @param {object} obj
 * @returns {boolean}
 */
export function isCanonical(obj) {
  if (!obj || typeof obj !== "object") return false;
  if (obj.type !== "document") return false;
  if (!Array.isArray(obj.body)) return false;
  return true;
}
