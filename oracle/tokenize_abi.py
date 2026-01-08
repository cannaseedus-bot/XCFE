from __future__ import annotations

from typing import Any, Dict, Iterable, Optional


def _in_ranges(codepoint: int, ranges: Iterable[Iterable[int]]) -> bool:
    for start, end in ranges:
        if start <= codepoint <= end:
            return True
    return False


def abi_tokenize_ok(text: str, tokenizer_abi: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Return error dict if text violates tokenizer ABI rules."""
    allowed_ranges = tokenizer_abi.get("allowed_codepoint_ranges", [])
    forbidden_ranges = tokenizer_abi.get("forbidden_codepoint_ranges", [])
    disallowed_codepoints = set(tokenizer_abi.get("disallowed_codepoints", []))

    for index, ch in enumerate(text):
        codepoint = ord(ch)
        if disallowed_codepoints and codepoint in disallowed_codepoints:
            return {
                "code": "E_TOKEN_DISALLOWED_CODEPOINT",
                "msg": f"disallowed codepoint: U+{codepoint:04X}",
                "line": 1,
                "col": index + 1,
            }
        if forbidden_ranges and _in_ranges(codepoint, forbidden_ranges):
            return {
                "code": "E_TOKEN_FORBIDDEN_RANGE",
                "msg": f"forbidden codepoint: U+{codepoint:04X}",
                "line": 1,
                "col": index + 1,
            }
        if allowed_ranges and not _in_ranges(codepoint, allowed_ranges):
            return {
                "code": "E_TOKEN_OUTSIDE_ALLOWED_RANGE",
                "msg": f"codepoint outside allowed ranges: U+{codepoint:04X}",
                "line": 1,
                "col": index + 1,
            }

    return None
