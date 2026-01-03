/**
 * XCFE Verification v1
 *
 * Static verification of AST, policy, and proof envelopes.
 * Implements:
 * - AST schema validation
 * - Policy schema validation
 * - Proof envelope validation
 *
 * @artifact xcfe://spec/verify/v1
 */

import { err } from "./errors.js";

/**
 * Verify AST structure
 * Validates AST against schema v1
 *
 * @param {object} ast - AST document
 * @returns {boolean}
 */
export function verifyAst(ast) {
  if (!ast || ast.type !== "document") throw err("E_AST", "AST must be a document");
  if (!Array.isArray(ast.body)) throw err("E_AST_BODY", "AST.body must be an array");

  // Validate version
  if (ast.version && ast.version !== "1.0.0") {
    throw err("E_AST_VERSION", `Unsupported AST version: ${ast.version}`);
  }

  // Validate body structure
  for (const exec of ast.body) {
    verifyExecNode(exec);
  }

  return true;
}

/**
 * Verify exec node structure
 *
 * @param {object} exec - Exec node
 */
function verifyExecNode(exec) {
  if (!exec || exec.type !== "exec") {
    throw err("E_AST_EXEC", "Expected exec node");
  }
  if (!exec.verb || typeof exec.verb !== "string") {
    throw err("E_AST_VERB", "Exec must have a verb string");
  }
  if (!exec.verb.startsWith("@")) {
    throw err("E_AST_VERB_FORMAT", "Verb must start with @");
  }
  if (!Array.isArray(exec.params)) {
    throw err("E_AST_PARAMS", "Exec.params must be an array");
  }
  if (!Array.isArray(exec.children)) {
    throw err("E_AST_CHILDREN", "Exec.children must be an array");
  }

  // Validate params
  for (const param of exec.params) {
    verifyParamNode(param);
  }

  // Validate children (labels or execs)
  for (const child of exec.children) {
    if (child.type === "label") {
      verifyLabelNode(child);
    } else if (child.type === "exec") {
      verifyExecNode(child);
    } else {
      throw err("E_AST_CHILD", `Invalid child type: ${child.type}`);
    }
  }
}

/**
 * Verify param node structure
 *
 * @param {object} param - Param node
 */
function verifyParamNode(param) {
  if (!param || param.type !== "param") {
    throw err("E_AST_PARAM", "Expected param node");
  }
  if (!param.key || typeof param.key !== "string") {
    throw err("E_AST_PARAM_KEY", "Param must have a key string");
  }
  if (!param.value) {
    throw err("E_AST_PARAM_VALUE", "Param must have a value");
  }
}

/**
 * Verify label node structure
 *
 * @param {object} label - Label node
 */
function verifyLabelNode(label) {
  if (!label || label.type !== "label") {
    throw err("E_AST_LABEL", "Expected label node");
  }
  if (!label.name || typeof label.name !== "string") {
    throw err("E_AST_LABEL_NAME", "Label must have a name string");
  }
  if (!Array.isArray(label.children)) {
    throw err("E_AST_LABEL_CHILDREN", "Label.children must be an array");
  }

  // Validate label children (must be execs)
  for (const child of label.children) {
    verifyExecNode(child);
  }
}

/**
 * Verify policy structure
 *
 * @param {object} policy - Policy document
 * @returns {boolean}
 */
export function verifyPolicy(policy) {
  if (!policy || policy["@type"] !== "xcfe.policy") {
    throw err("E_POLICY", "Policy must be @type xcfe.policy");
  }
  if (policy["@version"] !== "1.0.0") {
    throw err("E_POLICY_VER", "Unsupported policy version");
  }

  // Validate grants if present
  if (policy.grants && !Array.isArray(policy.grants)) {
    throw err("E_POLICY_GRANTS", "Policy.grants must be an array");
  }

  // Validate limits if present
  if (policy.limits && typeof policy.limits !== "object") {
    throw err("E_POLICY_LIMITS", "Policy.limits must be an object");
  }

  return true;
}

/**
 * Verify proof envelope structure
 *
 * @param {object} envelope - Proof envelope
 * @returns {boolean}
 */
export function verifyProof(envelope) {
  if (!envelope || envelope["@type"] !== "xcfe.proof.envelope") {
    throw err("E_PROOF", "Envelope must be @type xcfe.proof.envelope");
  }
  if (envelope["@version"] !== "1.0.0") {
    throw err("E_PROOF_VER", "Unsupported proof version");
  }

  // Validate program section
  if (!envelope.program) {
    throw err("E_PROOF_PROGRAM", "Envelope must have program section");
  }
  if (!envelope.program.program_hash) {
    throw err("E_PROOF_HASH", "Envelope must have program_hash");
  }

  // Validate signer section
  if (!envelope.signer) {
    throw err("E_PROOF_SIGNER", "Envelope must have signer section");
  }
  if (envelope.signer.alg !== "ed25519") {
    throw err("E_PROOF_ALG", "Only ed25519 signing is supported");
  }

  // Validate binding section
  if (!envelope.binding || !envelope.binding.bind_hash) {
    throw err("E_PROOF_BINDING", "Envelope must have binding.bind_hash");
  }

  // Validate signature section
  if (!envelope.signature || !envelope.signature.sig) {
    throw err("E_PROOF_SIG", "Envelope must have signature.sig");
  }

  return true;
}
