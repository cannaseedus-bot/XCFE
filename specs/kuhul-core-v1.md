# KUHUL-CORE v1 (LOCKED)

This section defines **the executable substrate** of XJSON brains.

Everything else (SCXQ2, ZK, federation, UI) **depends on this**.

---

## 1. KUHUL Bytecode Interpreter (KBI-1)

### 1.1 Execution Model

KUHUL is a **deterministic graph VM**.

There are **no stacks**, no recursion, no hidden state.

Execution is:

```
SEED → GRAPH WALK → OPS → TENSOR READS → SCORE → EMIT
```

---

### 1.2 Runtime State

```rust
struct KuhulVM {
    pc: NodeId,                    // current node
    energy: f32,                   // walk budget
    visited: SmallBitSet,          // cycle control
    score: f32,                    // accumulated relevance
}
```

No mutation during inference.
Mutation only happens during **Prompt Tape application**.

---

## 2. Graph Walk (Inference Core)

### 2.1 Node Structure

```rust
struct Node {
    id: NodeId,
    edges: Vec<Edge>,              // weighted, directed
    ops: OpSeqId,                  // optional
    tensor: Option<TensorRef>,     // optional
}
```

---

### 2.2 Edge Structure

```rust
struct Edge {
    target: NodeId,
    weight: i16,      // signed, normalized
    lane: u8,         // SCXQ2 lane
}
```

---

### 2.3 Walk Algorithm (Canonical)

```text
while energy > 0:
    choose edge with max(weight * novelty_penalty)
    pc = edge.target
    energy -= cost(edge)
    score += edge.weight
    execute ops at pc (if any)
```

Rules:

- **No backtracking**
- **No randomness**
- **No beam search**
- Deterministic ordering on ties

This makes inference **provable**.

---

## 3. Tensor Ops (Read-Only at Inference)

### 3.1 Tensor Format

INT8 tensors with scale (already locked earlier):

```rust
struct Tensor {
    shape: Vec<u16>,
    scale: f32,
    data: Vec<i8>,
}
```

---

### 3.2 Supported Ops (v1)

| Op    | Description                    |
| ----- | ------------------------------ |
| DOT   | dot(node.tensor, query.tensor) |
| COS   | cosine similarity              |
| NORM  | L2 norm                        |
| SCALE | scalar multiply                |

No matmul.
No gradients.
No mutation.

---

## 4. OPSEQ Execution (SCX_OPSEQ)

OPSEQ is **bytecode**, not syntax.

```rust
enum Op {
    ReadTensor,
    Dot,
    Scale,
    Accumulate,
    Halt,
}
```

Execution:

- Linear
- No jumps
- No loops
- Max 255 ops

This is **deliberately constrained**.

---

## 5. Prompt Tape v1 (LEARNING INPUT)

### 5.1 Tape Definition

```json
{
  "tape_id": "prompt_2026_01_21_001",
  "hash": "blake3:…",
  "author": "user",
  "policy": "default",
  "ngrams": [...],
  "edges": [...],
  "timestamp": 18900000123
}
```

Tapes are:

- Immutable
- Replayable
- Ordered
- Hash-addressed

---

## 6. Supgram Stabilization Rules (CRITICAL)

Supgrams are **not arbitrary**.

A supgram forms **iff all conditions hold**:

1. Appears in ≥ **K tapes**
2. Appears in ≥ **M distinct contexts**
3. Edge entropy < **ε**
4. No policy violation

Formal rule:

```text
supgram(g) ⇔
  freq(g) ≥ K
  ∧ contexts(g) ≥ M
  ∧ H(edges(g)) < ε
```

Once stabilized:

- Converted to a **node**
- Child grams become edges
- Confidence frozen

This prevents hallucination.

---

## 7. Learning = Edge Mutation Only

There are **no weight tensors updated**.

Learning applies **edge deltas**:

```rust
struct EdgeDelta {
    from: NodeId,
    to: NodeId,
    delta: i16,
    lane: u8,
}
```

Application rule:

```
edge.weight += delta
clamp(weight)
```

That’s it.

This is why:

- Rollback is trivial
- ZK proofs are possible
- Federation works

---

## 8. Rollback / Pruning

Because tapes are immutable:

### 8.1 Rollback

```text
brain_state = replay(tapes[0..N-1])
```

No snapshots required.

---

### 8.2 Pruning

Policies may mark tapes as:

- expired
- revoked
- sandboxed

Pruned tapes are skipped during replay.

---

## 9. CRDT Merge (Federation Core)

Brains merge by **tape union**, not state union.

### 9.1 Merge Rule

```text
MergedBrain.tapes =
  A.tapes ∪ B.tapes
  ordered by (timestamp, hash)
```

Edge conflicts resolve via:

- Deterministic order
- Signed deltas
- Lane priority

This is a **convergent replicated data type**.

---

## 10. Why This Is Stable

| Feature   | Property      |
| --------- | ------------- |
| Inference | Deterministic |
| Learning  | Append-only   |
| Rollback  | Free          |
| Merge     | CRDT-safe     |
| ZK proofs | Feasible      |
| SIMD      | Friendly      |
| WASM      | Native        |

Nothing here contradicts:

- SCXQ2
- KGB-ZK
- Prompt streaming
- Browser SW execution

---

## 11. Minimal CLI Wiring (Canonical)

```bash
xjson prompt add ./data.txt
xjson prompt stream stdin
xjson brain infer "explain tensors"
xjson brain rollback --to tape_42
xjson brain merge A.bin B.bin -o C.bin
```

Each command maps **directly** to the structures above.

---

## 12. What Is Now Frozen

You can treat these as **final v1**:

- KUHUL bytecode semantics
- Graph walk inference
- OPSEQ execution
- Prompt Tape v1
- Supgram stabilization
- Edge-only learning
- CRDT merge

No rework required.
