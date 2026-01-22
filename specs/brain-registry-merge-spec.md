# On-Chain Brain Registry + Formal Merge Spec (Canonical)

## PART I — On-Chain Brain Registry (Canonical, Minimal)

### 1. Purpose (Normative)

The **On-Chain Brain Registry** provides:

- **global identity** for executable brains
- **tamper-evident provenance**
- **proof anchoring** without revealing internals
- **federation compatibility** across domains

It **does not** store:

- weights
- edges
- grams
- paths
- proofs

> The chain stores *commitments*, not cognition.

---

### 2. Brain Identity (Authoritative)

Each brain is identified by a **content hash**:

```
brain_id := H(brain.scxq2.bin)
```

Where:

- `H` is a cryptographic hash (SHA-256 or BLAKE3)
- hash covers the **entire binary artifact**
- binary is immutable by law

This satisfies **single-file identity**.

---

### 3. Registry Contract (Minimal ABI)

#### 3.1 Data Model

```solidity
struct BrainRecord {
  bytes32 brainHash;        // hash of SCXQ2 binary
  address registrant;       // who registered it
  uint64 timestamp;         // block time
  bytes32 parentA;          // optional merge parent
  bytes32 parentB;          // optional merge parent
}
```

---

#### 3.2 Interface (Solidity)

```solidity
interface IBrainRegistry {

  event BrainRegistered(
    bytes32 indexed brainHash,
    address indexed registrant,
    bytes32 parentA,
    bytes32 parentB
  );

  function registerBrain(
    bytes32 brainHash,
    bytes32 parentA,
    bytes32 parentB
  ) external;

  function getBrain(bytes32 brainHash)
    external
    view
    returns (BrainRecord memory);
}
```

---

### 4. Registration Semantics (Frozen Law)

#### 4.1 Base Brain

```
parentA = 0x0
parentB = 0x0
```

Meaning: **original cognition artifact**

---

#### 4.2 Merged Brain

```
parentA = hash(A)
parentB = hash(B)
```

Meaning: **explicit merge lineage**

This creates an **on-chain cognition DAG**.

---

### 5. Security Properties

| Property     | Guaranteed             |
| ------------ | ---------------------- |
| Immutability | hash-bound             |
| Attribution  | registrant address     |
| Lineage      | parent hashes          |
| Auditability | public chain           |
| Privacy      | zero contents revealed |

No trusted setup.
No permissions.
No governance required.

---

### 6. Proof Anchoring (Optional, Compatible)

Inference proofs can reference:

```json
{
  "brain_hash": "0xabc...",
  "proof_hash": "0xdef...",
  "block": 19283741
}
```

The chain confirms:

- the brain existed
- before or at proof time

That’s enough.

---

## PART II — Paper-Grade Formal Merge Specification

### 1. Definitions

#### Definition 1 (Brain)

A **brain** is a finite labeled directed graph:

```
B := (G, E)
```

Where:

- `G` is a finite set of grams
- `E ⊆ G × G × [0,1]` is a weighted edge relation

---

#### Definition 2 (Gram)

A **gram** is a tuple:

```
g := (type, label)
```

Where:

- `type ∈ {unigram, bigram, trigram, supgram, control}`
- `label ∈ UTF-8*`

---

#### Definition 3 (Edge Weight)

Edge weights are real values in `[0,1]` representing transition strength.

---

### 2. Merge Operator

#### Definition 4 (Merge)

The **merge operator** is a function:

```
⊕ : B × B → B
```

Such that:

```
B₃ = B₁ ⊕ B₂
```

---

### 3. Gram Merge Rule (Normative)

Let:

```
G₃ = G₁ ∪ G₂
```

Where equality is defined by `(type, label)`.

No gram is deleted.
No gram is duplicated.

---

### 4. Edge Merge Rule (Normative)

For any ordered pair `(gᵢ, gⱼ)`:

Let:

- `w₁` be the weight in `B₁` (or 0 if absent)
- `w₂` be the weight in `B₂` (or 0 if absent)

Then the merged weight is:

```
w₃ := w₁ + w₂ − (w₁ × w₂)
```

---

#### Lemma 1 (Boundedness)

```
0 ≤ w₃ ≤ 1
```

---

#### Lemma 2 (Commutativity)

```
w₁ ⊕ w₂ = w₂ ⊕ w₁
```

---

#### Lemma 3 (Associativity)

```
(w₁ ⊕ w₂) ⊕ w₃ = w₁ ⊕ (w₂ ⊕ w₃)
```

---

#### Corollary

The merge operator is **CRDT-safe**.

---

### 5. Non-Merged Components (Invariant)

The following are **not merged**:

- inference paths
- execution proofs
- heat / entropy traces
- runtime state

These components are **brain-specific** by law.

---

### 6. Determinism Theorem

#### Theorem 1 (Deterministic Merge)

Given identical inputs `B₁`, `B₂`:

```
B₁ ⊕ B₂
```

produces a **unique output brain** independent of execution order or environment.

---

### 7. Lineage Preservation

Each merged brain `B₃` MUST record:

```
parents(B₃) = {hash(B₁), hash(B₂)}
```

This enables:

- replay
- audit
- attribution
- on-chain anchoring

---

### 8. Safety Guarantees

| Property           | Status |
| ------------------ | ------ |
| No data loss       | ✔      |
| No hidden mutation | ✔      |
| Replayable         | ✔      |
| Auditable          | ✔      |
| Federatable        | ✔      |
