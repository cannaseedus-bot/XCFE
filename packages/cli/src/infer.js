/**
 * XCFE Inference Command v1
 *
 * Sends raw, native XJSON to an inference endpoint without wrapping it in JSON.
 * This preserves the exact source as the execution intent marker (`@`) is part
 * of the language surface, not JSON syntax.
 *
 * @artifact xcfe://cli/infer/v1
 */

import fs from "fs";
import { flag, error } from "./router.js";

/**
 * xcfe infer <file.xjson> [--endpoint url] [--model name] [--out file]
 */
export async function cmdInfer(args) {
  const file = args[0];
  if (!file) throw error("Missing file argument for infer", 64);

  const endpoint = flag(args, "--endpoint") ?? "http://localhost:8080";
  const model = flag(args, "--model");
  const out = flag(args, "--out");

  const source = fs.readFileSync(file, "utf8");
  const normalized = normalizeSource(source);

  if (looksLikeJson(normalized)) {
    throw error("Inference expects raw XJSON source (not JSON objects)", 64);
  }

  const url = model ? `${endpoint}/xcfe/infer?model=${encodeURIComponent(model)}` : `${endpoint}/xcfe/infer`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "text/x-xjson; charset=utf-8" },
    body: normalized
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = body?.error || `HTTP ${res.status}`;
    throw error(msg, res.status);
  }

  const outText = JSON.stringify(body, null, 2);
  if (out) {
    fs.writeFileSync(out, outText + "\n", "utf8");
    console.log(`Inference response saved → ${out}`);
  } else {
    console.log(outText);
  }
}

function normalizeSource(src) {
  return src.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function looksLikeJson(src) {
  const t = src.trimStart();
  return t.startsWith("{") || t.startsWith("[");
}
