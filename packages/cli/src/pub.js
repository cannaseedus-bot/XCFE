/**
 * XCFE Pub Command v1
 *
 * Derives and prints public key from a seed.
 *
 * @artifact xcfe://cli/pub/v1
 */

import crypto from "crypto";
import fs from "fs";
import {
  loadEd25519Seed,
  rawEd25519SeedToPkcs8Der,
  spkiDerToRawEd25519Pub
} from "@xcfe/core";
import { flag, has, error } from "./router.js";

/**
 * xcfe pub --key <env://...|file:...|base64:...|hex:...> [--out pub.json] [--compact]
 *
 * Prints:
 * {
 *   "@type": "xcfe.pubkey",
 *   "@version": "1.0.0",
 *   "alg": "ed25519",
 *   "pub": "base64:..."
 * }
 */
export function cmdPub(args) {
  const keyHandle = flag(args, "--key");
  if (!keyHandle) throw error("Missing --key <handle>", 64);

  const outPath = flag(args, "--out");
  const compact = has(args, "--compact");

  const seed = loadEd25519Seed(keyHandle);
  const pkcs8 = rawEd25519SeedToPkcs8Der(seed);
  const privKey = crypto.createPrivateKey({ key: pkcs8, format: "der", type: "pkcs8" });
  const pubSpki = crypto.createPublicKey(privKey).export({ format: "der", type: "spki" });
  const pubRaw = spkiDerToRawEd25519Pub(pubSpki);

  const obj = {
    "@type": "xcfe.pubkey",
    "@version": "1.0.0",
    alg: "ed25519",
    pub: "base64:" + pubRaw.toString("base64")
  };

  const out = compact ? JSON.stringify(obj, null, 0) : JSON.stringify(obj, null, 2);
  if (outPath) fs.writeFileSync(outPath, out + "\n", "utf8");
  else process.stdout.write(out + "\n");
}
