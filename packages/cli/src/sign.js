/**
 * XCFE Sign Command v1
 *
 * Signs a program and emits a proof envelope with:
 * - Computed bind_hash from canonical bind_payload
 * - ed25519 signature
 * - env-handle key loading
 *
 * @artifact xcfe://cli/sign/v1
 */

import crypto from "crypto";
import fs from "fs";
import {
  parseSurface,
  lowerToAst,
  canonicalize,
  hashAst,
  canonicalJsonBytes,
  buildBindPayloadV1,
  computeBindHashV1,
  loadSigningSeed,
  rawEd25519SeedToPkcs8Der,
  spkiDerToRawEd25519Pub
} from "@xcfe/core";
import { flag, flags, has, readText, readJson, error } from "./router.js";

/**
 * xcfe sign <file.xjson> --policy policy.json --kid xcfe://kid/... --key env://... [options]
 *
 * Options:
 *  --intent approve|publish|execute|attest
 *  --scope program|program+snapshot
 *  --expires <UTC ISO, optional>
 *  --stdlib <file.json> (optional, default sentinel sha256:0 if scope=program)
 *  --pack <file.json> (repeatable)
 *  --session <session.json> (required for sessionwrap: keys)
 *  --out <path> (optional; stdout if omitted)
 *  --compact (one-line output)
 */
export function cmdSign(args) {
  const file = args[0];
  if (!file) throw error("Missing file argument for sign", 64);

  const policyPath = flag(args, "--policy");
  if (!policyPath) throw error("Missing --policy <policy.json>", 64);

  const kid = flag(args, "--kid");
  if (!kid) throw error("Missing --kid <xcfe://kid/...>", 64);

  const keyHandle = flag(args, "--key");
  if (!keyHandle) throw error("Missing --key <env://...|file:...|base64:...|hex:...|sessionwrap:...>", 64);

  const intent = flag(args, "--intent") ?? "approve";
  const scope = flag(args, "--scope") ?? "program";
  const expires = flag(args, "--expires") ?? null;

  const stdlibPath = flag(args, "--stdlib"); // optional
  const packPaths = flags(args, "--pack");   // optional repeatable
  const sessionPath = flag(args, "--session"); // required for sessionwrap

  const outPath = flag(args, "--out");
  const compact = has(args, "--compact");

  // Load session if provided
  const session = sessionPath ? readJson(sessionPath) : null;

  // 1) Read + normalize source exactly as parser does (CRLF -> LF)
  const src = readText(file).replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 2) program_hash = sha256(utf8(normalized_source))
  const program_hash = sha256Utf8("sha256:", src);

  // 3) AST + ast_hash
  const ast = canonicalize(lowerToAst(parseSurface(src)));
  const ast_hash = hashAst(ast);

  // 4) Policy hash (canonical json bytes)
  const policyObj = readJson(policyPath);
  const policy_hash = sha256Bytes("sha256:", canonicalJsonBytes(policyObj));

  // 5) stdlib + packs hashes (either from files, or sentinel allowed only when scope=program)
  const stdlib_hash = stdlibPath
    ? sha256Bytes("sha256:", canonicalJsonBytes(readJson(stdlibPath)))
    : "sha256:0";

  const pack_hashes = packPaths.length
    ? packPaths.map(p => sha256Bytes("sha256:", canonicalJsonBytes(readJson(p))))
    : ["sha256:0"];

  // 6) Enforce sentinel rules for scope program+snapshot
  if (scope === "program+snapshot") {
    if (stdlib_hash === "sha256:0") throw error("stdlib hash sentinel not allowed with --scope program+snapshot", 64);
    if (policy_hash === "sha256:0") throw error("policy hash sentinel not allowed with --scope program+snapshot", 64);
    for (const h of pack_hashes) {
      if (h === "sha256:0") throw error("pack hash sentinel not allowed with --scope program+snapshot", 64);
    }
  }

  // 7) Load ed25519 private key (seed) from handle
  const seed = loadSigningSeed(keyHandle, session);
  const pkcs8 = rawEd25519SeedToPkcs8Der(seed);
  const privKey = crypto.createPrivateKey({ key: pkcs8, format: "der", type: "pkcs8" });

  // 8) Derive public key raw32 for envelope
  const pubSpki = crypto.createPublicKey(privKey).export({ format: "der", type: "spki" });
  const pubRaw = spkiDerToRawEd25519Pub(pubSpki);

  // 9) Build envelope skeleton (bind_hash computed from bind_payload)
  const issued_utc = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  const envelope = {
    "@type": "xcfe.proof.envelope",
    "@version": "1.0.0",

    program: {
      program_hash,
      ast_hash
    },

    snapshot: {
      stdlib: { hash: stdlib_hash },
      packs: pack_hashes.map(h => ({ hash: h })),
      policy: { hash: policy_hash }
    },

    intent: {
      mode: intent,
      scope
    },

    time: {
      issued_utc,
      expires_utc: expires ? String(expires) : null
    },

    signer: {
      alg: "ed25519",
      kid,
      pub: "base64:" + pubRaw.toString("base64")
    },

    binding: {
      bind_hash: "sha256:0" // placeholder for now
    },

    signature: {
      sig: "base64:" // placeholder for now
    }
  };

  // 10) Compute bind_hash and sign it (v1 signs bind_hash bytes)
  const bindPayload = buildBindPayloadV1(envelope);
  const bind_hash = computeBindHashV1(bindPayload);
  envelope.binding.bind_hash = bind_hash;

  const bindHex = bind_hash.slice("sha256:".length);
  const bindBytes = Buffer.from(bindHex, "hex");

  const sig = crypto.sign(null, bindBytes, privKey); // ed25519 raw sig (64 bytes)
  envelope.signature.sig = "base64:" + sig.toString("base64");

  // 11) Emit
  const out = compact ? JSON.stringify(envelope, null, 0) : JSON.stringify(envelope, null, 2);
  if (outPath) fs.writeFileSync(outPath, out + "\n", "utf8");
  else process.stdout.write(out + "\n");
}

/* ---------------- hashing helpers ---------------- */

function sha256Utf8(prefix, s) {
  const h = crypto.createHash("sha256").update(Buffer.from(s, "utf8")).digest("hex");
  return prefix + h;
}

function sha256Bytes(prefix, b) {
  const h = crypto.createHash("sha256").update(b).digest("hex");
  return prefix + h;
}
