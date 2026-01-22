# SCX-GLYPH-1: Binary Glyph Wire Format (Canonical)

This document locks the canonical binary glyph encoding used by SCX v3 and KUHUL.
It replaces earlier ad-hoc encoders by enforcing explicit type tags, length
prefixes, and deterministic payloads.

## 1) Format Overview

Every glyph is a self-describing record:

```
┌────────┬──────────┬──────────────┐
│ byte 0 │ bytes 1+ │ bytes N+     │
├────────┼──────────┼──────────────┤
│ TYPE   │ LEN(var) │ PAYLOAD      │
└────────┴──────────┴──────────────┘
```

* **TYPE**: 1 byte opcode.
* **LEN**: unsigned varint length of payload.
* **PAYLOAD**: type-specific body.

### 1.1 Type Opcodes (Frozen)

```
0x01  SYMBOL
0x02  TENSOR_INT8
0x03  NGRAM_BITMASK
0x04  GRAPH_ADJ
0x05  SCX_OPSEQ
```

## 2) Glyph Types (Canonical)

### 2.1 SYMBOL glyph (0x01)

**Use:** SCX primitives, operators, clusters.

```
PAYLOAD = UTF-8 bytes
```

Example:

```
↯ → [01][03][E2 86 AF]
```

### 2.2 TENSOR_INT8 glyph (0x02)

**Use:** Phi/Qwen/MX2LM weights with deterministic dequantization.

```
PAYLOAD =
  rank      : u8
  shape     : u16 × rank (little-endian)
  scale     : f32 (little-endian)
  data      : int8[]
```

**Notes**
* **int8 means 1 byte per value**. No int16 writes.
* `scale` is required for dequantization and deterministic replay.

### 2.3 NGRAM_BITMASK glyph (0x03)

**Use:** Supgrams, prompt tapes, intent matching.

```
PAYLOAD =
  token_count : u8
  bitmask     : u8
  confidence  : u8
```

Total payload size: **3 bytes**.

### 2.4 GRAPH_ADJ glyph (0x04)

**Use:** XCFE / KUHUL control flow.

```
PAYLOAD =
  node_count : u8
  rows       : u8[node_count]   // adjacency bitmasks
```

Each node has **8 outgoing edges max** via a bitmask.

### 2.5 SCX_OPSEQ glyph (0x05)

**Use:** compiled SCX command streams.

```
PAYLOAD =
  opcode_count : u8
  opcodes      : u8[]
```

## 3) Reference Encoder (Node / Browser)

```js
export const GlyphType = {
  SYMBOL: 0x01,
  TENSOR_INT8: 0x02,
  NGRAM: 0x03,
  GRAPH: 0x04,
  OPSEQ: 0x05
};

export function encodeVarint(n) {
  const out = [];
  while (n > 0x7f) {
    out.push((n & 0x7f) | 0x80);
    n >>= 7;
  }
  out.push(n);
  return Uint8Array.from(out);
}

export function glyph(type, payload) {
  const len = encodeVarint(payload.length);
  return Uint8Array.from([type, ...len, ...payload]);
}
```

## 4) Tensor Encoder (INT8)

```js
export function tensorInt8(shape, scale, data) {
  const rank = shape.length;
  const header = new Uint8Array(1 + rank * 2 + 4);
  header[0] = rank;

  let o = 1;
  for (const d of shape) {
    header[o++] = d & 0xff;
    header[o++] = d >> 8;
  }

  new DataView(header.buffer).setFloat32(o, scale, true);

  return glyph(
    GlyphType.TENSOR_INT8,
    Uint8Array.from([...header, ...data])
  );
}
```

## 5) Packed Brain File (SCX-BRAIN-BIN)

A brain file is simply:

```
[GLYPH][GLYPH][GLYPH]...
```

* Order is execution order.
* No index required.
* Deterministic by construction.

## 6) Implementation Notes

* **No implicit decoding heuristics.** Always read `TYPE` and `LEN`.
* UTF-8 symbols are supported, but **must be length-prefixed**.
* The format is compatible with SIMD/WASM decoding and proof-friendly hashing.
