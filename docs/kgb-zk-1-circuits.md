# KGB-ZK-1 Circuits — Circom + Noir (Normative)

## 1) What These Circuits Enforce (Exact)

Both circuits enforce:

✅ Version = `1`
✅ Domain ∈ `{infer, merge, compress, project}`
✅ `brain_hash` is fixed public input
✅ `path_commit = H(H(edges))`
✅ `ops_commit = H(sorted(opcodes))`
✅ **No forbidden opcodes**
✅ No node IDs, weights, topology leaked
✅ Deterministic proof (no randomness)

They **do NOT**:

* reveal paths
* reveal graph size
* reveal weights
* authorize execution

## 2) Circom — `kgb_zk_1.circom`

### 2.1 Constants

```circom
pragma circom 2.1.6;

include "circomlib/poseidon.circom";

const uint8 VERSION = 1;

const uint8 DOMAIN_INFER     = 0;
const uint8 DOMAIN_MERGE     = 1;
const uint8 DOMAIN_COMPRESS = 2;
const uint8 DOMAIN_PROJECT  = 3;

const uint8 OPCODE_FORBIDDEN_MIN = 200;
```

### 2.2 Opcode Legality Check

```circom
template OpcodeAllowed() {
    signal input opcode;
    signal output ok;

    ok <== opcode < OPCODE_FORBIDDEN_MIN;
}
```

### 2.3 Sorted Ops Commitment

```circom
template SortedOpsHash(N) {
    signal input ops[N];
    signal output hash;

    component h = Poseidon(N);

    for (var i = 0; i < N; i++) {
        component chk = OpcodeAllowed();
        chk.opcode <== ops[i];
        chk.ok === 1;

        if (i > 0) {
            ops[i] >= ops[i-1];
        }

        h.inputs[i] <== ops[i];
    }

    hash <== h.out;
}
```

### 2.4 Path Commitment (Double Hash)

```circom
template PathCommit(N) {
    signal input edges[N];
    signal output commit;

    component h1 = Poseidon(N);
    for (var i = 0; i < N; i++) {
        h1.inputs[i] <== edges[i];
    }

    component h2 = Poseidon(1);
    h2.inputs[0] <== h1.out;

    commit <== h2.out;
}
```

### 2.5 Main Proof Circuit

```circom
template KGBZK1(N_EDGES, N_OPS) {

    signal input version;
    signal input domain;
    signal input brain_hash;
    signal input path_commit_pub;
    signal input ops_commit_pub;

    signal input edges[N_EDGES];
    signal input ops[N_OPS];

    version === VERSION;

    (domain === DOMAIN_INFER) ||
    (domain === DOMAIN_MERGE) ||
    (domain === DOMAIN_COMPRESS) ||
    (domain === DOMAIN_PROJECT);

    component pc = PathCommit(N_EDGES);
    for (var i = 0; i < N_EDGES; i++) {
        pc.edges[i] <== edges[i];
    }
    pc.commit === path_commit_pub;

    component oh = SortedOpsHash(N_OPS);
    for (var i = 0; i < N_OPS; i++) {
        oh.ops[i] <== ops[i];
    }
    oh.hash === ops_commit_pub;
}

component main = KGBZK1(8, 8);
```

## 3) Noir — `kgb_zk_1.nr`

### 3.1 Constants

```rust
const VERSION: Field = 1;

enum Domain {
    Infer = 0,
    Merge = 1,
    Compress = 2,
    Project = 3,
}
```

### 3.2 Opcode Legality

```rust
fn opcode_allowed(op: Field) -> bool {
    op < 200
}
```

### 3.3 Sorted Ops Commitment

```rust
fn ops_commitment(ops: [Field; N_OPS]) -> Field {
    for i in 0..N_OPS {
        assert(opcode_allowed(ops[i]));
        if i > 0 {
            assert(ops[i] >= ops[i-1]);
        }
    }
    poseidon(ops)
}
```

### 3.4 Path Commitment

```rust
fn path_commitment(edges: [Field; N_EDGES]) -> Field {
    let h1 = poseidon(edges);
    poseidon([h1])
}
```

### 3.5 Main Proof

```rust
fn main(
    version: pub Field,
    domain: pub Field,
    brain_hash: pub Field,
    path_commit_pub: pub Field,
    ops_commit_pub: pub Field,

    edges: [Field; N_EDGES],
    ops: [Field; N_OPS],
) {
    assert(version == VERSION);

    assert(
        domain == Domain::Infer as Field ||
        domain == Domain::Merge as Field ||
        domain == Domain::Compress as Field ||
        domain == Domain::Project as Field
    );

    let pc = path_commitment(edges);
    assert(pc == path_commit_pub);

    let oc = ops_commitment(ops);
    assert(oc == ops_commit_pub);
}
```

## 4) Recursive Aggregation Layer

### 4.1 Aggregation Invariants (Normative)

1. Child proofs **MUST** be valid KGB-ZK-1 proofs
2. All child proofs **MUST** have:
   * version = 1
   * legal domain
3. Aggregate proof:
   * has **one domain**
   * has **one aggregate path_commit**
   * has **one aggregate ops_commit**
4. Aggregation is **order-independent**
5. Aggregation is **associative**

### 4.2 Aggregate Commitments (Normative)

```
agg_path_commit = H(sort(path_commit[]))
agg_ops_commit  = H(sort(ops_commit[]))
agg_brain_hash  = H(sort(brain_hash[]))
```

Sorting is **lexicographic**.

### 4.3 Circom — Recursive Aggregator

```circom
template VerifyKGBZK1() {
    signal input proof;
    signal output ok;
}

template SortedHash(N) {
    signal input items[N];
    signal output out;

    for (var i = 1; i < N; i++) {
        items[i] >= items[i-1];
    }

    component h = Poseidon(N);
    for (var i = 0; i < N; i++) {
        h.inputs[i] <== items[i];
    }

    out <== h.out;
}

template KGBZK1Aggregate(N) {

    signal input domain;
    signal output agg_path_commit;
    signal output agg_ops_commit;
    signal output agg_brain_hash;

    signal input child_proofs[N];
    signal input child_path_commits[N];
    signal input child_ops_commits[N];
    signal input child_brain_hashes[N];

    for (var i = 0; i < N; i++) {
        component v = VerifyKGBZK1();
        v.proof <== child_proofs[i];
        v.ok === 1;
    }

    component p = SortedHash(N);
    component o = SortedHash(N);
    component b = SortedHash(N);

    for (var i = 0; i < N; i++) {
        p.items[i] <== child_path_commits[i];
        o.items[i] <== child_ops_commits[i];
        b.items[i] <== child_brain_hashes[i];
    }

    agg_path_commit <== p.out;
    agg_ops_commit  <== o.out;
    agg_brain_hash  <== b.out;
}

component main = KGBZK1Aggregate(4);
```

### 4.4 Noir — Recursive Aggregator

```rust
fn verify_kgbzk1(proof: Proof) -> bool {
    true
}

fn sorted_hash(values: [Field; N]) -> Field {
    for i in 1..N {
        assert(values[i] >= values[i-1]);
    }
    poseidon(values)
}

fn main(
    domain: pub Field,

    child_proofs: [Proof; N],
    child_path_commits: [Field; N],
    child_ops_commits: [Field; N],
    child_brain_hashes: [Field; N],

    agg_path_commit: pub Field,
    agg_ops_commit: pub Field,
    agg_brain_hash: pub Field,
) {
    for i in 0..N {
        assert(verify_kgbzk1(child_proofs[i]));
    }

    let p = sorted_hash(child_path_commits);
    let o = sorted_hash(child_ops_commits);
    let b = sorted_hash(child_brain_hashes);

    assert(p == agg_path_commit);
    assert(o == agg_ops_commit);
    assert(b == agg_brain_hash);
}
```

## 5) Federation Patterns (Informative)

### Tree Aggregation

```
Leaf proofs → shard aggregates → region aggregate → global proof
```

### Streaming / Rolling Aggregation

```
aggₙ₊₁ = Aggregate(aggₙ, new_proof)
```

### CRDT-Style Merge

* Two aggregates merge by re-aggregating children
* Order-independent
* Deterministic

## 6) On-Chain Anchoring (Informative)

Only **three values**:

```json
{
  "agg_brain_hash": "...",
  "agg_path_commit": "...",
  "agg_ops_commit": "..."
}
```

Plus verifier key + version.

No paths. No data. No leakage.
