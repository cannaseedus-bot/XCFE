# XJSON Prompt Tape v1 — Normative Specification

**Status:** FROZEN (v1)  
**Scope:** Prompt ingestion, stabilization, policy, rollback  
**Non-goals:** Neural weights, attention, runtime execution

---

## 1. Prompt Tape v1 — Canonical Schema

File: `prompt-tape.v1.xjson`

```json
{
  "@schema": "xjson://schema/prompt-tape/v1",
  "@type": "prompt_tape",

  "tape": {
    "id": "pt_2026_01_21_0001",
    "parent": null,
    "created_at": "2026-01-21T12:44:02Z",
    "source": {
      "actor": "user",
      "origin": "cli|api|ui",
      "session": "sess_hash"
    },
    "hash": "sha256:…",
    "size": {
      "bytes": 183402,
      "tokens": 42117
    }
  },

  "content": {
    "encoding": "utf-8|binary",
    "raw_ref": "blob://content/sha256:…"
  },

  "grams": {
    "order_max": 6,
    "unigrams": [{ "id": "g:u:json", "count": 418 }],
    "ngrams": [
      {
        "id": "g:n:json-schema",
        "order": 2,
        "count": 73
      }
    ]
  },

  "edges": [
    {
      "from": "g:u:json",
      "to": "g:n:json-schema",
      "weight": 0.42,
      "type": "cooccurrence"
    }
  ],

  "supgrams": {
    "candidates": [
      {
        "id": "sg:json_model_manifest",
        "members": ["g:n:json-schema", "g:n:manifest"],
        "score": 0.91
      }
    ],
    "accepted": []
  },

  "delta": {
    "nodes_added": 184,
    "edges_added": 762,
    "edges_updated": 194
  },

  "policy": {
    "applied": [],
    "decision": "pending"
  },

  "proof": {
    "present": false
  },

  "status": "active|pruned|rolled_back"
}
```

### Invariants

* Tapes are **immutable**
* Graph mutation happens **only via `delta`**
* Raw content is never reloaded after gram extraction
* All effects are **replayable**

---

## 2. Supgram Stabilization Rules (Formal)

Supgrams are **structural motifs**, not clusters.

### 2.1 Candidate Formation

A supgram candidate `S` is formed when:

```
∀ gᵢ ∈ S:
  cooccur(gᵢ, gⱼ) ≥ θ₁
AND
  entropy(S) ≤ θ₂
AND
  support(S) ≥ θ₃
```

### 2.2 Stability Window

A candidate becomes **accepted** only if:

```
present_in ≥ K distinct tapes
AND
age ≥ Δt
AND
Δweight ≤ ε across last N tapes
```

### 2.3 Promotion Rule

```text
candidate → accepted
accepted → immutable node
```

Accepted supgrams:

* Become first-class graph nodes
* Can be referenced by policy
* Cannot be deleted (only deprecated)

### 2.4 Rejection / Decay

Candidates decay if:

```
support < θ₃ for M consecutive tapes
```

---

## 3. Prompt Tape Policy DSL (Per-Tape)

File: `policy.prompt.xpl` (XJSON Policy Language)

### Grammar (EBNF)

```
policy      ::= rule+
rule        ::= "allow" | "deny" | "cap" | "require"
condition   ::= expr
expr        ::= metric comparator value
metric      ::= "tokens" | "entropy" | "domain" | "source"
```

### Example Policies

#### Token Cap

```xpl
cap tokens <= 50000
```

#### Domain Restriction

```xpl
deny domain == "pii"
```

#### Structural Requirement

```xpl
require supgram "json_schema"
```

#### Enterprise Gate

```xpl
allow if proof.present == true
```

### Policy Resolution

Policies evaluate **before merge**.

Outcomes:

* `accept`
* `quarantine`
* `reject`

---

## 4. Prompt Rollback & Pruning (Deterministic)

### Rollback

Rollback does **not delete** tapes.

It applies the inverse delta:

```text
graph_state(n) − delta(tape_k)
```

Command:

```bash
xjson prompt rollback pt_2026_01_21_0001
```

### Pruning

Pruning:

* Removes tape from future inference
* Keeps tape for audit

```bash
xjson prompt prune --older-than 90d
```

### Guarantees

* Rollback is O(|Δ|)
* No global recompute
* Hash chain preserved

---

## 5. CLI Wiring (Authoritative)

### Add Prompt

```bash
xjson prompt add ./docs/*.md \
  --policy policy.prompt.xpl \
  --ngram-max 6 \
  --supgram auto
```

### Inspect Tape

```bash
xjson prompt show pt_2026_01_21_0001
```

### List Tapes

```bash
xjson prompt list --status active
```

### Rollback

```bash
xjson prompt rollback pt_2026_01_21_0001
```

### Prune

```bash
xjson prompt prune --policy enterprise-default
```

---

## 6. How Inference Sees This (Important)

Inference **never sees prompts**.

It sees:

* Nodes
* Edges
* Supgrams
* Weights

Prompt size is irrelevant after ingestion.

---

## 7. One-paragraph mental model (for Codex / docs)

> Prompting in XJSON is not inference input. It is dataset compilation. Each prompt becomes an immutable tape that contributes structural deltas to a graph brain. Inference operates solely on stabilized grams and supgrams, making prompt size unbounded, learning deterministic, and provenance complete.

---

## 8. Prompt Tape → SCXQ2 Pipeline (v1)

**Status:** FROZEN  
**Applies to:** Prompt Tape v1 → Brain Graph

### 8.1 SCXQ2 Lane Mapping (Authoritative)

| SCXQ2 Lane | Contents                             |
| ---------- | ------------------------------------ |
| **DICT**   | Gram IDs, Supgram IDs, Policy IDs    |
| **FIELD**  | Counts, entropy, support, timestamps |
| **EDGE**   | (from, to, weight, type)             |
| **LANE**   | Tape-local deltas                    |
| **PROOF**  | ZK commitments (optional)            |
| **META**   | Hashes, parent tape refs             |

### 8.2 Binary Record Format (Little-Endian)

```text
[TAPE_HEADER]
  u32 magic = 0x58504C54   // "XPLT"
  u16 version = 1
  u64 tape_id_hash
  u64 parent_hash
  u64 created_at

[DICT_LANE]
  u32 count
  repeated {
    u64 gram_id
    u8  type  // unigram, ngram, supgram
  }

[FIELD_LANE]
  repeated {
    u64 gram_id
    f32 count
    f32 entropy
  }

[EDGE_LANE]
  repeated {
    u64 from
    u64 to
    f32 weight
    u8  edge_type
  }

[DELTA_LANE]
  u32 nodes_added
  u32 edges_added
  u32 edges_updated

[POLICY_LANE]
  u64 policy_hash
  u8  decision

[PROOF_LANE] (optional)
  opaque bytes

[FOOTER]
  u64 scxq2_hash
```

### Invariants

* Append-only
* SIMD-aligned (16-byte blocks)
* Zero JSON at runtime

---

## 9. Supgram Visual Debugger (SVG Spec)

### 9.1 Graph Projection Rules

* **Node radius** = log(support)
* **Color** = entropy band
* **Edge thickness** = weight
* **Supgrams** = hull overlays

### 9.2 SVG Layering

```text
<svg>
  <g id="lanes">
    <g id="lane-unigram"/>
    <g id="lane-ngram"/>
    <g id="lane-supgram"/>
  </g>

  <g id="edges"/>

  <g id="supgram-hulls"/>

  <g id="heatmap">
    <!-- SCXQ2 compression pressure -->
  </g>
</svg>
```

### 9.3 Interaction

* Hover → show tape provenance
* Toggle → show/hide candidate vs accepted supgrams
* Time slider → tape-by-tape evolution

---

## 10. Policy → ZK-Enforced Proofs

### 10.1 What Gets Proven

Policies are enforced **without revealing content**.

Examples:

* Token cap respected
* Domain exclusions respected
* Required supgrams present
* Entropy bounds satisfied

### 10.2 Proof Statement (Abstract)

```
∃ tape T, graph G :
  hash(T) = H
∧ policy(P) == true
∧ Δ(G) derived only from T
```

### 10.3 Circuit Inputs

| Type             | Visibility |
| ---------------- | ---------- |
| Tape hash        | public     |
| Policy hash      | public     |
| Gram counts      | private    |
| Supgram presence | private    |
| Decision         | public     |

### 10.4 Output

```json
{
  "proof_type": "KGB-ZK-1",
  "policy_hash": "0x…",
  "tape_hash": "0x…",
  "decision": "accept",
  "proof": "opaque"
}
```

---

## 11. Federated Prompt Tape Sharing

### 11.1 Tape Federation Rules

* Tapes are **CRDT-mergeable**
* Merge = union of deltas
* Conflicts resolved by:
  1. Tape hash order
  2. Policy precedence
  3. Supgram immutability

### 11.2 Federation Envelope

```json
{
  "tape_id": "pt_…",
  "origin_brain": "brain_A",
  "scxq2_bin": "hash://…",
  "policy_proof": "hash://…",
  "trust_weight": 0.92
}
```

### 11.3 Merge Algorithm

```
for each incoming tape:
  verify proof
  check policy compatibility
  apply delta
  recompute supgram stability window
```

---

## 12. Prompt Streaming Ingestion

### 12.1 Streaming Model

Prompts can be **unbounded**.

Pipeline:

```
stream → chunk → grams → delta → SCXQ2 append
```

No buffering of raw content after gram extraction.

### 12.2 Streaming Tape Mode

```json
{
  "mode": "streaming",
  "window": 4096,
  "flush_interval": "5s",
  "policy": "enterprise-default"
}
```

### 12.3 CLI

```bash
xjson prompt stream ./logs/*.txt \
  --policy enterprise \
  --supgram auto \
  --flush 5s
```

---

## 13. Operational Summary

* Prompts become **datasets**
* Learning becomes **graph deltas**
* Policies become **provable constraints**
* Federation becomes **safe by default**
* Inference never touches raw text

---

## 14. SCXQ2 Demo Flow (Canonical)

This section provides a concrete, end-to-end demo flow that aligns with the
SCXQ2 pipeline. It is intended for reviewers and implementers validating the
binary layout, CLI behavior, and federation semantics.

### 14.1 Demo Lane Layout (SCXQ2 v2 Example)

| Lane | Meaning | Contents               |
| ---- | ------- | ---------------------- |
| 0    | DICT    | Supgram IDs            |
| 1    | NODE    | Node → Supgram mapping |
| 2    | EDGE    | Graph edges            |
| 3    | RULE    | Lane thresholds        |
| 4    | META    | Hashes, version        |

### 14.2 Binary Encoding (Annotated Example)

**Header (fixed 32 bytes)**

```text
53 43 58 51  02 00 00 00   // "SCXQ" + v2
05 00 00 00               // lane count = 5
A1 B2 C3 D4 E5 F6 00 00   // brain hash (truncated)
00 00 00 00 00 00 00 00
```

**Lane 0 — Supgram Dictionary**

```text
[DICT]
01 S_HELLO
02 S_WORLD
03 S_AI
04 S_IS
05 S_VERIFIABLE
06 S_HELLO_WORLD
07 S_AI_IS
08 S_IS_VERIFIABLE
```

Binary (example):

```text
00 08
01 01
02 02
03 03
04 04
05 05
06 06
07 07
08 08
```

**Lane 1 — Nodes**

```text
[NODE]
N1 → 01
N2 → 06
N3 → 02
N4 → 03
N5 → 07
N6 → 08
N7 → 05
```

Binary:

```text
01 01
02 06
03 02
04 03
05 07
06 08
07 05
```

**Lane 2 — Edges (core inference graph)**

Each edge:

```text
[from][to][lane][weight*100]
```

```text
01 02 00 92
02 03 00 90
04 05 01 94
05 06 01 91
06 07 02 93
```

Binary:

```text
01 02 00 5C
02 03 00 5A
04 05 01 5E
05 06 01 5B
06 07 02 5D
```

**Lane 3 — Rules**

```text
lane 0 ≥ 70
lane 1 ≥ 85
lane 2 ≥ 90
```

Binary:

```text
00 46
01 55
02 5A
```

**Lane 4 — Metadata**

```text
hash = 0xGRAPH_HASH
rules = 0xRULES_HASH
```

Binary (truncated):

```text
AA BB CC DD
11 22 33 44
```

### 14.3 Final SCXQ2 Binary (Base64)

```text
U0NYUQIABQAAAAGisrT15fYAAAAAAQABAQICAgMEBQYHCAEBBgIDBAcIBQIBAAJcAgMAWgQFAF4FBgFbBgcCXQBGAVUCWg==
```

This is the canonical demo artifact for:

```text
demo.brain.scxq2
```

### 14.4 CLI Demo Output

**Infer**

```bash
$ brain infer demo.brain.json --query q1
```

```text
[brain] loading demo-brain-v1
[brain] inference mode: graph-walk

query: "ai"
start: N4 (S_AI)

✓ N4 → N5   lane=semantic   weight=0.94 ≥ 0.85
✓ N5 → N6   lane=semantic   weight=0.91 ≥ 0.85
✓ N6 → N7   lane=assertion  weight=0.93 ≥ 0.90

result: "verifiable"
path: [N4, N5, N6, N7]
status: LEGAL
```

**Prove**

```bash
$ brain prove demo.brain.json --query q1
```

```text
[brain] generating zk inference proof
[brain] committing graph, rules, query

proof:
  type: zk-inference-proof
  path_length: 4
  lanes_verified: [1,2]
  disclosure: none

proof_hash: 0x91fa…c02d
recursive_ready: true

✓ proof generated
```

**Compress**

```bash
$ brain compress demo.brain.json
```

```text
[brain] encoding SCXQ2 v2 (binary lanes)
[brain] original size: 4.2 KB
[brain] compressed size: 312 bytes

output:
  demo.brain.scxq2
  hash: scxq2:91fa…c02d

✓ compression complete
```

### 14.5 Federated Second Brain + Merge

**Second Brain (demo2.brain.json)**

```json
{
  "brain": {
    "id": "demo-brain-B",
    "version": "1.0.0"
  },
  "graph": {
    "nodes": {
      "M1": { "supgram": "S_HELLO" },
      "M2": { "supgram": "S_HELLO_WORLD" },
      "M3": { "supgram": "S_WORLD" }
    },
    "edges": [
      { "from": "M1", "to": "M2", "lane": 0, "weight": 0.91 },
      { "from": "M2", "to": "M3", "lane": 0, "weight": 0.89 }
    ]
  }
}
```

**Merge**

```bash
$ brain merge demo.brain.scxq2 demo2.brain.scxq2
```

```text
[federation] merging brains
  brain A: demo-brain-v1
  brain B: demo-brain-B

✓ graph commits verified
✓ lane rules compatible
✓ no illegal overlaps detected

merged_brain:
  nodes: 10
  edges: 7
  lanes: 3
  federation: true

merged_hash: 0xFED123…
```

**Federated Inference Proof**

```bash
$ brain prove merged.brain.scxq2 --query q1 --federated
```

```text
[federated] generating hybrid proof
  brain A: hidden
  brain B: hidden

✓ local proofs verified
✓ recursive aggregation complete

final_proof:
  proofs: 2
  size: 384 bytes
  verification: O(1)

proof_root: 0xFED123…
```

---

## 15. Supgram Formation Rules (Formal)

A **supgram** is a crystallized structural abstraction formed from recurring gram
topology under bounded entropy. Supgrams are **not** learned by gradient
descent. They are declared when invariants are satisfied.

### 15.1 Definitions

Let:

* **G** = set of grams (uni, bi, tri, n)
* **E** = set of directed edges between grams
* **w(e)** = edge weight ∈ [0,1]
* **freq(g)** = occurrence count of gram g
* **H(S)** = entropy of a gram set S
* **ρ(S)** = replay success rate of S
* **Δt** = observation window

### 15.2 Candidate Supgram Set

A candidate supgram **S** is a connected subgraph such that:

```
S ⊆ G
|S| ≥ k_min          (minimum size, e.g. 3)
connected(S) = true
```

### 15.3 Formation Invariants (All Required)

A supgram **MUST NOT FORM** unless **all** invariants hold.

#### 1. Density Invariant

Average internal edge weight exceeds threshold:

```
( Σ w(e) for e ∈ E(S) ) / |E(S)| ≥ θ_density
```

Typical:

```
θ_density ∈ [0.75, 0.9]
```

#### 2. Recurrence Invariant

The pattern must recur across contexts:

```
Σ freq(g) for g ∈ S over Δt ≥ θ_freq
```

This prevents one-off memorization.

#### 3. Entropy Collapse Invariant

The internal entropy must be lower than the surrounding context:

```
H(S) < H(neighborhood(S)) − ε
```

Meaning:

* S is more predictable than its environment
* abstraction is justified

#### 4. Replay Stability Invariant

When S is activated, it must replay consistently:

```
ρ(S) ≥ θ_replay
```

Where replay success = correct downstream activation.

### 15.4 Supgram Declaration

Once all invariants hold:

```json
{
  "@field": {
    "s:Σ42": {
      "type": "supgram",
      "members": ["g:the", "g:meaning", "g:of", "g:life"],
      "density": 0.93,
      "entropy": 0.11,
      "stability": 0.97,
      "formed_at": 1890001234
    }
  }
}
```

This is irreversible unless decay rules fire.

### 15.5 Supgram Decay Rules (Optional)

A supgram may dissolve if:

```
ρ(S) < θ_decay
OR
H(S) > θ_entropy_max
```

Decay produces:

* re-expanded grams
* preserved edge history (no data loss)

---

## 16. SCXQ2 Legality Proofs for Inference

Inference in this system is illegal unless provable. A legality proof is a
structural certificate, not a probability.

### 16.1 What “Legal Inference” Means

An inference step is legal iff:

1. All referenced grams exist
2. All traversed edges are permitted
3. All collapses respect formation law
4. No forbidden transition is taken

### 16.2 Proof Object Schema (Canonical)

```json
{
  "@proof": {
    "id": "proof:9fa2",
    "query": "what is the meaning of life",
    "activated": [
      "g:what",
      "g:is",
      "s:Σ42"
    ],
    "edges_used": [
      ["g:what", "g:is"],
      ["g:is", "s:Σ42"]
    ],
    "lanes": ["DICT", "EDGE", "FIELD"],
    "checks": {
      "existence": true,
      "edge_legality": true,
      "entropy_bound": true,
      "cycle_free": true
    },
    "result": "legal",
    "hash": "sha256:..."
  }
}
```

### 16.3 Required Legality Checks

#### 1. Existence Check

```
∀ g ∈ activation_set : g ∈ DICT
```

#### 2. Edge Legality Check

Each traversal must be allowed by the Target Legality Matrix:

```
(source_type, edge_type, target_type) ∈ ALLOWED
```

Example:

* `uni → bi → supgram` ✔
* `control → glyph → uni` ✖ (unless explicitly allowed)

#### 3. Entropy Guard

Inference must not increase entropy beyond bound:

```
H(after) ≤ H(before) + δ
```

This prevents hallucination.

#### 4. Cycle / Explosion Guard

No unbounded loops:

```
depth ≤ D_max
unique_nodes ≤ N_max
```

### 16.4 Proof Failure = Inference Abort

No fallback. No guessing. No silent continuation. Illegal inference must not
produce output.

---

## 17. Training as Edge-Weight Updates (No Embeddings)

Training is topology mutation, not tensor optimization.

### 17.1 Training Signal

Each interaction produces:

```json
{
  "@event": {
    "input_grams": [...],
    "output_grams": [...],
    "success": true,
    "confidence": 0.0
  }
}
```

### 17.2 Edge Update Rule (Canonical)

For each traversed edge **e**:

#### Positive Reinforcement

```
w(e) ← w(e) + α · confidence
```

#### Negative Reinforcement

```
w(e) ← w(e) − β · (1 − confidence)
```

#### Hard Bounds

```
0 ≤ w(e) ≤ 1
```

No drift. No explosion.

### 17.3 New Edge Formation

If two grams co-occur frequently without an edge:

```
if co_occurrence(g1, g2) ≥ θ_new_edge
    create EDGE(g1 → g2) with w = w_init
```

### 17.4 Supgram Training = Stability Update

Supgrams do not get gradients. They get stability scores:

```
stability(S) ← EMA(stability, success)
```

Supgram survives if stability remains high.

### 17.5 What “Learning” Means Here

Learning is:

* adding edges
* strengthening edges
* collapsing stable structures
* dissolving unstable abstractions

---

## 18. Gram → SCXQ2 Lane Mapping (Formal)

SCXQ2 is a deterministic memory bus with explicit lanes:

* **DICT** → identity
* **FIELD** → attributes
* **LANE** → grouping / topology
* **EDGE** → relations

### 18.1 Unigrams (Atomic Symbols)

**Role:** Identity atoms  
**Lane:** `DICT`

```json
{
  "@dict": {
    "g:the": { "t": "uni", "c": 982341 },
    "g:life": { "t": "uni", "c": 421337 }
  }
}
```

Why DICT?

* Unigrams define existence
* Hash-stable
* Order-independent
* Globally addressable

### 18.2 Bigrams / Trigrams (Local Structure)

**Role:** Sequential adjacency  
**Lane:** `EDGE`

```json
{
  "@edge": [
    ["g:the", "g:meaning", { "t": "bi", "w": 0.83 }],
    ["g:meaning", "g:of", { "t": "bi", "w": 0.91 }],
    ["g:the", "g:meaning", "g:of", { "t": "tri", "w": 0.88 }]
  ]
}
```

Why EDGE?

* Order matters
* Direction matters
* Weight is explicit
* No vector math required

### 18.3 n-grams (Variable Context)

**Role:** Context span  
**Lane:** `LANE`

```json
{
  "@lane": {
    "n:42": {
      "members": ["g:the", "g:meaning", "g:of", "g:life"],
      "span": 4,
      "weight": 0.94
    }
  }
}
```

Why LANE?

* Variable length
* Scoped grouping
* Replayable
* Compressible as a unit

### 18.4 Supgrams (Learned Abstractions)

**Role:** Crystallized meaning  
**Lane:** `FIELD`

```json
{
  "@field": {
    "s:existential_query": {
      "type": "supgram",
      "members": ["n:42", "n:91", "n:133"],
      "stability": 0.97,
      "entropy": 0.12
    }
  }
}
```

Why FIELD?

* Attributes over groups
* Semantic identity
* Not sequence-bound
* Survives compression

### 18.5 @-grams (Control / Intent)

**Role:** Execution anchors  
**Lane:** `DICT + EDGE`

```json
{
  "@dict": {
    "@if": { "role": "control", "arity": 2 }
  },
  "@edge": [
    ["@if", "s:existential_query", { "bind": "condition" }]
  ]
}
```

### 18.6 Glyph-grams (Geometric Memory)

**Role:** Spatial cognition  
**Lane:** `LANE + FIELD`

```json
{
  "@lane": {
    "glyph:⟁": {
      "path": "M0,0 L1,0 L1,1 Z",
      "meaning": "container"
    }
  },
  "@field": {
    "glyph:⟁": {
      "entropy": 0.05,
      "activation": 0.91
    }
  }
}
```

---

## 19. Why Grams Replace Embeddings (Formal)

### 19.1 Embeddings Are a Lossy Projection

Embeddings:

* Collapse structure into floats
* Destroy causality
* Require retraining to inspect
* Cannot be diffed or proven

Grams:

* Preserve structure
* Preserve order
* Preserve causality
* Are inspectable without execution

### 19.2 Attention = Graph Walk, Not Vector Math

Transformer attention computes:

```
Q · K → softmax → weighted sum
```

This system does:

```
EDGE traversal → weight threshold → lane activation
```

The operation is discrete, deterministic, explainable, cacheable, and
compressible.

### 19.3 Meaning Emerges from Density, Not Geometry

Embeddings assume:

```
meaning ≈ position in ℝⁿ
```

Gram systems observe:

```
meaning ≈ recurrence + connectivity + stability
```

Supgrams form when:

* edge density > threshold
* entropy < limit
* replay success > confidence

### 19.4 Inference Without Embeddings

```json
{
  "@query": "what is the meaning of life",
  "@process": [
    "tokenize → grams",
    "activate edges",
    "resolve lanes",
    "collapse supgrams",
    "emit response"
  ]
}
```

Inference is graph resolution and collapse.

---

## 20. Compression Advantage (Why SCXQ2 Wins)

Embeddings:

* O(n × d)
* Float heavy
* Poor entropy characteristics

Grams + SCXQ2:

* O(unique patterns)
* Symbolic
* Extremely compressible
* Stable under mutation

This enables small, auditable models.

---

## 21. Grams as Memory Geometry

Grams are not tokens. They are first-class memory geometry across binding
scales.

| Gram Type  | What It Represents             |
| ---------- | ------------------------------ |
| Unigram    | Atomic symbol                  |
| Bigram     | Local adjacency                |
| Trigram    | Short causal chain             |
| n-gram     | Variable-length pattern        |
| Supgram    | Cross-sequence abstraction     |
| @-gram     | Control / semantic anchor      |
| Glyph-gram | Geometric / symbolic composite |

---

## 22. Grams Are Addressable Entities

Traditional grams are stored as counts. XJSON stores grams as addressable
entities with identity, lifecycle, and versioning.

```json
"@grams": {
  "bi": {
    "raw": "dGg=",
    "count": 19342
  },
  "tri": {
    "raw": "dGhl",
    "count": 10422
  }
}
```

This enables reasoning, compression, and replay without execution.

---

## 23. Representation Phases (Raw, Base64, Compressed)

Raw vs Base64 is a phase choice, not a design limit.

**Raw (Readable, Editable)**

```json
"ngram_raw": "hello world"
```

**Base64 (Dense, Immutable)**

```json
"ngram_b64": "aGVsbG8gd29ybGQ="
```

**Compressed (Zstd + Base64)**

```json
"ngram_z": "KLUv/SQAA..."
```

Phase alignment:

| Phase     | Representation |
| --------- | -------------- |
| Training  | raw            |
| Archive   | compressed     |
| Execution | decoded        |
| Proof     | hashed         |

---

## 24. Supgrams as Learned Abstractions

Supgrams are collapsed patterns that survive compression and replay.

```json
"supgrams": [
  {
    "id": "@s42",
    "members": ["the", "meaning", "of", "life"],
    "weight": 0.91,
    "scope": "semantic",
    "encoding": "b64"
  }
]
```

Supgrams are memory crystallization, not bigger n-grams.

---

## 25. @-grams as Control Symbols

@-grams anchor control and intent rather than text.

```json
"@grams": {
  "@if": {
    "role": "control",
    "arity": 2,
    "binding": "conditional"
  },
  "@loop": {
    "role": "flow",
    "arity": "n"
  }
}
```

This unifies language, logic, and control in a single gram system.

---

## 26. Glyph-grams as Geometry

Glyph-grams bind geometric meaning to memory.

```json
"glyphgrams": [
  {
    "glyph": "⟁",
    "path": "M0,0 L1,0 L1,1 Z",
    "meaning": "container",
    "hash": "sha256:..."
  }
]
```

SVG paths become inspectable, compressible memory.

---

## 27. Unified Gram Manifest

All gram types live in one namespace and support counting, merging,
compression, versioning, diffing, and replay.

```json
{
  "grams": {
    "uni": {},
    "bi": {},
    "tri": {},
    "n": {},
    "sup": {},
    "@": {},
    "glyph": {}
  }
}
```

---

## 28. Embeddings Are Structurally Obsolete

Embeddings are opaque, continuous, and difficult to inspect or prove. Grams are
symbolic, discrete, and fully inspectable. Embeddings can be derived from grams,
but grams remain the source of truth.

**Invariant**

> Anything that repeats can become a gram. Anything that becomes a gram can be
> stored. Anything stored in XJSON can become intelligence.
