# XJSON Golden Corpus

This directory contains canonical samples for validator conformance.

## Layout

- `valid/`: files that must validate successfully.
- `invalid/`: files that must fail validation.

## Expectations

Validators should run the phases in order:

1. Schema validation
2. Canonical hash check (`@provenance.model_hash` removed before hashing)
3. Cross-reference checks (supgram members)
4. Limits checks

Each file is intended to fail at a specific phase; for example:

- `invalid/missing_decode.xjson`: schema error (missing `@decode`).
- `invalid/bad_hash.xjson`: hash mismatch.
- `invalid/orphan_supgram.xjson`: invalid supgram reference.
- `invalid/limit_violation.xjson`: exceeds `max_grams`.
