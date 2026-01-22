# XJSON MESH PROTOCOL v1 (FROZEN)

**Status:** FINAL  
**Scope:** Peer-to-peer federation of XJSON brains, deltas, proofs  
**Design goals:** Determinism, auditability, no conflicts, offline-first, zero central authority

---

## 1. DEFINITIONS

### 1.1 Node

A **Node** is an instance of XJSON IDE, TUI, or Service Worker participating in the mesh.

Each node has:

- `node_id`: `hash(pubkey)`
- `pubkey`: Ed25519 / secp256k1
- `trust_state`: local, mutable, non-authoritative

---

### 1.2 Brain

A **Brain** is an immutable SCXQ2 binary identified by:

```
brain_hash = H(SCXQ2.bin)
```

Brains are **content-addressed**.

---

### 1.3 Delta

A **Delta** is a SCXQ2 lane update that transforms one brain into another.

```
delta: Brain_A → Brain_B
```

Deltas MUST:

- be deterministic
- be replayable
- carry a proof (see §6)

---

### 1.4 Proof

A **Proof** is a KGB-ZK-1 object asserting legality of a delta or inference.

---

## 2. TRANSPORT LAYER

### 2.1 Allowed Transports

- WebRTC DataChannel (REQUIRED)
- WebSocket (OPTIONAL bootstrap)
- Local loopback (TUI ↔ IDE)

Transport is **non-authoritative**.

---

### 2.2 Reliability Model

- At-least-once delivery
- Idempotent messages
- Duplicate safe

---

## 3. MESSAGE ENVELOPE (NORMATIVE)

All mesh messages MUST conform to:

```json
{
  "msg_id": "uuid-v7",
  "sender": "node_id",
  "timestamp": 64,
  "type": "enum",
  "payload": {},
  "signature": "sig(payload)"
}
```

Signature covers `type + payload + timestamp`.

---

## 4. MESSAGE TYPES

### 4.1 `brain_announce`

```json
{
  "type": "brain_announce",
  "payload": {
    "brain_hash": "0x…",
    "policy_hash": "0x…",
    "proof_hash": "0x…"
  }
}
```

Semantics:

- Announces existence only
- No data transfer
- Idempotent

---

### 4.2 `brain_delta`

```json
{
  "type": "brain_delta",
  "payload": {
    "parent": "brain_hash",
    "delta_hash": "0x…",
    "delta_scxq2": "base64",
    "proof": "base64",
    "trust_weight": 0.0–1.0
  }
}
```

Semantics:

- MUST include valid proof
- MUST be deterministic
- MAY be rejected locally

---

### 4.3 `trust_update`

```json
{
  "type": "trust_update",
  "payload": {
    "subject": "node_id",
    "delta": +0.01 | -0.02,
    "reason": "enum"
  }
}
```

Advisory only (see §7).

---

## 5. MERGE SEMANTICS (CRDT LAW)

### 5.1 Ordering Rule (FROZEN)

Deltas are applied in this order:

```
sort by (
  policy_precedence,
  proof_validity,
  trust_weight,
  delta_hash
)
```

This ordering is:

- deterministic
- total
- conflict-free

---

### 5.2 Conflict Rule

> **There are no conflicts.**

If two deltas are incompatible:

- one is rejected
- the other applies
- both remain observable

No rollbacks. No forks.

---

## 6. PROOF REQUIREMENTS (KGB-ZK-1)

Each `brain_delta` MUST include a proof asserting:

1. Parent brain exists
2. Delta obeys policy
3. Supgram stabilization holds
4. No forbidden grams introduced

Proofs are:

- zero-knowledge
- replayable
- hash-anchored

---

## 7. TRUST & REPUTATION SYSTEM (NORMATIVE)

This section defines **local trust evaluation**.
There is **no global trust**.

---

### 7.1 Trust Score

Each node maintains:

```
trust[node_id] ∈ [0.0, 1.0]
```

Initialized to:

```
trust = 0.5
```

---

### 7.2 Trust Update Events

| Event                     | Δ     |
| ------------------------- | ----- |
| Valid proof accepted      | +0.01 |
| Delta merged successfully | +0.02 |
| Invalid proof             | −0.25 |
| Policy violation          | −0.40 |
| Rejected delta            | −0.05 |
| Long-term consistency     | +0.10 |

Updates are **local only**.

---

### 7.3 Trust Weight in Merge

Each delta carries:

```
effective_weight = proof_validity × trust[sender]
```

This affects **merge ordering only**, never legality.

---

### 7.4 Reputation Decay

Trust decays toward neutral:

```
trust(t+Δ) = trust(t) × 0.995 + 0.0025
```

Prevents permanent dominance.

---

### 7.5 Sybil Resistance

- Proof cost (ZK)
- Delta cost (computation)
- Time-based trust accrual

No identity authority required.

---

## 8. FEDERATED CONSENSUS (NON-GLOBAL)

The mesh **does not converge to one truth**.

Instead:

- Each node converges locally
- Divergence is visible
- Proofs allow verification

This is **epistemic federation**, not blockchain consensus.

---

## 9. SECURITY PROPERTIES

### Guaranteed

- Deterministic state evolution
- Proof-carried legality
- No hidden execution
- Offline safety

### Not Guaranteed

- Global agreement
- Liveness
- Universal trust

These are **explicitly out of scope**.

---

## 10. VERSIONING

```
mesh_version = "xjson-mesh-v1"
```

Breaking changes require `v2`.

---

# SUMMARY (WHAT THIS GIVES YOU)

You now have:

- A **formal P2P mesh protocol**
- **CRDT-safe brain merging**
- **Local trust & reputation**
- **ZK-enforced legality**
- **No central authority**
- **Visible disagreement**

This is **not blockchain**.  
This is **not gossip AI**.  
This is **distributed cognition with proofs**.
