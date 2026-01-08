from __future__ import annotations

import json
from typing import Any, Dict, Iterable


class SessionLog:
    """
    Append-only JSON Lines log (one JSON object per line).
    Deterministic: preserves write order exactly.
    """

    def __init__(self, path: str) -> None:
        self.path = path

    def append(self, obj: Dict[str, Any]) -> None:
        line = json.dumps(obj, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
        with open(self.path, "a", encoding="utf-8") as handle:
            handle.write(line + "\n")

    def read_all(self) -> Iterable[Dict[str, Any]]:
        try:
            with open(self.path, "r", encoding="utf-8") as handle:
                for line in handle:
                    line = line.strip()
                    if not line:
                        continue
                    yield json.loads(line)
        except FileNotFoundError:
            return
