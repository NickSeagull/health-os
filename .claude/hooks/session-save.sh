#!/bin/bash
# session-save.sh — Stop hook для сохранения breadcrumb сессии
# Срабатывает после каждого ответа Claude. Перезаписывает файл по session_id.
# Когда сессия заканчивается, breadcrumb остаётся как pending.

set -euo pipefail

# Защита от рекурсии
if [ "${CLAUDE_STOP_HOOK_ACTIVE:-}" = "1" ]; then
  exit 0
fi
export CLAUDE_STOP_HOOK_ACTIVE=1

# Читаем JSON из stdin
INPUT=$(cat)

# Хук должен срабатывать только в этом проекте.
# Проверяем по факту наличия самого хука в рабочем каталоге, а не по имени
# каталога: привязка к подстроке «health-os» ломала breadcrumbs у всех,
# кто склонировал репозиторий под другим именем.
CWD=$(echo "$INPUT" | jq -r '.cwd // empty' 2>/dev/null)
if [ -z "$CWD" ] || [ ! -f "$CWD/.claude/hooks/session-save.sh" ]; then
  exit 0
fi

# Извлекаем данные
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty' 2>/dev/null)
if [ -z "$SESSION_ID" ]; then
  exit 0
fi

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S")
DATE=$(date +"%Y-%m-%d")

# Считаем сообщения по транскрипту.
# ВАЖНО: в payload Stop-хука поля .num_turns НЕТ — прежняя версия всегда писала 0,
# из-за чего /recover-sessions считал все сессии пустыми и удалял их без логов.
TRANSCRIPT=$(echo "$INPUT" | jq -r '.transcript_path // empty' 2>/dev/null)
MSG_COUNT=0
if [ -n "$TRANSCRIPT" ] && [ -f "$TRANSCRIPT" ]; then
  MSG_COUNT=$(wc -l < "$TRANSCRIPT" 2>/dev/null | tr -d ' ')
  MSG_COUNT=${MSG_COUNT:-0}
fi

# Читаем start_time и вычисляем длительность
START_FILE="$CWD/.claude/hooks/session-start-${SESSION_ID}.tmp"
START_EPOCH=""
ELAPSED_SECONDS=0
if [ -f "$START_FILE" ]; then
  START_EPOCH=$(cat "$START_FILE")
  NOW_EPOCH=$(date +%s)
  ELAPSED_SECONDS=$((NOW_EPOCH - START_EPOCH))
fi
# date -r — синтаксис BSD (macOS), date -d @ — GNU (Linux).
# Пробуем оба, иначе на Linux время старта молча оставалось пустым
START_TIME=""
if [ -n "$START_EPOCH" ]; then
  START_TIME=$(date -r "$START_EPOCH" -u +"%Y-%m-%dT%H:%M:%S" 2>/dev/null \
            || date -u -d "@$START_EPOCH" +"%Y-%m-%dT%H:%M:%S" 2>/dev/null \
            || echo "")
fi

# Директория для breadcrumbs
PENDING_DIR="$CWD/.claude/hooks/pending-sessions"
mkdir -p "$PENDING_DIR"

# Записываем breadcrumb (перезаписываем на каждом Stop — идемпотентно)
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
