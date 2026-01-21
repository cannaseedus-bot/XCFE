#!/usr/bin/env node
import fs from "fs";
import crypto from "crypto";
import Ajv from "ajv";

const SCHEMA_PATH = "xjson-model-schema-v1.xjson";

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

function sha256Hex(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function fail(code, message) {
  console.error(message);
  process.exit(code);
}

function computeModelHash(model) {
  const canonicalModel = JSON.parse(JSON.stringify(model));
  if (canonicalModel["@provenance"]) {
    delete canonicalModel["@provenance"]["model_hash"];
  }
  return sha256Hex(Buffer.from(canonical(canonicalModel)));
}

const file = process.argv[2];
if (!file) {
  fail(3, "usage: xjson-validate.mjs <file.xjson>");
}

let model;
let schema;
try {
  model = JSON.parse(fs.readFileSync(file, "utf8"));
  schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
} catch (error) {
  fail(3, `IO_ERROR: ${error.message}`);
}

const ajv = new Ajv({ allErrors: true, strict: true });
const validate = ajv.compile(schema);
if (!validate(model)) {
  fail(1, `SCHEMA_INVALID: ${ajv.errorsText(validate.errors)}`);
}

const declared = model["@provenance"].model_hash.split(":")[1];
const computed = computeModelHash(model);
if (computed !== declared) {
  fail(2, `HASH_MISMATCH\ncomputed=${computed}\ndeclared=${declared}`);
}

const grams = model["@grams"] || {};
for (const [gid, gram] of Object.entries(grams)) {
  if (gram.type === "supgram") {
    for (const member of gram.members || []) {
      if (!grams[member]) {
        fail(1, `INVALID_SUPGRAM_REFERENCE: ${gid}  ${member}`);
      }
    }
  }
}

if (Object.keys(grams).length > model["@limits"].max_grams) {
  fail(1, "LIMIT_EXCEEDED: max_grams");
}

console.log("VALID");
process.exit(0);
