#!/usr/bin/env node
import crypto from "crypto";
import fs from "fs";
import path from "path";

const DEFAULT_MAX_HASH_MB = 64;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sha256Hex(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function sha256File(filePath) {
  const hash = crypto.createHash("sha256");
  const stream = fs.createReadStream(filePath);
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

function sortKeys(value) {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortKeys(value[key]);
        return acc;
      }, {});
  }
  return value;
}

function canonical(obj) {
  return JSON.stringify(sortKeys(obj));
}

function computeModelHash(model) {
  const canonicalModel = JSON.parse(JSON.stringify(model));
  if (canonicalModel["@provenance"]) {
    delete canonicalModel["@provenance"].model_hash;
  }
  return sha256Hex(Buffer.from(canonical(canonicalModel)));
}

function normalizeToken(token) {
  if (typeof token === "string") {
    return token;
  }
  if (token && typeof token === "object") {
    if (typeof token.content === "string") {
      return token.content;
    }
    if (typeof token.token === "string") {
      return token.token;
    }
    if (typeof token.text === "string") {
      return token.text;
    }
  }
  return null;
}

function extractTokenizerTokens(tokenizerJson) {
  if (tokenizerJson?.model?.vocab && typeof tokenizerJson.model.vocab === "object") {
    const entries = Object.entries(tokenizerJson.model.vocab);
    const numericIds = entries.every(([, id]) => Number.isInteger(id));
    if (numericIds) {
      entries.sort((a, b) => a[1] - b[1]);
    }
    return entries.map(([token]) => token);
  }
  if (tokenizerJson?.vocab && typeof tokenizerJson.vocab === "object") {
    const entries = Object.entries(tokenizerJson.vocab);
    const numericIds = entries.every(([, id]) => Number.isInteger(id));
    if (numericIds) {
      entries.sort((a, b) => a[1] - b[1]);
    }
    return entries.map(([token]) => token);
  }
  if (Array.isArray(tokenizerJson?.tokens)) {
    const tokens = tokenizerJson.tokens
      .map(normalizeToken)
      .filter((token) => token);
    if (tokens.length > 0) {
      return tokens;
    }
  }
  fail("Unable to locate vocab entries in tokenizer.json");
}

function extractAddedTokens(addedTokensJson) {
  if (!addedTokensJson) {
    return [];
  }
  if (Array.isArray(addedTokensJson)) {
    return addedTokensJson
      .map(normalizeToken)
      .filter((token) => token);
  }
  if (Array.isArray(addedTokensJson.added_tokens)) {
    return addedTokensJson.added_tokens
      .map(normalizeToken)
      .filter((token) => token);
  }
  if (typeof addedTokensJson === "object") {
    return Object.keys(addedTokensJson);
  }
  return [];
}

function extractSpecialTokens(tokenizerConfig, addedTokensJson) {
  const specials = new Set();
  if (tokenizerConfig && typeof tokenizerConfig === "object") {
    const keys = [
      "bos_token",
      "eos_token",
      "unk_token",
      "pad_token",
      "sep_token",
      "cls_token",
      "mask_token",
    ];
    for (const key of keys) {
      const value = tokenizerConfig[key];
      if (typeof value === "string") {
        specials.add(value);
      } else if (value && typeof value === "object" && typeof value.content === "string") {
        specials.add(value.content);
      }
    }
    if (Array.isArray(tokenizerConfig.additional_special_tokens)) {
      for (const token of tokenizerConfig.additional_special_tokens) {
        const normalized = normalizeToken(token);
        if (normalized) {
          specials.add(normalized);
        }
      }
    }
  }
  if (Array.isArray(addedTokensJson)) {
    for (const token of addedTokensJson) {
      if (token && typeof token === "object" && token.special) {
        const normalized = normalizeToken(token);
        if (normalized) {
          specials.add(normalized);
        }
      }
    }
  }
  return specials;
}

function summarizeNdarrayCache(ndarrayCache) {
  if (!ndarrayCache) {
    return null;
  }
  if (Array.isArray(ndarrayCache)) {
    return { tensor_count: ndarrayCache.length };
  }
  if (typeof ndarrayCache === "object") {
    return { tensor_count: Object.keys(ndarrayCache).length };
  }
  return null;
}

async function buildBrain(inputDir, outputFile, maxHashBytes) {
  const resolvedDir = path.resolve(inputDir);
  if (!fs.existsSync(resolvedDir) || !fs.statSync(resolvedDir).isDirectory()) {
    fail(`Input directory not found: ${resolvedDir}`);
  }

  const tokenizerPath = path.join(resolvedDir, "tokenizer.json");
  if (!fs.existsSync(tokenizerPath)) {
    fail(`Missing tokenizer.json in ${resolvedDir}`);
  }

  const addedTokensPath = path.join(resolvedDir, "added_tokens.json");
  const tokenizerConfigPath = path.join(resolvedDir, "tokenizer_config.json");
  const ndarrayCachePath = path.join(resolvedDir, "ndarray-cache.json");
  const tensorCachePath = path.join(resolvedDir, "tensor-cache.json");
  const mlcConfigPath = path.join(resolvedDir, "mlc-chat-config.json");
  const logsPath = path.join(resolvedDir, "logs.txt");

  const tokenizerJson = readJson(tokenizerPath);
  const addedTokensJson = fs.existsSync(addedTokensPath)
    ? readJson(addedTokensPath)
    : null;
  const tokenizerConfig = fs.existsSync(tokenizerConfigPath)
    ? readJson(tokenizerConfigPath)
    : null;
  const ndarrayCache = fs.existsSync(ndarrayCachePath) ? readJson(ndarrayCachePath) : null;
  const tensorCache = fs.existsSync(tensorCachePath) ? readJson(tensorCachePath) : null;
  const mlcConfig = fs.existsSync(mlcConfigPath) ? readJson(mlcConfigPath) : null;
  const logsText = fs.existsSync(logsPath) ? fs.readFileSync(logsPath, "utf8") : null;

  const baseTokens = extractTokenizerTokens(tokenizerJson);
  const addedTokens = extractAddedTokens(addedTokensJson);
  const specialTokens = extractSpecialTokens(tokenizerConfig, addedTokensJson);

  const tokenSet = new Set();
  const orderedTokens = [];
  for (const token of [...baseTokens, ...addedTokens]) {
    if (!tokenSet.has(token)) {
      tokenSet.add(token);
      orderedTokens.push(token);
    }
  }

  const grams = {};
  orderedTokens.forEach((token, index) => {
    const type = specialTokens.has(token) ? "control" : "token";
    grams[`g${index}`] = {
      type,
      scope: "tokenizer",
      count: 1,
      origin: "tokenizer.json",
      tokens: [token],
    };
  });

  const files = fs.readdirSync(resolvedDir);
  const manifest = [];
  let totalBytes = 0;
  for (const name of files.sort()) {
    const filePath = path.join(resolvedDir, name);
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      continue;
    }
    totalBytes += stats.size;
    const entry = {
      name,
      size_bytes: stats.size,
    };
    if (stats.size <= maxHashBytes) {
      entry.sha256 = `sha256:${await sha256File(filePath)}`;
    } else {
      entry.sha256 = null;
      entry.hash_skipped = true;
    }
    manifest.push(entry);
  }

  const shardFiles = files.filter((file) => file.startsWith("params_shard_") && file.endsWith(".bin"));
  const shardCount = shardFiles.length;
  const buildSummary = {
    tool: "tools/phi-to-brain.mjs",
    timestamp: new Date().toISOString(),
    phi_folder: resolvedDir,
    total_files: manifest.length,
    total_bytes: totalBytes,
    tokenizer_tokens: baseTokens.length,
    added_tokens: addedTokens.length,
    shards: shardCount,
    ndarray_cache: summarizeNdarrayCache(ndarrayCache),
    tensor_cache: summarizeNdarrayCache(tensorCache),
  };

  const buildPayload = {
    summary: buildSummary,
    files: manifest,
  };

  if (mlcConfig) {
    buildPayload.mlc_chat_config = mlcConfig;
  }
  if (logsText) {
    buildPayload.logs_excerpt = logsText.split("\n").slice(0, 40).join("\n");
  }

  const buildPayloadChecksum = sha256Hex(Buffer.from(canonical(buildPayload)));
  const gramsSummary = {
    total: orderedTokens.length,
    control: orderedTokens.filter((token) => specialTokens.has(token)).length,
    token: orderedTokens.filter((token) => !specialTokens.has(token)).length,
  };
  const decodePayload = {
    build_payload_sha256: buildPayloadChecksum,
    grams_summary: gramsSummary,
  };
  const decodeChecksum = sha256Hex(Buffer.from(canonical(decodePayload)));

  const modelId = `${path.basename(resolvedDir)}-xjson-brain`;
  const brain = {
    $schema: "xjson://schema/model/v1",
    "@model": {
      id: modelId,
      version: "1.0.0",
      format: "xjson-model",
      description: "Tokenizer-derived XJSON brain (embedding-free).",
    },
    "@provenance": {
      model_hash: "sha256:pending",
      parent_hash: null,
      datasets: [],
      build: buildPayload,
    },
    "@decode": {
      encoding: "base64",
      compression: "none",
      byte_order: "little",
      checksum: {
        algorithm: "sha256",
        value: decodeChecksum,
      },
      payload: decodePayload,
      strict: true,
    },
    "@grams": grams,
    "@limits": {
      max_payload_bytes: totalBytes,
      max_grams: orderedTokens.length,
      max_edges: 0,
      max_supgrams: 0,
      max_depth: 64,
    },
  };

  const modelHash = computeModelHash(brain);
  brain["@provenance"].model_hash = `sha256:${modelHash}`;

  fs.writeFileSync(outputFile, `${JSON.stringify(brain, null, 2)}\n`, "utf8");
  console.log(`Wrote ${outputFile}`);
}

const args = process.argv.slice(2);
if (args.length < 1) {
  fail("usage: phi-to-brain.mjs <phi-folder> [output-file] [--max-hash-mb N]");
}

const inputDir = args[0];
let outputFile = args[1] && !args[1].startsWith("--") ? args[1] : "brain.json";
let maxHashMb = DEFAULT_MAX_HASH_MB;

const maxHashIndex = args.findIndex((arg) => arg === "--max-hash-mb");
if (maxHashIndex !== -1) {
  const value = Number.parseFloat(args[maxHashIndex + 1]);
  if (!Number.isFinite(value) || value <= 0) {
    fail("--max-hash-mb must be a positive number");
  }
  maxHashMb = value;
}

const maxHashBytes = Math.floor(maxHashMb * 1024 * 1024);

await buildBrain(inputDir, outputFile, maxHashBytes);
