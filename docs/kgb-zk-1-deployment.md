# KGB-ZK-1 Deployment — On-Chain, Browser, Visualization, Trust, Security

## 1) On-Chain Verifier (Base / L2)

### 1.1 Design Goals (Normative)

The on-chain verifier MUST:

1. Verify **recursive KGB-ZK-1 aggregate proofs**
2. Accept **one proof → many brains**
3. Be deterministic, replay-safe, and gas-bounded
4. Never see paths, edges, weights, or topology

The chain only sees **commitments**.

### 1.2 On-Chain State Model

```solidity
struct BrainAggregate {
    bytes32 agg_brain_hash;
    bytes32 agg_path_commit;
    bytes32 agg_ops_commit;
    uint8   domain;
    uint8   version; // MUST be 1
}
```

### 1.3 Solidity Verifier Contract (Skeleton)

```solidity
pragma solidity ^0.8.20;

interface IZKVerifier {
    function verify(bytes calldata proof, bytes calldata publicInputs)
        external
        view
        returns (bool);
}

contract KGBZKVerifier {
    IZKVerifier public verifier;

    event ProofAnchored(
        bytes32 agg_brain_hash,
        bytes32 agg_path_commit,
        bytes32 agg_ops_commit,
        uint8 domain
    );

    constructor(address _verifier) {
        verifier = IZKVerifier(_verifier);
    }

    function verifyAndAnchor(
        bytes calldata proof,
        bytes calldata publicInputs,
        BrainAggregate calldata agg
    ) external {
        require(agg.version == 1, "Bad version");

        bool ok = verifier.verify(proof, publicInputs);
        require(ok, "Invalid ZK proof");

        emit ProofAnchored(
            agg.agg_brain_hash,
            agg.agg_path_commit,
            agg.agg_ops_commit,
            agg.domain
        );
    }
}
```

## 2) Browser WASM Verifier

### 2.1 Responsibilities

The browser verifier MUST:

1. Verify single proofs and recursive aggregates
2. Match on-chain verification logic
3. Run fully offline
4. Support Service Worker + WASM SIMD

### 2.2 WASM Interface

```ts
export interface KGBZKVerifier {
  verify(
    proof: Uint8Array,
    publicInputs: Uint8Array
  ): boolean;

  extractCommitments(
    proof: Uint8Array
  ): {
    brain_hash: Uint8Array;
    path_commit: Uint8Array;
    ops_commit: Uint8Array;
    domain: number;
  };
}
```

### 2.3 Verification Flow (Browser)

```
SCXQ2.bin
   ↓
decode lanes (SIMD)
   ↓
extract proof
   ↓
WASM verify
   ↓
✔ legal
✖ illegal
```

## 3) SVG Proof-Path Visualization (Revealed vs Hidden)

### 3.1 Visualization Layers

| Layer        | Visible | Meaning     |
| ------------ | ------- | ----------- |
| Nodes        | ❌       | Never shown |
| Edges        | ❌       | Never shown |
| Steps        | ⚠️      | Count only  |
| Proof path   | ✅       | Abstract    |
| Hidden steps | ▒       | Obfuscated  |

### 3.2 SVG Data Model

```json
{
  "proof_id": "0xabc...",
  "domain": "infer",
  "path_length": 42,
  "revealed": [0, 5, 12, 30],
  "hidden": true
}
```

### 3.3 SVG Rendering Rules

* Revealed steps: bright, labeled by **ordinal only**
* Hidden steps: dashed, uniform opacity
* No identifiers, no topology hints

### 3.4 SVG Example (Conceptual)

```svg
<svg>
  <line x1="0" x2="100" class="hidden"/>
  <circle cx="20" cy="50" class="revealed"/>
  <circle cx="80" cy="50" class="revealed"/>
</svg>
```

## 4) Federated Trust Weighting

### 4.1 Trust Vector Model

```json
{
  "brain_hash": "0x...",
  "trust": 0.87
}
```

Weights are:

* off-chain computed
* on-chain referenced
* browser enforced

### 4.2 Weighted Aggregation Rule

```
agg_weight = Σ(trust_i × proof_valid_i) / Σ(trust_i)
```

Where:

* `proof_valid_i ∈ {0,1}`
* invalid proofs contribute **zero**

### 4.3 ZK-Compatible Rule

Trust weights are **NOT inside the proof**. They are applied during aggregation selection and UI projection, preserving proof portability.

## 5) Formal Security Proof (Paper-Grade Outline)

### Theorem 1 — Soundness

> If a KGB-ZK-1 proof verifies, then the underlying graph walk obeys all KGB-1 legality constraints.

**Proof Sketch**

1. The circuit enforces sorted ops, forbidden opcode exclusion, and canonical hashing.
2. Any illegal operation violates a constraint.
3. Constraint violation ⇒ proof invalid.
4. Therefore, verified proof ⇒ legal walk.

### Theorem 2 — Zero-Knowledge

> A verifier learns nothing about the graph structure beyond the declared commitments.

**Proof Sketch**

1. Only hash commitments are public.
2. Hashes are preimage-resistant.
3. No auxiliary leakage channels exist.
4. Commitments are indistinguishable from random.

### Theorem 3 — Aggregation Safety

> Recursive aggregation preserves soundness and zero-knowledge.

**Proof Sketch**

1. Each child proof is verified independently.
2. Aggregation hashes only commitments.
3. Sorting removes order information.
4. No child witness data enters parent circuit.

### Theorem 4 — Replay Safety

> Proofs cannot be reused to authorize different executions.

**Proof Sketch**

1. Proofs bind to `brain_hash`.
2. Any mutation changes commitments.
3. Commitments are domain-scoped.
4. Replay across brains invalidates checks.
