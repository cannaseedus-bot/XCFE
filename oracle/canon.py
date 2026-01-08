from __future__ import annotations

import json
from typing import Any


def _canonicalize(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {key: _canonicalize(obj[key]) for key in sorted(obj.keys())}
    if isinstance(obj, list):
        return [_canonicalize(item) for item in obj]
    return obj


def canon_json_bytes_v1(obj: Any) -> bytes:
    """Return canonical JSON bytes for ABI hashing.

    Canonicalization rules:
    - objects have lexicographically sorted keys
    - no extra whitespace
    - UTF-8 encoding
    """
    canonical = _canonicalize(obj)
    text = json.dumps(canonical, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
    return text.encode("utf-8")
