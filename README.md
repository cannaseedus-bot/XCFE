<p align="center">
  <img src="xjson-logo.svg" alt="XJSON Logo" width="128" height="128">
</p>

<h1 align="center">XJSON / XCFE</h1>

<p align="center">
  <strong>Deterministic, Verifiable, Proof-Based Program Execution</strong>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#packages">Packages</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#license">License</a>
</p>

---

## What is XJSON/XCFE?

**XJSON** is a structured, indentation-based language for defining executable workflows. **XCFE** (eXtensible Code Flow Engine) is the deterministic runtime and proof system that powers it.

Key properties:

- **Deterministic**: Same input → same AST → same bytes → same hash
- **Verifiable**: All programs can be verified against policy before execution
- **Proof-Based**: Ed25519 signed proof envelopes for non-repudiation
- **Policy-Enforced**: Default-deny execution with explicit capability grants

## Example

```xjson
@http.get
  url: "https://api.example.com/data"
  headers:
    Authorization: "Bearer {{ ctx.token }}"
  then:
    @log
      message: "Received: {{ response.status }}"
    @set
      result: {{ response.body }}
  on_error:
    @log
      message: "Error: {{ error.message }}"
```

## Installation

```bash
# Install CLI globally
npm install -g @xcfe/cli

# Or install packages individually
npm install @xcfe/core      # Core kernel
npm install @xcfe/server    # Verification server
npm install @xcfe/basher    # Structured command layer
npm install @xcfe/crypto-pack  # Crypto extensions
```

## Quick Start

### Parse and Verify a Program

```bash
# Parse to surface IR
xcfe parse program.xjson

# Lower to canonical AST
xcfe ast program.xjson

# Compute deterministic hash
xcfe hash program.xjson

# Verify structure
xcfe verify program.xjson --policy policy.json
```

### Sign and Prove

```bash
# Generate a keypair
xcfe keygen --out device.key.json

# Export seed to environment
export XCFE_ENV_DEVICE_MASTER=$(jq -r .seed device.key.json)

# Sign a program
xcfe sign program.xjson \
  --policy policy.json \
  --kid xcfe://kid/device \
  --key env://device/master \
  --out proof.envelope.json

# Verify proof
xcfe prove proof.envelope.json
```

### Run Verification Server

```bash
# Start the server
node packages/server/src/server.js

# Health check
curl http://localhost:8080/xcfe/health

# Verify a program
curl -X POST http://localhost:8080/xcfe/verify \
  -H "Content-Type: application/json" \
  -d '{"source": "@log\n  message: \"hello\""}'
```

## Packages

| Package | Description |
|---------|-------------|
| `@xcfe/core` | Deterministic kernel: parser, AST, hashing, verification, proofs |
| `@xcfe/cli` | Command-line tools: parse, ast, hash, verify, sign, prove, keygen |
| `@xcfe/server` | HTTP verification gateway with auth adapter |
| `@xcfe/basher` | Structured XCFE command layer (not a shell) |
| `@xcfe/crypto-pack` | Session binding, SCX chains, crypto schemas |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        XCFE Ecosystem                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────────┐   │
│  │  @xcfe/cli  │   │@xcfe/server │   │  @xcfe/crypto-pack  │   │
│  │             │   │             │   │                     │   │
│  │ • parse     │   │ • /verify   │   │ • session-binding   │   │
│  │ • ast       │   │ • /hash     │   │ • scx-chain         │   │
│  │ • hash      │   │ • /execute  │   │ • key-wrap          │   │
│  │ • verify    │   │ • /proof    │   │                     │   │
│  │ • sign      │   │             │   │                     │   │
│  └──────┬──────┘   └──────┬──────┘   └──────────┬──────────┘   │
│         │                 │                     │               │
│         └────────────┬────┴─────────────────────┘               │
│                      │                                          │
│              ┌───────▼───────┐                                  │
│              │  @xcfe/core   │                                  │
│              │               │                                  │
│              │ • parseSurface│                                  │
│              │ • lowerToAst  │                                  │
│              │ • canonicalize│                                  │
│              │ • hashAst     │                                  │
│              │ • verifyProof │                                  │
│              │ • buildBind   │                                  │
│              └───────────────┘                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Core Concepts

### Programs

XJSON programs are structured as exec statements (`@verb`) with parameters and control flow labels:

```xjson
@if
  condition: {{ ctx.ready }}
  then:
    @log
      message: "Ready!"
  else:
    @log
      message: "Not ready"
```

### Policy

Policies control what verbs a program can use:

```json
{
  "@type": "xcfe.policy",
  "@version": "1.0.0",
  "grants": [
    { "verb": "@http.get", "allow": true },
    { "verb": "@log", "allow": true }
  ],
  "limits": {
    "max_exec_depth": 10,
    "timeout_ms": 5000
  },
  "default_deny": true
}
```

### Proof Envelopes

Proof envelopes bind programs to signatures:

```json
{
  "@type": "xcfe.proof.envelope",
  "@version": "1.0.0",
  "program": {
    "program_hash": "sha256:...",
    "ast_hash": "sha256:..."
  },
  "signer": {
    "alg": "ed25519",
    "kid": "xcfe://kid/device",
    "pub": "base64:..."
  },
  "binding": {
    "bind_hash": "sha256:..."
  },
  "signature": {
    "sig": "base64:..."
  }
}
```

## Version History

### Version 2.x — XCFE Execution Server

The current version is the **reference HTTP execution host** for **XCFE v1** programs. It accepts XJSON/XCFE input, verifies canonical ASTs, enforces policy and proof envelopes, and executes only allowed effects.

### Version 1.x — JSON REST Server (Legacy)

Version 1.x remains available as a **JSON REST server**. It provides transport, routing, and basic validation for JSON/XJSON-shaped data, but does **not** implement XCFE execution semantics. If you only need a JSON API server, stay on `@xjson/xjson-server@1.x`.

## Documentation

- [NPM.md](NPM.md) - Complete npm package documentation, API reference, and future plans
- [XJSON.md](XJSON.md) - XJSON language specification
- [BRAND.md](BRAND.md) - Brand guidelines and assets

## Security

XCFE is designed with security as a core principle:

- **No eval**: Programs are parsed, not evaluated as code
- **No I/O in core**: The kernel has no side effects
- **Policy enforcement**: Default-deny with explicit grants
- **Proof verification**: Ed25519 signatures on canonical hashes
- **Session binding**: Optional OAuth/SecuroLink integration

Report security issues to the maintainers privately.

## Contributing

```bash
# Clone the repository
git clone https://github.com/cannaseedus-bot/XJSON.git
cd XJSON

# Install dependencies
pnpm install

# Run tests
pnpm test
```

See [NPM.md](NPM.md#contributing) for detailed contribution guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  <sub>Built with precision. Verified by design.</sub>
</p>
