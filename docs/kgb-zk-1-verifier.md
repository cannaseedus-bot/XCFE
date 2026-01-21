# KGB-ZK-1 Verifier Bundle — On-Chain, Browser, CRDT, Policy

> **Note:** This document is normative unless marked otherwise.

## 1) On-Chain Verifier (PLONK / Halo2 Backend)

### 1.1 Public Inputs Layout

```solidity
struct KGBPublicInputs {
    bytes32 agg_brain_hash;
    bytes32 agg_path_commit;
    bytes32 agg_ops_commit;
    uint8   domain;
    uint8   version; // MUST == 1
}
```

### 1.2 Verifier Interface

```solidity
interface IPlonkVerifier {
    function verifyProof(
        bytes calldata proof,
        uint256[] calldata publicSignals
    ) external view returns (bool);
}
```

### 1.3 KGB On-Chain Verifier Contract (Skeleton)

```solidity
pragma solidity ^0.8.20;

contract KGBZKAnchor {
    IPlonkVerifier public verifier;

    event Anchored(
        bytes32 agg_brain_hash,
        bytes32 agg_path_commit,
        bytes32 agg_ops_commit,
        uint8 domain
    );

    constructor(address _verifier) {
        verifier = IPlonkVerifier(_verifier);
    }

    function anchor(
        bytes calldata proof,
        KGBPublicInputs calldata pub
    ) external {
        require(pub.version == 1, "KGB: bad version");

        uint256[] memory signals = new uint256[](4);
        signals[0] = uint256(pub.agg_brain_hash);
        signals[1] = uint256(pub.agg_path_commit);
        signals[2] = uint256(pub.agg_ops_commit);
        signals[3] = uint256(pub.domain);

        require(
            verifier.verifyProof(proof, signals),
            "KGB: invalid proof"
        );

        emit Anchored(
            pub.agg_brain_hash,
            pub.agg_path_commit,
            pub.agg_ops_commit,
            pub.domain
        );
    }
}
```

## 2) Browser Verifier Bundle (WASM + SVG)

### 2.1 WASM Verifier Interface

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

### 2.2 SVG Proof Visualization Model

```json
{
  "path_length": 61,
  "revealed_steps": [0, 7, 23, 60],
  "hidden": true
}
```

**Rendering rule:** Ordinal-only, no node IDs, no topology hints.

## 3) Federated CRDT Merge Spec (Formal)

### 3.1 Object Type

```text
KGB-Aggregate = {
  brain_hashes: set<hash>,
  path_commits: set<hash>,
  ops_commits:  set<hash>
}
```

### 3.2 Merge Rule

```text
merge(A, B) =
  (
    A.brain_hashes ∪ B.brain_hashes,
    A.path_commits ∪ B.path_commits,
    A.ops_commits  ∪ B.ops_commits
  )
```

### 3.3 Deterministic Collapse

```text
final_path = H(sort(path_commits))
final_ops  = H(sort(ops_commits))
final_brain= H(sort(brain_hashes))
```

Properties: commutative, associative, idempotent.

## 4) Enterprise Policy DSL Bound to Proofs

### 4.1 Policy Grammar (EBNF)

```ebnf
Policy      ::= Rule+
Rule        ::= "allow" Domain "if" Condition
Domain      ::= "infer" | "merge" | "compress"
Condition   ::= "proof_valid"
              | "brain_trusted"
              | "federation_size" Comparator Number
Comparator  ::= ">" | "<" | ">=" | "<="
```

### 4.2 Example Policy

```text
allow infer if proof_valid
allow merge if proof_valid and federation_size >= 3
```

### 4.3 Enforcement Points

* Browser: before inference
* Server: before aggregation
* Chain: before anchoring

Policy **never enters the ZK circuit**.
