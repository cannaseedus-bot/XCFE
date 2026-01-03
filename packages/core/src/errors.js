/**
 * XCFE Error System v1
 *
 * Stable error codes for deterministic error handling.
 * Error paths point to canonical AST paths.
 * No stack traces or host-specific noise in canonical output.
 *
 * @artifact xcfe://spec/errors/v1
 */

export class XCFEError extends Error {
  /**
   * @param {string} code - Stable error code (e.g., "E_PARSE_TAB")
   * @param {string} message - Human-readable description
   * @param {object} meta - Additional metadata
   */
  constructor(code, message, meta = {}) {
    super(`${code}: ${message}`);
    this.name = "XCFEError";
    this.code = code;
    this.meta = meta;
    this.exitCode = meta.exitCode ?? 65;
  }

  /**
   * Returns a canonical error object for serialization
   */
  toCanonical() {
    return {
      "@type": "xcfe.error",
      "@version": "1.0.0",
      code: this.code,
      message: this.message,
      meta: this.meta
    };
  }
}

/**
 * Factory function for creating XCFE errors
 * @param {string} code
 * @param {string} message
 * @param {object} meta
 * @returns {XCFEError}
 */
export function err(code, message, meta) {
  return new XCFEError(code, message, meta);
}

/**
 * Error code categories:
 * - E_PARSE_*   : Parsing errors
 * - E_LOWER_*   : AST lowering errors
 * - E_CANON_*   : Canonicalization errors
 * - E_HASH_*    : Hashing errors
 * - E_AST_*     : AST validation errors
 * - E_POLICY_*  : Policy errors
 * - E_PROOF_*   : Proof envelope errors
 * - E_KEY_*     : Key handling errors
 * - E_CLI_*     : CLI errors
 */
