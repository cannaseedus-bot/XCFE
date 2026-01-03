/**
 * XCFE Proof System v1
 *
 * Implements:
 * - bind_payload construction
 * - bind_hash computation
 * - Proof envelope verification
 *
 * @artifact xcfe://spec/proof/v1
 */

import crypto from "crypto";
import { err } from "./errors.js";
import { canonicalJsonBytes } from "./hash.js";

/**
 * Build the bind_payload for signing
 * This is the canonical payload that gets hashed and signed
 *
 * @param {object} envelope - Partial proof envelope
 * @returns {object} Bind payload object
 */
export function buildBindPayloadV1(envelope) {
  return {
    "@type": "xcfe.bind_payload",
    "@version": "1.0.0",
    program: {
      program_hash: envelope.program.program_hash,
      ast_hash: envelope.program.ast_hash
    },
    snapshot: {
      stdlib_hash: envelope.snapshot?.stdlib?.hash ?? "sha256:0",
      pack_hashes: (envelope.snapshot?.packs ?? []).map(p => p.hash),
      policy_hash: envelope.snapshot?.policy?.hash ?? "sha256:0"
    },
    intent: {
      mode: envelope.intent?.mode ?? "approve",
      scope: envelope.intent?.scope ?? "program"
    },
    time: {
      issued_utc: envelope.time?.issued_utc ?? null,
      expires_utc: envelope.time?.expires_utc ?? null
    },
    signer: {
      alg: envelope.signer?.alg ?? "ed25519",
      kid: envelope.signer?.kid ?? null
    }
  };
}

/**
 * Compute the bind_hash from a bind_payload
 *
 * @param {object} bindPayload - Bind payload object
 * @returns {string} Hash string in format "sha256:<hex>"
 */
export function computeBindHashV1(bindPayload) {
  const bytes = canonicalJsonBytes(bindPayload);
  return "sha256:" + crypto.createHash("sha256").update(bytes).digest("hex");
}

/**
 * Verify a complete proof envelope
 * Checks:
 * - bind_hash matches recomputed bind_payload
 * - Signature is valid
 *
 * @param {object} envelope - Complete proof envelope
 * @returns {boolean}
 */
export function verifyEnvelopeProofV1(envelope) {
  // Recompute bind_hash
  const bindPayload = buildBindPayloadV1(envelope);
  const expectedBindHash = computeBindHashV1(bindPayload);

  if (envelope.binding.bind_hash !== expectedBindHash) {
    throw err("E_PROOF_BIND_HASH", "bind_hash does not match computed payload", {
      expected: expectedBindHash,
      actual: envelope.binding.bind_hash
    });
  }

  // Verify signature
  if (envelope.signer.alg !== "ed25519") {
    throw err("E_PROOF_ALG", "Only ed25519 signatures are supported");
  }

  const pubKeyRaw = decodeBase64Field(envelope.signer.pub);
  const sig = decodeBase64Field(envelope.signature.sig);
  const bindHashBytes = Buffer.from(envelope.binding.bind_hash.slice(7), "hex");

  const pubKey = rawEd25519PubToSpkiDer(pubKeyRaw);
  const pubKeyObj = crypto.createPublicKey({ key: pubKey, format: "der", type: "spki" });

  const valid = crypto.verify(null, bindHashBytes, pubKeyObj, sig);
  if (!valid) {
    throw err("E_PROOF_SIG_INVALID", "Signature verification failed");
  }

  // Check time window if present
  if (envelope.time?.expires_utc) {
    const expires = new Date(envelope.time.expires_utc).getTime();
    if (Date.now() > expires) {
      throw err("E_PROOF_EXPIRED", "Proof has expired");
    }
  }

  return true;
}

/* ---------------- Helpers ---------------- */

function decodeBase64Field(value) {
  if (!value) throw err("E_PROOF_FIELD", "Missing required field");
  const str = String(value);
  if (str.startsWith("base64:")) {
    return Buffer.from(str.slice(7), "base64");
  }
  throw err("E_PROOF_FORMAT", "Expected base64: prefixed value");
}

/**
 * Convert raw ed25519 public key to SPKI DER format
 *
 * @param {Buffer} rawPub - 32-byte raw public key
 * @returns {Buffer} SPKI DER encoded public key
 */
function rawEd25519PubToSpkiDer(rawPub) {
  if (rawPub.length !== 32) {
    throw err("E_PROOF_PUBKEY", "ed25519 public key must be 32 bytes");
  }
  // OID 1.3.101.112 => 06 03 2B 65 70
  const oid = Buffer.from([0x06, 0x03, 0x2B, 0x65, 0x70]);
  const algId = derSeq(oid);
  const bitString = Buffer.concat([
    Buffer.from([0x03, rawPub.length + 1, 0x00]), // BIT STRING header + unused bits
    rawPub
  ]);
  return derSeq(Buffer.concat([algId, bitString]));
}

/* ---------------- DER helpers ---------------- */

function derLen(n) {
  if (n < 0x80) return Buffer.from([n]);
  if (n <= 0xff) return Buffer.from([0x81, n]);
  return Buffer.from([0x82, (n >> 8) & 0xff, n & 0xff]);
}

function derSeq(content) {
  return Buffer.concat([Buffer.from([0x30]), derLen(content.length), content]);
}
