/**
 * XCFE Keygen Command v1
 *
 * Generates ed25519 keypairs for signing.
 *
 * @artifact xcfe://cli/keygen/v1
 */

import crypto from "crypto";
import fs from "fs";
import {
  rawEd25519SeedToPkcs8Der,
  spkiDerToRawEd25519Pub
} from "@xcfe/core";
import { flag, has, error } from "./router.js";

/**
 * xcfe keygen [--kid xcfe://kid/...] [--out key.json] [--compact]
 *
 * Generates:
 *  - ed25519 seed (32 bytes)
 *  - derived public key (32 bytes)
 *  - kid (deterministic if provided, random otherwise)
 *
 * OUTPUT FORMAT:
 * {
 *   "@type": "xcfe.keypair",
 *   "@version": "1.0.0",
 *   "alg": "ed25519",
 *   "kid": "...",
 *   "seed": "base64:...",
 *   "pub": "base64:..."
 * }
 */
export function cmdKeygen(args) {
  const kid = flag(args, "--kid") ?? randomKid();
  const outPath = flag(args, "--out");
  const compact = has(args, "--compact");

  // 1) Generate 32-byte seed
  const seed = crypto.randomBytes(32);

  // 2) Build private key (PKCS8 DER) and derive public key
  const pkcs8 = rawEd25519SeedToPkcs8Der(seed);
  const privKey = crypto.createPrivateKey({ key: pkcs8, format: "der", type: "pkcs8" });
  const pubSpki = crypto.createPublicKey(privKey).export({ format: "der", type: "spki" });
  const pubRaw = spkiDerToRawEd25519Pub(pubSpki);

  const obj = {
    "@type": "xcfe.keypair",
    "@version": "1.0.0",
    alg: "ed25519",
    kid,
    seed: "base64:" + seed.toString("base64"),
    pub: "base64:" + pubRaw.toString("base64")
  };

  const out = compact ? JSON.stringify(obj, null, 0) : JSON.stringify(obj, null, 2);
  if (outPath) fs.writeFileSync(outPath, out + "\n", "utf8");
  else process.stdout.write(out + "\n");
}

/* ---------------- helpers ---------------- */

function randomKid() {
  const r = crypto.randomBytes(8).toString("hex");
  return `xcfe://kid/${r}`;
}
