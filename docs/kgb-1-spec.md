# KGB-1 (K’uhul ⊗ Glyph ⊗ Binary) Specification

> **GitHub binary policy note:** The KGB-encoded `.bin` artifacts are binary. This repo stores hex in `.md` files. To create binaries, save the hex to `.hex` and run:
>
> ```bash
> xxd -r -p kgb_tutor_min.hex > kgb_tutor_min.scxq2.bin
> ```
>
> These binaries must be **manually created** from the hex blocks below.

## 1) Invariants (Normative)

* Deterministic byte layout
* Fixed lane order
* Fixed-point weights
* No dynamic dispatch
* No execution authority inside the format
* All legality is declarative and verifiable

## 2) File Layout

```
| Header | LaneIndex[] | Lane0 | Lane1 | Lane2 | Lane3 | Lane4 |
```

### Header (little-endian)

```c
struct KgbHeader {
  char     magic[4];      // "KGB1"
  uint16_t version;       // 0x0001
  uint16_t flags;         // bit0 = lane-packed
  uint64_t brain_id;      // blake3_64(name)
  uint64_t payload_hash;  // blake3_64(payload)
  uint32_t lane_count;    // MUST be 5
  uint32_t reserved;      // 0
}
```

### Lane Index

```c
struct LaneIndex {
  uint8_t  lane_id;       // 0..4
  uint8_t  flags;         // 0
  uint16_t count;         // records
  uint32_t offset;        // absolute
  uint32_t length;        // bytes
}
```

## 3) Lanes (Fixed Order)

| ID | Lane             | Purpose               |
| -: | ---------------- | --------------------- |
|  0 | Glyph Dictionary | Semantic anchors      |
|  1 | Concepts / Grams | Nodes                 |
|  2 | Edges / Weights  | Learning state        |
|  3 | K’uhul Ops       | Legal operations      |
|  4 | Proofs           | Optional, append-only |

## 4) Lane 0 — Glyph Dictionary

```c
enum GlyphDomain : uint8_t {
  CONCEPT=1, CONTROL=2, PROOF=3, POLICY=4
};

struct GlyphEntry {
  uint16_t glyph_id;
  uint8_t  domain;
  uint8_t  arity;
  uint32_t meaning_hash; // stable hash of meaning
}
```

**Canonical Glyphs (v1)**

| glyph |     id |  domain | meaning              |
| ----- | -----: | ------: | -------------------- |
| ⟁     | 0x0001 | CONCEPT | anchor               |
| ⟶     | 0x0002 | CONTROL | directed implication |
| ⚖     | 0x0003 |   PROOF | legality             |
| ⧉     | 0x0004 | CONTROL | merge                |

## 5) Lane 1 — Concepts / Grams

```c
struct Concept {
  uint16_t id;
  uint16_t len;
  uint8_t  bytes[len]; // UTF-8
}
```

## 6) Lane 2 — Edges / Binary Weights

```c
struct Edge {
  uint16_t src;
  uint16_t dst;
  uint32_t weight_q; // fixed-point: value * 65536
  uint16_t glyph_id; // MUST be ⟶
}
```

**Learning Rule (Frozen)**

```
co-occur ⇒ weight_q += 65536
```

**Merge Rule**

```
w = min((wA + wB) * 0.85, MAX)
```

## 7) Lane 3 — K’uhul Ops (Declarative)

```c
enum KuhulOpcode : uint8_t {
  WALK=1, MERGE=2, PROVE=3
};

struct KuhulOp {
  uint8_t  opcode;
  uint8_t  flags;
  uint16_t a;
  uint16_t b;
}
```

## 8) Lane 4 — Proofs (Optional)

```c
struct Proof {
  uint32_t rule_id;
  uint32_t subject_hash;
}
```

## 9) Decoder Phases (Required)

```
LOAD → MAP(GLYPHS) → VERIFY(K’UHUL) → PROJECT(UI/INFER/PROVE)
```

## 10) KGB-Encoded Brain (Hex Dump)

**Brain:** `kgb_tutor_min.scxq2.bin`

### Semantics

* Concepts: `XJSON`, `graph walk`
* Edge: `XJSON ⟶ graph walk` (weight 2.0)
* Ops: `WALK`
* Glyphs present

### Hex (write with `xxd -r -p`)

```
4B 47 42 31 01 00 01 00
11 22 33 44 55 66 77 88
99 AA BB CC DD EE FF 00
05 00 00 00 00 00 00 00

00 00 02 00 40 00 00 00 18 00 00 00
01 00 02 00 58 00 00 00 24 00 00 00
02 00 01 00 7C 00 00 00 0A 00 00 00
03 00 01 00 86 00 00 00 06 00 00 00
04 00 00 00 8C 00 00 00 00 00 00 00

01 00 01 01 34 12 00 00
02 00 02 02 78 56 00 00

01 00 05 00 58 4A 53 4F 4E
02 00 0A 00 67 72 61 70 68 20 77 61 6C 6B

01 00 02 00 00 00 02 00 02 00

01 00 01 00 02 00
```

## 11) Hybrid Decoder (Rust + WASM)

### Rust Core

```rust
pub struct Brain {
  pub glyphs: Vec<GlyphEntry>,
  pub concepts: Vec<Concept>,
  pub edges: Vec<Edge>,
  pub ops: Vec<KuhulOp>,
}

pub fn decode_kgb(bin: &[u8]) -> Brain {
  let header = parse_header(bin);
  assert_eq!(&header.magic, b"KGB1");

  let lanes = parse_lanes(bin);
  let glyphs = parse_glyphs(lanes[0]);
  let concepts = parse_concepts(lanes[1]);
  let edges = parse_edges(lanes[2], &glyphs);
  let ops = parse_ops(lanes[3]);

  kuhul_verify(&ops, &edges);
  Brain { glyphs, concepts, edges, ops }
}
```

### WASM Binding

```rust
#[wasm_bindgen]
pub fn load_kgb(ptr: *const u8, len: usize) {
  let bin = unsafe { std::slice::from_raw_parts(ptr, len) };
  let _brain = decode_kgb(bin);
}
```

## 12) Glyph-Annotated SVG Debugger

```svg
<svg width="640" height="220" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: monospace; font-size: 14px }
    .node { fill:#ecfeff; stroke:#0f172a; stroke-width:1.2 }
    .edge { stroke:#334155; stroke-width:2; marker-end:url(#a) }
  </style>
  <defs>
    <marker id="a" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
      <path d="M0,0 L8,4 L0,8 Z" fill="#334155"/>
    </marker>
  </defs>

  <rect x="40" y="80" width="140" height="40" class="node"/>
  <text x="60" y="105">⟁ XJSON</text>

  <rect x="360" y="80" width="180" height="40" class="node"/>
  <text x="380" y="105">⟁ graph walk</text>

  <line x1="180" y1="100" x2="360" y2="100" class="edge"/>
  <text x="250" y="85">⟶ w=2.0</text>
</svg>
```

## 13) K’uhul Grammar → Binary Ops Mapping

| K’uhul Construct | Binary               |
| ---------------- | -------------------- |
| `walk(A,B)`      | `KuhulOp{WALK,A,B}`  |
| `merge(X,Y)`     | `KuhulOp{MERGE,X,Y}` |
| `prove(E)`       | `KuhulOp{PROVE,E,0}` |
| legality         | glyph ⚖ in Lane 4    |
