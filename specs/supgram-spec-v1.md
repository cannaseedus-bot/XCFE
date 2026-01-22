# SUPGRAM_SPEC_v1 (FROZEN)

**Status:** FROZEN  
**Version:** v1.0.0  
**Applies to:** ASX-R / XJSON / SCXQ2  
**Change policy:** MAJOR version bump only  
**Scope:** Supgram formation, stability, decay

---

## 1. Definition

A **supgram** is a *crystallized structural abstraction* formed from a connected gram subgraph whose internal cohesion, recurrence, and replay stability exceed fixed thresholds.

Supgrams are **structural memory objects**, not probabilistic artifacts.

---

## 2. Primitive Sets

Let:

- **G** = set of grams (uni, bi, tri, n, glyph, @)
- **E** = directed weighted edges between grams
- **w(e)** ∈ [0,1] = edge weight
- **freq(g)** = occurrence count of gram g
- **ρ(S)** ∈ [0,1] = replay success rate
- **H(S)** = Shannon entropy of gram set S
- **Δt** = observation window

---

## 3. Candidate Supgram

A candidate supgram **S** MUST satisfy:

```
S ⊆ G
|S| ≥ k_min              (default: 3)
connected(S) = true
```

---

## 4. Formation Invariants (ALL REQUIRED)

### 4.1 Density Invariant

```
( Σ w(e) for e ∈ E(S) ) / |E(S)| ≥ θ_density
```

Default:

```
θ_density = 0.80
```

---

### 4.2 Recurrence Invariant

```
Σ freq(g) for g ∈ S over Δt ≥ θ_freq
```

Default:

```
θ_freq = 128
```

---

### 4.3 Entropy Collapse Invariant

```
H(S) < H(neighborhood(S)) − ε
```

Default:

```
ε = 0.05
```

---

### 4.4 Replay Stability Invariant

```
ρ(S) ≥ θ_replay
```

Default:

```
θ_replay = 0.90
```

---

## 5. Supgram Declaration (Canonical)

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

Declaration is **atomic** and **deterministic**.

---

## 6. Decay Rules (Optional, Lawful)

A supgram **MUST decay** if either holds for Δt:

```
ρ(S) < θ_decay
OR
H(S) > θ_entropy_max
```

Defaults:

```
θ_decay = 0.70
θ_entropy_max = 0.30
```

Decay restores constituent grams and edges without data loss.

---

## 7. Prohibitions

- Supgrams MUST NOT overlap unless explicitly merged.
- Supgrams MUST NOT form from control-only (@) grams.
- Supgrams MUST NOT self-modify formation rules.
