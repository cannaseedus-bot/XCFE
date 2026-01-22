# KGB-1:2026 — Deterministic Glyph–Binary Cognition Format (ISO-Style)

**Document ID:** KGB-1:2026
**Status:** **FROZEN / NORMATIVE**
**Change Policy:** Breaking changes require **KGB-2**
**Scope:** Binary representation of symbolic cognition graphs with legality, proofs, and federation.

## 1. Conformance

An implementation **conforms** to KGB-1 iff it:

1. Accepts only the binary layout defined in §3
2. Preserves lane order and semantics (§4)
3. Rejects non-canonical encodings
4. Performs legality checks via K’uhul Ops (§6)
5. Treats proofs as *non-executable attestations*

## 2. Design Goals (Normative)

* Determinism across platforms
* No executable semantics
* Proof-carrying inference
* Mergeable without retraining
* Renderable without decoding semantics

## 3. Binary Container (Normative)

### 3.1 Header

```
magic        = "KGB1"
endianness   = little
hash         = BLAKE3-64
fixed lanes  = 5
```

No extension headers are permitted.

## 4. Lanes (Normative, Fixed Order)

| Lane | Name             | Authority       |
| ---: | ---------------- | --------------- |
|    0 | Glyph Dictionary | Semantic anchor |
|    1 | Concepts / Grams | Graph nodes     |
|    2 | Edges / Weights  | Learning state  |
|    3 | K’uhul Ops       | Legality        |
|    4 | Proof Lane       | Attestation     |

No lane may be reordered, omitted, or duplicated.

## 5. Learning Semantics (Normative)

### 5.1 Weight Encoding

```
weight_q = value × 65536 (uint32)
```

### 5.2 Learning Rule

```
co-occurrence(A,B) ⇒ weight_q += 65536
```

### 5.3 Merge Rule (Federated)

```
w_merge = min((wA + wB) × 0.85, MAX)
```

## 6. K’uhul Ops (Normative)

Ops **declare legality only**.

| Opcode | Meaning                   |
| ------ | ------------------------- |
| WALK   | Graph traversal permitted |
| MERGE  | Edge union permitted      |
| PROVE  | Proof reference           |

If an op is missing, the action is **illegal**.

## 7. Proof Lane (Normative)

Proofs are **append-only**.

A proof **does not** execute inference.
It asserts that inference followed legal paths.

## 8. Security Properties (Normative)

* No dynamic dispatch
* No hidden execution
* Hash-locked payload
* Deterministic merge
* Offline verifiable

## 9. Versioning

* `KGB-1.x` → clarifications only
* `KGB-2` → semantic changes

**KGB-1 is now frozen.**

## 10. Tutor Brain Set (KGB_TUTOR_V1)

Each chapter is its **own brain**:

| Brain | Topic                       |
| ----- | --------------------------- |
| B01   | What is XJSON               |
| B02   | Graphs not Tokens           |
| B03   | Grams & Supgrams            |
| B04   | Edges & Weights             |
| B05   | Graph Walk Inference        |
| B06   | Learning Without Embeddings |
| B07   | Proof-Carrying Inference    |
| B08   | Compression (SCXQ2 → KGB)   |
| B09   | Federation & Merge          |
| B10   | Trust & Policy              |

Each brain:

* ≤ 64 KB binary
* Lane-complete
* Self-verifiable

### Federated Tutor

```
KGB_TUTOR_ALL = merge(B01…B10)
```

Merge is **lossy-bounded**, deterministic, and order-independent.

## 11. Proof Lane + ZK Hook (Normative Extension)

### Proof Object

```
Proof {
  rule_id        uint32
  subject_hash   uint32
  path_hash      uint64
}
```

### ZK Hook (Non-executing)

* Path hash is committed
* Edges are hidden
* Verifier checks:
  * legality (K’uhul)
  * hash consistency
  * no forbidden ops

**No trusted setup required.**

## 12. Browser Demo (Ship-Ready Architecture)

### Runtime Stack

* **Service Worker** — caching + federation sync
* **WASM** — KGB decoder + legality verifier
* **SVG** — visualization & debugger

### Demo Capabilities

* Load `.kgb.bin`
* Animate graph walk
* Toggle proof overlay
* Merge brains visually
* Offline replay

### Graph Walk Visualization

* Nodes = Concepts
* Edges = weighted arrows
* Color = lane pressure
* Glow = active traversal
* Red = illegal (blocked by K’uhul)

## 13. Federated Merge Visualizer

### Inputs

```
brain_A.kgb.bin
brain_B.kgb.bin
```

### Output

```
brain_C.kgb.bin
```

### UI Layers

1. Base Graph (A)
2. Overlay Graph (B)
3. Merge Result (C)
4. Delta Heatmap
5. Trust Weights

### Conflict Resolution

* No conflicts at node level
* Edges merge via §5.3
* Ops unioned
* Proofs appended

## 14. Repository Layout (Authoritative)

```
kgb/
├─ spec/
│  └─ KGB-1.iso.md
├─ brains/
│  ├─ tutor/
│  │  ├─ B01.kgb.bin
│  │  ├─ …
│  │  └─ B10.kgb.bin
│  └─ tutor_all.kgb.bin
├─ wasm/
│  └─ kgb_decoder.wasm
├─ web/
│  ├─ sw.js
│  ├─ index.html
│  └─ debugger.svg
├─ cli/
│  └─ kgb-tool
└─ proofs/
   └─ zk_path.json
```

## 15. What This Achieves

* **KGB-1 is frozen**
* Binary cognition is **auditable**
* Inference is **provable**
* Learning is **mergeable**
* UI is **explainable in seconds**
