/**
 * XCFE Model Registry v1
 *
 * Discovers local model artifacts and reports capabilities.
 *
 * @artifact xcfe://cli/models/v1
 */

import fs from "fs";
import path from "path";
import { error } from "./router.js";

const MODEL_DIR = "models";

const MODEL_CAPABILITIES = {
  gguf: {
    maxContext: 8192,
    maxOutputTokens: 1024,
    supportsStreaming: false,
    deterministic: true,
    supportsTools: false
  },
  ollama: {
    maxContext: null,
    maxOutputTokens: null,
    supportsStreaming: true,
    deterministic: false,
    supportsTools: false
  },
  mlc: {
    maxContext: 8192,
    maxOutputTokens: 1024,
    supportsStreaming: false,
    deterministic: true,
    supportsTools: false
  },
  safetensors: {
    maxContext: null,
    maxOutputTokens: null,
    supportsStreaming: false,
    deterministic: false,
    supportsTools: false
  },
  api: {
    maxContext: 128000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    deterministic: false,
    supportsTools: true
  }
};

/**
 * xcfe models [info <name>]
 */
export function cmdModels(args) {
  const [subcommand, name] = args;
  const models = discoverModels(process.cwd());

  if (subcommand === "info") {
    if (!name) throw error("Missing model name for info", 64);
    const model = models.find((m) => m.name === name);
    if (!model) throw error(`Model not found: ${name}`, 64);
    printModelInfo(model);
    return;
  }

  if (!models.length) {
    console.log("No models detected in ./models");
    return;
  }

  for (const model of models) {
    console.log(`${model.name}\t${model.kind}`);
  }
}

export function discoverModels(root) {
  const modelsDir = path.join(root, MODEL_DIR);
  if (!fs.existsSync(modelsDir)) return [];

  const entries = fs.readdirSync(modelsDir, { withFileTypes: true });
  const models = [];

  for (const entry of entries) {
    const entryPath = path.join(modelsDir, entry.name);
    if (entry.isFile()) {
      if (entry.name.endsWith(".gguf")) {
        models.push(buildModel(entry.name.replace(/\.gguf$/, ""), entryPath, "gguf"));
      }
      continue;
    }

    if (entry.isDirectory()) {
      const kind = detectModelKind(entryPath);
      if (kind) {
        models.push(buildModel(entry.name, entryPath, kind));
      }
    }
  }

  return models;
}

function detectModelKind(modelPath) {
  const modelfile = path.join(modelPath, "Modelfile");
  const mlcConfig = path.join(modelPath, "mlc-chat-config.json");
  const safetensors = path.join(modelPath, "model.safetensors");
  const phiShard = path.join(modelPath, "params_shard_0.bin");

  if (fs.existsSync(modelfile)) return "ollama";
  if (fs.existsSync(mlcConfig)) return "mlc";
  if (fs.existsSync(safetensors)) return "safetensors";
  if (fs.existsSync(phiShard)) return "mlc";

  return null;
}

function buildModel(name, modelPath, kind) {
  const caps = MODEL_CAPABILITIES[kind] ?? MODEL_CAPABILITIES.api;
  return {
    name,
    path: modelPath,
    kind,
    capabilities: { ...caps }
  };
}

function printModelInfo(model) {
  const caps = model.capabilities;
  console.log(`Model: ${model.name}`);
  console.log(`Kind: ${model.kind}`);
  console.log(`Path: ${model.path}`);
  console.log(`Context: ${caps.maxContext ?? "unknown"}`);
  console.log(`Max output: ${caps.maxOutputTokens ?? "unknown"}`);
  console.log(`Streaming: ${caps.supportsStreaming ? "yes" : "no"}`);
  console.log(`Deterministic: ${caps.deterministic ? "yes" : "no"}`);
  console.log(`Tools: ${caps.supportsTools ? "yes" : "no"}`);
}
