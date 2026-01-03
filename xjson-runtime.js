/**
 * XJSON Runtime Client v1
 *
 * Client-side runtime for XJSON/XCFE programs.
 * Provides:
 * - Server communication (verify, hash, execute)
 * - Client-side parsing and verification
 * - Session management
 * - Proof envelope handling
 *
 * @artifact xcfe://runtime/client/v1
 */

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_CONFIG = {
  baseUrl: "http://localhost:8080",
  authUrl: "http://localhost:8787",
  timeout: 30000,
  retries: 3,
  retryDelay: 1000
};

let _config = { ...DEFAULT_CONFIG };

/**
 * Configure the runtime
 * @param {Partial<typeof DEFAULT_CONFIG>} config
 */
export function configure(config) {
  _config = { ..._config, ...config };
}

/**
 * Get current configuration
 * @returns {typeof DEFAULT_CONFIG}
 */
export function getConfig() {
  return { ..._config };
}

// ============================================================================
// Core Runtime Functions
// ============================================================================

/**
 * Run an XJSON program on a remote server
 *
 * @param {string} program - XJSON source code
 * @param {object} context - Execution context
 * @param {object} options - Additional options
 * @returns {Promise<any>} Execution result
 */
export async function run(program, context = {}, options = {}) {
  const baseUrl = options.baseUrl ?? _config.baseUrl;

  const res = await fetchWithRetry(`${baseUrl}/xjson/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ program, context })
  });

  const data = await res.json();
  if (!data.ok) {
    throw new XJSONError("E_RUN", data.error || "Execution failed", data);
  }
  return data.result;
}

/**
 * Verify an XJSON program structure
 *
 * @param {string} source - XJSON source code
 * @param {object} policy - Optional policy document
 * @param {object} options - Additional options
 * @returns {Promise<{status: string, hash: string}>}
 */
export async function verify(source, policy = null, options = {}) {
  const baseUrl = options.baseUrl ?? _config.baseUrl;

  const body = { source };
  if (policy) body.policy = policy;

  const res = await fetchWithRetry(`${baseUrl}/xcfe/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (data.error) {
    throw new XJSONError("E_VERIFY", data.message || data.error, data);
  }
  return data;
}

/**
 * Compute deterministic hash of an XJSON program
 *
 * @param {string} source - XJSON source code
 * @param {object} options - Additional options
 * @returns {Promise<string>} Hash string (sha256:...)
 */
export async function hash(source, options = {}) {
  const baseUrl = options.baseUrl ?? _config.baseUrl;

  const res = await fetchWithRetry(`${baseUrl}/xcfe/hash`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source })
  });

  const data = await res.json();
  if (data.error) {
    throw new XJSONError("E_HASH", data.message || data.error, data);
  }
  return data.hash;
}

/**
 * Verify a proof envelope
 *
 * @param {object} envelope - Proof envelope
 * @param {object} options - Additional options
 * @returns {Promise<{status: string, program_hash: string, signer_kid: string}>}
 */
export async function verifyProof(envelope, options = {}) {
  const baseUrl = options.baseUrl ?? _config.baseUrl;

  const res = await fetchWithRetry(`${baseUrl}/xcfe/proof/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ envelope })
  });

  const data = await res.json();
  if (data.error) {
    throw new XJSONError("E_PROOF", data.message || data.error, data);
  }
  return data;
}

/**
 * Execute a verified program with proof
 *
 * @param {string} source - XJSON source code
 * @param {object} envelope - Proof envelope
 * @param {object} policy - Optional policy document
 * @param {object} options - Additional options
 * @returns {Promise<{status: string, program_hash: string}>}
 */
export async function execute(source, envelope, policy = null, options = {}) {
  const baseUrl = options.baseUrl ?? _config.baseUrl;

  const body = { source, envelope };
  if (policy) body.policy = policy;

  const res = await fetchWithRetry(`${baseUrl}/xcfe/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (data.error) {
    throw new XJSONError("E_EXECUTE", data.message || data.error, data);
  }
  return data;
}

/**
 * Check server health
 *
 * @param {object} options - Additional options
 * @returns {Promise<{status: string, version: string, timestamp: string}>}
 */
export async function health(options = {}) {
  const baseUrl = options.baseUrl ?? _config.baseUrl;

  const res = await fetchWithRetry(`${baseUrl}/xcfe/health`, {
    method: "GET"
  });

  return res.json();
}

// ============================================================================
// Session Management
// ============================================================================

let _session = null;

/**
 * Exchange a SecuroLink token for a session
 *
 * @param {string} token - SecuroLink token (SL.xxx.xxx)
 * @param {object} options - Additional options
 * @returns {Promise<object>} Session object
 */
export async function authExchange(token, options = {}) {
  const authUrl = options.authUrl ?? _config.authUrl;

  const res = await fetchWithRetry(`${authUrl}/auth/securolink/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      "@type": "securolink.exchange.request",
      "@version": "1.0.0",
      token,
      nonce: generateNonce(),
      app_id: "xcfe"
    })
  });

  const data = await res.json();
  if (data.error) {
    throw new XJSONError("E_AUTH", data.message || data.error, data);
  }

  _session = data;
  return data;
}

/**
 * Bind Google OAuth to current session
 *
 * @param {string} idToken - Google OAuth ID token (JWT)
 * @param {object} options - Additional options
 * @returns {Promise<object>} Updated session object
 */
export async function authGoogle(idToken, options = {}) {
  if (!_session) {
    throw new XJSONError("E_SESSION", "No active session. Call authExchange first.");
  }

  const authUrl = options.authUrl ?? _config.authUrl;

  const res = await fetchWithRetry(`${authUrl}/auth/oauth/google/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      "@type": "oauth.google.verify.request",
      "@version": "1.0.0",
      session_id: _session.session_id,
      id_token: idToken,
      nonce: generateNonce()
    })
  });

  const data = await res.json();
  if (data.error) {
    throw new XJSONError("E_OAUTH", data.message || data.error, data);
  }

  _session = { ..._session, oauth: data };
  return _session;
}

/**
 * Register a public key with the current session
 *
 * @param {string} kid - Key identifier (xcfe://kid/...)
 * @param {string} pub - Base64-encoded public key (base64:...)
 * @param {object} options - Additional options
 * @returns {Promise<object>} Session binding
 */
export async function keyRegister(kid, pub, options = {}) {
  if (!_session) {
    throw new XJSONError("E_SESSION", "No active session. Call authExchange first.");
  }

  const authUrl = options.authUrl ?? _config.authUrl;

  const res = await fetchWithRetry(`${authUrl}/keys/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      "@type": "xcfe.key.register.request",
      "@version": "1.0.0",
      session_id: _session.session_id,
      kid,
      pub,
      alg: "ed25519",
      scope: "sign:xcfe",
      expires_utc: _session.expires_utc
    })
  });

  const data = await res.json();
  if (data.error) {
    throw new XJSONError("E_KEY_REGISTER", data.message || data.error, data);
  }

  return data;
}

/**
 * Provision a wrapped key from the server
 *
 * @param {string} kid - Key identifier (xcfe://kid/...)
 * @param {object} options - Additional options
 * @returns {Promise<object>} Wrapped key response
 */
export async function keyProvision(kid, options = {}) {
  if (!_session) {
    throw new XJSONError("E_SESSION", "No active session. Call authExchange first.");
  }

  const authUrl = options.authUrl ?? _config.authUrl;
  const salt = generateSalt();

  const res = await fetchWithRetry(`${authUrl}/keys/provision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      "@type": "xcfe.key.provision.request",
      "@version": "1.0.0",
      session_id: _session.session_id,
      kid,
      alg: "ed25519",
      wrap: {
        alg: "aes-256-gcm",
        kdf: "hkdf-sha256",
        salt: "base64:" + salt,
        info: "xcfe.keywrap.v1"
      },
      expires_utc: _session.expires_utc
    })
  });

  const data = await res.json();
  if (data.error) {
    throw new XJSONError("E_KEY_PROVISION", data.message || data.error, data);
  }

  return data;
}

/**
 * Get current session
 * @returns {object|null}
 */
export function getSession() {
  return _session ? { ..._session } : null;
}

/**
 * Clear current session
 */
export function clearSession() {
  _session = null;
}

// ============================================================================
// Client-Side Parsing (Lightweight)
// ============================================================================

/**
 * Parse XJSON source to surface IR (client-side)
 *
 * @param {string} text - XJSON source code
 * @returns {object} Surface IR
 */
export function parseSurface(text) {
  if (typeof text !== "string") {
    throw new XJSONError("E_PARSE_INPUT", "Input must be a string");
  }

  // Normalize newlines
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Tabs forbidden
  if (src.includes("\t")) {
    throw new XJSONError("E_PARSE_TAB", "Tabs are forbidden; use spaces only");
  }

  const rawLines = src.split("\n");
  const lines = [];

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i];

    // Skip blank lines
    if (/^\s*$/.test(raw)) continue;

    // Skip comment lines
    const firstNonSpace = raw.match(/\S/);
    if (firstNonSpace && raw[firstNonSpace.index] === "#") continue;

    // Count indent
    const m = raw.match(/^ */);
    const indent = m ? m[0].length : 0;

    if (indent % 2 !== 0) {
      throw new XJSONError("E_PARSE_INDENT", `Indent must be multiple of 2 spaces (got ${indent})`, { line: i + 1 });
    }

    const level = indent / 2;
    const trimmed = raw.slice(indent);

    lines.push({ ln: i + 1, indent, level, raw, trimmed });
  }

  if (lines.length && lines[0].level !== 0) {
    throw new XJSONError("E_PARSE_INDENT", "First statement must start at indent level 0", { line: lines[0].ln });
  }

  return {
    "@type": "xcfe.surface",
    "@version": "1.0.0",
    lines,
    labels: ["then", "else", "do", "case", "default", "on_error", "on_complete"]
  };
}

/**
 * Check if a line is an exec statement
 * @param {string} trimmed
 * @returns {boolean}
 */
export function isExecLine(trimmed) {
  if (!trimmed.startsWith("@")) return false;
  if (trimmed.includes(":")) return false;
  return /^@[A-Za-z0-9._-]+$/.test(trimmed);
}

/**
 * Check if a line is a label
 * @param {string} trimmed
 * @returns {boolean}
 */
export function isLabelLine(trimmed) {
  const LABELS = new Set(["then", "else", "do", "case", "default", "on_error", "on_complete"]);
  if (!trimmed.endsWith(":")) return false;
  const name = trimmed.slice(0, -1);
  if (!/^[A-Za-z0-9._-]+$/.test(name)) return false;
  return LABELS.has(name);
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * XJSON Error class
 */
export class XJSONError extends Error {
  constructor(code, message, meta = {}) {
    super(`${code}: ${message}`);
    this.name = "XJSONError";
    this.code = code;
    this.meta = meta;
  }

  toJSON() {
    return {
      "@type": "xcfe.error",
      "@version": "1.0.0",
      code: this.code,
      message: this.message,
      meta: this.meta
    };
  }
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Fetch with retry and timeout
 */
async function fetchWithRetry(url, options, retries = _config.retries) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), _config.timeout);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    if (!res.ok && retries > 0 && res.status >= 500) {
      await delay(_config.retryDelay);
      return fetchWithRetry(url, options, retries - 1);
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new XJSONError("E_HTTP", `HTTP ${res.status}: ${text}`, { status: res.status });
    }

    return res;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new XJSONError("E_TIMEOUT", "Request timed out");
    }
    if (retries > 0 && err.code !== "E_HTTP") {
      await delay(_config.retryDelay);
      return fetchWithRetry(url, options, retries - 1);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return "base64:" + btoa(String.fromCharCode(...bytes));
}

function generateSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

// ============================================================================
// Legacy Compatibility
// ============================================================================

/**
 * Legacy xjsonRun function for backward compatibility
 *
 * @deprecated Use run() instead
 * @param {string} baseUrl - Server base URL
 * @param {string} program - XJSON source code
 * @param {object} context - Execution context
 * @returns {Promise<any>}
 */
export async function xjsonRun(baseUrl, program, context = {}) {
  return run(program, context, { baseUrl: baseUrl.replace(/\/$/, "") });
}

// ============================================================================
// Module Exports (Default)
// ============================================================================

export default {
  // Configuration
  configure,
  getConfig,

  // Core functions
  run,
  verify,
  hash,
  verifyProof,
  execute,
  health,

  // Session management
  authExchange,
  authGoogle,
  keyRegister,
  keyProvision,
  getSession,
  clearSession,

  // Client-side parsing
  parseSurface,
  isExecLine,
  isLabelLine,

  // Error handling
  XJSONError,

  // Legacy
  xjsonRun
};
