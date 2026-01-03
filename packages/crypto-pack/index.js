/**
 * XCFE Crypto Pack v1
 *
 * Optional cryptographic extensions for XCFE.
 * Cleanly isolated and opt-in.
 *
 * What v1 crypto pack enables:
 * - Session-bound signing (OAuth / SecuroLink)
 * - SCX sequential hash chains
 * - Deterministic auth / ledger / telemetry proofs
 *
 * What it does NOT do:
 * - No magic "security"
 * - No hidden keys
 * - No runtime eval
 * - No policy bypass
 *
 * @artifact xcfe://pack/crypto_scx_auth/v1
 */

// Re-export schemas as manifest
export const CRYPTO_PACK_MANIFEST = {
  "@type": "xcfe.pack.manifest",
  "@version": "1.0.0",
  pack_id: "xcfe://pack/crypto_scx_auth/v1",
  name: "XCFE Crypto Pack",
  description: "Cryptographic extensions for session binding and hash chains",
  schemas: [
    "crypto-pack-config.schema.json",
    "session-binding.schema.json",
    "scx-chain.schema.json"
  ],
  capabilities: [
    "xcfe.crypto.sign",
    "xcfe.crypto.verify",
    "xcfe.crypto.session_bind",
    "xcfe.crypto.scx_chain"
  ],
  determinism: "pure"
};

/**
 * Validate crypto pack configuration
 *
 * @param {object} config
 * @returns {boolean}
 */
export function validateCryptoPackConfig(config) {
  if (!config || config["@type"] !== "xcfe.crypto_pack_config") {
    throw new Error("Invalid crypto pack config");
  }
  if (config["@version"] !== "1.0.0") {
    throw new Error("Unsupported crypto pack version");
  }
  return true;
}

/**
 * Validate session binding
 *
 * @param {object} binding
 * @returns {boolean}
 */
export function validateSessionBinding(binding) {
  if (!binding || binding["@type"] !== "xcfe.session_binding") {
    throw new Error("Invalid session binding");
  }
  if (binding["@version"] !== "1.0.0") {
    throw new Error("Unsupported session binding version");
  }
  if (!binding.session_id || !binding.kid || !binding.pub) {
    throw new Error("Missing required session binding fields");
  }
  return true;
}

/**
 * Validate SCX chain entry
 *
 * @param {object} entry
 * @returns {boolean}
 */
export function validateScxChainEntry(entry) {
  if (!entry || entry["@type"] !== "xcfe.scx_chain_entry") {
    throw new Error("Invalid SCX chain entry");
  }
  if (!entry.prev_hash || !entry.payload_hash || !entry.entry_hash) {
    throw new Error("Missing required SCX chain fields");
  }
  return true;
}
