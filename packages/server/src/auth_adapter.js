/**
 * XCFE Auth Adapter v1
 *
 * SecuroLink/OAuth key-provision adapter.
 *
 * Two modes:
 * 1. REGISTER: client generates seed locally, sends only pub
 * 2. PROVISION: server generates seed, returns wrapped
 *
 * @artifact xcfe://server/auth-adapter/v1
 */

import http from "http";
import crypto from "crypto";
import { URL } from "url";

/* ================================
   CONFIG (env)
   ================================ */

const CFG = {
  port: Number(process.env.XCFE_AUTH_PORT ?? 8787),
  // SecuroLink validation secret (HMAC)
  securolinkSecret: mustEnv("XCFE_SECUROLINK_SECRET"),
  // Google OAuth client id (audience)
  googleClientId: mustEnv("XCFE_GOOGLE_CLIENT_ID"),
  // Server signing key (ed25519 seed raw32 in base64:/hex:)
  serverKeySeed: parseSeed(mustEnv("XCFE_SERVER_ED25519_SEED")),
  // Session TTL minutes
  sessionTtlMs: Number(process.env.XCFE_SESSION_TTL_MS ?? (60 * 60 * 1000))
};

const serverPriv = crypto.createPrivateKey({
  key: rawEd25519SeedToPkcs8Der(CFG.serverKeySeed),
  format: "der",
  type: "pkcs8"
});
const serverPubRaw = spkiDerToRawEd25519Pub(
  crypto.createPublicKey(serverPriv).export({ format: "der", type: "spki" })
);

/* ================================
   IN-MEM SESSION STORE (v1)
   swap for redis/db later
   ================================ */

const SESS = new Map(); // session_id -> { exp, subject, aud, email }

/* ================================
   ROUTER
   ================================ */

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "GET" && u.pathname === "/health") {
      return reply(res, 200, { status: "ok" });
    }

    if (req.method !== "POST") return reply(res, 405, { error: "method_not_allowed" });

    const body = await readJson(req);

    if (u.pathname === "/auth/securolink/exchange") {
      return handleSecuroLinkExchange(res, body);
    }
    if (u.pathname === "/auth/oauth/google/verify") {
      return await handleGoogleVerify(res, body);
    }
    if (u.pathname === "/keys/register") {
      return handleKeyRegister(res, body);
    }
    if (u.pathname === "/keys/provision") {
      return handleKeyProvision(res, body);
    }

    return reply(res, 404, { error: "not_found" });
  } catch (e) {
    return reply(res, 400, { error: "bad_request", message: String(e.message ?? e) });
  }
});

server.listen(CFG.port, () => {
  console.log(`XCFE auth adapter listening on :${CFG.port}`);
});

/* ================================
   HANDLERS
   ================================ */

function handleSecuroLinkExchange(res, body) {
  must(body?.["@type"] === "securolink.exchange.request", "bad_type");
  must(body?.["@version"] === "1.0.0", "bad_version");
  const token = mustStr(body.token, "missing_token");
  const nonce = mustB64(body.nonce, "missing_nonce");
  const appId = mustStr(body.app_id, "missing_app_id");

  // Token format: SL.<b64(payload)>.<b64(sig)>
  const parts = token.split(".");
  must(parts.length === 3 && parts[0] === "SL", "bad_token_format");
  const payloadBytes = Buffer.from(parts[1], "base64");
  const sigBytes = Buffer.from(parts[2], "base64");

  const mac = crypto.createHmac("sha256", Buffer.from(CFG.securolinkSecret, "utf8"))
    .update(payloadBytes)
    .digest();

  must(timingSafeEq(sigBytes, mac), "bad_securolink_sig");

  const payload = JSON.parse(payloadBytes.toString("utf8"));
  must(payload.app_id === appId, "app_id_mismatch");
  must(Date.now() < Number(payload.exp) * 1000, "securolink_expired");

  // create session
  const sid = "sid_" + crypto.randomBytes(16).toString("hex");
  const expires = new Date(Date.now() + CFG.sessionTtlMs).toISOString().replace(/\.\d{3}Z$/, "Z");
  SESS.set(sid, { exp: Date.now() + CFG.sessionTtlMs, subject: null, aud: null, email: null });

  return reply(res, 200, {
    "@type": "xcfe.session",
    "@version": "1.0.0",
    "session_id": sid,
    "session_pub": "base64:" + serverPubRaw.toString("base64"),
    "expires_utc": expires
  });
}

async function handleGoogleVerify(res, body) {
  must(body?.["@type"] === "oauth.google.verify.request", "bad_type");
  must(body?.["@version"] === "1.0.0", "bad_version");

  const sid = mustStr(body.session_id, "missing_session");
  const idToken = mustStr(body.id_token, "missing_id_token");
  mustB64(body.nonce, "missing_nonce");

  const sess = getSession(sid);

  // Verify via Google tokeninfo endpoint
  const info = await fetchJson("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(idToken));

  must(info.aud === CFG.googleClientId, "oauth_aud_mismatch");
  must(Number(info.exp) * 1000 > Date.now(), "oauth_expired");

  sess.subject = info.sub ?? null;
  sess.aud = info.aud ?? null;
  sess.email = info.email ?? null;

  const issued = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const expires = new Date(sess.exp).toISOString().replace(/\.\d{3}Z$/, "Z");

  return reply(res, 200, {
    "@type": "oauth.google.verify.response",
    "@version": "1.0.0",
    "session_id": sid,
    "subject": sess.subject,
    "email": sess.email,
    "aud": sess.aud,
    "issued_utc": issued,
    "expires_utc": expires
  });
}

function handleKeyRegister(res, body) {
  must(body?.["@type"] === "xcfe.key.register.request", "bad_type");
  must(body?.["@version"] === "1.0.0", "bad_version");

  const sid = mustStr(body.session_id, "missing_session");
  const sess = getSession(sid);
  must(sess.subject, "oauth_not_verified");

  const kid = mustStr(body.kid, "missing_kid");
  const alg = mustStr(body.alg, "missing_alg");
  must(alg === "ed25519", "bad_alg");
  const pub = mustB64Field(body.pub, "missing_pub", 32);
  const expiresUtc = mustStr(body.expires_utc, "missing_expires");

  const binding = buildSessionBinding({
    session_id: sid,
    kid,
    pub,
    alg,
    capabilities: ["xcfe.sign.v1", "xcfe.prove.v1"],
    issued_utc: nowUtc(),
    expires_utc: expiresUtc
  });

  return reply(res, 200, binding);
}

function handleKeyProvision(res, body) {
  must(body?.["@type"] === "xcfe.key.provision.request", "bad_type");
  must(body?.["@version"] === "1.0.0", "bad_version");

  const sid = mustStr(body.session_id, "missing_session");
  const sess = getSession(sid);
  must(sess.subject, "oauth_not_verified");

  const kid = mustStr(body.kid, "missing_kid");
  must(body.alg === "ed25519", "bad_alg");
  const wrap = body.wrap ?? {};
  must(wrap.alg === "aes-256-gcm", "bad_wrap_alg");
  must(wrap.kdf === "hkdf-sha256", "bad_kdf");

  const salt = mustB64Field(wrap.salt, "missing_salt", null);
  const expiresUtc = mustStr(body.expires_utc, "missing_expires");

  // Server generates seed
  const seed = crypto.randomBytes(32);

  // Derive pub
  const priv = crypto.createPrivateKey({ key: rawEd25519SeedToPkcs8Der(seed), format: "der", type: "pkcs8" });
  const pubRaw = spkiDerToRawEd25519Pub(crypto.createPublicKey(priv).export({ format: "der", type: "spki" }));

  // Derive session wrap key = HKDF(subject + sid + aud, salt)
  const wrapKey = hkdfSha256(
    Buffer.from(sess.subject + "|" + sid + "|" + sess.aud, "utf8"),
    salt,
    Buffer.from("xcfe.keywrap.v1", "utf8"),
    32
  );

  // AES-256-GCM wrap
  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", wrapKey, nonce);
  const ciphertext = Buffer.concat([cipher.update(seed), cipher.final()]);
  const tag = cipher.getAuthTag();

  const binding = buildSessionBinding({
    session_id: sid,
    kid,
    pub: pubRaw,
    alg: "ed25519",
    capabilities: ["xcfe.sign.v1", "xcfe.prove.v1"],
    issued_utc: nowUtc(),
    expires_utc: expiresUtc
  });

  return reply(res, 200, {
    "@type": "xcfe.key.provision.response",
    "@version": "1.0.0",
    "kid": kid,
    "alg": "ed25519",
    "pub": "base64:" + pubRaw.toString("base64"),
    "wrapped_seed": {
      "alg": "aes-256-gcm",
      "salt": "base64:" + salt.toString("base64"),
      "nonce": "base64:" + nonce.toString("base64"),
      "ciphertext": "base64:" + ciphertext.toString("base64"),
      "tag": "base64:" + tag.toString("base64")
    },
    "session_binding": binding
  });
}

/* ================================
   SESSION BINDING (server signed)
   ================================ */

function buildSessionBinding({ session_id, kid, pub, alg, capabilities, issued_utc, expires_utc }) {
  const payload = {
    "@type": "xcfe.session_binding",
    "@version": "1.0.0",
    "session_id": session_id,
    "kid": kid,
    "pub": "base64:" + pub.toString("base64"),
    "alg": alg,
    "capabilities": capabilities,
    "issued_utc": issued_utc,
    "expires_utc": expires_utc
  };

  const bind_hash = "sha256:" + crypto.createHash("sha256").update(canon(payload)).digest("hex");
  const sig = crypto.sign(null, Buffer.from(bind_hash.slice(7), "hex"), serverPriv);

  return {
    ...payload,
    "bind_hash": bind_hash,
    "server_sig": "base64:" + sig.toString("base64")
  };
}

function canon(obj) {
  return Buffer.from(JSON.stringify(obj, null, 0), "utf8");
}

/* ================================
   UTIL
   ================================ */

function getSession(sid) {
  const s = SESS.get(sid);
  must(s, "unknown_session");
  must(Date.now() < s.exp, "session_expired");
  return s;
}

function nowUtc() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function reply(res, code, obj) {
  const out = JSON.stringify(obj, null, 0);
  res.statusCode = code;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(out + "\n");
}

function must(cond, code) {
  if (!cond) throw new Error(code);
}
function mustEnv(k) {
  const v = process.env[k];
  if (!v) throw new Error("missing_env:" + k);
  return v;
}
function mustStr(v, code) {
  if (typeof v !== "string" || v.length === 0) throw new Error(code);
  return v;
}
function mustB64(v, code) {
  mustStr(v, code);
  if (!String(v).startsWith("base64:")) throw new Error(code);
  return v;
}
function mustB64Field(v, code, exactLen) {
  mustStr(v, code);
  if (!v.startsWith("base64:")) throw new Error(code);
  const b = Buffer.from(v.slice(7), "base64");
  if (exactLen != null && b.length !== exactLen) throw new Error(code + "_len");
  return b;
}
function timingSafeEq(a, b) {
  if (!Buffer.isBuffer(a)) a = Buffer.from(a);
  if (!Buffer.isBuffer(b)) b = Buffer.from(b);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
function parseSeed(s) {
  if (s.startsWith("base64:")) return Buffer.from(s.slice(7), "base64");
  if (s.startsWith("hex:")) return Buffer.from(s.slice(4), "hex");
  throw new Error("bad_server_seed_format");
}

/* ----- fetch json ----- */
async function fetchJson(url) {
  const r = await fetch(url, { method: "GET" });
  if (!r.ok) throw new Error("tokeninfo_http_" + r.status);
  return await r.json();
}
function readJson(req) {
  return new Promise((resolve, reject) => {
    let b = "";
    req.on("data", c => (b += c));
    req.on("end", () => {
      try { resolve(JSON.parse(b || "{}")); }
      catch (e) { reject(e); }
    });
  });
}

/* ================================
   CRYPTO PRIMITIVES
   ================================ */

function hkdfSha256(ikm, salt, info, len) {
  const prk = crypto.createHmac("sha256", salt).update(ikm).digest();
  let t = Buffer.alloc(0);
  let okm = Buffer.alloc(0);
  let c = 1;
  while (okm.length < len) {
    t = crypto.createHmac("sha256", prk).update(Buffer.concat([t, info, Buffer.from([c])])).digest();
    okm = Buffer.concat([okm, t]);
    c++;
  }
  return okm.slice(0, len);
}

/* ----- ed25519 seed -> pkcs8 der ----- */
function rawEd25519SeedToPkcs8Der(seed32) {
  const oid = Buffer.from([0x06, 0x03, 0x2B, 0x65, 0x70]); // 1.3.101.112
  const algId = derSeq(oid);
  const inner = derOctetString(seed32);
  const priv = derOctetString(inner);
  const ver = Buffer.from([0x02, 0x01, 0x00]);
  return derSeq(Buffer.concat([ver, algId, priv]));
}
function spkiDerToRawEd25519Pub(spkiDer) {
  const buf = Buffer.from(spkiDer);
  const idx = buf.indexOf(0x03);
  if (idx < 0) throw new Error("spki_no_bitstring");
  const { next } = readDerLen(buf, idx + 1);
  if (buf[next] !== 0x00) throw new Error("spki_unused_bits");
  return buf.slice(next + 1, next + 33);
}
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
function readDerLen(buf, at) {
  const b = buf[at];
  if (b < 0x80) return { len: b, next: at + 1 };
  const n = b & 0x7f;
  if (n === 1) return { len: buf[at + 1], next: at + 2 };
  if (n === 2) return { len: (buf[at + 1] << 8) | buf[at + 2], next: at + 3 };
  throw new Error("der_len_unsupported");
}
