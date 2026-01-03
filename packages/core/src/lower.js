/**
 * XCFE AST Lowering v1
 *
 * Transforms surface IR to canonical XCFE AST.
 * Output matches canonical shapes:
 * - document.body: exec[]
 * - exec.params: param[]
 * - exec.children: (label|exec)[]
 * - label.children: exec[]
 *
 * @artifact xcfe://spec/lower/v1
 */

import { err } from "./errors.js";
import { isExecLine, isLabelLine, parseParamLine } from "./parse.js";

/**
 * lowerToAst(surface) -> canonical XCFE AST (v1)
 *
 * @param {object} surface - Surface IR from parseSurface()
 * @returns {object} Canonical AST document
 */
export function lowerToAst(surface) {
  if (!surface || surface["@type"] !== "xcfe.surface") {
    throw err("E_LOWER_INPUT", "Expected surface IR from parseSurface()");
  }

  const lines = surface.lines;
  let i = 0;

  const doc = {
    type: "document",
    version: "1.0.0",
    body: [],
    meta: { line_map: false }
  };

  // Stack holds {kind, node, level}
  /** @type {Array<{kind:"document"|"exec"|"label"|"param_block", node:any, level:number}>} */
  const stack = [{ kind: "document", node: doc, level: -1 }];

  function parent() {
    return stack[stack.length - 1];
  }
  function popToLevel(level) {
    while (stack.length && parent().level >= level) stack.pop();
  }

  while (i < lines.length) {
    const L = lines[i];
    popToLevel(L.level);

    const p = parent();

    // EXEC
    if (isExecLine(L.trimmed)) {
      const exec = mkExec(L.trimmed);
      attachExec(p, exec, L);
      stack.push({ kind: "exec", node: exec, level: L.level });
      i++;
      continue;
    }

    // LABEL
    if (isLabelLine(L.trimmed)) {
      if (p.kind !== "exec") {
        throw err("E_LABEL_PARENT", `Label '${L.trimmed}' must be under an exec`, { line: L.ln });
      }
      const name = L.trimmed.slice(0, -1);
      const label = { type: "label", name, children: [], path: null };
      p.node.children.push(label);
      stack.push({ kind: "label", node: label, level: L.level });
      i++;
      continue;
    }

    // PARAM (scalar or block)
    const kv = parseParamLine(L.trimmed);
    if (kv) {
      if (p.kind !== "exec") {
        throw err("E_PARAM_PARENT", `Param '${kv.key}' must be under an exec`, { line: L.ln });
      }

      // key: (block)
      if (kv.valueText === "") {
        // Parse a param block from subsequent indented lines
        const baseLevel = L.level;
        const next = lines[i + 1];
        if (!next || next.level <= baseLevel) {
          // Empty block not allowed (deterministic)
          throw err("E_PARAM_BLOCK_EMPTY", `Param block '${kv.key}:' must have indented entries`, { line: L.ln });
        }

        const block = parseParamBlock(lines, i + 1, next.level);
        const valueNode = block.value;
        const param = mkParam(kv.key, valueNode, null);

        p.node.params.push(param);

        // Advance i to the first line after the block
        i = block.nextIndex;
        continue;
      }

      // key: scalar
      const valueNode = parseScalarValue(kv.valueText, null);
      const param = mkParam(kv.key, valueNode, null);
      p.node.params.push(param);
      i++;
      continue;
    }

    throw err("E_PARSE_LINE", `Unrecognized statement: '${L.trimmed}'`, { line: L.ln });
  }

  // Assign canonical paths (required for hashes/test vectors)
  assignPaths(doc);

  return doc;
}

/* ---------------- node builders ---------------- */

function mkExec(verbToken) {
  return {
    type: "exec",
    verb: verbToken,
    id: null,
    determinism: null,
    capability: null,
    async: null,
    params: [],
    children: [],
    path: null
  };
}

function mkParam(key, value, path) {
  return { type: "param", key, value, path };
}

function mkLiteral(kind, value, path) {
  return { type: "literal", kind, value, path };
}

function mkExpr(body, path) {
  return { type: "expr", body, path };
}

/* ---------------- attach rules ---------------- */

function attachExec(parentFrame, exec, L) {
  if (parentFrame.kind === "document") {
    parentFrame.node.body.push(exec);
    return;
  }
  if (parentFrame.kind === "label") {
    parentFrame.node.children.push(exec);
    return;
  }
  if (parentFrame.kind === "exec") {
    // v1 allows nested execs directly (sequencing), besides labels
    parentFrame.node.children.push(exec);
    return;
  }
  throw err("E_EXEC_PARENT", "Invalid exec parent", { line: L.ln });
}

/* ---------------- value parsing ---------------- */

function parseScalarValue(text, path) {
  // expr: {{ ... }}  (preserve inner bytes exactly)
  if (text.startsWith("{{") && text.endsWith("}}")) {
    const body = text.slice(2, -2); // preserve spaces inside
    return mkExpr(body, path);
  }

  // string: "..."
  if (text.startsWith("\"") && text.endsWith("\"")) {
    return mkLiteral("string", unescapeJsonString(text), path);
  }

  // true/false/null
  if (text === "true") return mkLiteral("boolean", true, path);
  if (text === "false") return mkLiteral("boolean", false, path);
  if (text === "null") return mkLiteral("null", null, path);

  // number (int or float)
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(text)) {
    // keep as JS number; canonical JSON handles it
    const n = Number(text);
    if (!Number.isFinite(n)) throw err("E_NUM", `Invalid number: ${text}`);
    return mkLiteral("number", n, path);
  }

  // fallback: bare string token (used rarely; keep explicit)
  return mkLiteral("string", text, path);
}

function unescapeJsonString(quoted) {
  // quoted includes the surrounding quotes
  // We interpret JSON-style escapes deterministically.
  try {
    return JSON.parse(quoted);
  } catch {
    throw err("E_STRING", `Invalid string literal: ${quoted}`);
  }
}

/**
 * Parses a param block beginning at `startIndex`, where start line is already indented.
 * `blockLevel` is the indentation level of the first entry line.
 *
 * Supports:
 * - array: lines like "- value"
 * - object: lines like "Key: value"
 */
function parseParamBlock(lines, startIndex, blockLevel) {
  // Determine block kind from first line
  const first = lines[startIndex];
  if (!first) throw err("E_BLOCK", "Missing block start");

  const firstTrim = first.trimmed;

  // Array form: "- <scalar>"
  const isArray = firstTrim.startsWith("- ");
  const isObj = !isArray && firstTrim.includes(":");

  if (!isArray && !isObj) {
    throw err("E_PARAM_BLOCK_KIND", "Block must be array '- ' or object 'k: v'", { line: first.ln });
  }

  if (isArray) {
    /** @type {Array<any>} */
    const items = [];
    let i = startIndex;

    while (i < lines.length) {
      const L = lines[i];
      if (L.level < blockLevel) break;
      if (L.level !== blockLevel) {
        throw err("E_ARRAY_INDENT", "Array items must be at the same indentation level", { line: L.ln });
      }
      if (!L.trimmed.startsWith("- ")) {
        throw err("E_ARRAY_ITEM", "Array item must start with '- '", { line: L.ln });
      }
      const vText = L.trimmed.slice(2); // after "- "
      items.push(parseScalarValue(vText, null));
      i++;
    }

    return {
      value: { type: "array", items, path: null },
      nextIndex: i
    };
  }

  // Object form: "Key: value" on each line
  /** @type {Array<{key:string, value:any}>} */
  const entries = [];
  let i = startIndex;

  while (i < lines.length) {
    const L = lines[i];
    if (L.level < blockLevel) break;
    if (L.level !== blockLevel) {
      throw err("E_OBJECT_INDENT", "Object entries must be at the same indentation level", { line: L.ln });
    }
    const idx = L.trimmed.indexOf(":");
    if (idx <= 0) throw err("E_OBJECT_ENTRY", "Object entry must be 'k: v'", { line: L.ln });

    const k = L.trimmed.slice(0, idx).trim();
    const vText = L.trimmed.slice(idx + 1).trim();

    if (!k) throw err("E_OBJECT_KEY", "Object entry key must be non-empty", { line: L.ln });
    if (vText === "") throw err("E_OBJECT_VALUE", "Object entry value must be present on same line", { line: L.ln });

    entries.push({
      key: k,
      value: parseScalarValue(vText, null)
    });

    i++;
  }

  return {
    value: { type: "object", entries, path: null },
    nextIndex: i
  };
}

/* ---------------- canonical path assignment ---------------- */

/**
 * Assign canonical paths to all nodes in the document
 * Required for deterministic hashing and test vectors
 *
 * @param {object} doc - AST document
 */
export function assignPaths(doc) {
  // Root execs: root/<i>/<verb>
  doc.body.forEach((ex, i) => assignExecPaths(ex, `root/${i}/${ex.verb}`));
}

function assignExecPaths(ex, path) {
  ex.path = path;

  // params: <exec.path>/param:<key>
  for (const p of ex.params) {
    p.path = `${path}/param:${p.key}`;
    assignValuePaths(p.value, `${p.path}/v`);
  }

  // children: if label, label path is <exec.path>/<labelName>
  // if exec, exec child path is <exec.path>/<i>/<verb>
  let execChildIdx = 0;
  for (const ch of ex.children) {
    if (ch.type === "label") {
      ch.path = `${path}/${ch.name}`;
      ch.children.forEach((cx, j) => assignExecPaths(cx, `${ch.path}/${j}/${cx.verb}`));
    } else if (ch.type === "exec") {
      assignExecPaths(ch, `${path}/${execChildIdx}/${ch.verb}`);
      execChildIdx++;
    }
  }
}

function assignValuePaths(v, path) {
  v.path = path;

  if (v.type === "array") {
    v.items.forEach((it, i) => {
      // array item path: <param.path>/v/<index>
      assignValuePaths(it, `${path}/${i}`);
    });
  } else if (v.type === "object") {
    v.entries.forEach((e) => {
      // object entry value path: <param.path>/v/<entryKey>
      assignValuePaths(e.value, `${path}/${e.key}`);
    });
  }
}
