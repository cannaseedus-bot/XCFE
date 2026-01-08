from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict


@dataclass
class LowerError(Exception):
    code: str
    msg: str


def lower_ast_to_scene_xjson(ast: Dict[str, Any], grammar_abi: Dict[str, Any]) -> Dict[str, Any]:
    """Lower AST into a scene IR envelope.

    This default lowering embeds the original GGL for round-tripping.
    """
    if grammar_abi.get("lowering") == "deny":
        raise LowerError("E_LOWER_DISABLED", "lowering disabled by grammar ABI")

    return {
        "@type": grammar_abi.get("scene_ir_type", "scene.ir.v1"),
        "ggl": ast.get("text", ""),
    }
