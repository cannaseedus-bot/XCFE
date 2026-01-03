/**
 * XCFE Key Remote Commands v1
 *
 * Remote key management commands:
 * - xcfe key register  : Register local key with server
 * - xcfe key provision : Provision wrapped key from server
 *
 * @artifact xcfe://cli/key-remote/v1
 */

import crypto from "crypto";
import fs from "fs";
import { flag, error } from "./router.js";

/**
 * Route key subcommands
 *
 * @param {string[]} args
 */
export async function cmdKeyRemote(args) {
  const sub = args[0];
  if (sub === "register") return keyRegister(args.slice(1));
  if (sub === "provision") return keyProvision(args.slice(1));
  throw error("key subcommand required (register|provision)", 64);
}

/**
 * xcfe key register --session session.json --kid xcfe://kid/... --pub base64:...
 */
async function keyRegister(args) {
  const session = loadSession(flag(args, "--session"));
  const kid = flag(args, "--kid");
  const pub = flag(args, "--pub");
  const endpoint = flag(args, "--endpoint") ?? "http://localhost:8787";

  if (!kid || !pub) throw error("Missing --kid or --pub", 64);

  const res = await post(`${endpoint}/keys/register`, {
    "@type": "xcfe.key.register.request",
    "@version": "1.0.0",
    session_id: session.session_id,
    kid,
    pub,
    alg: "ed25519",
    scope: "sign:xcfe",
    expires_utc: session.expires_utc
  });

  console.log(JSON.stringify(res, null, 2));
}

/**
 * xcfe key provision --session session.json --kid xcfe://kid/... [--out wrapped.key.json]
 */
async function keyProvision(args) {
  const session = loadSession(flag(args, "--session"));
  const kid = flag(args, "--kid");
  const out = flag(args, "--out") ?? "wrapped.key.json";
  const endpoint = flag(args, "--endpoint") ?? "http://localhost:8787";

  if (!kid) throw error("Missing --kid", 64);

  const salt = crypto.randomBytes(16).toString("base64");

  const res = await post(`${endpoint}/keys/provision`, {
    "@type": "xcfe.key.provision.request",
    "@version": "1.0.0",
    session_id: session.session_id,
    kid,
    alg: "ed25519",
    wrap: {
      alg: "aes-256-gcm",
      kdf: "hkdf-sha256",
      salt: "base64:" + salt,
      info: "xcfe.keywrap.v1"
    },
    expires_utc: session.expires_utc
  });

  fs.writeFileSync(out, JSON.stringify(res, null, 2));
  console.log(`Wrapped key saved → ${out}`);
}

/* ---------- helpers ---------- */

async function post(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw error(`HTTP ${res.status}`, 1);
  return res.json();
}

function loadSession(path) {
  if (!path) throw error("Missing --session", 64);
  return JSON.parse(fs.readFileSync(path, "utf8"));
}
