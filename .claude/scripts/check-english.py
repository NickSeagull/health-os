#!/usr/bin/env python3
"""Reject Cyrillic text and filenames in repository source files.

Run from any directory: python3 .claude/scripts/check-english.py
Tracked files and non-ignored new files are checked. Deleted files and binary
assets are skipped; screenshots require a separate visual review.
"""

from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
CYRILLIC = re.compile(r"[\u0400-\u052f\u1c80-\u1c8f\u2de0-\u2dff\ua640-\ua69f]")


def main() -> int:
    paths = subprocess.check_output(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"],
        cwd=ROOT,
    ).decode("utf-8").split("\0")
    failures = []
    checked = 0
    for name in sorted(set(paths) - {""}):
        path = ROOT / name
        if not path.is_file():
            continue
        if CYRILLIC.search(name):
            failures.append(f"{name}: filename contains Cyrillic characters")
        raw = path.read_bytes()
        if b"\0" in raw:
            continue
        try:
            content = raw.decode("utf-8")
        except UnicodeDecodeError:
            continue
        checked += 1
        for number, line in enumerate(content.splitlines(), start=1):
            if CYRILLIC.search(line):
                # Report locations only; do not print potentially personal content.
                failures.append(f"{name}:{number}: Cyrillic text")
    if failures:
        print("\n".join(failures))
        print(f"English-only check failed: {len(failures)} locations in {checked} text files.")
        return 1
    print(f"English-only check passed: {checked} text files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
