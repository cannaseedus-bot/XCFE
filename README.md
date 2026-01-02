# @xjson/xjson-server

## Version 2.x — XCFE Execution Server

This package is the **reference HTTP execution host** for **XCFE v1** programs.

It accepts XJSON/XCFE input, verifies canonical ASTs, enforces policy and proof
envelopes, and executes only allowed effects.

---

Yeah — if you looked through it and it’s mostly “connect here / demo page / default ports / placeholder hive,” then calling it an **honest JSON REST server** (v1 line) is the right truth, and the “hive” should be upgraded from *demo cluster* → *real local REST hive*.

Here’s how to fix it cleanly without pretending it’s already an XCFE execution system.

---

## 1) Keep the old line honest: **v1 = JSON REST SERVER (real, useful)**

### v1 scope (make it actually good)

* **Static JSON API**

  * `GET /health`
  * `GET /capabilities`
  * `GET /db` / `GET /db/:path`
  * `POST /db/:path` (write/patch)
* **KQL/KPI adapters optional** (behind flags, off by default)
* **No execution semantics**

  * `@` is treated as data, not “run this”
* **No demo HTML in core**

  * if you want a demo, ship it in `/examples`, never in runtime path

**Deliverable:** publish `@xjson/xjson-server@1.1.0` as “JSON REST SERVER” with the above endpoints + proper docs.

---

## 2) Upgrade the “hive” into a real thing: **hive-cluster.js becomes a local REST hive**

Right now it sounds like it’s a shell. Make it real by giving it 4 non-negotiable invariants:

### Hive invariants (minimum viable “real”)

1. **Deterministic node identity**

   * `node_id = hash(machine_fingerprint + salt)` (or user-provided)
2. **Discovery that actually works**

   * `GET /hive/nodes` returns live nodes
   * seed list support: `--seed http://127.0.0.1:PORT`
3. **Consistent routing**

   * consistent-hash ring (or rendezvous hashing)
   * `route(key)` → node endpoint
4. **Health + quorum**

   * heartbeats + TTL eviction
   * `GET /hive/health` returns quorum + node liveness

### Core endpoints (v1-compatible)

* `GET /hive/health`
* `GET /hive/nodes`
* `POST /hive/join`
* `POST /hive/leave`
* `POST /hive/heartbeat`
* `POST /hive/route` `{ "key": "..." } -> { "node": ... }`

That makes it a legitimate “local REST server hive” for *any* program, exactly like you said.

---

## 3) v2 should not land until it passes “not-theater” gates

If we’re going to ship **XCFE Execution Server** as v2, it must meet runtime-grade acceptance tests, not “example wiring.”

### v2 gates (must pass)

* **Parse/lower → canonical AST → byte-stable hash**
* **Policy check happens before any effect**
* **Proof bind_hash matches canonical serialization**
* **ed25519 verification works end-to-end**
* **effects are allowlisted + audited**
* **no “demo HTML” in server runtime**

If it can’t do those yet, don’t call it v2 execution. Keep improving v1 + hive first.

---

## 4) How to publish without breaking anyone (npm dist-tags)

You can keep the *same package name* and still be brutally clear:

* Publish:

  * `1.1.0` as the upgraded **JSON REST SERVER**
  * `2.0.0` later as **XCFE Execution Server**
* Use dist-tags:

  * `latest` → points to `1.1.0` until v2 is real
  * `xcfe` → points to experimental `2.0.0-alpha.x` until it’s solid
  * or flip later when v2 is legit

This prevents “people install latest and get an execution server that’s actually a demo.”

---

## 5) Concrete next commit plan (no placeholders)

**Commit A (v1.1.0):**

* remove demo UI from runtime path
* implement `/health`, `/capabilities`, `/db` routes
* implement real `hive-cluster.js` endpoints + hashing + TTL
* add minimal CLI:

  * `xjson-server start --port`
  * `xjson-server hive --port --seed ...`
  * `xjson-server nodes`

**Commit B (v2 alpha branch only):**

* add `@xcfe/core` dependency
* add `/xcfe/verify`, `/xcfe/execute` behind `--xcfe`
* require proofs/policy/sessionbinding in strict mode

---
---

# 🔢 Versioning Outcome

### 🔒 Old Line (Preserved)

**`@xjson/xjson-server@1.x`**

**Officially defined as:**

> **JSON REST SERVER**
> A generic HTTP server for JSON/XJSON payload routing, validation, and transport.

It:

* parses JSON
* exposes REST routes
* MAY accept XJSON-shaped data
* **does not** claim execution authority
* **does not** implement XCFE semantics

This is **not deprecated**, it is **reclassified**.

Users who want a JSON API server:

* stay on `1.x`
* nothing breaks
* no pressure

---

### 🚀 New Line (Authoritative)

**`@xjson/xjson-server@2.0.0`**

**Officially defined as:**

> **XCFE Execution Server**
> A proof-aware, policy-enforced execution host for XCFE/XJSON programs.

This is a **semantic upgrade**, not a patch.

---

# 🧭 Naming Clarity (Critical)

You’re doing something very important here:

| Version | What it really is     | What you now call it      |
| ------- | --------------------- | ------------------------- |
| `1.x`   | JSON over HTTP        | **JSON REST SERVER**      |
| `2.x`   | Language runtime host | **XCFE Execution Server** |

No theater. No ambiguity. No bait-and-switch.

---

# 📦 npm Metadata (Exact Changes)

## `package.json`

```json
{
  "name": "@xjson/xjson-server",
  "version": "2.0.0",
  "description": "XCFE-compatible execution server for XJSON programs with proof, policy, and session binding enforcement.",
  "keywords": [
    "xcfe",
    "xjson",
    "execution-server",
    "proof-verification",
    "policy-enforcement",
    "runtime"
  ]
}
```

---

## README.md — Opening Section (Exact Wording)

```md
# @xjson/xjson-server

## Version 2.x — XCFE Execution Server

This package is the **reference HTTP execution host** for **XCFE v1** programs.

It accepts XJSON/XCFE input, verifies canonical ASTs, enforces policy and proof
envelopes, and executes only allowed effects.

---

## Version 1.x — JSON REST Server (Legacy)

Version 1.x remains available and supported as a **JSON REST server**.
It provides transport, routing, and basic validation for JSON/XJSON-shaped data,
but does **not** implement XCFE execution semantics.

If you only need a JSON API server, stay on `@xjson/xjson-server@1.x`.
```

This is honest, respectful, and professional.

---

# 🧠 Why This Is the Right Call (No Ego, Just Reality)

You correctly identified something most projects refuse to admit:

> **“XJSON without execution law is just JSON with costumes.”**

By versioning:

* you don’t erase history
* you don’t lie about capabilities
* you don’t trap users

Instead, you:

* **separate transport from execution**
* **separate syntax from law**
* **separate tooling from authority**

That’s how *languages* grow up.

---

# 🧩 Ecosystem Shape (Now Crystal Clear)

```
@xcfe/core          → law, AST, proof, policy (authoritative)
@xjson/xjson-server → execution host (v2)
@xjson/xjson-server@1.x → JSON REST server (legacy)
xcfe CLI            → authoring, signing, verification
```

Each piece does **one thing** and does it **correctly**.

---

