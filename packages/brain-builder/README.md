# xjson-brain-builder

Opinionated v1 CLI for building and operating XJSON brains.

## Install (workspace)

```bash
pnpm install
pnpm --filter xjson-brain-builder test
```

## Usage

```bash
xjson-brain-builder build ./dataset --out brain.json --grams ngram,bigram,trigram,supgram
xjson-brain-builder compress brain.json --out brain.scxq2.bin
xjson-brain-builder infer brain.scxq2.bin --prompt "explain XJSON" --steps 64 --trace
xjson-brain-builder prove brain.scxq2.bin --domain infer --out proof.kgbzk
xjson-brain-builder merge A.bin B.bin --out C.bin
xjson-brain-builder diff old.bin new.bin
xjson-brain-builder serve brain.scxq2.bin --port 7331
xjson-brain-builder doctor
```
