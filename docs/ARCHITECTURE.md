# XJSON Architecture

This document provides a deep dive into the XJSON system architecture, execution model, and design philosophy.

## Table of Contents

- [Design Philosophy](#design-philosophy)
- [System Layers](#system-layers)
- [KUHUL Execution Model](#kuhul-execution-model)
- [Data Structures](#data-structures)
- [Proof System (KGB-ZK)](#proof-system-kgb-zk)
- [Federation Protocol](#federation-protocol)
- [Package Architecture](#package-architecture)

---

## Design Philosophy

### Core Invariants

1. **Structure is authoritative** - The XJSON file defines meaning, not the runtime
2. **Execution never defines meaning** - Runtimes conform to structure, they don't invent semantics
3. **Specifications outrank implementations** - If spec and code disagree, spec wins
4. **One file = one mind** - A brain is a complete, self-contained identity

### Split-Authority Model

XJSON is a split-authority language:

- **Declarative existence**: `[]` defines what exists
- **Executable causality**: `{{ }}` defines what happens
- **Control vectors**: `@` prefixes first-class XCFE directives
- **Order = flow**: Sequence matters, not just nesting

---

## System Layers

```
┌─────────────────────────────────────────────────────┐
│                    XJSON File                       │
│            (Human-readable source)                  │
└─────────────────────────────────────────────────────┘
                         │
                         ▼ parse
┌─────────────────────────────────────────────────────┐
│                       AST                           │
│           (Abstract Syntax Tree)                    │
└─────────────────────────────────────────────────────┘
                         │
                         ▼ lower
┌─────────────────────────────────────────────────────┐
│                     SCXQ2                           │
│           (Binary encoding, lanes)                  │
└─────────────────────────────────────────────────────┘
                         │
                         ▼ execute
┌─────────────────────────────────────────────────────┐
│                     KUHUL                           │
│          (Deterministic graph VM)                   │
└─────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Format | Purpose |
|-------|--------|---------|
| XJSON | `.xjson` (JSON) | Human authoring, inspection, diffing |
| AST | Internal | Validation, canonicalization, hashing |
| SCXQ2 | `.scxq2.bin` | Runtime execution, no JSON parsing |
| KUHUL | VM state | Deterministic graph walk execution |

---

## KUHUL Execution Model

KUHUL is the deterministic graph virtual machine at the heart of XJSON.

### Execution Flow

```
SEED → GRAPH WALK → OPS → TENSOR READS → SCORE → EMIT
```

### Key Properties

- **No stacks, no recursion** - Flat execution model
- **No hidden state** - All state is explicit and inspectable
- **Deterministic traversal** - Same input = same walk = same output
- **Read-only tensors** - Tensors are only mutated during training, never inference
- **No randomness** - No beam search, sampling, or backtracking

### Graph Components

**Nodes**
- Contain edges to other nodes
- May have operations attached
- May reference tensor data

**Edges**
- Weighted (i16 values)
- Directed
- Lane-designated (which SCXQ2 lane they belong to)

**Runtime State**
- Program counter (current node)
- Energy budget (execution limit)
- Visited set (cycle detection)
- Accumulated score

### Inference Algorithm

```
1. Start at seed node
2. While energy > 0:
   a. Get outgoing edges from current node
   b. Apply novelty penalties to visited edges
   c. Select highest-scoring legal edge
   d. Move to target node
   e. Execute node operations
   f. Accumulate score
   g. Decrement energy
3. Emit result
```

---

## Data Structures

### Grams

Grams are first-class memory units - addressable, inspectable, and replayable.

| Type | Description | Example |
|------|-------------|---------|
| Unigram | Single token | `"the"` |
| Bigram | Token pair | `"th"` |
| Supergram | Semantic group | `["the", "meaning", "of", "life"]` |
| Glyph-gram | Visual symbol | Unicode glyph reference |
| Control gram | Execution directive | `@halt`, `@yield` |

### Brain Structure

```json
{
  "$schema": "xjson://schema/model/v1",
  "@model": {
    "id": "brain-id",
    "version": "1.0.0",
    "created": "2025-01-01T00:00:00Z"
  },
  "@grams": {
    "gram-id": {
      "edges": [...],
      "weight": 100,
      "ops": [...]
    }
  },
  "@tensors": {
    "tensor-id": {
      "shape": [128, 64],
      "dtype": "int8",
      "scale": 0.01,
      "data": "base64..."
    }
  }
}
```

### SCXQ2 Lanes

SCXQ2 organizes data into parallel lanes for efficient access:

| Lane | Purpose |
|------|---------|
| Syntax | Token/grammar structure |
| Semantic | Meaning relationships |
| Assertion | Logical claims |
| Control | Execution directives |
| Tensor | Numeric data references |

---

## Proof System (KGB-ZK)

KGB-ZK provides zero-knowledge proofs for XJSON operations.

### Proof Types

**KGB-ZK-1**: Single inference proof
- Proves one inference path is legal
- Includes: input hash, output hash, path trace

**KGB-ZK-2**: Recursive aggregation
- Aggregates multiple KGB-ZK-1 proofs
- Enables batch verification
- On-chain verifiable via Solidity

### Proof Envelope

```json
{
  "version": "kgb-zk-2",
  "brain_hash": "sha256:...",
  "input_hash": "sha256:...",
  "output_hash": "sha256:...",
  "proof": "base64...",
  "timestamp": "2025-01-01T00:00:00Z"
}
```

### Verification Flow

```
1. Receive proof envelope
2. Verify brain hash matches known brain
3. Verify input hash matches query
4. Verify ZK proof
5. Accept output as valid
```

---

## Federation Protocol

XJSON brains can synchronize peer-to-peer using the Mesh protocol.

### Content Addressing

Every brain has a unique hash:
```
brain_hash = SHA256(canonical(brain))
```

### Deltas

Changes between brains are expressed as deltas:
```json
{
  "from": "sha256:abc...",
  "to": "sha256:def...",
  "ops": [
    {"add_gram": {...}},
    {"update_edge": {...}}
  ],
  "proof": "..."
}
```

### Mesh Protocol

1. **Discovery**: Peers announce available brains
2. **Request**: Peer requests brain or delta
3. **Transfer**: Brain/delta sent with proof
4. **Verify**: Recipient verifies proof
5. **Merge**: Apply delta to local state

Transport: WebRTC DataChannel (browser) or TCP (server)

---

## Package Architecture

### Dependency Graph

```
                    @xcfe/core
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
    @xcfe/cli     @xcfe/server   @xcfe/basher
         │              │
         ▼              ▼
  @xcfe/crypto-pack  @xcfe/mx2lex
```

### Package Responsibilities

**@xcfe/core** (no dependencies)
- Pure, deterministic operations
- No I/O, no side effects
- Parse, lower, canonicalize, hash, verify

**@xcfe/cli**
- Human and CI interface
- Wraps core with file I/O
- Commands: parse, hash, verify, sign, prove

**@xcfe/server**
- REST API gateway
- Verification endpoint
- Execution (with proof requirement)

**@xcfe/basher**
- Structured command layer
- Commands lower to XJSON programs
- Auditable scripts

**@xcfe/crypto-pack**
- Optional cryptography
- EdDSA, secp256k1 signing
- Key management

**@xcfe/mx2lex**
- Grammar compiler
- XJSON grammar definitions
- Lexer generation

---

## Further Reading

- [KUHUL Core Spec](../specs/kuhul-core-v1.md)
- [XJSON Mesh Spec](../specs/xjson-mesh-v1.md)
- [KGB-ZK-2 Spec](../specs/kgb-zk-2-recursive-aggregation.md)
- [Language Specification](../XJSON.md)
