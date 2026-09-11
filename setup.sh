#!/usr/bin/env bash
#
# Health-OS — Setup.
#
#   ./setup.sh          working mode: empty templates ready to fill in
#   ./setup.sh --demo   demo mode: fictional patient data to explore
#
# This script is idempotent: existing files are never overwritten.

set -euo pipefail

MODE="blank"
ASSUME_YES="no"
for arg in "$@"; do
  case "$arg" in
    --demo) MODE="demo" ;;
    -y|--yes) ASSUME_YES="yes" ;;   # accept terms without prompting, for automation
  esac
done

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

GREEN=$'\033[0;32m'; YELLOW=$'\033[0;33m'; RED=$'\033[0;31m'; DIM=$'\033[2m'; NC=$'\033[0m'
ok()   { echo "  ${GREEN}✓${NC} $*"; }
warn() { echo "  ${YELLOW}!${NC} $*"; }
err()  { echo "  ${RED}✗${NC} $*"; }
skip() { echo "  ${DIM}·${NC} $*"; }

echo
echo "Health-OS — Setup (mode: $MODE)"
echo "═══════════════════════════════════════════════"
echo
echo "${YELLOW}⚠️  READ BEFORE INSTALLING${NC}"
echo
echo "  This is ${YELLOW}not a medical device${NC}: the software is not registered,"
echo "  certified, or clinically tested."
echo "  It does not diagnose, treat, or replace a doctor."
echo
echo "  Noncommercial project. Provided as is, without warranties."
echo "  ${YELLOW}Use entirely at your own risk.${NC}"
echo "  The authors are not liable for health harm, incorrect conclusions, or data loss."
echo
echo "  You are responsible for data security and lawful data processing."
echo "  File contents are sent to the language model API with each interaction."
echo
echo "  All demonstration data is fictional."
echo
echo "  Full terms: DISCLAIMER.md"
echo
echo "  🚨 In an emergency, contact emergency services. This is not a monitoring system."
echo
if [ "$ASSUME_YES" = "yes" ]; then
  ok "terms accepted (--yes flag)"
else
  printf "  Do you accept the terms? [y/N] "
  if read -r ACCEPT </dev/tty 2>/dev/null; then
    case "$ACCEPT" in
      [yY]*) echo; ok "terms accepted" ;;
      *) echo; err "Setup canceled. You must accept the terms to use the software."; exit 1 ;;
    esac
  else
    echo
    err "No terminal available. For noninteractive setup: ./setup.sh --yes"
    exit 1
  fi
fi
echo

# ── 1. Environment check ──────────────────────────────────────────
echo "Checking the environment"
MISSING=0
need() {
  if command -v "$1" >/dev/null 2>&1; then ok "$1"; else err "$1 — $2"; MISSING=1; fi
}
need python3 "required for integrity checks"
if command -v python3 >/dev/null 2>&1; then
  # The integrity script uses annotations such as `bool | None`, requiring Python 3.10+
  if python3 -c 'import sys; sys.exit(0 if sys.version_info >= (3,10) else 1)' 2>/dev/null; then
    ok "python3 $(python3 -c 'import sys;print(".".join(map(str,sys.version_info[:3])))')"
  else
    err "python3 $(python3 -c 'import sys;print(".".join(map(str,sys.version_info[:3])))') — requires 3.10 or newer"
    MISSING=1
  fi
fi
need jq       "required for session hooks"
need git      "required for local version control"

if command -v node >/dev/null 2>&1; then
  NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
  if [ "$NODE_MAJOR" -ge 20 ]; then ok "node $(node -v)"; else warn "node $(node -v) — the dashboard requires 20+"; fi
else
  warn "node not found: the system works, but the dashboard will not start"
fi

if [ "$MISSING" -eq 1 ]; then
  echo
  err "Required dependencies are missing. Install them and rerun this script."
  exit 1
fi
echo

# ── 2. Data files ────────────────────────────────────────────────
echo "Deploying data files"

# Do not mix modes: demo files would overlay empty files while indexes remain
# from the blank installation, producing an inconsistent state that fails
# integrity checks. Check before copying anything.
EXISTING=$(find Data/profiles -type f \( -name "*.json" -o -name "*.csv" -o -name "*.jsonl" -o -name "*.md" \) \
  ! -name "*.example.*" ! -name "*.demo.*" ! -name "*.reference.*" 2>/dev/null | wc -l | tr -d ' ')

if [ "$EXISTING" -gt 0 ] && [ "$MODE" = "demo" ]; then
  echo
  err "Data/profiles/ already contains $EXISTING previously deployed files."
  err "Do not overlay demo data: the indexes would no longer match the files."
  echo
  echo "  If this is your data, do not run --demo; you would overwrite it."
  echo "  If this is an old installation you can discard, clear the directory:"
  echo
  echo "    rm -rf Data/profiles/*/ && rm -f Data/profiles/_active.json"
  echo
  echo "  Then run ./setup.sh --demo again."
  echo
  exit 1
fi

# Data is organized by profile: Data/profiles/<id>/. The first profile belongs
# to the installation owner. Templates remain in Data/: they are shared
# and serve as the source for every new profile.
PROFILE="${PROFILE:-owner}"
PROFILE_DIR="Data/profiles/$PROFILE"

mkdir -p "$PROFILE_DIR"/{context,labs/pdfs,doctors/visits,doctors/prep,dental,\
medications,mental,goals,costs,traction,consilium,history,wiki/condition,\
wiki/hypothesis,wiki/symptom,wiki/synthesis} 2>/dev/null
mkdir -p Data/wiki/source Data/wiki/marker 2>/dev/null

# Template destination. Files in Data/profiles/ are service files
# (the active-profile pointer) and stay at that level. Everything else goes
# inside the profile: Data/labs/_index.example.json → Data/profiles/owner/labs/_index.json
target_for() {
  local tpl="$1" suffix="$2" ext="$3"
  local rel="${tpl#Data/}"
  local stem="${rel%$suffix}"
  case "$rel" in
    # Service file: the active-profile pointer sits above individual profiles
    profiles/*)              printf 'Data/%s.%s' "$stem" "$ext" ;;
    # Shared wiki: literature and marker references apply to everyone;
    # duplicating them per profile serves no purpose
    wiki/source/*|wiki/marker/*) printf 'Data/%s.%s' "$stem" "$ext" ;;
    # Personal wiki and all other data go inside the profile
    *)                       printf '%s/%s.%s' "$PROFILE_DIR" "$stem" "$ext" ;;
  esac
}

SUFFIX=".example.json"
[ "$MODE" = "demo" ] && SUFFIX=".demo.json"

CREATED=0; KEPT=0
while IFS= read -r -d '' tpl; do
  target="$(target_for "$tpl" "$SUFFIX" json)"
  base="$(basename "$target")"
  if [ -e "$target" ]; then
    skip "$base — already exists, leaving unchanged"
    KEPT=$((KEPT+1))
  else
    mkdir -p "$(dirname "$target")"
    cp "$tpl" "$target"
    ok "$base"
    CREATED=$((CREATED+1))
  fi
done < <(find Data -name "*$SUFFIX" -print0 2>/dev/null)

# Other formats: tables, line-based journals, and Markdown visit notes
for ext in csv jsonl md; do
  pat=".example.$ext"; [ "$MODE" = "demo" ] && pat=".demo.$ext"
  while IFS= read -r -d '' tpl; do
    target="$(target_for "$tpl" "$pat" "$ext")"
    base="$(basename "$target")"
    if [ -e "$target" ]; then skip "$base — already exists"; KEPT=$((KEPT+1))
    else mkdir -p "$(dirname "$target")"; cp "$tpl" "$target"; ok "$base"; CREATED=$((CREATED+1)); fi
  done < <(find Data -name "*$pat" -print0 2>/dev/null)
done

# Annual files: goals and expenses are named by year, e.g. 2026.json, 2026.jsonl.
# Templates use neutral names so they do not become outdated; here the name
# receives the current year. Without this, the dashboard searches for \d{4}.json
# and cannot find goals.
YEAR="$(date +%Y)"
for pair in "$PROFILE_DIR/goals/goals.json:$PROFILE_DIR/goals/$YEAR.json" "$PROFILE_DIR/costs/costs.jsonl:$PROFILE_DIR/costs/$YEAR.jsonl"; do
  src="${pair%%:*}"; dst="${pair##*:}"
  if [ -f "$src" ] && [ ! -e "$dst" ]; then
    mv "$src" "$dst"
    ok "$(basename "$dst") — annual file"
  elif [ -f "$src" ] && [ -e "$dst" ]; then
    rm -f "$src"
    skip "$(basename "$dst") — already exists"
  fi
done

echo "  created: $CREATED, existing files kept: $KEPT"
echo

# ── 3. MCP configuration ────────────────────────────────────────────
echo "Setting up integrations"
if [ -f ".mcp.json" ]; then
  skip ".mcp.json — already exists"
elif [ -f ".mcp.json.example" ]; then
  cp .mcp.json.example .mcp.json
  chmod 600 .mcp.json
  ok ".mcp.json created from template (permissions 600)"
  warn "enter your keys manually: the template contains placeholders"
fi
echo

# ── 4. Access permissions ───────────────────────────────────────────────
echo "Restricting permissions"
chmod -R go-rwx Data 2>/dev/null && ok "Data/ — owner access only"
[ -f .mcp.json ] && chmod 600 .mcp.json && ok ".mcp.json — 600"
chmod +x .claude/hooks/*.sh 2>/dev/null && ok "hooks are executable"
echo

# ── 5. Local Git ───────────────────────────────────────────────
echo "Checking repository isolation"
if [ ! -d .git ]; then
  git init -q
  ok "Git repository created"
fi

if git remote | grep -q .; then
  # A GitHub clone normally has an origin remote; this is not an error.
  # A red error marker here would needlessly alarm every new user.
  REMOTE_NAME=$(git remote | head -1)
  REMOTE_URL=$(git remote get-url "$REMOTE_NAME" 2>/dev/null || echo "")
  warn "The repository has a remote: $REMOTE_NAME → $REMOTE_URL"
  echo "     If this is the origin from cloning, remove it so that medical data"
  echo "     has no configured upload destination:"
  echo
  echo "       git remote remove $REMOTE_NAME"
  echo
  echo "     You can then update as follows (see Updating in INSTALL.md):"
  echo "       git fetch <repository-url> && git merge FETCH_HEAD"
else
  ok "no remote: data will stay local"
fi

# Check that the safeguard works
PROBE="Data/__gitignore_probe.json"
echo '{}' > "$PROBE"
if git check-ignore -q "$PROBE" 2>/dev/null; then
  ok ".gitignore protects Data/: verified"
else
  err ".gitignore does NOT protect Data/: unsafe, do not enter data"
fi
rm -f "$PROBE"
echo

# ── 6. Summary ────────────────────────────────────────────────────────
echo "═══════════════════════════════════════════════"
if [ "$MODE" = "demo" ]; then
  echo "Done. The fictional patient demo dataset has been deployed."
  echo
  echo "View the dashboard:"
  echo "  cd Dashboard && npm install && npm run dev"
  echo
  echo "When finished exploring, remove the demo data and run ./setup.sh again."
else
  echo "Done. Data files are empty and ready to fill in."
  echo
  echo "Next steps:"
  echo "  1. Open the project in Claude Code"
  echo "  2. Run /onboarding to create your initial medical record"
  echo "  3. Place lab PDFs in Inbox/ and run /inbox"
  echo
  echo "Step-by-step guide: docs/ONBOARDING.md"
fi
echo
echo "⚕️  The system does not diagnose conditions or replace a doctor."
echo
