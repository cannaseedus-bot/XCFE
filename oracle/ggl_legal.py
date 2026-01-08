from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict


@dataclass
class LegalityError(Exception):
    code: str
    msg: str
    line: int = 0
    col: int = 0


def check_legality(ast: Dict[str, Any], grammar_abi: Dict[str, Any]) -> None:
    """Apply legality checks based on grammar ABI hints."""
    legal_pattern = grammar_abi.get("legal_regex")
    if legal_pattern:
        import re

        text = ast.get("text", "")
        if not re.fullmatch(legal_pattern, text, re.DOTALL):
            raise LegalityError("E_LEGAL_REGEX_NO_MATCH", "GGL text failed legality regex")
