#!/usr/bin/env python3
"""Pack text sources into fixed-width binary atoms.

This is a minimal offline packer for MATRIX/ATOMIC-DOM ingestion. It performs
one-time normalization + tokenization, then emits a flat uint16 stream aligned
to atom boundaries for fast mmap/seek usage.
"""
from __future__ import annotations

import argparse
import json
from array import array
from pathlib import Path
from typing import Iterable, List

DEFAULT_EXTS = (".txt", ".md", ".html", ".json")


def load_and_clean(path: Path) -> str:
    text = path.read_text(encoding="utf-8", errors="ignore")
    if path.suffix.lower() == ".json":
        try:
            obj = json.loads(text)
            text = json.dumps(obj, separators=(",", ":"))
        except json.JSONDecodeError:
            pass
    text = text.replace("<", " ").replace(">", " ")
    return text


def pi_tokenize(text: str, vocab_size: int) -> List[int]:
    return [ord(char) % vocab_size for char in text]


def iter_inputs(root: Path, exts: Iterable[str]) -> Iterable[Path]:
    for path in root.rglob("*"):
        if path.is_file() and path.suffix.lower() in exts:
            yield path


def pack_directory(input_dir: Path, out_file: Path, atom_size: int, vocab_size: int) -> int:
    tokens: List[int] = []
    for path in iter_inputs(input_dir, DEFAULT_EXTS):
        text = load_and_clean(path)
        tokens.extend(pi_tokenize(text, vocab_size))

    pad = (-len(tokens)) % atom_size
    if pad:
        tokens.extend([0] * pad)

    packed = array("H", tokens)
    out_file.parent.mkdir(parents=True, exist_ok=True)
    with out_file.open("wb") as handle:
        packed.tofile(handle)

    return len(tokens)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Pack text into binary atoms.")
    parser.add_argument("input_dir", type=Path, help="Directory of input files")
    parser.add_argument("out_file", type=Path, help="Output .bin file")
    parser.add_argument("--atom-size", type=int, default=256, help="Tokens per atom")
    parser.add_argument("--vocab-size", type=int, default=65536, help="Vocabulary size")
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    token_count = pack_directory(args.input_dir, args.out_file, args.atom_size, args.vocab_size)
    atom_count = token_count // args.atom_size

    print(f"[OK] Packed {token_count} tokens")
    print(f"[OK] Atoms: {atom_count}")
    print(f"[OK] Output: {args.out_file}")


if __name__ == "__main__":
    main()
