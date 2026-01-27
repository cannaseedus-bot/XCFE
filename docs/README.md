# XJSON Documentation

Welcome to the XJSON documentation. This directory contains detailed technical documentation, specifications, and guides.

## Getting Started

If you're new to XJSON, start here:

1. [Main README](../README.md) - Project overview and quick start
2. [Architecture Overview](./ARCHITECTURE.md) - How XJSON works
3. [Language Specification](../XJSON.md) - Full language spec

## Documentation Index

### Architecture & Design

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture deep dive |
| [xjson-runtime-bundle.md](./xjson-runtime-bundle.md) | Runtime bundling and deployment |
| [desktop-tauri.md](./desktop-tauri.md) | Desktop app packaging with Tauri |

### Proof System (KGB)

| Document | Description |
|----------|-------------|
| [kgb-1-spec.md](./kgb-1-spec.md) | KGB v1 proof specification |
| [kgb-1-iso.md](./kgb-1-iso.md) | KGB v1 isolation model |
| [kgb-zk-1-spec.md](./kgb-zk-1-spec.md) | Zero-knowledge proof v1 |
| [kgb-zk-1-circuits.md](./kgb-zk-1-circuits.md) | ZK circuit definitions |
| [kgb-zk-1-verifier.md](./kgb-zk-1-verifier.md) | Verifier implementation |
| [kgb-zk-1-deployment.md](./kgb-zk-1-deployment.md) | Deployment guide |

### Encoding & Format

| Document | Description |
|----------|-------------|
| [scx-glyph-spec.md](./scx-glyph-spec.md) | SCXQ2 glyph specification |
| [prompt-tape-v1.md](./prompt-tape-v1.md) | Prompt tape format |

### Tutorials

| Document | Description |
|----------|-------------|
| [brain-tutor-scxq2.md](./brain-tutor-scxq2.md) | SCXQ2 tutorial |
| [brain-tutor-wireframes.md](./brain-tutor-wireframes.md) | UI wireframes |

### Assets

| Directory | Contents |
|-----------|----------|
| [desktop-assets/](./desktop-assets/) | Desktop app assets |
| [diagrams/](./diagrams/) | Architecture diagrams |
| [figures/](./figures/) | Documentation figures |

## Specifications

Formal specifications are in the [specs/](../specs/) directory:

| Spec | Description |
|------|-------------|
| [kuhul-core-v1.md](../specs/kuhul-core-v1.md) | KUHUL VM specification |
| [xjson-mesh-v1.md](../specs/xjson-mesh-v1.md) | P2P federation protocol |
| [supgram-spec-v1.md](../specs/supgram-spec-v1.md) | Supergram (semantic unit) spec |
| [gram-lane-mapping-v1.md](../specs/gram-lane-mapping-v1.md) | Gram to SCXQ2 lane mapping |
| [scxq2-target-legality-matrix-v1.md](../specs/scxq2-target-legality-matrix-v1.md) | Lane targeting rules |
| [kgb-zk-2-recursive-aggregation.md](../specs/kgb-zk-2-recursive-aggregation.md) | ZK proof aggregation |
| [kgb-zk-2-solidity-verifier.md](../specs/kgb-zk-2-solidity-verifier.md) | On-chain verifier |
| [brain-registry-merge-spec.md](../specs/brain-registry-merge-spec.md) | Brain registry protocol |
| [brain-full-sync-merge.md](../specs/brain-full-sync-merge.md) | Full brain synchronization |
| [training-event-edge-mutation-simulator.md](../specs/training-event-edge-mutation-simulator.md) | Training simulation |

## Other Documentation

| Document | Location | Description |
|----------|----------|-------------|
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Root | Contribution guidelines |
| [NPM.md](../NPM.md) | Root | Package API and release plan |
| [BRAND.md](../BRAND.md) | Root | Brand guidelines |
| [TODO.md](../TODO.md) | Root | Roadmap and missing features |
