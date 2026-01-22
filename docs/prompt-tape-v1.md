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
