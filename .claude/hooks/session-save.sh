#!/bin/bash
# session-save.sh — Stop hook that saves a session breadcrumb
# Runs after each Claude response. Overwrites the file identified by session_id.
# When the session ends, the breadcrumb remains pending.

set -euo pipefail

# Prevent recursion
if [ "${CLAUDE_STOP_HOOK_ACTIVE:-}" = "1" ]; then
  exit 0
fi
export CLAUDE_STOP_HOOK_ACTIVE=1

# Read JSON from stdin
INPUT=$(cat)

# Run this hook only in this project.
# Check that the hook exists in the working directory rather than matching
# its name: matching the substring "health-os" broke breadcrumbs for anyone
# who cloned the repository under a different directory name.
CWD=$(echo "$INPUT" | jq -r '.cwd // empty' 2>/dev/null)
if [ -z "$CWD" ] || [ ! -f "$CWD/.claude/hooks/session-save.sh" ]; then
  exit 0
fi

# Extract data
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty' 2>/dev/null)
if [ -z "$SESSION_ID" ]; then
  exit 0
fi

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S")
DATE=$(date +"%Y-%m-%d")

# Count messages in the transcript.
# IMPORTANT: the Stop hook payload has NO .num_turns field. The previous version
# always wrote 0, causing /recover-sessions to discard every session without logs.
TRANSCRIPT=$(echo "$INPUT" | jq -r '.transcript_path // empty' 2>/dev/null)
MSG_COUNT=0
if [ -n "$TRANSCRIPT" ] && [ -f "$TRANSCRIPT" ]; then
  MSG_COUNT=$(wc -l < "$TRANSCRIPT" 2>/dev/null | tr -d ' ')
  MSG_COUNT=${MSG_COUNT:-0}
fi

# Read start_time and calculate elapsed time
START_FILE="$CWD/.claude/hooks/session-start-${SESSION_ID}.tmp"
START_EPOCH=""
ELAPSED_SECONDS=0
if [ -f "$START_FILE" ]; then
  START_EPOCH=$(cat "$START_FILE")
  NOW_EPOCH=$(date +%s)
  ELAPSED_SECONDS=$((NOW_EPOCH - START_EPOCH))
fi
# date -r is BSD syntax (macOS); date -d @ is GNU syntax (Linux).
# Try both; otherwise the start time silently remains empty on Linux.
START_TIME=""
if [ -n "$START_EPOCH" ]; then
  START_TIME=$(date -r "$START_EPOCH" -u +"%Y-%m-%dT%H:%M:%S" 2>/dev/null \
            || date -u -d "@$START_EPOCH" +"%Y-%m-%dT%H:%M:%S" 2>/dev/null \
            || echo "")
fi

# Breadcrumb directory
PENDING_DIR="$CWD/.claude/hooks/pending-sessions"
mkdir -p "$PENDING_DIR"

# Write the breadcrumb (idempotently overwritten on each Stop)
cat > "$PENDING_DIR/${SESSION_ID}.json" << EOF
{
  "session_id": "$SESSION_ID",
  "date": "$DATE",
  "timestamp": "$TIMESTAMP",
  "cwd": "$CWD",
  "transcript_path": "$TRANSCRIPT",
  "message_count": $MSG_COUNT,
  "start_time": "$START_TIME",
  "elapsed_seconds": $ELAPSED_SECONDS
}
EOF

exit 0
