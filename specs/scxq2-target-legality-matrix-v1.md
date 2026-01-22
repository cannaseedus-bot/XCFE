# SCXQ2_TARGET_LEGALITY_MATRIX_v1 (FROZEN)

**Status:** FROZEN  
**Purpose:** Define all legal inference traversals  
**Scope:** DICT, EDGE, LANE, FIELD

---

## 1. Matrix Definition

Each inference step MUST satisfy:

```
(source_type, edge_type, target_type) ∈ ALLOWED
```

---

## 2. Canonical Legality Matrix

| Source  | Edge | Target  | Legal | Notes                        |
| ------- | ---- | ------- | ----- | ---------------------------- |
| uni     | bi   | uni     | ✔     | local adjacency              |
| uni     | bi   | supgram | ✔     | abstraction lift             |
| uni     | tri  | supgram | ✔     | sequence collapse            |
| bi      | n    | supgram | ✔     | context merge                |
| n       | —    | supgram | ✔     | lane collapse                |
| supgram | —    | supgram | ✔     | abstraction chaining         |
| supgram | —    | uni     | ✔     | expansion                    |
| @       | —    | supgram | ✔     | control binding              |
| @       | —    | uni     | ✔     | control anchor               |
| glyph   | —    | glyph   | ✔     | spatial reasoning            |
| glyph   | —    | supgram | ✔     | multimodal lift              |
| supgram | —    | glyph   | ✔     | projection                   |
| @       | —    | glyph   | ✖     | forbidden unless whitelisted |
| uni     | —    | @       | ✖     | control is non-emergent      |
| supgram | —    | @       | ✖     | control not inferred         |

Anything not explicitly allowed is **illegal**.

---

## 3. Inference Legality Proof (Required)

Each inference MUST emit a proof object:

```json
{
  "@proof": {
    "activated": [...],
    "edges_used": [...],
    "lanes": ["DICT", "EDGE", "FIELD"],
    "checks": {
      "existence": true,
      "edge_legality": true,
      "entropy_bound": true,
      "cycle_free": true
    },
    "result": "legal"
  }
}
```

Failure at any check ⇒ **inference abort**.
