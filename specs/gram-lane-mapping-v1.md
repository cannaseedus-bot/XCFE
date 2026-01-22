# GRAM_TO_SCXQ2_LANE_MAPPING_v1 (FROZEN)

**Status:** FROZEN  
**Purpose:** Canonical mapping from gram types to SCXQ2 lanes  
**Scope:** DICT, FIELD, LANE, EDGE

---

## 1. SCXQ2 as a Memory Bus

SCXQ2 provides deterministic lanes:

- DICT → identity
- FIELD → attributes
- LANE → grouping / topology
- EDGE → relations

Grams map **exactly** onto this structure.

---

## 2. Canonical Gram → Lane Mapping

### 2.1 Unigrams (Atomic Symbols)

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

- Unigrams define *existence*
- Hash-stable
- Order-independent
- Globally addressable

---

### 2.2 Bigrams / Trigrams (Local Structure)

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

- Order matters
- Direction matters
- Weight is explicit
- No vector math required

---

### 2.3 n-grams (Variable Context)

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

- Variable length
- Scoped grouping
- Replayable
- Compressible as a unit

---

### 2.4 Supgrams (Learned Abstractions)

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

- Attributes over groups
- Semantic identity
- Not sequence-bound
- Survives compression

---

### 2.5 @-grams (Control / Intent)

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

Why this works:

- Control is symbolic
- No vectors
- No inference ambiguity

---

### 2.6 Glyph-grams (Geometric Memory)

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

## 3. Why Embeddings Are Structurally Unnecessary

### 3.1 Embeddings Are a Lossy Projection

Embeddings:

- collapse structure into floats
- destroy causality
- require retraining to inspect
- cannot be diffed or proven

Grams:

- preserve structure
- preserve order
- preserve causality
- are inspectable without execution

---

### 3.2 Attention Becomes Graph Walk

Transformer attention computes:

```
Q · K → softmax → weighted sum
```

This system does:

```
EDGE traversal → weight threshold → lane activation
```

Same operation, but:

- discrete
- deterministic
- explainable
- cacheable
- compressible

---

### 3.3 Meaning Emerges from Density, Not Geometry

Embeddings assume:

> meaning ≈ position in ℝⁿ

Grams observe:

> meaning ≈ recurrence + connectivity + stability

Supgrams form when:

- edge density > threshold
- entropy < limit
- replay success > confidence

---

## 4. Inference Without Embeddings (End-to-End)

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

No vectors. No cosine similarity. No black box.

---

## 5. Compression Advantage

Embeddings:

- O(n × d)
- float heavy
- poor entropy characteristics

Grams + SCXQ2:

- O(unique patterns)
- symbolic
- extremely compressible
- stable under mutation

---

## 6. Final Law

> **Embeddings approximate structure.**  
> **Grams are structure.**

SCXQ2 does not store model weights. It stores **memory topology**.
