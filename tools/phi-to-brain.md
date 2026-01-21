# Phi → XJSON Brain Generator

This utility converts a Phi-style folder (MLC build artifacts with tokenizer files) into a
minimal, embedding-free XJSON brain. The output aligns with `xjson-model-schema-v1.xjson`
and preserves provenance metadata without touching or interpreting tensor weights.

## What it produces

- `brain.json` (or your chosen output path)
- **No tensors** are read. The tool only inspects tokenizer files, config metadata,
  and file manifests.

## Usage

```bash
node tools/phi-to-brain.mjs <phi-folder> [output-file] [--max-hash-mb N]
```

### Example

```bash
node tools/phi-to-brain.mjs ./phi-3-instruct brain.json --max-hash-mb 64
```

## Inputs it expects

- `tokenizer.json` **(required)**
- `tokenizer_config.json` (optional)
- `added_tokens.json` (optional)
- `ndarray-cache.json` (optional)
- `tensor-cache.json` (optional)
- `mlc-chat-config.json` (optional)
- `logs.txt` (optional)

## Output overview

- `@grams` are derived from `tokenizer.json` + `added_tokens.json`.
- Tokens in `tokenizer_config.json` and `added_tokens.json` marked as special
  are flagged as `control` grams.
- `@decode.checksum` is computed from a stable summary payload (build + grams metadata),
  rather than any raw tensors.
- `@provenance.build` embeds:
  - file manifest with hashes (skips hashing files larger than `--max-hash-mb`)
  - shard counts and file sizes
  - `mlc-chat-config.json` (when present)
  - a short `logs.txt` excerpt (when present)
  - `tensor-cache.json`/`ndarray-cache.json` summaries (when present)

## Notes

- This generator is deterministic for a given input folder and hashing limit.
- It is intentionally **embedding-free** and does not emit edges or supgrams.
- To validate the resulting brain file, run:

```bash
node tools/xjson-validate.mjs brain.json
```

## Windows path example

```powershell
node tools/phi-to-brain.mjs "C:\public_html\models\phi-3-instruct" brain.json
```
