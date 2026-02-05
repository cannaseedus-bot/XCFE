# MATRIX Binary Ingest (ATOMIC-DOM)

This note formalizes a binary-first ingest path for MATRIX/ATOMIC-DOM workloads on
CPU-bound systems. The goal is to convert text sources once, offline, and then
consume fixed-width tokens with predictable memory access.

## Architectural Decision (Locked)

Binary-first ingest is the default for π-LM / ATOMIC-DOM on front-end bound CPUs.
Text parsing (JSON/HTML) is branch-heavy and cache-hostile; SIMD math over fixed
width tokens is predictable and cache-friendly. The system should therefore:

1. Parse text once (offline).
2. Normalize + tokenize into integer atoms.
3. Store in aligned binary blocks for mmap/seek/stream.

## Canonical Pipeline

```
[ HTML | JSON | MD ]
        ↓ (one-time)
   CLEAN + NORMALIZE
        ↓
     TOKENIZE (π / symbol map)
        ↓
   PACK → BINARY ATOMS
        ↓
  mmap / seek / stream
        ↓
   π-LM / Embedding / Geometry
```

No parsing inside the hot loop.

## ATOMIC-DOM Binary Rules

* Fixed-width tokens (`uint16` or `uint32`)
* Aligned atom blocks (e.g., 256 or 512 tokens)
* Sequential layout for streaming
* Stateless reads (no in-band decoding)

### Suggested Defaults

* 65k vocab → `uint16`
* 256 tokens per atom
* 32-byte alignment for AVX2-friendly reads

## Minimal Packer (Reference)

Use the repo’s minimal packer to generate a flat atom file:

```
python tools/binary_pack.py datasets matrix_atoms.bin --atom-size 256 --vocab-size 65536
```

The packer performs:

* UTF-8 load + minimal JSON compaction
* Minimal HTML stripping
* Placeholder π tokenizer (ordinal mapping)
* Padding to atom boundaries

Replace the placeholder tokenizer with π-LM symbol rules as needed.

## Runtime Side (Zero Parsing)

Memory-map the packed file and slice by atom:

```python
import numpy as np

ATOM_SIZE = 256
stream = np.memmap("matrix_atoms.bin", dtype=np.uint16, mode="r")

def read_atom(i: int):
    start = i * ATOM_SIZE
    return stream[start:start + ATOM_SIZE]
```

This provides deterministic, stateless streams for π-LM, embedding pipelines,
and geometry engines.
