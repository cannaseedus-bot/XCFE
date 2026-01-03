/**
 * XCFE Server v1
 *
 * Authoritative XCFE verification + execution gateway.
 *
 * Core responsibilities:
 * - Accept XCFE programs + proof envelopes
 * - Verify AST, policy, proof/signature
 * - Enforce policy
 * - Dispatch to execution adapters
 *
 * Strong rule:
 * > Server never trusts source. Only trusts canonical hashes + proofs.
 *
 * @artifact xcfe://server/v1
 */

import http from "http";
import { URL } from "url";
import {
  parseSurface,
  lowerToAst,
  canonicalize,
  hashAst,
  verifyAst,
  verifyPolicy,
  verifyProof,
  verifyEnvelopeProofV1
} from "@xcfe/core";

const PORT = Number(process.env.XCFE_PORT ?? 8080);

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, `http://${req.headers.host}`);

    // Health check
    if (req.method === "GET" && u.pathname === "/xcfe/health") {
      return reply(res, 200, {
        status: "ok",
        version: "1.0.0",
        timestamp: new Date().toISOString()
      });
    }

    if (req.method !== "POST") {
      return reply(res, 405, { error: "method_not_allowed" });
    }

    const body = await readJson(req);

    // Verify endpoint - verify AST structure
    if (u.pathname === "/xcfe/verify") {
      return handleVerify(res, body);
    }

    // Hash endpoint - compute hash of program
    if (u.pathname === "/xcfe/hash") {
      return handleHash(res, body);
    }

    // Proof verify endpoint - verify proof envelope
    if (u.pathname === "/xcfe/proof/verify") {
      return handleProofVerify(res, body);
    }

    // Execute endpoint - execute verified program (requires proof)
    if (u.pathname === "/xcfe/execute") {
      return handleExecute(res, body);
    }

    return reply(res, 404, { error: "not_found" });
  } catch (e) {
    return reply(res, 400, { error: "bad_request", message: String(e.message ?? e) });
  }
});

server.listen(PORT, () => {
  console.log(`XCFE Server v1 listening on :${PORT}`);
});

/* ================================
   HANDLERS
   ================================ */

/**
 * POST /xcfe/verify
 * Verify AST structure and optionally policy
 */
function handleVerify(res, body) {
  const { source, policy } = body;

  if (!source) {
    return reply(res, 400, { error: "missing_source" });
  }

  const ast = lowerToAst(parseSurface(source));
  verifyAst(ast);

  if (policy) {
    verifyPolicy(policy);
  }

  const hash = hashAst(canonicalize(ast));

  return reply(res, 200, {
    "@type": "xcfe.verify.response",
    "@version": "1.0.0",
    status: "valid",
    hash
  });
}

/**
 * POST /xcfe/hash
 * Compute deterministic hash of program
 */
function handleHash(res, body) {
  const { source } = body;

  if (!source) {
    return reply(res, 400, { error: "missing_source" });
  }

  const ast = lowerToAst(parseSurface(source));
  const hash = hashAst(canonicalize(ast));

  return reply(res, 200, {
    "@type": "xcfe.hash.response",
    "@version": "1.0.0",
    hash
  });
}

/**
 * POST /xcfe/proof/verify
 * Verify a proof envelope
 */
function handleProofVerify(res, body) {
  const { envelope } = body;

  if (!envelope) {
    return reply(res, 400, { error: "missing_envelope" });
  }

  verifyProof(envelope);
  verifyEnvelopeProofV1(envelope);

  return reply(res, 200, {
    "@type": "xcfe.proof.verify.response",
    "@version": "1.0.0",
    status: "valid",
    program_hash: envelope.program.program_hash,
    signer_kid: envelope.signer.kid
  });
}

/**
 * POST /xcfe/execute
 * Execute a verified program (requires proof)
 */
function handleExecute(res, body) {
  const { source, envelope, policy } = body;

  if (!source || !envelope) {
    return reply(res, 400, { error: "missing_source_or_envelope" });
  }

  // Verify proof first
  verifyProof(envelope);
  verifyEnvelopeProofV1(envelope);

  // Verify AST
  const ast = lowerToAst(parseSurface(source));
  verifyAst(ast);

  // Verify policy if provided
  if (policy) {
    verifyPolicy(policy);
  }

  // Check source hash matches envelope
  const hash = hashAst(canonicalize(ast));
  if (envelope.program.ast_hash && hash !== envelope.program.ast_hash) {
    return reply(res, 400, { error: "hash_mismatch" });
  }

  // Execution is optional in v1 - just return acceptance
  return reply(res, 200, {
    "@type": "xcfe.execute.response",
    "@version": "1.0.0",
    status: "accepted",
    program_hash: envelope.program.program_hash,
    message: "Execution dispatch not implemented in v1"
  });
}

/* ================================
   UTILS
   ================================ */

function reply(res, code, obj) {
  const out = JSON.stringify(obj, null, 0);
  res.statusCode = code;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(out + "\n");
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
