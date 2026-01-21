# Contributing to XJSON

Thank you for your interest in contributing to **XJSON**.

XJSON is a **language and standard**, not just a software project.
As such, contributions are governed by **strict authority boundaries** to preserve determinism, auditability, and long-term stability.

Please read this document carefully before submitting changes.

---

## 1. Core Principles

All contributions must respect the following invariants:

1. **Structure is authoritative**
2. **Execution never defines meaning**
3. **Specifications outrank implementations**
4. **Backward compatibility is explicit**
5. **No silent semantic changes**

If a change violates any of these, it will not be accepted.

---

## 2. Repository Authority Model

Different repositories have **different levels of authority**.

| Repository         | Authority Level | What Can Change                  |
| ------------------ | --------------- | -------------------------------- |
| `xjson-spec`       | **LAW**         | Only via versioned spec updates  |
| `xjson-schema`     | **GATE**        | New versions only, never edits   |
| `xjson-validator`  | **REFERENCE**   | Must match spec + schema exactly |
| `scxq2`            | **RUNTIME LAW** | Versioned, spec-driven           |
| `xjson-playground` | **PROJECTION**  | UI / demos only                  |

> **No implementation may override a spec.
> No demo may override a validator.**

---

## 3. Contribution Types

### 3.1 Specification Changes (`xjson-spec`)

**Requirements:**

* MUST include version bump justification
* MUST clearly state backward compatibility impact
* MUST update normative language only (no examples-as-law)
* MUST NOT modify existing frozen versions

**Process:**

1. Open an issue describing the change
2. Discuss impact and necessity
3. Submit PR with new versioned document

---

### 3.2 Schema Changes (`xjson-schema`)

Schemas are **immutable once published**.

**Allowed:**

* Adding a new schema version directory (e.g. `v2/`)
* Adding clarifying comments

**Not allowed:**

* Editing existing schema files
* Loosening validation rules retroactively

---

### 3.3 Validator Contributions (`xjson-validator`)

Validators are **reference implementations**.

**Requirements:**

* MUST pass the golden test corpus
* MUST NOT add permissive behavior
* MUST match schema and spec exactly
* MUST be deterministic

If two validators disagree, the **spec wins**.

---

### 3.4 Runtime Contributions (`scxq2`)

Runtime work must:

* Reference a specific SCXQ2 version
* Preserve binary compatibility guarantees
* Include conformance tests
* Avoid heuristic decoding

---

### 3.5 Playground / UI (`xjson-playground`)

This repo is for:

* demos
* visualization
* education
* projection layers (Tyson / Chomsky)

**Not allowed:**

* changing model semantics
* bypassing validation
* altering inference logic

---

## 4. Golden Test Corpus Rule

Any change that affects validation or parsing:

* MUST include new golden test cases
* MUST NOT break existing golden tests
* MUST document expected outcomes

Golden tests are **binding**.

---

## 5. Versioning Rules

* **Spec versions** are immutable once frozen
* **Schema versions** are immutable
* **Validator versions** track spec compatibility
* **Runtime versions** are explicit and side-by-side

There are **no rolling changes**.

---

## 6. Code of Conduct (Short)

* Be precise
* Be respectful
* Argue from structure, not preference
* Assume good faith
* Avoid hype

XJSON values **clarity over novelty**.

---

## 7. Final Reminder

> XJSON is designed to outlive individual tools, runtimes, and contributors.

If a contribution improves **short-term convenience** at the cost of **long-term determinism**, it will not be accepted.
