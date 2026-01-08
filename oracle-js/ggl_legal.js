export class LegalityError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export function checkLegality(ast, grammarAbi) {
  const legalPattern = grammarAbi.legal_regex;
  if (legalPattern) {
    const re = new RegExp(legalPattern, "s");
    if (!re.test(ast.text || "")) {
      throw new LegalityError("E_LEGAL_REGEX_NO_MATCH", "GGL text failed legality regex");
    }
  }
}
