from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict


@dataclass
class ParseError(Exception):
    code: str
    msg: str
    line: int = 0
    col: int = 0


def parse_ggl_to_ast(text: str, grammar_abi: Dict[str, Any]) -> Dict[str, Any]:
    """Parse GGL text into an AST using a lightweight ABI contract.

    If grammar_abi includes a "parser" field of "regex", enforce "pattern".
    Otherwise return a raw AST envelope.
    """
    parser_kind = grammar_abi.get("parser", "raw")
    if parser_kind == "regex":
        import re

        pattern = grammar_abi.get("pattern")
        if not pattern:
            raise ParseError("E_PARSE_PATTERN_MISSING", "regex parser requires pattern")
        if not re.fullmatch(pattern, text, re.DOTALL):
            raise ParseError("E_PARSE_REGEX_NO_MATCH", "GGL text failed regex parser")

    return {
        "type": "GGLRaw",
        "text": text,
    }
