import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compileXjsonGrammar, lexXjson } from "../src/xjson.js";

describe("MX2LEX XJSON grammar", () => {
  it("compiles a reusable lexer", () => {
    const lexer = compileXjsonGrammar();
    assert.equal(typeof lexer.tokenize, "function");
    const tokens = lexer.tokenize('[ "@name": "alpha" ]');
    assert.ok(tokens.find((t) => t.type === "string"));
  });

  it("lexes executable and flow tokens", () => {
    const tokens = lexXjson('[ "@ipc.pipe" ] -> {{ @log message: "hi" }}');
    const types = tokens.map((t) => t.type);
    assert.ok(types.includes("arrow"), "includes flow arrow");
    assert.ok(types.includes("exec_open") && types.includes("exec_close"), "detects exec braces");
  });

  it("skips whitespace and comments", () => {
    const tokens = lexXjson(`// comment
[ "@name": "beta" ] /* block */ -> {{ @log }}  `);
    assert.ok(!tokens.some((t) => t.type === "whitespace"), "whitespace skipped");
    assert.ok(!tokens.some((t) => t.type === "line_comment"), "comments skipped");
  });

  it("throws on unknown token", () => {
    const lexer = compileXjsonGrammar();
    assert.throws(() => lexer.tokenize("???"), /Unrecognized token/);
  });
});
