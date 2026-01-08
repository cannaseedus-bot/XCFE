export function abiTokenizeOk(text, tokenizerAbi) {
  const allowedRanges = tokenizerAbi.allowed_codepoint_ranges || [];
  const forbiddenRanges = tokenizerAbi.forbidden_codepoint_ranges || [];
  const disallowed = new Set(tokenizerAbi.disallowed_codepoints || []);

  for (let i = 0; i < text.length; i += 1) {
    const codepoint = text.codePointAt(i);
    if (disallowed.size && disallowed.has(codepoint)) {
      return {
        code: "E_TOKEN_DISALLOWED_CODEPOINT",
        msg: `disallowed codepoint: U+${codepoint.toString(16).toUpperCase().padStart(4, "0")}`,
        line: 1,
        col: i + 1,
      };
    }
    if (forbiddenRanges.length && inRanges(codepoint, forbiddenRanges)) {
      return {
        code: "E_TOKEN_FORBIDDEN_RANGE",
        msg: `forbidden codepoint: U+${codepoint.toString(16).toUpperCase().padStart(4, "0")}`,
        line: 1,
        col: i + 1,
      };
    }
    if (allowedRanges.length && !inRanges(codepoint, allowedRanges)) {
      return {
        code: "E_TOKEN_OUTSIDE_ALLOWED_RANGE",
        msg: `codepoint outside allowed ranges: U+${codepoint.toString(16).toUpperCase().padStart(4, "0")}`,
        line: 1,
        col: i + 1,
      };
    }
  }

  return null;
}

function inRanges(codepoint, ranges) {
  return ranges.some(([start, end]) => start <= codepoint && codepoint <= end);
}
