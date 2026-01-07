import { createGrammar } from "./grammar.js";
import { compileGrammar } from "./compiler.js";

const IDENT = "[A-Za-z0-9_./:-]+";
const XCFE_KEY = `@${IDENT}`;
const STRING = "\"(?:\\\\[\"\\\\nrt]|[^\"\\\\])*\"";
const NUMBER = "-?(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?";

const XJSON_GRAMMAR_SPEC = {
  name: "XJSON v1 (MX2LEX)",
  tokens: {
    block_comment: "^/\\*[\\s\\S]*?\\*/",
    line_comment: "^//[^\\n]*",
    whitespace: "^\\s+",

    exec_open: "^\\{\\{",
    exec_close: "^\\}\\}",
    lbracket: "^\\[",
    rbracket: "^\\]",
    colon: "^:",
    arrow: "^(?:→|->)",

    xcfe_key: `^${XCFE_KEY}`,
    identifier: `^${IDENT}`,
    string: `^${STRING}`,
    number: `^${NUMBER}`,
    boolean: "^(?:true|false)",
    null: "^null"
  },
  skip: ["block_comment", "line_comment", "whitespace"]
};

export const XJSON_GRAMMAR = createGrammar(XJSON_GRAMMAR_SPEC);

/**
 * Compile the canonical XJSON grammar into a lexer.
 * @returns {{tokenize:(source:string)=>Array<{type:string,value:string,position:number}>}}
 */
export function compileXjsonGrammar() {
  return compileGrammar(XJSON_GRAMMAR_SPEC);
}

/**
 * Convenience helper for one-off lexing.
 * @param {string} source
 * @returns {Array<{type:string,value:string,position:number}>}
 */
export function lexXjson(source) {
  return compileXjsonGrammar().tokenize(source);
}

/**
 * Create a reusable XJSON lexer instance.
 * @returns {{tokenize:(source:string)=>Array<{type:string,value:string,position:number}>}}
 */
export function createXjsonLexer() {
  return compileXjsonGrammar();
}
