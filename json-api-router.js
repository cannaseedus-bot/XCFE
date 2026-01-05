// json-api-router.js — v1 JSON REST API router (no execution semantics)
// Node 18+. No deps.

import fs from "fs";
import crypto from "crypto";

export function createJsonApiRouter(options = {}) {
  const cfg = {
    basePath: options.basePath || "",
    dbPath: options.dbPath || "/db",
    dbFile: options.dbFile || null,
    allowCors: options.allowCors ?? true,
    maxBodyBytes: options.maxBodyBytes ?? 2_000_000,
    serverName: options.serverName || "xjson-json-rest-server",
    version: options.version || "1.1.0"
  };

  let db = cfg.dbFile ? loadFile(cfg.dbFile) : (options.initialDb ?? {});

  function handle(req, res, pathname, jsonBody /* parsed or null */, rawBody /* Buffer or null */) {
    // CORS / preflight
    if (cfg.allowCors) applyCors(req, res);
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      return res.end();
    }

    // health
    if (pathname === cfg.basePath + "/health" && req.method === "GET") {
      return replyJson(res, 200, {
        ok: true,
        name: cfg.serverName,
        version: cfg.version,
        now_utc: isoUtc()
      });
    }

    // capabilities
    if (pathname === cfg.basePath + "/capabilities" && req.method === "GET") {
      return replyJson(res, 200, {
        "@type": "xjson.server.capabilities",
        "@version": "1.0.0",
        name: cfg.serverName,
        version: cfg.version,
        routes: {
          health: "GET /health",
          capabilities: "GET /capabilities",
          db: [
            "GET /db",
            "GET /db/<path>",
            "PUT /db/<path>",
            "POST /db/<path>",
            "PATCH /db/<path>",
            "DELETE /db/<path>"
          ],
          infer: "POST /infer"
        },
        semantics: {
          execution: false,
          note: "This is a JSON REST server. XJSON/XCFE execution is not implemented in v1."
        }
      });
    }

    // inference ingress (raw XJSON passthrough acknowledgment)
    if (pathname === cfg.basePath + "/infer" && req.method === "POST") {
      const src = pickSource(jsonBody, rawBody);
      if (!src || !String(src).trim()) {
        return replyJson(res, 400, { error: "missing_source" });
      }

      if (looksLikeJson(src)) {
        return replyJson(res, 400, { error: "invalid_format", message: "Expected raw XJSON body, not JSON object" });
      }

      const normalized = normalizeSource(String(src));
      const hash = sha256Utf8(normalized);

      return replyJson(res, 200, {
        "@type": "xjson.infer.response",
        "@version": "1.0.0",
        status: "accepted",
        program_hash: hash,
        message: "Inference dispatch not implemented in json-api-router v1"
      });
    }

    // db routes
    const dbBase = cfg.basePath + cfg.dbPath; // e.g. "/db"
    if (pathname === dbBase && req.method === "GET") {
      return replyJson(res, 200, db);
    }

    if (pathname.startsWith(dbBase + "/")) {
      const subPath = pathname.slice((dbBase + "/").length); // remainder
      const pointer = "/" + decodeURIComponent(subPath).split("/").map(escapeJsonPointer).join("/");

      if (req.method === "GET") {
        const val = getByPointer(db, pointer);
        if (val === NOT_FOUND) return replyJson(res, 404, { error: "not_found" });
        return replyJson(res, 200, val);
      }

      if (req.method === "DELETE") {
        const ok = deleteByPointer(db, pointer);
        if (!ok) return replyJson(res, 404, { error: "not_found" });
        persist();
        return replyJson(res, 200, { ok: true });
      }

      if (req.method === "PUT" || req.method === "POST") {
        // set exact value
        const v = jsonBody;
        if (v === null || v === undefined) return replyJson(res, 400, { error: "missing_json_body" });
        setByPointer(db, pointer, v);
        persist();
        return replyJson(res, 200, { ok: true });
      }

      if (req.method === "PATCH") {
        // JSON Merge Patch (RFC 7386)
        const patch = jsonBody;
        if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
          return replyJson(res, 400, { error: "merge_patch_must_be_object" });
        }
        const cur = getByPointer(db, pointer);
        if (cur === NOT_FOUND) return replyJson(res, 404, { error: "not_found" });

        const next = mergePatch(cur, patch);
        setByPointer(db, pointer, next);
        persist();
        return replyJson(res, 200, { ok: true });
      }

      return replyJson(res, 405, { error: "method_not_allowed" });
    }

    return false;
  }

  function readDb() {
    return db;
  }

  function writeDb(nextDb) {
    db = nextDb;
    persist();
  }

  function persist() {
    if (!cfg.dbFile) return;
    fs.writeFileSync(cfg.dbFile, JSON.stringify(db, null, 2) + "\n", "utf8");
  }

  return { cfg, handle, readDb, writeDb };
}

/* ---------------- JSON Pointer ops ---------------- */

const NOT_FOUND = Symbol("NOT_FOUND");

function escapeJsonPointer(seg) {
  // JSON Pointer uses "~0" for "~" and "~1" for "/"
  return seg.replace(/~/g, "~0").replace(/\//g, "~1");
}

function unescapeJsonPointer(seg) {
  return seg.replace(/~1/g, "/").replace(/~0/g, "~");
}

function getByPointer(root, ptr) {
  if (ptr === "" || ptr === "/") return root;
  if (!ptr.startsWith("/")) return NOT_FOUND;
  const parts = ptr.split("/").slice(1).map(unescapeJsonPointer);

  let cur = root;
  for (const p of parts) {
    if (cur && typeof cur === "object") {
      if (Array.isArray(cur)) {
        const idx = toIndex(p);
        if (idx === null || idx < 0 || idx >= cur.length) return NOT_FOUND;
        cur = cur[idx];
      } else {
        if (!(p in cur)) return NOT_FOUND;
        cur = cur[p];
      }
    } else return NOT_FOUND;
  }
  return cur;
}

function setByPointer(root, ptr, value) {
  if (ptr === "" || ptr === "/") throw new Error("cannot_set_root_without_path");
  if (!ptr.startsWith("/")) throw new Error("bad_pointer");
  const parts = ptr.split("/").slice(1).map(unescapeJsonPointer);

  let cur = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    const nextP = parts[i + 1];

    if (Array.isArray(cur)) {
      const idx = toIndex(p);
      if (idx === null) throw new Error("array_index_required");
      while (cur.length <= idx) cur.push(null);
      if (cur[idx] === null || typeof cur[idx] !== "object") {
        // create container based on next segment
        cur[idx] = looksLikeIndex(nextP) ? [] : {};
      }
      cur = cur[idx];
    } else {
      if (cur[p] === undefined || cur[p] === null || typeof cur[p] !== "object") {
        cur[p] = looksLikeIndex(nextP) ? [] : {};
      }
      cur = cur[p];
    }
  }

  const last = parts[parts.length - 1];
  if (Array.isArray(cur)) {
    const idx = toIndex(last);
    if (idx === null) throw new Error("array_index_required");
    while (cur.length <= idx) cur.push(null);
    cur[idx] = value;
  } else {
    cur[last] = value;
  }
}

function deleteByPointer(root, ptr) {
  if (ptr === "" || ptr === "/") return false;
  if (!ptr.startsWith("/")) return false;
  const parts = ptr.split("/").slice(1).map(unescapeJsonPointer);

  let cur = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cur && typeof cur === "object") {
      if (Array.isArray(cur)) {
        const idx = toIndex(p);
        if (idx === null || idx < 0 || idx >= cur.length) return false;
        cur = cur[idx];
      } else {
        if (!(p in cur)) return false;
        cur = cur[p];
      }
    } else return false;
  }

  const last = parts[parts.length - 1];
  if (Array.isArray(cur)) {
    const idx = toIndex(last);
    if (idx === null || idx < 0 || idx >= cur.length) return false;
    cur.splice(idx, 1);
    return true;
  } else {
    if (!(last in cur)) return false;
    delete cur[last];
    return true;
  }
}

function looksLikeIndex(s) {
  return /^[0-9]+$/.test(s);
}
function toIndex(s) {
  if (!looksLikeIndex(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/* ---------------- JSON Merge Patch (RFC 7386) ---------------- */

function mergePatch(target, patch) {
  if (patch === null) return null;

  // If patch is not an object, replace target entirely
  if (typeof patch !== "object" || Array.isArray(patch)) return patch;

  // If target is not an object, treat it as empty object
  const out = (target && typeof target === "object" && !Array.isArray(target))
    ? { ...target }
    : {};

  for (const k of Object.keys(patch)) {
    const v = patch[k];
    if (v === null) {
      delete out[k];
    } else {
      out[k] = mergePatch(out[k], v);
    }
  }
  return out;
}

/* ---------------- server helpers ---------------- */

function isoUtc() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function applyCors(req, res) {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type");
}

function replyJson(res, code, obj) {
  const out = JSON.stringify(obj, null, 0);
  res.statusCode = code;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(out + "\n");
}

function loadFile(path) {
  try {
    const s = fs.readFileSync(path, "utf8");
    return JSON.parse(s);
  } catch {
    return {};
  }
}

function pickSource(jsonBody, rawBody) {
  // Prefer raw body when provided (for text/x-xjson)
  if (rawBody && rawBody.length) return rawBody.toString("utf8");

  if (jsonBody && typeof jsonBody === "object" && typeof jsonBody.source === "string") {
    return jsonBody.source;
  }
  return null;
}

function normalizeSource(src) {
  return src.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function looksLikeJson(src) {
  const t = src.trimStart();
  return t.startsWith("{") || t.startsWith("[");
}

function sha256Utf8(src) {
  const h = crypto.createHash("sha256").update(Buffer.from(src, "utf8")).digest("hex");
  return "sha256:" + h;
}
