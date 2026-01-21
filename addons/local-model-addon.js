/**
 * XCFE Local Model Add-on (Ollama-style default)
 *
 * Accepts raw XJSON and forwards it to a local model endpoint.
 */

import crypto from "crypto";
import http from "http";
import { URL } from "url";
import {
  canonicalize,
  hashAst,
  lowerToAst,
  parseSurface,
  verifyAst
} from "@xcfe/core";

const CFG = {
  port: Number(process.env.LOCAL_ADDON_PORT ?? 8092),
  modelUrl: process.env.LOCAL_MODEL_URL ?? "http://localhost:11434/api/generate",
  defaultModel: process.env.LOCAL_MODEL_NAME ?? "llama3.1",
  promptPrefix: process.env.LOCAL_MODEL_PROMPT_PREFIX ?? ""
};

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "GET" && u.pathname === "/health") {
      return reply(res, 200, {
        status: "ok",
        name: "xcfe-local-model-addon",
        version: "1.0.0",
        model_url: CFG.modelUrl,
        default_model: CFG.defaultModel,
        now: new Date().toISOString()
      });
    }

    if (req.method !== "POST" || u.pathname !== "/xcfe/infer") {
      return reply(res, 404, { error: "not_found" });
    }

    const src = await readText(req, 2_000_000);
    if (!src || !String(src).trim()) {
      return reply(res, 400, { error: "missing_source" });
    }

    if (looksLikeJson(src)) {
      return reply(res, 400, { error: "invalid_format", message: "Expected raw XJSON body, not JSON object" });
    }

    const normalized = normalizeSource(String(src));
    const ast = lowerToAst(parseSurface(normalized));
    verifyAst(ast);
    const canon = canonicalize(ast);
    const ast_hash = hashAst(canon);
    const program_hash = sha256Utf8(normalized);

    const model = u.searchParams.get("model") || CFG.defaultModel;
    const prompt = [CFG.promptPrefix, normalized].filter(Boolean).join("\n");

    const upstreamRes = await fetch(CFG.modelUrl, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false
      })
    });

    const upstreamText = await upstreamRes.text();
    let upstreamBody = null;
    try { upstreamBody = JSON.parse(upstreamText); } catch { upstreamBody = upstreamText; }

    const output = typeof upstreamBody === "object" && upstreamBody !== null
      ? upstreamBody.response ?? upstreamBody.output ?? upstreamBody
      : upstreamBody;

    return reply(res, upstreamRes.ok ? 200 : 502, {
      "@type": "xcfe.infer.response",
      "@version": "1.0.0",
      status: upstreamRes.ok ? "ok" : "upstream_error",
      model,
      program_hash,
      ast_hash,
      output_text: output,
      upstream_status: upstreamRes.status
    });
  } catch (e) {
    return reply(res, 400, { error: "bad_request", message: String(e.message ?? e) });
  }
});

server.listen(CFG.port, () => {
  console.log(`XCFE local model addon listening on :${CFG.port}`);
});

function reply(res, code, obj) {
  const out = JSON.stringify(obj, null, 0);
  res.statusCode = code;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(out + "\n");
}

function readText(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let n = 0;
    req.on("data", c => {
      n += c.length;
      if (maxBytes && n > maxBytes) {
        reject(new Error("body_too_large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
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
