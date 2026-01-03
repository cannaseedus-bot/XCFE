/**
 * XCFE Surface Parser v1
 *
 * Implements XJSON Surface → AST Lowering Rules v1
 * Deterministic, line-based parsing with exact source order preservation.
 *
 * @artifact xcfe://spec/parser/v1
 */

import { err } from "./errors.js";

const LABELS_V1 = new Set([
  "then", "else", "do", "case", "default", "on_error", "on_complete"
]);

/**
 * parseSurface(text) -> surface IR
 *
 * Surface IR is line-based, deterministic, and keeps just enough structure
 * for lowering. It does NOT execute, and it does NOT invent semantics.
 *
 * @param {string} text - XJSON source text
 * @returns {object} Surface IR
 */
export function parseSurface(text) {
  if (typeof text !== "string") throw err("E_PARSE_INPUT", "Input must be a string");

  // Normalize newlines deterministically
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Tabs forbidden (determinism + visibility)
  if (src.includes("\t")) throw err("E_PARSE_TAB", "Tabs are forbidden; use spaces only");

  const rawLines = src.split("\n");

  /** @type {Array<{ln:number, indent:number, level:number, raw:string, trimmed:string}>} */
  const lines = [];

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i];

    // Ignore blank lines (but keep deterministic line numbers in errors)
    if (/^\s*$/.test(raw)) continue;

    // Optional comment lines: "#" at first non-space
    const firstNonSpace = raw.match(/\S/);
    if (firstNonSpace && raw[firstNonSpace.index] === "#") continue;

    // Count leading spaces
    const m = raw.match(/^ */);
    const indent = m ? m[0].length : 0;

    // Enforce 2-space indentation units (v1)
    if (indent % 2 !== 0) {
      throw err("E_PARSE_INDENT", `Indent must be multiple of 2 spaces (got ${indent})`, { line: i + 1 });
    }

    const level = indent / 2;
    const trimmed = raw.slice(indent);

    lines.push({ ln: i + 1, indent, level, raw, trimmed });
  }

  // Structural sanity: first non-empty line must be level 0
  if (lines.length && lines[0].level !== 0) {
    throw err("E_PARSE_INDENT", "First statement must start at indent level 0", { line: lines[0].ln });
  }

  return { "@type": "xcfe.surface", "@version": "1.0.0", lines, labels: Array.from(LABELS_V1) };
}

/* ---------------- surface line classifiers ---------------- */

/**
 * Check if a line is an exec statement (@verb)
 * Exec must be exactly "@verb" with no trailing tokens.
 * Verb may include dots: @http.get
 *
 * @param {string} trimmed
 * @returns {boolean}
 */
export function isExecLine(trimmed) {
  if (!trimmed.startsWith("@")) return false;
  if (trimmed.includes(":")) return false; // params are key: value, not exec
  // forbid whitespace after verb
  return /^@[A-Za-z0-9._-]+$/.test(trimmed);
}

/**
 * Check if a line is a label (then:, else:, etc.)
 *
 * @param {string} trimmed
 * @returns {boolean}
 */
export function isLabelLine(trimmed) {
  if (!trimmed.endsWith(":")) return false;
  const name = trimmed.slice(0, -1);
  if (!/^[A-Za-z0-9._-]+$/.test(name)) return false;
  return LABELS_V1.has(name);
}

/**
 * Parse a parameter line (key: value)
 *
 * @param {string} trimmed
 * @returns {{key: string, valueText: string}|null}
 */
export function parseParamLine(trimmed) {
  // key: value  OR key:
  // key may contain letters/digits/_ and also allow dash/dot for object keys (header names)
  const idx = trimmed.indexOf(":");
  if (idx <= 0) return null;

  const key = trimmed.slice(0, idx).trim();
  const rest = trimmed.slice(idx + 1); // keep leading spaces in value position insignificant; we trim for parsing
  if (!key) return null;

  // Disallow keys that look like exec/label
  if (key.startsWith("@")) return null;

  // v1: key must not contain whitespace
  if (/\s/.test(key)) return null;

  const valueText = rest.length ? rest.trim() : "";

  return { key, valueText };
}

/**
 * Get the set of valid v1 labels
 * @returns {Set<string>}
 */
export function getLabelsV1() {
  return new Set(LABELS_V1);
}
