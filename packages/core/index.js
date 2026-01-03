/**
 * @xcfe/core - XCFE Kernel v1
 *
 * Pure, deterministic language + proof kernel.
 * No network, no UI, no side effects.
 *
 * @artifact xcfe://spec/core/v1
 * @status FROZEN
 */

export { parseSurface, isExecLine, isLabelLine, parseParamLine } from "./src/parse.js";
export { lowerToAst, assignPaths } from "./src/lower.js";
export { canonicalize } from "./src/canonical.js";
export { hashAst, canonicalJsonBytes } from "./src/hash.js";
export { verifyAst, verifyPolicy, verifyProof } from "./src/verify.js";
export { buildBindPayloadV1, computeBindHashV1, verifyEnvelopeProofV1 } from "./src/proof.js";
export { loadSigningSeed } from "./src/keyload.js";
export * as XCFEError from "./src/errors.js";

/**
 * Core kernel guarantees:
 * - Same input → same AST → same bytes → same hash
 * - No I/O
 * - No eval
 * - No environment access
 */
