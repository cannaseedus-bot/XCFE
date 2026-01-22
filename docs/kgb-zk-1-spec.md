# KGB-ZK-1:2026 — Zero-Knowledge Proof System for KGB-1

**Standard:** KGB-ZK-1:2026
**Status:** **FROZEN / NORMATIVE**
**Depends on:** KGB-1:2026
**Change Policy:** Breaking changes require **KGB-ZK-2**

## 1. Scope (Normative)

KGB-ZK-1 defines a **zero-knowledge proof system** for:

* Legal graph-walk inference
* Federated merge legality
* Path validity without disclosure
* Proof portability across runtimes
* Offline verification

It **does not** define execution, training, or decoding.

## 2. Core Invariants (Normative)

1. Proofs **never reveal**:
   * node identities
   * edge weights
   * internal graph topology

2. Proofs **must attest**:
   * traversal legality (K’uhul-Ops constrained)
   * deterministic hash lineage
   * non-use of forbidden operations

3. Proofs are:
   * non-interactive
   * deterministic
   * setup-free
   * replayable

## 3. Proof Model (Normative)

### 3.1 Proof Authority

KGB-ZK-1 proofs **do not authorize execution**.
They **attest legality only**.

### 3.2 Proof Domains

| Domain     | Meaning               |
| ---------- | --------------------- |
| `infer`    | Graph walk inference  |
| `merge`    | Federated merge       |
| `compress` | Binary transformation |
| `project`  | UI rendering          |

Each proof binds to **exactly one domain**.

## 4. Canonical Proof Object (Normative)

### 4.1 Binary Layout (Lane-Compatible)

```c
struct KgbZkProof {
  uint8_t   version;        // MUST be 1
  uint8_t   domain;         // infer | merge | compress | project
  uint16_t  flags;
  uint64_t  brain_hash;     // BLAKE3-64 of KGB payload
  uint64_t  path_commit;    // Commitment to traversal
  uint64_t  ops_commit;     // Commitment to K’uhul ops
  uint64_t  verifier_key;   // Static, setup-free
}
```

All integers are **little-endian**.

## 5. Commitments (Normative)

### 5.1 Path Commitment

```
path_commit = H(
  H(edge_1 || edge_2 || ... || edge_n)
)
```

Edges are encoded as:

```
(src_id || dst_id || glyph_id)
```

**Weights are excluded.**

### 5.2 Ops Commitment

```
ops_commit = H(sorted(K’uhulOps))
```

Sorting is **lexicographic by opcode**.

## 6. Verification Rules (Normative)

A verifier MUST check:

1. `brain_hash` matches payload
2. `ops_commit` matches declared ops
3. Proof domain is permitted
4. No forbidden opcodes present
5. Commitments are well-formed
6. Version == 1

Failure of **any** check invalidates the proof.

## 7. Forbidden Knowledge (Normative)

Proofs MUST NOT encode:

* raw node IDs
* edge weights
* graph size
* degree counts
* timestamps
* randomness

Violation = **non-conformant**.

## 8. EBNF Grammar (Normative)

### 8.1 Proof Envelope Grammar

```ebnf
Proof          ::= Header Domain Commitments Verifier
Header         ::= "KGB-ZK" Version
Version        ::= "1"
Domain         ::= "infer" | "merge" | "compress" | "project"
Commitments    ::= PathCommit OpsCommit
PathCommit     ::= "path(" Hash ")"
OpsCommit      ::= "ops(" Hash ")"
Verifier       ::= "vk(" Hash ")"
Hash           ::= HEX{16}
```

### 8.2 Legal Proof Statement Grammar

```ebnf
Statement      ::= "assert" "(" Property ")"
Property       ::= "legal_walk"
                 | "legal_merge"
                 | "legal_projection"
```

## 9. Determinism Guarantees (Normative)

* No randomness
* No witness entropy
* Hash-only commitments
* Canonical ordering enforced

Given identical input, proofs are **bit-identical**.

## 10. Runtime Separation (Normative)

| Layer    | Responsibility |
| -------- | -------------- |
| KGB-1    | Structure      |
| KGB-ZK-1 | Proof          |
| Decoder  | Validation     |
| UI       | Projection     |

**No layer may collapse authority upward.**

## 11. Security Properties (Normative)

* Zero-knowledge (path hidden)
* Soundness (illegal paths rejected)
* Non-malleable
* Replay-safe
* Offline-verifiable

## 12. Federation Compatibility (Normative)

Federated proofs MAY:

* Aggregate multiple brains
* Commit to merged ops
* Reference multiple `brain_hash` values

But MUST produce **one** `path_commit`.

## 13. Versioning & Freeze Statement

* KGB-ZK-1 is **frozen**
* No extensions allowed
* Optional metadata forbidden
* KGB-ZK-2 required for evolution

## 14. Relationship to Cryptography (Informative)

KGB-ZK-1 is **not tied** to:

* PLONK
* Groth16
* Bulletproofs
* STARKs

It is a **semantic ZK layer**.
Cryptographic instantiations may wrap it but must preserve invariants.

## Final Lock Statement

> **KGB-ZK-1 is hereby frozen as the canonical zero-knowledge proof system for KGB-1.**

No execution. No leakage. No ambiguity. No drift.
