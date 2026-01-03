/**
 * XCFE Auth Commands v1
 *
 * Authentication flow commands:
 * - xcfe auth exchange : SecuroLink token exchange
 * - xcfe auth google   : Google OAuth binding
 *
 * @artifact xcfe://cli/auth/v1
 */

import crypto from "crypto";
import fs from "fs";
import { flag, error } from "./router.js";

/**
 * Route auth subcommands
 *
 * @param {string[]} args
 */
export async function cmdAuth(args) {
  const sub = args[0];
  if (sub === "exchange") return authExchange(args.slice(1));
  if (sub === "google") return authGoogle(args.slice(1));
  throw error("auth subcommand required (exchange|google)", 64);
}

/**
 * xcfe auth exchange --token SL... [--out session.json] [--endpoint url]
 */
async function authExchange(args) {
  const token = flag(args, "--token");
  const out = flag(args, "--out") ?? "session.json";
  const endpoint = flag(args, "--endpoint") ?? "http://localhost:8787";

  if (!token) throw error("Missing --token", 64);

  const res = await post(`${endpoint}/auth/securolink/exchange`, {
    "@type": "securolink.exchange.request",
    "@version": "1.0.0",
    token,
    nonce: randNonce(),
    app_id: "xcfe"
  });

  fs.writeFileSync(out, JSON.stringify(res, null, 2));
  console.log(`Session saved → ${out}`);
}

/**
 * xcfe auth google --id_token <jwt> --session session.json [--endpoint url]
 */
async function authGoogle(args) {
  const idToken = flag(args, "--id_token");
  const sessionPath = flag(args, "--session");
  const endpoint = flag(args, "--endpoint") ?? "http://localhost:8787";

  if (!idToken || !sessionPath) throw error("Missing --id_token or --session", 64);

  const session = JSON.parse(fs.readFileSync(sessionPath, "utf8"));

  const res = await post(`${endpoint}/auth/oauth/google/verify`, {
    "@type": "oauth.google.verify.request",
    "@version": "1.0.0",
    session_id: session.session_id,
    id_token: idToken,
    nonce: randNonce()
  });

  const merged = { ...session, oauth: res };
  fs.writeFileSync(sessionPath, JSON.stringify(merged, null, 2));
  console.log(`Session updated → ${sessionPath}`);
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

function randNonce() {
  return "base64:" + crypto.randomBytes(16).toString("base64");
}
