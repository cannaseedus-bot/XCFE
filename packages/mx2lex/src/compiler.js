import { createGrammar, ensureRegex } from "./grammar.js";

/**
 * Compile a grammar into a deterministic lexer.
 * @param {{name:string, tokens: Record<string, RegExp|string>, skip?: string[]}} spec
 * @returns {{name:string, tokens: Record<string, RegExp>, skip:Set<string>, tokenize:(source:string)=>Array<{type:string,value:string,position:number}>}}
 */
export function compileGrammar(spec) {
  const grammar = createGrammar(spec);
  const ordered = Object.entries(grammar.tokens).map(([type, regex]) => {
    const anchored = ensureRegex(regex);
    return { type, regex: anchored };
  });

  /**
   * Tokenize source text.
   * @param {string} source
   * @returns {Array<{type:string,value:string,position:number}>}
   */
  function tokenize(source) {
    if (typeof source !== "string") {
      throw new TypeError("tokenize() expects source text");
    }

    /** @type {Array<{type:string,value:string,position:number}>} */
    const tokens = [];
    let offset = 0;
    let remaining = source;

    while (remaining.length > 0) {
      let matched = false;

      for (const { type, regex } of ordered) {
        const m = regex.exec(remaining);
        if (m && m.index === 0) {
          matched = true;
          const value = m[0];
          if (!grammar.skip.has(type)) {
            tokens.push({ type, value, position: offset });
          }
          offset += value.length;
          remaining = remaining.slice(value.length);
          break;
        }
      }

      if (!matched) {
        const preview = remaining.slice(0, 12).replace(/\n/g, "\\n");
        throw new SyntaxError(
          `Unrecognized token at ${offset}: "${preview}${remaining.length > 12 ? "…" : ""}"`
        );
      }
    }

    return tokens;
  }

  return {
    name: grammar.name,
    tokens: grammar.tokens,
    skip: grammar.skip,
    tokenize
  };
}
