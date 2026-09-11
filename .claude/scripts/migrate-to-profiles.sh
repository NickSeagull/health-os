#!/usr/bin/env bash
#
# Move the flat Data/ structure into Data/profiles/<id>/
#
# Before profiles, all data lived directly under Data/. This script moves it
# into the owner profile, leaving shared registries and templates in place.
#
#   ./.claude/scripts/migrate-to-profiles.sh            show the plan without making changes
#   ./.claude/scripts/migrate-to-profiles.sh --apply    perform the move
#
# There is no undo. Restoring a backup is the only way back.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

RED=$'\033[0;31m'; GRN=$'\033[0;32m'; YEL=$'\033[0;33m'; DIM=$'\033[2m'; NC=$'\033[0m'
ok()   { echo "  ${GRN}✓${NC} $1"; }
warn() { echo "  ${YEL}!${NC} $1"; }
err()  { echo "  ${RED}✗${NC} $1"; }

PROFILE="owner"
APPLY="no"
for a in "$@"; do
  case "$a" in
    --apply) APPLY="yes" ;;
    --profile=*) PROFILE="${a#--profile=}" ;;
    -h|--help) sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) err "unknown argument: $a"; exit 1 ;;
  esac
done

if ! [[ "$PROFILE" =~ ^[a-z0-9][a-z0-9-]{1,31}$ ]]; then
  err "invalid profile identifier: ${PROFILE}"
  echo "     Use lowercase Latin letters, digits, and hyphens; 2–32 characters."
  exit 1
fi

echo
echo "Health-OS — moving data into profile ${PROFILE}"
echo "═══════════════════════════════════════════════"
echo

if [ ! -d Data ]; then err "Data/ does not exist: nothing to move"; exit 1; fi

DEST="Data/profiles/$PROFILE"

# ── What to move ──────────────────────────────────────────────────
# All Data/ contents except the profiles directory, shared wiki,
# shared registries, and templates.
# `mapfile` is unavailable in bash 3.2, which ships with macOS.
# Collect the list in a temporary file to support every version.
LIST="$(mktemp)"
trap 'rm -f "$LIST"' EXIT

find Data -mindepth 1 -type f \
  ! -path "Data/profiles/*" ! -path "Data/wiki/*" ! -path "Data/specialists/*" \
  ! -name "README.md" ! -name ".gitkeep" ! -name ".DS_Store" \
  ! -name "*.example.*" ! -name "*.demo.*" ! -name "*.reference.*" \
  ! -name "_marker-aliases.json" \
  2>/dev/null | sort > "$LIST"

COUNT=$(wc -l < "$LIST" | tr -d ' ')

if [ "$COUNT" -eq 0 ]; then
  ok "No data in the flat structure: nothing to move."
  if [ -d "$DEST" ]; then ok "Profile ${PROFILE} already exists."; fi
  echo
  exit 0
fi

echo "Files to move: $COUNT"
echo
while IFS= read -r f; do
  echo "  ${DIM}$f${NC}  →  $DEST/${f#Data/}"
done < <(head -40 "$LIST")
[ "$COUNT" -gt 40 ] && echo "  ${DIM}… and another $(( COUNT - 40 ))${NC}"
echo
echo "These shared files remain in place:"
echo "  Data/labs/_marker-aliases.json   marker registry"
echo "  Data/specialists/                specialty responsibilities"
echo "  Data/wiki/                       shared knowledge: sources and references"
echo "  Data/*.example.*, *.demo.*       installer templates"
echo

if [ "$APPLY" != "yes" ]; then
  warn "This is a preview. Nothing has changed."
  echo
  echo "  Back up Data/ first: this move has no undo:"
  echo "      cp -R Data Data.backup-\$(date +%Y%m%d)"
  echo
  echo "  Then perform the move:"
  echo "      $0 --apply"
  echo
  exit 0
fi

# ── Execution ─────────────────────────────────────────────────────
if [ -d "$DEST" ] && [ -n "$(find "$DEST" -type f 2>/dev/null | head -1)" ]; then
  err "Profile ${PROFILE} already contains files."
  err "Moving into an existing profile would mix two datasets."
  echo
  echo "  Specify a different profile:  $0 --apply --profile=<id>"
  echo
  exit 1
fi

echo "Moving files"
MOVED=0
while IFS= read -r f; do
  [ -f "$f" ] || continue
  rel="${f#Data/}"
  target="$DEST/$rel"
  mkdir -p "$(dirname "$target")"
  mv "$f" "$target"
  MOVED=$((MOVED+1))
done < "$LIST"
ok "files moved: $MOVED"

# Empty directories left after the move, excluding directories with templates
find Data -mindepth 1 -maxdepth 2 -type d -empty \
  ! -path "Data/profiles*" ! -path "Data/wiki*" -delete 2>/dev/null || true

# ── Active-profile pointer ────────────────────────────────────
PTR="Data/profiles/_active.json"
if [ ! -f "$PTR" ]; then
  NOW="$(date +%Y-%m-%dT%H:%M:%S)"
  cat > "$PTR" <<JSON
{
  "version": 1,
  "active": "$PROFILE",
  "switched_at": "$NOW",
  "history": [
    { "profile": "$PROFILE", "at": "$NOW" }
  ]
}
JSON
  ok "_active.json created; active profile: ${PROFILE}"
else
  ok "_active.json already exists; leaving unchanged"
fi

chmod -R go-rwx Data 2>/dev/null || true

echo
echo "═══════════════════════════════════════════════"
echo "Done. Checking integrity:"
echo
python3 .claude/scripts/check-integrity.py || {
  echo
  warn "Integrity checks found problems: resolve them before entering new data."
  exit 1
}
echo
echo "Add a family member:  /profiles create"
echo
