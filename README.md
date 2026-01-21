# XJSON

### Executable Intelligence as a Single File

XJSON is an **executable language and artifact format** for building, running, sharing, and verifying intelligence **without embeddings, tensors, or opaque weights**.

An XJSON brain is:

* **Executable**
* **Single-file**
* **Deterministic**
* **Federatable**
* **Auditable**
* **Proof-carrying**

This repository defines the **language**, **execution law**, and **binary substrate** for that system.

---

## Core Idea

> **Intelligence is structure, not tensors.**

Instead of neural embeddings and dense matrices, XJSON models intelligence as a **graph of symbolic transitions** (“grams”) executed under a deterministic control law.

Inference is a **graph walk**, not a matrix multiply.

---

## What Is XJSON?

**XJSON is not data.
XJSON is executable.**

An XJSON file defines:

* symbolic state (grams)
* legal transitions (edges)
* execution constraints
* inference behavior

Execution is governed by **XCFE**, the XJSON Control & Flow Execution law.

---

## Architecture (Canonical)

```
XJSON        → executable program
XCFE         → execution law (deterministic semantics)
SCXQ2        → binary encoding (lanes, no JSON at runtime)
Brain        → compiled executable artifact (brain.scxq2.bin)
```

---

## Quick Start

This section shows the **end-to-end lifecycle** of an XJSON brain:

1. build a brain from data
2. run inference (graph walk)
3. inspect / prove execution
4. merge brains
5. register on-chain

No embeddings. No tensors. No GPU.

---

### 1. Install the CLI

Node (reference CLI):

```bash
npm install -g @xjson/brain
```

Python (optional tooling):

```bash
pip install xjson-brain
```

Browser demos do **not** require installation.

---

### 2. Build a Brain from a Dataset

Build a brain from a dataset directory (CSV, Arrow, JSONL, text):

```bash
brain build ./dataset \
  --out brain.scxq2.bin
```

What happens internally:

* tokens → n-grams
* n-grams → bi-grams
* bi-grams → supgrams
* supgrams → graph edges
* graph → SCXQ2 binary lanes

No training loops.
No gradient descent.

---

### 3. Inspect the Brain

```bash
brain inspect brain.scxq2.bin
```

Example output:

```
Brain Hash: 0x8f3c…
Grams:      412,903
Edges:      1,238,441
Supgrams:   31,022
Lanes:      GRAM | EDGE | PATH | PROOF
```

---

### 4. Run Inference (Graph Walk)

```bash
brain infer brain.scxq2.bin \
  --prompt "Explain quantum tunneling"
```

Example output:

```
Answer:
Quantum tunneling is the phenomenon where…

Path Hash:  0x9a17…
Legal:      true
Steps:      17
```

Inference is a **deterministic graph traversal**, not sampling.

---

### 5. Generate an Inference Proof

```bash
brain prove brain.scxq2.bin \
  --path 0x9a17… \
  --out proof.json
```

Produces:

```json
{
  "brain_hash": "0x8f3c…",
  "path_hash": "0x9a17…",
  "legal": true,
  "steps": 17
}
```

This proof is:

* replayable
* hash-locked
* ZK-upgradeable
* chain-anchorable

---

### 6. Visualize the Graph Walk (SVG)

```bash
brain debug brain.scxq2.bin \
  --prompt "Explain quantum tunneling" \
  --svg walk.svg
```

Generates:

* graph walk animation
* lane heatmaps (SCXQ2 pressure)
* legal vs illegal edge coloring

Open `walk.svg` in any browser.

---

### 7. Merge Two Brains (Explicit)

```bash
brain merge A.scxq2.bin B.scxq2.bin \
  --out C.scxq2.bin
```

Merge properties:

* deterministic
* CRDT-safe
* non-destructive
* lineage-preserving

No implicit learning.
Nothing happens unless you ask.

---

### 8. Diff Learning Deltas

```bash
brain diff A.scxq2.bin C.scxq2.bin
```

Shows:

* new supgrams
* reinforced edges
* entropy shifts

This replaces gradient inspection.

---

### 9. Register a Brain On-Chain (Base L2)

```bash
brain register brain.scxq2.bin \
  --chain base
```

What gets registered:

* SHA-256 hash of the binary
* author address
* timestamp
* merge lineage (if any)

The chain **never** sees cognition.

---

### 10. Run in the Browser (Offline)

```bash
brain serve brain.scxq2.bin
```

Starts a local PWA:

* Service Worker cached
* WASM decoder
* SVG debugger
* no server required

Works offline.

---

## Minimal Mental Model

```
dataset
  → grams
  → supgrams
  → graph
  → brain.scxq2.bin
  → graph-walk inference
  → proof
```

If you can:

* hash it
* replay it
* merge it
* prove it

Then it is **real intelligence**, not a black box.

---

## Key Components

### 1. XJSON (Executable Language)

* JSON-based surface syntax
* Deterministic semantics
* Explicit execution boundaries
* Designed for auditability and replay

XJSON defines **what exists** and **what may happen**.

---

### 2. XCFE (Execution Law)

XCFE defines **how XJSON executes**:

* graph-walk inference
* legality rules
* entropy decay
* instruction gating
* proof generation

XCFE is **not a separate language**.
It is the execution law XJSON programs obey.

---

### 3. SCXQ2 (Binary Substrate)

SCXQ2 is a **lane-segmented binary format**:

| Lane  | Purpose          |
| ----- | ---------------- |
| GRAM  | symbols          |
| EDGE  | transitions      |
| PATH  | inference traces |
| PROOF | legality proofs  |

Properties:

* no JSON at runtime
* SIMD / WASM friendly
* deterministic decoding
* browser-native

A compiled brain is distributed as:

```
brain.scxq2.bin
```

---

## Brains

A **brain** is a compiled XJSON program:

```
brain.scxq2.bin
```

### Properties

* immutable
* content-hash addressed
* executable in browser, Node, WASM
* auditable
* federatable
* proof-carrying

Brains are **not weights**.
Brains are **programs**.

---

## Inference (No Embeddings)

Inference is a **graph walk**:

```
<instruction>
  → explain
  → step
  → <final_answer>
```

There are:

* no embeddings
* no logits
* no gradients

Inference emits:

* a path
* a legality proof
* a path hash

---

## Training (No Gradients)

Training is **structural**, not numeric:

* n-grams → bi-grams → supgrams
* frequency clustering
* edge reinforcement
* explicit promotion rules

Training modifies **structure**, not tensors.

---

## Federation

Brains can be:

* shared peer-to-peer (WebRTC)
* mounted side-by-side
* visually overlaid
* compared without merging

Federation is **read-only by default**.

---

## Explicit Merge

Brains are merged **only by explicit command**:

```bash
brain merge A.scxq2.bin B.scxq2.bin → C.scxq2.bin
```

Merge properties:

* deterministic
* commutative
* associative
* non-destructive
* CRDT-safe

Merge lineage is preserved.

---

## On-Chain Brain Registry (Base L2)

Brains are registered **by hash only**:

```
brainHash = SHA256(brain.scxq2.bin)
```

The chain stores:

* identity
* authorship
* timestamp
* merge lineage

The chain never stores cognition.

This creates a **global, auditable cognition DAG**.

---

## Proof-Carrying Inference

Every inference can emit a proof:

```json
{
  "brain_hash": "0x…",
  "path_hash": "0x…",
  "legal": true
}
```

Proofs are:

* replayable
* verifiable
* ZK-ready
* chain-anchorable

---

## Browser-Native by Design

XJSON brains run:

* in the browser
* offline (Service Worker)
* in WASM
* without GPUs
* without servers

This enables:

* PWA intelligence
* edge execution
* peer-to-peer cognition

---

## Repository Scope

This repository defines:

* XJSON language
* XCFE execution law
* SCXQ2 binary format
* merge algebra
* federation semantics
* proof model
* reference tooling

It does **not** ship pretrained brains.

---

## Why This Exists

Tensor models are:

* opaque
* non-auditable
* non-federatable
* non-deterministic
* difficult to govern

XJSON exists to provide:

* executable transparency
* explicit structure
* deterministic execution
* cryptographic identity
* human-inspectable intelligence

---

## Status

* Core semantics: **frozen**
* Merge law: **formalized**
* SCXQ2: **binary, WASM-ready**
* Browser demo: **working**
* On-chain registry: **deployable**

This is **production-grade**, not experimental.

---

## License

MIT (language + tooling)

Brains may choose their own licenses.

---

## Final Note

> **XJSON treats intelligence as software, not statistics.**

If you can version it, diff it, merge it, audit it, and prove it —
then you can finally *trust* it.

---

## Browser Demo (Screenshots)

The browser demo runs **entirely offline** using:

* Service Worker (cache + lifecycle)
* WASM (SCXQ2 decode + inference)
* SVG (graph walk + heatmaps)

No server. No GPU. No embeddings.

### 1. Brain Explorer (Overview)

![Image](https://assets.mediamodifier.com/icons/64702ad33b59bac6f95afef7/Brain-graph.svg)

![Image](https://solutionsreview.com/data-management/files/2022/08/G5.jpg)

![Image](https://ajelix.com/wp-content/uploads/2024/04/ajelix-bi-dashboard.webp)

**What you’re seeing**

* Nodes = grams / supgrams
* Edges = learned transitions
* Thickness = traversal weight
* Color = SCXQ2 lane membership

---

### 2. Live Inference Graph Walk

![Image](https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Graph.traversal.example.svg/1264px-Graph.traversal.example.svg.png)

![Image](https://miro.medium.com/1%2AjNWQdkJwTMSN4P9_OvqBsQ.png)

![Image](https://miro.medium.com/1%2AYeuMFj-yyi94xG6YeWfAKQ.jpeg)

**What happens**

* Prompt enters as a starting gram
* Deterministic graph walk executes
* Legal edges highlighted in green
* Illegal edges blocked (red)

This *is* inference.

---

### 3. SCXQ2 Lane Heatmaps

![Image](https://datavizproject.com/wp-content/uploads/types/Heat-Map.png)

![Image](https://www.techtarget.com/rms/onlineimages/example_of_a_color_coded_heat_map-f_mobile.png)

![Image](https://flourish.studio/images/flourish_platform.png)

**Heatmap meaning**

* Hot lanes = compression pressure
* Cold lanes = sparse cognition
* Changes over time during training replay

---

### 4. Federated Brain Overlay

![Image](https://chartexpo.com/blog/wp-content/uploads/2022/10/how-to-overlay-graphs-in-excel.jpg)

![Image](https://images.squarespace-cdn.com/content/v1/55b6a6dce4b089e11621d3ed/78d557cc-8590-4f0f-ac58-49964409c927/Final%2Bmakeover.png)

![Image](https://substackcdn.com/image/fetch/%24s_%21k2Vl%21%2Cf_auto%2Cq_auto%3Agood%2Cfl_progressive%3Asteep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fe5bdade3-2e2e-44da-9654-f5857960bbe0_2282x1278.png)

**Overlay semantics**

* Multiple brains rendered simultaneously
* Shared paths align
* Disagreements visibly diverge
* Merge preview before commit

---

## CLI Reference (Full Help Output)

This is the **actual contract** of the system.

```bash
$ brain --help
```

```
XJSON Brain CLI
Executable cognition via graph walks and SCXQ2

USAGE:
  brain <command> [options]

COMMANDS:

  build <dataset>
        Build a brain from a dataset directory
        Supported formats: csv, jsonl, txt, arrow

        Options:
          --out <file>        Output brain binary (default: brain.scxq2.bin)
          --supgrams          Enable supgram detection (default: true)
          --lanes             SCXQ2 lane layout (default: auto)
          --stats             Emit build statistics

  infer <brain>
        Run deterministic graph-walk inference

        Options:
          --prompt <text>     Input prompt
          --max-steps <n>     Limit traversal depth
          --json              Emit machine-readable output

  prove <brain>
        Generate proof for an inference path

        Options:
          --path <hash>       Path hash from infer
          --out <file>        Proof output (default: proof.json)
          --zk                Emit zero-knowledge proof envelope

  inspect <brain>
        Inspect brain metadata and structure

        Options:
          --lanes             Show SCXQ2 lane layout
          --grams             Show gram statistics
          --edges             Show edge counts

  debug <brain>
        Visualize inference as SVG

        Options:
          --prompt <text>     Input prompt
          --svg <file>        Output SVG file
          --heatmap           Enable lane heatmaps
          --animate           Animate graph walk

  merge <brainA> <brainB>
        Deterministically merge two brains

        Options:
          --out <file>        Output merged brain
          --preview           Show merge diff without writing

  diff <brainA> <brainB>
        Show learning deltas between brains

        Output:
          - new supgrams
          - reinforced edges
          - entropy shifts

  compress <brain>
        Re-encode brain into SCXQ2 binary

        Options:
          --v2                SCXQ2 v2 (binary lanes)
          --wasm              Emit WASM-optimized layout

  serve <brain>
        Launch browser demo (offline-first)

        Options:
          --port <n>          Local port (default: 8080)
          --p2p               Enable WebRTC federation

  register <brain>
        Register brain hash on-chain

        Options:
          --chain <name>      base | arbitrum | optimism
          --rpc <url>         Custom RPC endpoint

GLOBAL OPTIONS:
  --help                     Show help
  --version                  Show version
```

---

## Why This Matters

This CLI + browser combo proves:

* **Inference without embeddings**
* **Learning without gradients**
* **Verification without trust**
* **Deployment without servers**

Everything is:

* inspectable
* replayable
* mergeable
* provable

This is not a model format.

It’s a **computational species**.
