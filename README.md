# XCFE

**Executable intelligence as a single, auditable file.**

XJSON is a language and runtime for building AI systems that are transparent, deterministic, and verifiable. Unlike traditional neural networks with opaque weights, XJSON represents intelligence as explicit graph structures that can be inspected, diffed, and proven correct.

## Why XCFE?

| Traditional AI | XJSON |
|----------------|-------|
| Opaque tensor weights | Explicit graph structure |
| Non-deterministic inference | Deterministic execution |
| Requires trust in black box | Auditable and provable |
| Scattered across files | Single-file identity |
| Hard to version/diff | Content-addressable by hash |

## Core Concepts

- **Brain**: A single `.xjson` file containing a complete cognitive identity
- **XCFE**: The execution law governing deterministic inference
- **SCXQ2**: Binary encoding format for efficient runtime execution
- **KUHUL**: The native tensor model with inspectable, first-class tensors
- **KGB-ZK**: Zero-knowledge proof system for verifiable inference

## Quick Start

```bash
# Install CLI
npm install -g @xcfe/cli

# Parse and validate an XJSON file
xcfe parse brain.xjson

# Compute deterministic hash
xcfe hash brain.xjson

# Run inference
xcfe infer brain.xjson --prompt "Hello"

# Verify with policy
xcfe verify brain.xjson --policy policy.json
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        XJSON File                           │
│  (brain.xjson - single file, complete identity)             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      @xcfe/core                             │
│  Parse → Lower → Canonicalize → Hash → Verify               │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
         @xcfe/cli      @xcfe/server    Browser Runtime
         (Terminal)     (REST API)      (WASM/JS)
```

## Packages

| Package | Description |
|---------|-------------|
| [@xcfe/core](./packages/core) | Deterministic language + proof kernel |
| [@xcfe/cli](./packages/cli) | Command-line tools for humans and CI |
| [@xcfe/server](./packages/server) | REST verification and execution gateway |
| [@xcfe/basher](./packages/basher) | Structured command layer |
| [@xcfe/crypto-pack](./packages/crypto-pack) | Cryptographic extensions |
| [@xcfe/mx2lex](./packages/mx2lex) | Grammar compiler |

## Key Properties

**Deterministic**: Same input always produces the same output. No randomness, no hidden state.

**Auditable**: Every inference step can be traced and verified. No black boxes.

**Proof-Carrying**: Inference results include cryptographic proofs of correctness.

**Federatable**: Brains can sync peer-to-peer using content-addressed deltas.

**Single-File**: One file = one identity. Hash it, diff it, version it.

## Documentation

- [Language Specification](./XJSON.md) - Full XJSON language spec and design philosophy
- [Architecture Details](./docs/ARCHITECTURE.md) - Deep dive into system architecture
- [Contributing](./CONTRIBUTING.md) - How to contribute to XJSON
- [API Reference](./NPM.md) - Package APIs and release plan

### Specifications

| Spec | Description |
|------|-------------|
| [KUHUL Core v1](./specs/kuhul-core-v1.md) | Deterministic graph VM |
| [XJSON Mesh v1](./specs/xjson-mesh-v1.md) | P2P federation protocol |
| [Supgram Spec v1](./specs/supgram-spec-v1.md) | Semantic unit specification |
| [KGB-ZK-2](./specs/kgb-zk-2-recursive-aggregation.md) | Zero-knowledge proofs |

## Example

```json
{
  "$schema": "xjson://schema/model/v1",
  "@model": {
    "id": "example-brain",
    "version": "1.0.0"
  },
  "@grams": {
    "hello": { "edges": ["world", "there"] },
    "world": { "edges": ["!"] },
    "there": { "edges": ["friend"] }
  }
}
```

## Browser Demo

The `public_html/brain-demo/` directory contains a browser-native XJSON IDE with:
- Real-time graph visualization
- Inference execution
- P2P federation via WebRTC
- Proof verification

## Status

**Core Language**: FROZEN (v1)
**Packages**: Active development
**Specs**: Locked where noted

## License

[MIT](./LICENSE)
