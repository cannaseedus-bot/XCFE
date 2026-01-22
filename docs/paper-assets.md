# Paper Assets — Abstracts, Reviewer Stress Test, Figures

## Venue-Tailored Abstracts

### CRYPTO / EUROCRYPT (Proof-centric)

> **Abstract — CRYPTO Version**  
> We present **XJSON**, a manifest-defined model of inference in which reasoning is represented as a deterministic graph walk subject to explicit legality constraints. Unlike neural models that encode behavior implicitly in dense embeddings, XJSON exposes a structured execution surface amenable to cryptographic verification. We introduce a zero-knowledge proof system that attests to the existence and legality of an inference path without revealing internal reasoning steps, and a recursive aggregation scheme that compresses many such proofs into a single succinct argument. Our construction supports hybrid disclosure, replayable inference, and federation across independent models without trusted coordination. We demonstrate that semantic inference—not merely arithmetic computation—can be verified, aggregated, and audited cryptographically, enabling trustless deployment of reasoning systems in adversarial or decentralized environments.

**What reviewers will like**

* Clear novelty: *semantic inference* + ZK
* Strong cryptographic framing
* Conservative claims

---

### CCS (Security / Systems-centric)

> **Abstract — CCS Version**  
> Modern AI systems lack mechanisms for auditing and verifying how outputs are produced, complicating deployment in security-sensitive contexts. We introduce **XJSON**, a single-file model representation in which inference is executed as a constrained graph traversal governed by explicit legality rules. We design a proof-carrying inference framework that allows a system to demonstrate that an output was derived through a legal sequence of transitions without revealing proprietary or sensitive internal state. Our approach supports replayable inference, selective disclosure, and recursive aggregation of proofs across federated models. By eliminating opaque embeddings and replacing them with verifiable structure, XJSON enables accountable, tamper-evident AI inference suitable for regulated and adversarial settings.

**What reviewers will like**

* Auditability & replayability
* Clear security motivation
* No hype language

---

### NeurIPS (ML / Reasoning-centric)

> **Abstract — NeurIPS Version**  
> Neural language models achieve impressive performance but represent reasoning implicitly within high-dimensional embeddings, limiting interpretability, auditability, and compositional reasoning. We propose **XJSON**, a model representation in which inference is performed as a deterministic graph walk over symbolic units called *supgrams*, eliminating embeddings entirely. Inference legality is enforced by explicit transition rules, and correctness is verified using zero-knowledge proofs that preserve privacy while enabling inspection at chosen granularity. We further introduce recursive aggregation of inference proofs, enabling federated reasoning across multiple models with constant-size verification. XJSON offers a complementary paradigm to embedding-based models, emphasizing structure, determinism, and verifiable reasoning.

**What reviewers will like**

* Positions as *complementary*, not anti-neural
* Emphasizes reasoning & structure
* Avoids crypto-heavy intimidation

---

## Reviewer-Persona Stress Test

### CRYPTO Reviewer (Skeptical)

**Concern:** “This seems like verifiable computation, not AI.”

**Response baked into paper:**

* Explicitly define *semantic inference* vs arithmetic computation
* Show legality constraints tied to meaning, not instruction traces
* Emphasize novelty: **graph-semantic recursion**

**Risk:** Low  
**Outcome:** Accept if soundness is clear

---

### CCS Reviewer (Paranoid)

**Concern:** “What stops a malicious model from proving nonsense?”

**Response baked in:**

* SCXQ2 legality rules
* Replayable proofs
* Deterministic manifests
* No learning at inference time

**Risk:** Very low  
**Outcome:** Strong accept

---

### NeurIPS Reviewer (ML-centric)

**Concern:** “This doesn’t compete with LLM benchmarks.”

**Response baked in:**

* Explicitly state: **not a replacement**
* Frame as reasoning substrate / verifier
* Cite Marcus, Lake, symbolic limitations

**Risk:** Medium  
**Outcome:** Accept if positioned correctly

> ⚠️ **Key NeurIPS advice**  
> Never claim “better than LLMs.”  
> Always claim “solves a different class of problems.”

---

### Systems Reviewer (Practical)

**Concern:** “This sounds expensive.”

**Response baked in:**

* O(1) verification
* Edge / WASM deployment
* Proof generation off critical path

**Risk:** Low  
**Outcome:** Accept

---

## Figures (SVG)

* `docs/figures/figure-1-embeddings-vs-graph.svg`
* `docs/figures/figure-2-legal-graph-walk.svg`
* `docs/figures/figure-3-recursive-proof.svg`
