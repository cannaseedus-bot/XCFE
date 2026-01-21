# SCXQ2 v2 Demo Flow

Below is a concrete demo flow that lines up with `examples/demo.brain.json`.

## 1. SCXQ2 Binary Dump (v2, lane-packed)

### 1.1 Lane Layout (for this demo)

| Lane | Meaning | Contents               |
| ---- | ------- | ---------------------- |
| 0    | DICT    | Supgram IDs            |
| 1    | NODE    | Node → Supgram mapping |
| 2    | EDGE    | Graph edges            |
| 3    | RULE    | Lane thresholds        |
| 4    | META    | Hashes, version        |

### 1.2 Binary Encoding (Annotated)

#### Header (fixed 32 bytes)

```
53 43 58 51  02 00 00 00   // "SCXQ" + v2
05 00 00 00               // lane count = 5
A1 B2 C3 D4 E5 F6 00 00   // brain hash (truncated)
00 00 00 00 00 00 00 00
```

#### Lane 0 — Supgram Dictionary

```
[DICT]
01 S_HELLO
02 S_WORLD
03 S_AI
04 S_IS
05 S_VERIFIABLE
06 S_HELLO_WORLD
07 S_AI_IS
08 S_IS_VERIFIABLE
```

Binary (example):

```
00 08
01 01
02 02
03 03
04 04
05 05
06 06
07 07
08 08
```

#### Lane 1 — Nodes

```
[NODE]
N1 → 01
N2 → 06
N3 → 02
N4 → 03
N5 → 07
N6 → 08
N7 → 05
```

Binary:

```
01 01
02 06
03 02
04 03
05 07
06 08
07 05
```

#### Lane 2 — Edges (core inference graph)

Each edge:

```
[from][to][lane][weight*100]
```

```
01 02 00 92
02 03 00 90
04 05 01 94
05 06 01 91
06 07 02 93
```

Binary:

```
01 02 00 5C
02 03 00 5A
04 05 01 5E
05 06 01 5B
06 07 02 5D
```

#### Lane 3 — Rules

```
lane 0 ≥ 70
lane 1 ≥ 85
lane 2 ≥ 90
```

Binary:

```
00 46
01 55
02 5A
```

#### Lane 4 — Metadata

```
hash = 0xGRAPH_HASH
rules = 0xRULES_HASH
```

Binary (truncated):

```
AA BB CC DD
11 22 33 44
```

### 1.3 Final SCXQ2 Binary (Base64)

```text
U0NYUQIABQAAAAGisrT15fYAAAAAAQABAQICAgMEBQYHCAEBBgIDBAcIBQIBAAJcAgMAWgQFAF4FBgFbBgcCXQBGAVUCWg==
```

This is the artifact the CLI would emit as:

```
demo.brain.scxq2
```

## 2. CLI Demo Output

### 2.1 `brain infer`

```bash
$ brain infer demo.brain.json --query q1
```

Output:

```
[brain] loading demo-brain-v1
[brain] inference mode: graph-walk

query: "ai"
start: N4 (S_AI)

✓ N4 → N5   lane=semantic   weight=0.94 ≥ 0.85
✓ N5 → N6   lane=semantic   weight=0.91 ≥ 0.85
✓ N6 → N7   lane=assertion  weight=0.93 ≥ 0.90

result: "verifiable"
path: [N4, N5, N6, N7]
status: LEGAL
```

### 2.2 `brain prove`

```bash
$ brain prove demo.brain.json --query q1
```

Output:

```
[brain] generating zk inference proof
[brain] committing graph, rules, query

proof:
  type: zk-inference-proof
  path_length: 4
  lanes_verified: [1,2]
  disclosure: none

proof_hash: 0x91fa…c02d
recursive_ready: true

✓ proof generated
```

### 2.3 `brain compress`

```bash
$ brain compress demo.brain.json
```

Output:

```
[brain] encoding SCXQ2 v2 (binary lanes)
[brain] original size: 4.2 KB
[brain] compressed size: 312 bytes

output:
  demo.brain.scxq2
  hash: scxq2:91fa…c02d

✓ compression complete
```

## 3. Federated Second Brain + Merge

### 3.1 `demo2.brain.json` (Second Brain)

Key difference:
Brain B infers:

```
hello → hello world → world
```

```json
{
  "brain": {
    "id": "demo-brain-B",
    "version": "1.0.0"
  },
  "graph": {
    "nodes": {
      "M1": { "supgram": "S_HELLO" },
      "M2": { "supgram": "S_HELLO_WORLD" },
      "M3": { "supgram": "S_WORLD" }
    },
    "edges": [
      { "from": "M1", "to": "M2", "lane": 0, "weight": 0.91 },
      { "from": "M2", "to": "M3", "lane": 0, "weight": 0.89 }
    ]
  }
}
```

### 3.2 `brain merge`

```bash
$ brain merge demo.brain.scxq2 demo2.brain.scxq2
```

Output:

```
[federation] merging brains
  brain A: demo-brain-v1
  brain B: demo-brain-B

✓ graph commits verified
✓ lane rules compatible
✓ no illegal overlaps detected

merged_brain:
  nodes: 10
  edges: 7
  lanes: 3
  federation: true

merged_hash: 0xFED123…
```

### 3.3 Federated Inference Proof

```bash
$ brain prove merged.brain.scxq2 --query q1 --federated
```

Output:

```
[federated] generating hybrid proof
  brain A: hidden
  brain B: hidden

✓ local proofs verified
✓ recursive aggregation complete

final_proof:
  proofs: 2
  size: 384 bytes
  verification: O(1)

proof_root: 0xFED123…
```

## 4. Summary

- SCXQ2 is binary, not conceptual.
- Inference works without embeddings.
- Proofs are path-legal, replayable, and recursive.
- Federation merges brains without trust.
- Everything fits edge/browser/chain constraints.
