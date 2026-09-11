#!/usr/bin/env python3
"""
Health-OS — data integrity checks.

Usage:
    python3 .claude/scripts/check-integrity.py           # summary
    python3 .claude/scripts/check-integrity.py -v        # verbose

Why this matters: a skill schema and the actual file schema can diverge
silently. The skill changes, existing data remains, and nothing crashes.
These defects often produce incorrect results instead of explicit errors:
trends miss history, indexes lose files, or counters count the wrong thing.
This script detects such defects before they affect a clinical assessment.

Missing files are not errors: a fresh installation has no data yet.
"""

import csv
import json
import os
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA_ROOT = ROOT / "Data"
PROFILES = DATA_ROOT / "profiles"

# Current profile being checked. Reassigned on each iteration of main():
# checks operate on one dataset and do not know about profiles.
DATA = DATA_ROOT
VERBOSE = "-v" in sys.argv or "--verbose" in sys.argv

OK, WARN, SKIP = "✅", "⚠️ ", "·"
problems: list[str] = []
checks_run = 0


def report(passed: bool | None, title: str, details: list[str] | None = None) -> None:
    """passed=None means there is nothing to check, not an error."""
    global checks_run
    if passed is None:
        print(f"  {SKIP} {title} — no data")
        return
    checks_run += 1
    print(f"  {OK if passed else WARN} {title}")
    for d in details or []:
        if not passed or VERBOSE:
            print(f"      {d}")
    if not passed:
        problems.append(title)


def load_json(p: Path):
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return None


def iter_data_json():
    if not DATA.exists():
        return
    for p in sorted(DATA.rglob("*.json")):
        if p.name.endswith((".example.json", ".demo.json")):
            continue
        yield p


# ── 1. JSON syntax ──────────────────────────────────────────────
def check_json_valid():
    files = list(iter_data_json())
    if not files:
        return report(None, "JSON syntax")
    bad = []
    for p in files:
        try:
            json.loads(p.read_text(encoding="utf-8"))
        except Exception as e:
            bad.append(f"{p.relative_to(ROOT)}: {e}")
    report(not bad, f"JSON syntax ({len(files)} files)", bad)


# ── 2. version field ────────────────────────────────────────────────
def check_version_field():
    files = [p for p in iter_data_json() if not p.name.startswith("_")]
    if not files:
        return report(None, "version field")
    missing = []
    for p in files:
        d = load_json(p)
        if isinstance(d, dict) and "version" not in d:
            missing.append(str(p.relative_to(ROOT)))
    report(not missing, f"version field ({len(files)} files)", missing)


# ── 3. Index completeness ────────────────────────────────────────────
def check_index_complete(idx_path: Path, entries_key: str, dir_path: Path, exts, title: str):
    if not idx_path.exists() or not dir_path.exists():
        return report(None, title)
    idx = load_json(idx_path)
    if not idx:
        return report(False, title, ["cannot read index"])
    listed = {e.get("file") for e in idx.get(entries_key, [])}
    on_disk = {
        p.name for p in dir_path.iterdir()
        if p.suffix in exts
        and not p.name.startswith("_")
        # Templates and demo files are not patient records and are not indexed.
        # Without this filter, a fresh installation reports a mismatch.
        and ".example." not in p.name
        and ".demo." not in p.name
        and ".reference." not in p.name
    }
    missing = sorted(on_disk - listed)
    ghost = sorted(listed - on_disk)
    details = [f"missing from index: {f}" for f in missing] + [f"missing from disk: {f}" for f in ghost]
    report(not details, f"{title} ({len(on_disk)} on disk, {len(listed)} in index)", details)


# ── 4. CSV consistency ────────────────────────────────────────────
def check_csv():
    p = DATA / "body-metrics.csv"
    if not p.exists():
        return report(None, "CSV consistency")
    with p.open(encoding="utf-8") as f:
        rows = list(csv.reader(f))
    if not rows:
        return report(None, "CSV consistency")
    width = len(rows[0])
    bad = [f"row {i}: {len(r)} fields instead of {width}"
           for i, r in enumerate(rows[1:], start=2) if len(r) != width]
    # Use a real CSV parser, not comma splitting: quoted notes can legally
    # contain commas, which would cause a naive check to report false errors.
    report(not bad, f"CSV consistency ({len(rows)-1} rows, {width} columns)", bad)


# ── 5. Dates ────────────────────────────────────────────────────────
ISO = re.compile(r"^\d{4}-\d{2}-\d{2}$")
PERIOD = re.compile(r"^\d{4}(-\d{2})?(-\d{2})?$|^\d{4}-\d{4}$|^~")


def check_dates():
    files = list(iter_data_json())
    if not files:
        return report(None, "Date format")
    today = date.today().isoformat()
    bad = []

    def walk(node, path, src):
        if isinstance(node, dict):
            for k, v in node.items():
                if k in ("date", "started", "deadline", "result_date", "analysis_date") and isinstance(v, str) and v:
                    if not ISO.match(v):
                        if not PERIOD.match(v):
                            bad.append(f"{src}: {path}.{k} = «{v}» — not ISO 8601")
                    elif v > today and k != "deadline":
                        bad.append(f"{src}: {path}.{k} = {v} — future date")
                walk(v, f"{path}.{k}", src)
        elif isinstance(node, list):
            for i, v in enumerate(node):
                walk(v, f"{path}[{i}]", src)

    for p in files:
        d = load_json(p)
        if d is not None:
            walk(d, "", str(p.relative_to(ROOT)))
    report(not bad, "Date format", bad[:15])


# ── 6. Marker reachability ───────────────────────────────────────
def check_markers_reachable():
    labs = DATA / "labs"
    if not labs.exists():
        return report(None, "Marker reachability")
    total = flat = 0
    hidden = []
    for p in sorted(labs.glob("*.json")):
        if p.name.startswith("_"):
            continue
        d = load_json(p)
        if not isinstance(d, dict) or "composition" in d:
            continue
        n = len(d.get("markers") or [])
        extra = sum(len(x.get("markers") or []) for x in (d.get("panels") or [])) \
              + sum(len(x.get("markers") or []) for x in (d.get("studies") or []))
        total += n + extra
        flat += n
        if extra:
            hidden.append(f"{p.name}: +{extra} outside the flat markers[] array")
    if total == 0:
        return report(None, "Marker reachability")
    # This is a reminder, not a data error: readers must support all three schemas.
    passed = True
    report(passed, f"Marker reachability ({total} total, {total-flat} via panels/studies)", hidden)


# ── 7. Tooth chart invariant ───────────────────────────────────────
def check_tooth_map():
    p = DATA / "dental" / "tooth-map.json"
    if not p.exists():
        return report(None, "Tooth chart")
    d = load_json(p) or {}
    s = d.get("summary") or {}
    teeth = d.get("teeth") or {}
    bad = []
    if s.get("total") not in (32, None):
        bad.append(f"summary.total = {s.get('total')}, expected 32: the sparse teeth map does not represent the full dentition")
    counted = sum(v for k, v in s.items() if k != "total" and isinstance(v, int))
    if counted > len(teeth):
        bad.append(f"status total {counted} exceeds the number of entries {len(teeth)}")
    report(not bad, "Tooth chart", bad)


# ── 8. Goal cost estimates ─────────────────────────────────────────────────
def check_goals_cost():
    files = sorted((DATA / "goals").glob("*.json")) if (DATA / "goals").exists() else []
    files = [f for f in files if not f.name.startswith("_")]
    if not files:
        return report(None, "Goal cost estimates")
    bad = []
    for p in files:
        g = load_json(p) or {}
        dirs = g.get("directions") or []
        cs = g.get("cost_summary") or {}
        if not dirs or not cs:
            continue
        est = sum(d.get("cost_estimate_rub") or 0 for d in dirs)
        if cs.get("total_estimate_rub") not in (None, est):
            bad.append(f"{p.name}: total_estimate_rub = {cs['total_estimate_rub']}, sum across health areas = {est}")
        by_phase = cs.get("by_phase") or {}
        ph: dict = {}
        for d in dirs:
            ph[d.get("phase")] = ph.get(d.get("phase"), 0) + (d.get("cost_estimate_rub") or 0)
        for k, v in by_phase.items():
            if isinstance(v, dict) and v.get("estimate") not in (None, ph.get(k, 0)):
                bad.append(f"{p.name}: {k}.estimate = {v['estimate']}, sum = {ph.get(k, 0)}")
    report(not bad, "Goal cost estimates", bad)


# ── 9. format matches the extension ─────────────────────────────
def check_visit_format():
    p = DATA / "doctors" / "visits" / "_index.json"
    if not p.exists():
        return report(None, "Format and extension match")
    idx = load_json(p) or {}
    bad = []
    for e in idx.get("visits", []):
        f, fmt = e.get("file", ""), e.get("format")
        if fmt and not f.endswith("." + fmt):
            bad.append(f"{f}: format = {fmt}")
    report(not bad, "Format and extension match", bad)


# ── 10. File references resolve ────────────────────────────────
def check_file_refs():
    if not DATA.exists():
        return report(None, "File references")
    bad = []
    checked = 0
    for p in iter_data_json():
        d = load_json(p)
        if not isinstance(d, dict):
            continue
        for key, base in (("pdf_path", DATA / "labs"), ("archive_path", ROOT)):
            v = d.get(key)
            if isinstance(v, str) and v:
                checked += 1
                if not (base / v).exists() and not (ROOT / v).exists():
                    bad.append(f"{p.relative_to(ROOT)}: {key} = «{v}» not found")
    if checked == 0:
        return report(None, "File references")
    report(not bad, f"File references ({checked} checked)", bad[:10])


# ── main ───────────────────────────────────────────────────────────

# ── 12. Profile structure ─────────────────────────────────────────
def check_profiles_structure():
    """Each profile is a directory with profile.json containing birth date and sex.

    Without birth date, age-specific intervals, screening, and pediatric mode
    cannot work: the system could silently apply adult intervals to children.
    """
    if not PROFILES.exists():
        report(None, "Profile structure")
        return
    dirs = [d for d in sorted(PROFILES.iterdir()) if d.is_dir()]
    if not dirs:
        report(None, "Profile structure")
        return
    bad = []
    for d in dirs:
        if not re.fullmatch(r"[a-z0-9][a-z0-9-]{1,31}", d.name):
            bad.append(f"{d.name}: invalid profile identifier")
            continue
        pf = d / "profile.json"
        if not pf.exists():
            bad.append(f"{d.name}: missing profile.json")
            continue
        data = load_json(pf)
        if data is None:
            bad.append(f"{d.name}/profile.json: cannot be parsed")
            continue
        basic = data.get("basic") or {}
        if not basic.get("date_of_birth"):
            bad.append(f"{d.name}: date_of_birth is missing: age-specific intervals are unavailable")
        if not basic.get("sex"):
            bad.append(f"{d.name}: sex is missing: sex-specific differences cannot be considered")
        if basic.get("relationship") not in (None, "self") and not (data.get("consent") or {}).get("basis"):
            bad.append(f"{d.name}: another person's profile has no consent entry")
    report(not bad, f"Profile structure ({len(dirs)})", bad)


# ── 13. Active-profile pointer ────────────────────────────────
def check_active_profile():
    """The pointer exists, parses, and identifies an existing profile.

    A broken pointer is more dangerous than a missing one: the system may
    continue with a default and write data to the wrong person's record.
    """
    ptr = PROFILES / "_active.json"
    if not PROFILES.exists() or not any(d.is_dir() for d in PROFILES.iterdir()):
        report(None, "Active-profile pointer")
        return
    if not ptr.exists():
        report(False, "Active-profile pointer", ["Data/profiles/_active.json is missing"])
        return
    data = load_json(ptr)
    if data is None:
        report(False, "Active-profile pointer", ["_active.json cannot be parsed"])
        return
    active = data.get("active")
    problems_local = []
    if not active:
        problems_local.append("active field is empty")
    elif not (PROFILES / active).is_dir():
        problems_local.append(f"active = «{active}», but that profile does not exist")
    report(not problems_local, "Active-profile pointer", problems_local)


# ── 14. Data outside profiles ─────────────────────────────────────────
def check_no_stray_data():
    """Patient data in Data/ outside a profile.

    This happens when an agent writes to a literal shorthand path without
    applying profile-resolution.md. Such a file is invisible to the
    dashboard and absent from all indexes.
    """
    if not DATA_ROOT.exists():
        report(None, "No data outside profiles")
        return
    allowed_dirs = {"profiles", "wiki", "specialists"}
    allowed_files = {"README.md"}
    stray = []
    for pth in sorted(DATA_ROOT.rglob("*")):
        if pth.is_dir() or pth.name == ".gitkeep" or pth.name.startswith("."):
            continue
        rel = pth.relative_to(DATA_ROOT)
        if rel.parts[0] in allowed_dirs or rel.name in allowed_files:
            continue
        if any(s in pth.name for s in (".example.", ".demo.", ".reference.")):
            continue
        if rel.name == "_marker-aliases.json":
            continue
        stray.append(f"Data/{rel} — data outside a profile; apply the rule in profile-resolution.md")
    report(not stray, "No data outside profiles", stray)


# ── 15. Conflicting file copies ───────────────────────────────────
def check_no_conflict_copies():
    """Duplicates such as "settings 2.json", created by cloud drives.

    Their risk is not storage use: a similar file appears beside the real
    one with different contents. A copy of outdated permissions was once
    published this way and appeared to be a second source of truth.
    """
    import re as _re
    pattern = _re.compile(r"^(.*) (\d+)(\.[^.]+)$")
    found = []
    for base in (ROOT / ".claude", DATA_ROOT, ROOT / "docs"):
        if not base.exists():
            continue
        for pth in sorted(base.rglob("*")):
            if pth.is_dir():
                continue
            m = pattern.match(pth.name)
            if not m:
                continue
            original = pth.with_name(m.group(1) + m.group(3))
            hint = " — original exists alongside it" if original.exists() else ""
            found.append(f"{pth.relative_to(ROOT)}{hint}")
    report(not found, "No conflicting file copies", found)


def main() -> int:
    print()
    print("Health-OS — data integrity checks")
    print("═" * 47)
    print()

    global DATA

    check_profiles_structure()
    check_active_profile()
    check_no_stray_data()
    check_no_conflict_copies()

    profiles = (
        [d for d in sorted(PROFILES.iterdir()) if d.is_dir()]
        if PROFILES.exists() else []
    )
    if not profiles:
        print()
        print("  · No profiles to check. Run ./setup.sh")
        profiles = []

    for pdir in profiles:
        DATA = pdir
        name = pdir.name
        data = load_json(pdir / "profile.json") or {}
        display = ((data.get("basic") or {}).get("display_name") or name)
        print()
        print(f"  ─── profile: {display} ({name}) ───")

        check_json_valid()
        check_version_field()
        check_index_complete(
            DATA / "labs" / "_index.json", "analyses", DATA / "labs", {".json"}, "Lab index is complete"
        )
        check_index_complete(
            DATA / "doctors" / "visits" / "_index.json", "visits",
            DATA / "doctors" / "visits", {".json", ".md"}, "Visit index is complete"
        )
        check_csv()
        check_dates()
        check_markers_reachable()
        check_tooth_map()
        check_goals_cost()
        check_visit_format()
        check_file_refs()

    print()
    print("═" * 47)
    if not checks_run:
        print("No data to check yet. This is normal for a fresh installation.")
        return 0
    if problems:
        print(f"Problems: {len(problems)} across {checks_run} checks")
        for p in problems:
            print(f"  • {p}")
        print()
        print("Run with -v to see details.")
        return 1
    print(f"All checks passed ({checks_run})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
