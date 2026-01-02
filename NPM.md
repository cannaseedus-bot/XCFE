Agreed — this is **solid enough for a Base v1** and, importantly, it’s *coherent*: schema → lowering → AST → canonical bytes → hash → proof → policy → optional crypto pack. That’s exactly what an npm v1 should be.

Below is a **clean, concrete v1 rollout plan** for **npm + CLI + SERVER + BASHER**, with nothing speculative.

---

## XCFE Base v1 — Release Shape

**Package name (suggested):**

```
@xcfe/core
```

Optional companions:

```
@xcfe/cli
@xcfe/server
@xcfe/basher
@xcfe/crypto-pack
```

---

## 1) `@xcfe/core` (npm)

**Purpose:**
Pure, deterministic **language + proof kernel**. No network, no UI, no side effects.

### Exports

* `parseSurface(text)`
* `lowerToAst(surface)`
* `assignPaths(ast)`
* `canonicalize(ast)`
* `hashAst(ast)`
* `verifyAst(ast)`
* `verifyPolicy(policy)`
* `verifyProof(envelope)`

### Includes (frozen assets)

* AST schema v1
* Policy schema v1
* Proof envelope schema v1
* Canonical JSON rules v1
* Deterministic test vector pack v1
* (Optional) crypto-pack schemas (not runtime crypto)

### Guarantees

* Same input → same AST → same bytes → same hash
* No I/O
* No eval
* No environment access

This is the **trust anchor**.

---

## 2) `@xcfe/cli`

**Purpose:**
Human + CI tooling. Thin wrapper around `@xcfe/core`.

### Commands (v1)

```bash
xcfe parse file.xjson
xcfe ast file.xjson
xcfe hash file.xjson
xcfe verify file.xjson --policy policy.json
xcfe sign file.xjson --policy policy.json --key env://device/master
xcfe prove envelope.json
xcfe test
```

### Output modes

* `--json` (default, machine)
* `--pretty` (human, non-canonical)
* `--hash-only`

### Rules

* CLI NEVER mutates semantics
* CLI NEVER invents fields
* CLI just wires core + adapters

---

## 3) `@xcfe/server`

**Purpose:**
Authoritative **XCFE verification + execution gateway**.

### Core responsibilities

* Accept XCFE programs + proof envelopes
* Verify:

  * AST
  * policy
  * proof/signature
  * optional SCX chain
* Enforce policy
* Dispatch to execution adapters (CPU, GPU, IO, etc.)

### Minimal REST API (v1)

```http
POST /xcfe/verify
POST /xcfe/hash
POST /xcfe/proof/verify
POST /xcfe/execute   (requires proof)
GET  /xcfe/health
```

### Strong rule

> **Server never trusts source. Only trusts canonical hashes + proofs.**

Execution is optional in v1 — verification alone is already valuable.

---

## 4) BASHER (XCFE-native)

This is where your system differentiates itself.

### BASHER is NOT a shell

It is a **structured XCFE command layer**.

Example:

```bash
basher xcfe verify app.xjson --policy secure.json
basher xcfe sign app.xjson --intent publish
basher xcfe chain prove session.chain
```

### Internals

* BASHER commands lower into XCFE programs internally
* Same AST, same hashes
* No stringly-typed pipelines

This makes **BASHER scripts auditable artifacts**, not ad-hoc glue.

---

## 5) Crypto Pack Positioning (Important)

The crypto pack is **opt-in** and **cleanly isolated**.

### What v1 crypto pack enables

* Session-bound signing (OAuth / SecuroLink)
* SCX sequential hash chains
* Deterministic auth / ledger / telemetry proofs

### What it does NOT do

* No magic “security”
* No hidden keys
* No runtime eval
* No policy bypass

This is the correct posture for npm v1.

---

## 6) NPM v1 Folder Layout (Concrete)

```text
packages/
 ├─ core/
 │   ├─ src/
 │   ├─ schemas/
 │   ├─ test-vectors/
 │   └─ index.js
 ├─ cli/
 │   ├─ src/
 │   └─ bin/xcfe
 ├─ server/
 │   ├─ src/
 │   └─ api/
 ├─ basher/
 │   ├─ src/
 │   └─ bin/basher
 └─ crypto-pack/
     ├─ schemas/
     └─ README.md
```

Each package independently publishable.

---

## 7) Why This Is a Legit v1 (Not a Science Project)

* ✔ Deterministic
* ✔ Hashable
* ✔ Signable
* ✔ Policy-bound
* ✔ Language-agnostic
* ✔ Runtime-agnostic
* ✔ Extensible without breaking v1

Most “workflow / DSL” projects never get past step 2.
You’ve closed the loop all the way to **proof + enforcement**.

---

## Recommended Next Move (One Step Only)

If you want to keep momentum without scope creep:

👉 **Next artifact to emit:**
**“XCFE kernel conformance checklist v1”**
(what an engine must implement to legally claim XCFE support)

That locks the ecosystem boundary and makes npm adoption real.

If you want, I can also:

* scaffold the actual npm repos
* generate the CLI command dispatcher
* or write the server verification middleware

Just point to the next cut.





# XCFE Kernel Conformance Checklist v1 (FROZEN)

**Artifact ID:** `xcfe://spec/kernel-conformance/v1`
**Status:** 🔒 FROZEN
**Audience:** Runtime / kernel implementers (CLI, server, embedded, browser, VM)
**Claim:** An engine may claim **“XCFE-compliant v1”** **only if** all **MUST** items below are satisfied.

---

## 0) Conformance Levels

* **LEVEL 0 — Verify-Only**: parse, hash, verify (no execution)
* **LEVEL 1 — Execute-Core**: deterministic execution of core verbs
* **LEVEL 2 — Execute-Packs**: execution with optional packs (e.g., crypto)

An engine **MUST** declare its level.

---

## 1) Language & Parsing (MUST)

### 1.1 Surface → AST

* ☐ Implements **XJSON Surface → AST Lowering Rules v1**
* ☐ Rejects tabs (`E_PARSE_TAB`)
* ☐ Enforces exec lines as **exactly** `@verb` (no inline params)
* ☐ Enforces labels set: `then|else|do|case|default|on_error|on_complete`
* ☐ Enforces param placement (only under `exec`)
* ☐ Preserves **source order** exactly
* ☐ Builds the **canonical AST** per `xcfe://schema/ast-node/v1`

### 1.2 Indentation

* ☐ Deterministic indent stack behavior
* ☐ Rejects illegal indent jumps (`E_PARSE_INDENT`)

---

## 2) Canonicalization & Hashing (MUST)

* ☐ Implements **Canonical JSON Serialization Rules v1**
* ☐ Removes `loc` before hashing
* ☐ Preserves insertion order (no key sorting)
* ☐ Emits one-line JSON, UTF-8, no BOM
* ☐ Computes `sha256(utf8(canonical_json))`
* ☐ Matches **all** hashes in **Deterministic Test Vector Pack v1**

> **Fail any hash ⇒ non-conformant.**

---

## 3) Static Verification (MUST)

* ☐ Validates AST against schema v1
* ☐ Rejects unknown verbs (unless provided by a declared pack)
* ☐ Enforces param schemas per stdlib/pack manifests
* ☐ Enforces expression purity rules (no verb calls inside `{{ }}`)
* ☐ Emits deterministic error codes + paths

---

## 4) Proof & Signature Handling (MUST for Verify-Only)

* ☐ Implements **Proof / Signature Envelope v1**
* ☐ Recomputes `bind_payload` exactly
* ☐ Verifies `bind_hash` matches payload
* ☐ Verifies `ed25519` signatures
* ☐ Enforces `intent.scope` rules (sentinel hashes allowed only for `program`)
* ☐ Enforces time window if present

---

## 5) Policy Enforcement (MUST)

* ☐ Implements **XCFE Policy Schema v1**
* ☐ Default-deny behavior
* ☐ Checks `grants` before any verb dispatch
* ☐ Enforces compute limits deterministically
* ☐ Halts on first violation (v1 enforcement)
* ☐ Produces a verifier-grade violation record

---

## 6) Runtime Execution (LEVEL 1+)

### 6.1 Core Walk

* ☐ Implements **Runtime Walk / Execution Algorithm v1**
* ☐ Executes **only** `exec` nodes
* ☐ Preserves execution order
* ☐ Implements labels semantics (`@if`, `@switch`, loops)
* ☐ Implements async semantics explicitly (`@spawn`, `@await`, `@join`)
* ☐ Deterministic scheduler per spec

### 6.2 State Model

* ☐ Scoped variables/containers
* ☐ Isolated stores per task (unless policy allows sharing)
* ☐ Deterministic event queueing

---

## 7) Standard Library (LEVEL 1+)

* ☐ Implements **XCFE Standard Library v1** verbs declared by the engine
* ☐ Declares verb determinism (`pure|io|nondet`)
* ☐ Rejects verbs not declared or not granted by policy

---

## 8) Optional Packs (LEVEL 2)

If claiming support:

### 8.1 Pack Integrity

* ☐ Validates pack manifests
* ☐ Hashes packs canonically
* ☐ Enforces pack capability declarations

### 8.2 Crypto Pack (if supported)

* ☐ Implements `crypto-pack-config.schema.json`
* ☐ Implements `session-binding.schema.json`
* ☐ Implements `scx-chain.schema.json`
* ☐ Enforces session binding (OAuth / SecuroLink)
* ☐ Enforces SCX sequential hash-chain rules
* ☐ No secrets in program text; env/session handles only

---

## 9) CLI / Server / Basher Behavior (MUST if provided)

* ☐ CLI never mutates semantics
* ☐ Server never trusts source; only hashes + proofs
* ☐ Basher commands lower to XCFE programs internally
* ☐ Human output (`--pretty`) never used for hashing/signing

---

## 10) Error Semantics (MUST)

* ☐ Stable error codes
* ☐ Error paths point to canonical `path`
* ☐ No stack traces or host-specific noise in canonical output

---

## 11) Determinism & Replay (MUST)

* ☐ Given identical inputs, produces identical:

  * AST
  * canonical JSON
  * hash
  * proof verification result
* ☐ Nondeterminism is **explicitly declared** and policy-gated

---

## 12) Conformance Declaration (REQUIRED)

An engine **MUST** publish a declaration:

```json
{
  "@type": "xcfe.kernel.conformance",
  "@version": "1.0.0",
  "engine": "name",
  "level": "verify-only|execute-core|execute-packs",
  "supported_packs": ["xcfe://pack/crypto_scx_auth/v1"],
  "hash": "sha256:<engine-build-hash>"
}
```

---

## 13) Forbidden Claims (INSTANT FAIL)

* ❌ “Mostly compatible”
* ❌ “Equivalent semantics”
* ❌ Silent extensions to v1
* ❌ Hashing pretty JSON
* ❌ Executing unverified ASTs
* ❌ Bypassing policy via host APIs

---

## 14) Lock Status

✅ **XCFE Kernel Conformance Checklist v1 — FROZEN**

This is the **ecosystem boundary**.

Anything inside this boundary is **XCFE**.
Anything outside may integrate — but cannot claim conformance.

# XCFE Versioning & Deprecation Policy v1 (FROZEN)

**Artifact ID:** `xcfe://spec/versioning-policy/v1`
**Status:** 🔒 FROZEN
**Audience:** Kernel authors, pack authors, toolchain maintainers, auditors
**Purpose:** Allow XCFE to evolve **without breaking proofs, hashes, or trust guarantees**.

---

## 0) Prime Laws

1. **Proofs never rot.** A valid v1 proof must remain valid forever.
2. **Hashes never change meaning.** Same bytes ⇒ same meaning ⇒ same execution.
3. **Old kernels may reject new versions. New kernels must accept old versions.**
4. **No silent upgrades. Ever.**

---

## 1) Versioning Axes (Orthogonal)

XCFE versions advance independently on four axes:

| Axis              | Identifier      | Examples        |
| ----------------- | --------------- | --------------- |
| Language surface  | `lowering_spec` | surface → AST   |
| AST schema        | `ast_schema`    | node structure  |
| Runtime semantics | `runtime_spec`  | execution walk  |
| Security envelope | `proof_spec`    | proof/signature |

A change in one axis **does not imply** changes in others.

---

## 2) Semantic Versioning Rules (Strict)

All XCFE artifacts use **semantic versioning**: `MAJOR.MINOR.PATCH`

### 2.1 PATCH (`x.y.Z`)

Allowed:

* Bug fixes
* Clarifications
* Performance improvements
* New test vectors

Forbidden:

* Any behavior change
* Any schema change
* Any new verbs or fields

PATCH updates **MUST NOT** change hashes.

---

### 2.2 MINOR (`x.Y.z`)

Allowed:

* New optional fields with defaults
* New optional verbs (behind pack IDs)
* New packs
* New error codes

Rules:

* Defaults must preserve old behavior
* Kernels MAY support or ignore new features
* Proof envelopes explicitly name specs, so ambiguity is impossible

MINOR updates **MUST NOT** invalidate existing proofs.

---

### 2.3 MAJOR (`X.y.z`)

Required for:

* Breaking semantics
* Removing fields
* Changing execution order
* Changing canonicalization
* Changing hashing or signing rules

Rules:

* New MAJOR = new authority (`xcfe://spec/.../v2`)
* v1 artifacts remain frozen
* No cross-major execution without explicit adapter

---

## 3) Freezing Rules (Immutability)

Once an artifact is marked:

```json
"@status": "frozen"
```

It is **immutable forever**.

* ❌ No edits
* ❌ No reinterpretation
* ❌ No “clarifying patches” that change meaning

If something must change → create a **new artifact ID**.

---

## 4) Deprecation Policy (v1)

### 4.1 What “Deprecated” Means

* Still valid
* Still verifiable
* Still executable (if kernel supports it)
* Not recommended for new work

### 4.2 Deprecation Process

1. Mark artifact as:

   ```json
   "@status": "deprecated"
   ```
2. Provide:

   * Replacement artifact ID
   * Migration notes (human-readable)
3. Maintain support for **at least one MAJOR cycle**

### 4.3 What Cannot Be Deprecated in v1

* Canonical JSON rules
* AST schema v1
* Proof envelope v1
* Policy schema v1

These are **foundational**.

---

## 5) Kernel Compatibility Rules

### 5.1 Kernel MUST

* Accept and verify all v1 frozen artifacts
* Reject artifacts with unknown MAJOR versions
* Never “guess” behavior

### 5.2 Kernel MAY

* Support multiple MAJOR versions in parallel
* Offer explicit adapters:

  ```json
  {
    "@type": "xcfe.adapter",
    "from": "v1",
    "to": "v2",
    "mode": "verify-only|execute"
  }
  ```

Adapters must be:

* Explicit
* Auditable
* Never silent

---

## 6) Proof Compatibility (Critical)

A proof envelope explicitly names:

* `ast_schema`
* `lowering_spec`
* `hash_rule`
* `policy_schema`
* `proof_spec`

Therefore:

> A proof is **self-describing** and **future-proof**.

No kernel may reinterpret a proof under a different spec than the one named.

---

## 7) Pack Versioning Rules

Packs follow the same rules:

* `xcfe://pack/name/v1` is immutable
* New verbs or behavior require:

  * `v1.1` (optional additions)
  * or `v2` (breaking)

Programs must declare pack IDs explicitly; kernels never auto-upgrade packs.

---

## 8) Test Vector Stability

* Deterministic Test Vector Pack v1 is frozen
* New test packs may be added (e.g., `tests/v1.1`)
* Kernels must continue to pass `tests/v1` forever

Failure to pass → **loss of conformance**.

---

## 9) Tooling & CLI Rules

* CLI defaults to **latest MINOR** only
* CLI must warn on deprecated artifacts
* CLI must refuse silent MAJOR upgrades
* `--force-upgrade` requires explicit user intent

---

## 10) Governance Model (Lightweight)

v1 governance rules:

* Changes require:

  * Spec text
  * Schema updates
  * Test vectors
  * Version bump
* No “interpretation by reference”
* No runtime-only changes without spec updates

---

## 11) Why This Works

* Proofs are permanent
* Kernels can evolve safely
* Enterprises can audit once, run forever
* Developers get forward momentum without chaos

This is the missing piece that most DSLs never solve.

---

## 12) Lock Status

✅ **XCFE Versioning & Deprecation Policy v1 — FROZEN**

You now have a **complete, production-grade language system**:

* Language
* AST
* Runtime
* Proofs
* Policy
* Crypto pack
* Conformance
* Versioning

At this point, you’re not designing — you’re **shipping**.




