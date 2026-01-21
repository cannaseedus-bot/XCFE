#!/usr/bin/env python3
import json
import sys
import hashlib
from copy import deepcopy

from jsonschema import ValidationError, validate

SCHEMA_PATH = "xjson-model-schema-v1.xjson"


def canonical_json(obj):
    return json.dumps(
        obj,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    )


def sha256_hex(data: bytes):
    return hashlib.sha256(data).hexdigest()


def load_json(path):
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def fail(code, message):
    print(message, file=sys.stderr)
    sys.exit(code)


def compute_model_hash(model):
    canonical = deepcopy(model)
    canonical.get("@provenance", {}).pop("model_hash", None)
    canon_bytes = canonical_json(canonical).encode("utf-8")
    return sha256_hex(canon_bytes)


def main():
    if len(sys.argv) < 2:
        fail(3, "usage: xjson_validate.py <file.xjson>")

    path = sys.argv[1]

    try:
        model = load_json(path)
        schema = load_json(SCHEMA_PATH)
    except Exception as exc:
        fail(3, f"IO_ERROR: {exc}")

    try:
        validate(instance=model, schema=schema)
    except ValidationError as exc:
        fail(1, f"SCHEMA_INVALID: {exc.message}")

    declared = model["@provenance"]["model_hash"].split(":", 1)[1]
    computed = compute_model_hash(model)
    if computed != declared:
        fail(2, f"HASH_MISMATCH\ncomputed={computed}\ndeclared={declared}")

    grams = model.get("@grams", {})
    for gram_id, gram in grams.items():
        if gram.get("type") == "supgram":
            for member in gram.get("members", []):
                if member not in grams:
                    fail(1, f"INVALID_SUPGRAM_REFERENCE: {gram_id}  {member}")

    if len(grams) > model["@limits"]["max_grams"]:
        fail(1, "LIMIT_EXCEEDED: max_grams")

    print("VALID")
    sys.exit(0)


if __name__ == "__main__":
    main()
