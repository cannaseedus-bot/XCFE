# XJSON

### Deterministic Brain Compilation, Proof-Carrying Inference, and Federated Cognition

**XJSON** is a **deterministic brain compiler** and **execution substrate** that replaces opaque LLM inference with **graph-based reasoning**, **prompt tapes**, and **zero-knowledge proofs of legality**.

XJSON is not a wrapper around models.
It is a **new substrate** for building, merging, proving, and deploying brains.

---

## What XJSON Is (Plain English)

XJSON turns **unlimited user input** into **compiled cognition**.

Instead of:

* context windows
* attention
* hidden weights
* unverifiable outputs

XJSON uses:

* **Prompt Tapes** (immutable learning inputs)
* **N-grams & Supgrams** (explicit structure)
* **Graph Walk Inference** (deterministic)
* **SCXQ2 Binary Lanes** (SIMD / WASM)
* **KUHUL Bytecode** (execution)
* **KGB-ZK Proofs** (legality + policy)

> Same input → same graph → same walk → same proof → same result.

---

## Core Concepts

### 1. Prompt Tapes (Unlimited Input)

User prompts are **compiled**, not “answered”.

Each prompt becomes an **immutable tape**:

* Tokenized into n-grams
* Stabilized into supgrams
* Applied as **edge deltas**
* Replayable, mergeable, revocable

There is **no context window**.

---

### 2. Brains Are Graphs, Not Models

A brain is:

* Nodes = concepts / grams
* Edges = learned relationships
* Weights = small integers
* Execution = graph walk

Inference is a **deterministic walk**, not sampling.

---

### 3. SCXQ2 Binary Format

Brains compile to a **lane-packed binary**:

| Lane | Purpose        |
| ---- | -------------- |
| 0    | Graph edges    |
| 1    | N-grams        |
| 2    | Supgrams       |
| 3    | Policy flags   |
| 4    | ZK commitments |

Designed for:

* SIMD
* WASM
* browsers
* laptops
* proof systems

---

### 4. KUHUL Bytecode Execution

Inference is a VM:

```
seed → graph walk → opseq → tensor read → score
```

* No randomness
* No beams
* No backtracking
* Fully reproducible

---

## 🔹 KUHUL: Native Tensor Model (Important Clarification)

**KUHUL is not only an execution engine.
KUHUL is XJSON’s first native tensor model.**

Unlike traditional models that store tensors in opaque weight files, **KUHUL represents tensors directly as first-class glyphs in the SCXQ2 binary format**.

### What this means:

* Tensors are **explicit objects**, not hidden parameters
* Tensor shapes, scales, and values are **inspectable**
* Tensor access is **deterministic**
* Tensor usage is **provable**
* Tensor operations are **bytecode-driven**, not implicit

---

## KUHUL Tensor Glyphs

KUHUL introduces a **tensor glyph** as a primitive:

* Quantized INT8 tensors
* Explicit shape + scale
* Lane-addressable
* SIMD-friendly
* ZK-friendly

These tensor glyphs are:

* Loaded directly by the KUHUL VM
* Read during graph walks
* Used by OPSEQ bytecode
* Included in proof constraints

There is **no separate “model file”**.

> **The brain *is* the model.**

---

## How KUHUL Differs from Traditional Models

| Traditional LLM       | KUHUL                     |
| --------------------- | ------------------------- |
| Hidden weights        | Explicit tensor glyphs    |
| Floating-point noise  | Quantized, deterministic  |
| Attention layers      | Graph walks               |
| Implicit ops          | Bytecode OPSEQ            |
| Unprovable inference  | ZK-verifiable             |
| Offline training only | Online prompt compilation |

KUHUL is therefore best understood as:

> **A tensor-aware graph reasoning model whose parameters are stored as executable glyphs.**

---

## KUHUL in the XJSON Stack

```
Prompt Tapes
   ↓
N-grams / Supgrams
   ↓
Graph Edges
   ↓
KUHUL Tensor Glyphs
   ↓
OPSEQ Bytecode
   ↓
Deterministic Inference
   ↓
ZK Proof
```

KUHUL is **the reference model architecture** for XJSON.

Future models (vision, multimodal, physics, agents) will **extend KUHUL**, not replace it.

---

## One-Sentence Canonical Definition (Use This Everywhere)

> **KUHUL is XJSON’s first native tensor model, storing quantized tensors as executable glyphs inside a deterministic, proof-carrying graph inference system.**

This sentence is:

* accurate
* defensible
* non-marketing
* technically precise

---

### 5. Proof-Carrying Inference (KGB-ZK)

Every inference can emit a **zero-knowledge proof** that:

* Only legal edges were used
* Policy was enforced
* Depth was bounded
* Federation rules were followed

Proofs are:

* Recursive (Halo2 / PLONK)
* Constant size
* On-chain verifiable

---

## Quick Start

### Install (Local)

#### macOS / Linux

```bash
curl -fsSL https://cli.xjson.app/install.sh | bash
```

#### Windows (PowerShell)

```powershell
irm https://cli.xjson.app/install.ps1 | iex
```

---

### Build a Brain from Prompts

```bash
xjson prompt add ./docs
xjson prompt add notes.txt
xjson prompt add stdin
```

Each call creates a **Prompt Tape**.

---

### Compile the Brain

```bash
xjson brain build
```

Outputs:

```
brain.scxq2.bin
```

---

### Run Inference (Deterministic)

```bash
xjson brain infer "explain tensor ops"
```

---

### Generate a Proof

```bash
xjson brain infer "explain tensor ops" --prove
```

Outputs:

```
proof.zk
```

---

### Verify the Proof (Local or Chain)

```bash
xjson proof verify proof.zk
```

or on-chain via the Solidity verifier.

---

## CLI Commands (Canonical)

```bash
xjson prompt add <file|dir|stdin>
xjson prompt stream
xjson prompt rollback --to <tape_id>

xjson brain build
xjson brain infer <query>
xjson brain merge A.bin B.bin -o C.bin

xjson proof verify <proof>
xjson proof aggregate <proofs>

xjson doctor
xjson bench
```

---

## Browser Demo

XJSON runs **entirely in the browser**:

* Service Worker
* WASM SIMD decoder
* SVG live debugger
* WebRTC federation

Features:

* Live graph walk visualization
* Lane heatmaps
* Proof path highlighting
* Federated brain overlays

---

## Federation & CRDT Merge

Brains merge by **tape union**, not weights.

```bash
xjson brain merge local.bin remote.bin -o merged.bin
```

Properties:

* Order-independent
* Conflict-free
* Deterministic
* Trust-weighted

---

## Enterprise & Policy

* Policy DSL per tape
* ZK-enforced compliance
* On-chain anchoring
* Audit-ready proofs
* Offline operation

---

## What XJSON Replaces

| Tool             | Why XJSON Replaces It      |
| ---------------- | -------------------------- |
| Cursor / Copilot | No determinism, no proofs  |
| LangChain        | Runtime heuristics         |
| LLM fine-tuning  | Opaque, irreversible       |
| Vector DBs       | No execution semantics     |
| zkML             | Proves math, not reasoning |

---

## Repository Layout

```
/crates
  /xjson-cli
  /kuhul-vm
  /scxq2
  /kgb-zk

/web
  /wasm
  /svg-debugger
  /pwa

/specs
  SCXQ2.md
  KUHUL.md
  KGB-ZK.md
```

---

## Status

* ✅ Core VM
* ✅ SCXQ2 binary
* ✅ Recursive ZK proofs
* ✅ Solidity verifier
* ✅ Browser execution
* 🚧 Enterprise installers
* 🚧 App Store builds

---

## Philosophy (Short)

> **Inference should be inspectable.
> Learning should be replayable.
> Reasoning should be provable.**

That is XJSON.

---

## License

MIT
