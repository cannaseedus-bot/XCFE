/**
 * XCFE Key Loading v1
 *
 * Handles loading signing keys from various sources:
 * - env://... : Environment variables
 * - file:... : File paths
 * - base64:... : Inline base64
 * - hex:... : Inline hex
 * - sessionwrap:... : Wrapped session keys
 *
 * @artifact xcfe://spec/keyload/v1
 */

import crypto from "crypto";
import fs from "fs";
import { err } from "./errors.js";

/**
 * Load a signing seed from a key handle
 *
 * @param {string} handle - Key handle (env://, file:, base64:, hex:, sessionwrap:)
 * @param {object|null} session - Session object (required for sessionwrap:)
 * @returns {Buffer} 32-byte ed25519 seed
 */
export function loadSigningSeed(handle, session = null) {
  if (handle.startsWith("sessionwrap:")) {
    if (!session) {
      throw err("E_KEY_SESSION", "Session required for sessionwrap: keys");
    }
    const wrapped = JSON.parse(fs.readFileSync(handle.slice(12), "utf8"));
    return unwrapSeed(wrapped, session);
  }

  return loadEd25519Seed(handle);
}

/**
 * Load ed25519 seed from handle (env://, file:, base64:, hex:)
 *
 * @param {string} handle
 * @returns {Buffer}
 */
export function loadEd25519Seed(handle) {
  let raw;

  if (handle.startsWith("env://")) {
    const envName = "XCFE_" + handle
      .slice("env://".length)
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_");
    const v = process.env[envName];
    if (!v) throw err("E_KEY_ENV", `Missing env var ${envName} for key handle ${handle}`);
    raw = decodeKeyMaterial(v.trim(), `env(${envName})`);
  } else if (handle.startsWith("file:")) {
    const p = handle.slice("file:".length);
    const v = fs.readFileSync(p, "utf8").trim();
    raw = decodeKeyMaterial(v, `file(${p})`);
  } else if (handle.startsWith("base64:") || handle.startsWith("hex:")) {
    raw = decodeKeyMaterial(handle, "inline");
  } else {
    throw err("E_KEY_HANDLE", `Unsupported key handle: ${handle}`);
  }

  if (raw.length !== 32) {
    throw err("E_KEY_LEN", "ed25519 seed must be exactly 32 raw bytes", { len: raw.length });
  }
  return raw;
}

/**
 * Decode key material from base64: or hex: format
 *
 * @param {string} s
 * @param {string} where - Description of source for error messages
 * @returns {Buffer}
 */
function decodeKeyMaterial(s, where) {
  try {
    if (s.startsWith("base64:")) return Buffer.from(s.slice(7), "base64");
    if (s.startsWith("hex:")) return Buffer.from(s.slice(4), "hex");
  } catch {
    throw err("E_KEY_DECODE", `Failed to decode key material from ${where}`);
  }
  throw err("E_KEY_FORMAT", `Key material must be base64:<...> or hex:<...> (${where})`);
}

/**
 * Unwrap a session-wrapped seed
 *
 * @param {object} wrapped - Wrapped key object
 * @param {object} session - Session object with oauth info
 * @returns {Buffer}
 */
function unwrapSeed(wrapped, session) {
  const ws = wrapped.wrapped_seed;
  if (!ws) {
    throw err("E_KEY_WRAP", "Missing wrapped_seed in wrapped key file");
  }

  const salt = b64(ws.salt);
  const nonce = b64(ws.nonce);
  const ciphertext = b64(ws.ciphertext);
  const tag = b64(ws.tag);

  if (!session.oauth || !session.oauth.subject) {
    throw err("E_KEY_SESSION", "Session must have oauth.subject for unwrapping");
  }

  const info = Buffer.from("xcfe.keywrap.v1", "utf8");
  const ikm = Buffer.from(
    session.oauth.subject + "|" + session.session_id + "|" + session.oauth.aud,
    "utf8"
  );

  const key = hkdfSha256(ikm, salt, info, 32);

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, nonce);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/**
 * HKDF-SHA256 key derivation
 *
 * @param {Buffer} ikm - Input key material
 * @param {Buffer} salt - Salt
 * @param {Buffer} info - Context info
 * @param {number} len - Output length
 * @returns {Buffer}
 */
function hkdfSha256(ikm, salt, info, len) {
  const prk = crypto.createHmac("sha256", salt).update(ikm).digest();
  let t = Buffer.alloc(0);
  let okm = Buffer.alloc(0);
  let c = 1;
  while (okm.length < len) {
    t = crypto.createHmac("sha256", prk)
      .update(Buffer.concat([t, info, Buffer.from([c])]))
      .digest();
    okm = Buffer.concat([okm, t]);
    c++;
  }
  return okm.slice(0, len);
}

/**
 * Decode base64: prefixed value
 *
 * @param {string} v
 * @returns {Buffer}
 */
function b64(v) {
  if (!v) throw err("E_KEY_FIELD", "Missing required field");
  return Buffer.from(v.replace(/^base64:/, ""), "base64");
}

/* ---------------- ASN.1: ed25519 PKCS8 from seed ---------------- */

/**
 * Convert raw ed25519 seed to PKCS8 DER format
 *
 * PKCS#8 Ed25519 private key (RFC 8410):
 * PrivateKeyInfo ::= SEQUENCE {
 *   version INTEGER 0,
 *   privateKeyAlgorithm AlgorithmIdentifier { OID Ed25519 },
 *   privateKey OCTET STRING  (contains OCTET STRING of 32-byte seed)
 * }
 *
 * @param {Buffer} seed32 - 32-byte seed
 * @returns {Buffer} PKCS8 DER encoded private key
 */
export function rawEd25519SeedToPkcs8Der(seed32) {
  // OID 1.3.101.112 => 06 03 2B 65 70
  const oid = Buffer.from([0x06, 0x03, 0x2B, 0x65, 0x70]);
  const algId = derSeq(oid);

  // inner OCTET STRING of seed
  const inner = derOctetString(seed32);
  // privateKey OCTET STRING containing inner
  const priv = derOctetString(inner);

  const ver = derInt0();
  return derSeq(Buffer.concat([ver, algId, priv]));
}

/**
 * Extract raw ed25519 public key from SPKI DER
 *
 * @param {Buffer} spkiDer - SPKI DER encoded public key
 * @returns {Buffer} 32-byte raw public key
 */
export function spkiDerToRawEd25519Pub(spkiDer) {
  const buf = Buffer.from(spkiDer);
  const idx = buf.indexOf(0x03); // BIT STRING
  if (idx < 0) throw err("E_SPKI_PARSE", "SPKI missing BIT STRING");

  const lenInfo = readDerLen(buf, idx + 1);
  const contentStart = lenInfo.next;
  const contentLen = lenInfo.len;
  if (contentLen < 1 + 32) throw err("E_SPKI_PARSE", "SPKI BIT STRING too short");

  const unusedBits = buf[contentStart];
  if (unusedBits !== 0x00) throw err("E_SPKI_PARSE", "SPKI BIT STRING unused-bits must be 0");

  const key = buf.slice(contentStart + 1, contentStart + 1 + 32);
  if (key.length !== 32) throw err("E_SPKI_PARSE", "Failed to extract raw pubkey");
  return key;
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

function derOctetString(content) {
  return Buffer.concat([Buffer.from([0x04]), derLen(content.length), content]);
}

function derInt0() {
  // INTEGER 0
  return Buffer.from([0x02, 0x01, 0x00]);
}

function readDerLen(buf, at) {
  const b = buf[at];
  if (b < 0x80) return { len: b, next: at + 1 };
  const n = b & 0x7f;
  if (n === 1) return { len: buf[at + 1], next: at + 2 };
  if (n === 2) return { len: (buf[at + 1] << 8) | buf[at + 2], next: at + 3 };
  throw err("E_DER_LEN", "Unsupported DER length encoding");
}
