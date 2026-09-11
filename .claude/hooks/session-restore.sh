#!/bin/bash
# session-restore.sh — SessionStart hook for health-os
# Finds pending breadcrumbs and checks active-context freshness
# No Git sync (health-os is local only)

set -euo pipefail

# Derive the path from this script location: .claude/hooks/ → project root.
# A hardcoded absolute path broke the hook in other clones and exposed
# the username in a version-controlled file.
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Read the SessionStart payload from stdin.
# IMPORTANT: CLAUDE_SESSION_ID is not set in the environment. Relying on it
# left session_id empty: no start-time file was created and the current
# session was not excluded from the pending list.
HOOK_INPUT=""
if [ ! -t 0 ]; then
  HOOK_INPUT=$(cat 2>/dev/null || echo "")
fi

# Cache freshness check — active-context.md
CONTEXT_FILE="$PROJECT_DIR/Cache/active-context.md"
if [ -f "$CONTEXT_FILE" ]; then
  # stat -f%m is BSD (macOS); stat -c%Y is GNU (Linux). Without the fallback,
  # Linux returned 0 and always triggered the stale-context warning.
  CTX_MTIME=$(stat -f%m "$CONTEXT_FILE" 2>/dev/null || stat -c%Y "$CONTEXT_FILE" 2>/dev/null || echo 0)
  CONTEXT_AGE_DAYS=$(( ($(date +%s) - CTX_MTIME) / 86400 ))
  if [ "$CONTEXT_AGE_DAYS" -gt 7 ]; then
    echo "<context-stale>active-context.md has not been updated for $CONTEXT_AGE_DAYS days. Run /day.</context-stale>"
  fi
fi

# Cache freshness — health alerts
CACHE_DIR="$PROJECT_DIR/Cache"
if [ -d "$CACHE_DIR/alerts" ]; then
  LATEST_ALERT=$(ls -t "$CACHE_DIR/alerts/" 2>/dev/null | head -1)
  if [ -n "$LATEST_ALERT" ]; then
    ALERT_MTIME=$(stat -f%m "$CACHE_DIR/alerts/$LATEST_ALERT" 2>/dev/null || stat -c%Y "$CACHE_DIR/alerts/$LATEST_ALERT" 2>/dev/null || echo 0)
    CACHE_AGE_DAYS=$(( ($(date +%s) - ALERT_MTIME) / 86400 ))
    if [ "$CACHE_AGE_DAYS" -gt 3 ]; then
      echo "<cache-stale>Cache has not been updated for $CACHE_AGE_DAYS days. Run /day or /health.</cache-stale>"
    fi
  fi
fi

PENDING_DIR="$PROJECT_DIR/.claude/hooks/pending-sessions"

# If the directory is missing, there is nothing to do
if [ ! -d "$PENDING_DIR" ]; then
  exit 0
fi

# Record the session start time as an epoch timestamp
CURRENT_SESSION=$(echo "$HOOK_INPUT" | jq -r '.session_id // empty' 2>/dev/null)
if [ -z "$CURRENT_SESSION" ]; then
  CURRENT_SESSION="${CLAUDE_SESSION_ID:-}"
fi
if [ -n "$CURRENT_SESSION" ]; then
  echo "$(date +%s)" > "$PROJECT_DIR/.claude/hooks/session-start-${CURRENT_SESSION}.tmp"
fi

PENDING_COUNT=0
PENDING_DATA=""

for f in "$PENDING_DIR"/*.json; do
  [ -f "$f" ] || continue

  SID=$(jq -r '.session_id' "$f" 2>/dev/null)

  # Skip the current session
  if [ "$SID" = "$CURRENT_SESSION" ]; then
    continue
  fi

  PENDING_COUNT=$((PENDING_COUNT + 1))
  DATE=$(jq -r '.date' "$f" 2>/dev/null)
  MSG=$(jq -r '.message_count' "$f" 2>/dev/null)
  PENDING_DATA="$PENDING_DATA\n  - $DATE (ID: ${SID:0:8}, ~$MSG turns)"
done

# If pending sessions exist, display instructions
if [ "$PENDING_COUNT" -gt 0 ]; then
  echo "<session-recovery>"
  echo "Found $PENDING_COUNT unsaved sessions:"
  echo -e "$PENDING_DATA"
  echo ""
  echo "Ask the user: Found $PENDING_COUNT unrecorded sessions. Process them now (/recover-sessions), or start working?"
  echo "</session-recovery>"
fi

exit 0
