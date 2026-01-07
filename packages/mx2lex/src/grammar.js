/**
 * MX2LEX Grammar management utilities.
 * Provides deterministic grammar definitions with anchored regular expressions.
 */

/**
 * Ensure a pattern is a start-anchored RegExp.
 * @param {RegExp|string} pattern
 * @returns {RegExp}
 */
export function ensureRegex(pattern) {
  if (pattern instanceof RegExp) {
    if (!pattern.source.startsWith("^")) {
      return new RegExp("^" + pattern.source, pattern.flags);
    }
    return pattern;
  }
  if (typeof pattern === "string") {
    const anchored = pattern.startsWith("^") ? pattern : "^" + pattern;
    return new RegExp(anchored);
  }
  throw new TypeError("Grammar token patterns must be RegExp or string");
}

/**
 * Create an immutable grammar definition.
 * @param {object} options
 * @param {string} options.name
 * @param {Record<string, RegExp|string>} options.tokens
 * @param {string[]} [options.skip]
 * @returns {{name:string, tokens: Record<string, RegExp>, skip: Set<string>}}
 */
export function createGrammar({ name, tokens, skip = [] }) {
  if (typeof name !== "string" || !name.length) {
    throw new TypeError("Grammar requires a non-empty name");
  }
  if (!tokens || typeof tokens !== "object") {
    throw new TypeError("Grammar requires a tokens map");
  }

  const normalized = {};
  for (const [key, pattern] of Object.entries(tokens)) {
    if (!key) continue;
    normalized[key] = ensureRegex(pattern);
  }

  const skipSet = new Set(skip);

  return Object.freeze({
    name,
    tokens: Object.freeze(normalized),
    skip: skipSet
  });
}

/**
 * Describe a grammar in a serializable structure.
 * @param {{name:string, tokens: Record<string, RegExp>, skip: Set<string>}} grammar
 * @returns {{name:string, tokens:string[], skip:string[]}}
 */
export function describeGrammar(grammar) {
  if (!grammar || typeof grammar !== "object") {
    throw new TypeError("Expected grammar object to describe");
  }
  return {
    name: grammar.name,
    tokens: Object.keys(grammar.tokens),
    skip: Array.from(grammar.skip || [])
  };
}
