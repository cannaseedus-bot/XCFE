# Full Brain Sync + Explicit Merge (Canonical)

## 1. Canonical Rule (Frozen)

**Federation transport = whole-brain transfer only.**

- `brain.scxq2.bin` is the **atomic unit**
- Sync = **send → verify → mount**
- Merge is **explicit**, never implicit
- Deltas are *derived artifacts*, not transport primitives

This matches:

- XJSON single-file identity
- Proof-carrying inference
- Auditability
- Reproducibility

---

## 2. Runtime Semantics (Authoritative)

### 2.1 Transport

- WebRTC DataChannel
- Chunked binary
- Hash verified (`sha256`)
- No partial application

### 2.2 Receipt

On receive:

1. Verify hash
2. Cache as immutable artifact
3. Register as **federated brain**
4. Do **not** mutate local brain

```text
local_brain.scxq2.bin      (active)
peerA_brain.scxq2.bin     (overlay)
peerB_brain.scxq2.bin     (overlay)
```

---

## 3. Full-Sync Overlay Rules (Frozen)

| Condition     | Render             |
| ------------- | ------------------ |
| Local brain   | solid stroke       |
| Remote brain  | translucent stroke |
| Overlap       | brighter color     |
| Disagreement  | color separation   |
| High pressure | red heat           |

No merge, no averaging.

---

## 4. Inference in Full-Sync Mode

### Default

```text
infer(local brain)
```

### Optional Compare Mode

```text
infer(local)
infer(peerA)
infer(peerB)
```

Rendered as **parallel animated paths** in SVG.

---

## 5. Proof Semantics (Critical)

Each inference proof binds to:

```json
{
  "brain_hash": "sha256:…",
  "path_hash": "blake3:…",
  "legal": true
}
```

This guarantees:

- proofs are **brain-specific**
- federation does **not** invalidate proofs
- on-chain anchoring stays correct

---

## 6. Explicit Merge Tool (Deterministic)

### 6.1 Merge Semantics

A merge is a **pure function**:

```
merge : Brain × Brain → Brain
```

- Inputs are **immutable**
- Output is a **new brain**
- Inputs remain valid and unchanged
- Merge is **explicit and opt-in**

### 6.2 What Gets Merged

#### Grams

- **Union by hash / text**
- Stable ID reassignment in output
- No deletions

#### Edges

- Union by `(from, to)`
- Weight merge rule (monotonic, bounded):

```
w_merge = wA + wB − (wA × wB)
```

Properties:

- Commutative
- Associative
- Bounded in [0,1]
- CRDT-safe

#### Paths / Proofs

- **NOT merged**
- Output brain starts with empty PATH / PROOF lanes

### 6.3 Non-Merged Components

- Runtime heat
- Path history
- Proof history
- Federation metadata

### 6.4 CLI Contract

```bash
brain merge A.scxq2.bin B.scxq2.bin -o C.scxq2.bin
```

Optional flags (future-safe, ignored if absent):

```bash
--trust A=1.0 B=0.8
--label "merged-brain"
```

---

## 7. Safety & Audit Guarantees

After merge:

- `hash(A)` unchanged
- `hash(B)` unchanged
- `hash(C)` new, unique
- Merge is **replayable**
- No side effects
- Proofs from A/B remain valid **only** for A/B

---

## 8. Visual Integration (Federation → Merge)

1. Federation overlay shows differences
2. User clicks **“Merge Selected Brains”**
3. Tool runs `brain merge`
4. New brain appears as selectable artifact
5. Old brains remain available

No silent state change.
