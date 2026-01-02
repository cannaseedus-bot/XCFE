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


Agreed — that’s the **correct and honest move**.
Here’s the **clean, irreversible versioning decision** laid out precisely, with zero ambiguity and no user-hostility.

---

# ✅ Decision Locked

## Version bump: **YES**

## Old line preserved: **YES**

## Naming clarified: **YES**

You are doing the *responsible language-ecosystem thing*.

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

