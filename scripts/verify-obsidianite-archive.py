#!/usr/bin/env python3
"""Verify Obsidianite review archives without mistaking source-derived drafts for approved art.

Run:
  python3 scripts/verify-obsidianite-archive.py ORIGINAL_REFERENCE.zip FOUR_DIRECTION_STUDY.zip
"""
import argparse
import hashlib
import json
import struct
import sys
import zipfile
from pathlib import Path

MANIFEST = Path(__file__).resolve().parents[1] / "docs/obsidianite-canonical-source-lock.json"
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"


def checked_png(archive, filename, metadata):
    raw = archive.read(filename)
    digest = hashlib.sha256(raw).hexdigest()
    if digest != metadata["sha256"]:
        raise ValueError(f"{filename}: SHA-256 mismatch ({digest})")
    if len(raw) < 29 or raw[:8] != PNG_SIGNATURE or raw[12:16] != b"IHDR":
        raise ValueError(f"{filename}: invalid PNG header")
    dimensions = struct.unpack_from(">II", raw, 16)
    if dimensions != (metadata["width"], metadata["height"]):
        raise ValueError(f"{filename}: wrong image dimensions {dimensions}")
    if (raw[24], raw[25]) != (8, 6):
        raise ValueError(f"{filename}: source must be 8-bit RGBA PNG")
    return raw


def verify(reference, turnaround, manifest):
    data = json.loads(manifest.read_text(encoding="utf-8"))
    if data["materialId"] != 7 or data["forgingLevel"] != 40:
        raise ValueError("Obsidianite item/forging IDs changed")
    if data["acceptance"]["canMerge"] or data["lockedAppearance"]["visibleEyes"]:
        raise ValueError("Unapproved release or exposed-eye helmet")
    front = data["canonicalFront"]
    if not front["visuallyApproved"] or not front["immutable"]:
        raise ValueError("canonical approved front must remain locked")
    if list(data["directionStudies"]) != ["right", "back", "left"]:
        raise ValueError("direction order changed")

    with zipfile.ZipFile(reference) as original, zipfile.ZipFile(turnaround) as study:
        for zipped, label in [(original, "approved archive"), (study, "turnaround archive")]:
            invalid = zipped.testzip()
            if invalid:
                raise ValueError(f"{label}: ZIP CRC failed on {invalid}")
        old_front = checked_png(original, "obsidianite_source_cutout.png", front)
        study_front = checked_png(study, front["filename"], front)
        if old_front != study_front:
            raise ValueError("The two canonical fronts differ")
        for direction, pose in data["directionStudies"].items():
            checked_png(study, pose["filename"], pose)
            if pose["visuallyApproved"]:
                raise ValueError(f"{direction}: provisional study cannot be auto-approved")

    print("PASS: exact approved front matches in BOTH source archives")
    print("PASS: original direction studies have correct SHA-256, dimensions and RGBA")
    print("PASS: ZIP CRC integrity")
    print("NOT COMPLETE: side/back visual signoff, 64 frames, separated equipment and in-game QA")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("reference_zip", type=Path)
    parser.add_argument("turnaround_zip", type=Path)
    parser.add_argument("--manifest", type=Path, default=MANIFEST)
    args = parser.parse_args()
    try:
        verify(args.reference_zip, args.turnaround_zip, args.manifest)
    except (KeyError, ValueError, OSError, AssertionError, zipfile.BadZipFile) as error:
        print(f"FAIL: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
