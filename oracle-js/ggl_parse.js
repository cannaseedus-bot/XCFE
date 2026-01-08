export class ParseError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export function parseGglToAst(text, grammarAbi) {
  const parserKind = grammarAbi.parser || "raw";
  if (parserKind === "regex") {
    const pattern = grammarAbi.pattern;
    if (!pattern) {
      throw new ParseError("E_PARSE_PATTERN_MISSING", "regex parser requires pattern");
    }
    const re = new RegExp(pattern, "s");
    if (!re.test(text)) {
      throw new ParseError("E_PARSE_REGEX_NO_MATCH", "GGL text failed regex parser");
    }
  }

  return { type: "GGLRaw", text };
}
