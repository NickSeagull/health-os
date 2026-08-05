#!/bin/bash
# session-restore.sh — SessionStart hook для health-os
# Обнаруживает pending breadcrumbs, проверяет свежесть active-context
# Без git sync (health-os — только локальный)

set -euo pipefail

# Путь выводится из расположения самого скрипта: .claude/hooks/ → корень проекта.
# Захардкоженный абсолютный путь ломал хук у любого, кто склонировал репозиторий,
# и заодно раскрывал имя пользователя в файле под контролем версий.
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Читаем payload SessionStart из stdin.
# ВАЖНО: переменная окружения CLAUDE_SESSION_ID не задаётся — прежняя версия
# полагалась на неё, из-за чего session_id всегда был пуст: tmp-файл со временем
# старта не создавался, а текущая сессия не исключалась из списка pending.
HOOK_INPUT=""
if [ ! -t 0 ]; then
  HOOK_INPUT=$(cat 2>/dev/null || echo "")
fi

# Cache freshness check — active-context.md
CONTEXT_FILE="$PROJECT_DIR/Cache/active-context.md"
if [ -f "$CONTEXT_FILE" ]; then
  # stat -f%m — BSD (macOS), stat -c%Y — GNU (Linux). Без запасного варианта
  # на Linux возвращался 0, и предупреждение о несвежести срабатывало всегда
  CTX_MTIME=$(stat -f%m "$CONTEXT_FILE" 2>/dev/null || stat -c%Y "$CONTEXT_FILE" 2>/dev/null || echo 0)
  CONTEXT_AGE_DAYS=$(( ($(date +%s) - CTX_MTIME) / 86400 ))
  if [ "$CONTEXT_AGE_DAYS" -gt 7 ]; then
    echo "<context-stale>active-context.md не обновлялся $CONTEXT_AGE_DAYS дней. Рекомендуется /day</context-stale>"
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
      echo "<cache-stale>Cache не обновлялся $CACHE_AGE_DAYS дней. Рекомендуется /day или /health</cache-stale>"
    fi
  fi
fi

PENDING_DIR="$PROJECT_DIR/.claude/hooks/pending-sessions"

# Если директории нет — нечего делать
if [ ! -d "$PENDING_DIR" ]; then
  exit 0
fi

# Записываем epoch timestamp старта сессии
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

  # Пропускаем текущую сессию
  if [ "$SID" = "$CURRENT_SESSION" ]; then
    continue
  fi

  PENDING_COUNT=$((PENDING_COUNT + 1))
  DATE=$(jq -r '.date' "$f" 2>/dev/null)
  MSG=$(jq -r '.message_count' "$f" 2>/dev/null)
  PENDING_DATA="$PENDING_DATA\n  - $DATE (ID: ${SID:0:8}, ~$MSG turns)"
done

# Если есть pending — выводим инструкции
if [ "$PENDING_COUNT" -gt 0 ]; then
  echo "<session-recovery>"
  echo "Обнаружено $PENDING_COUNT несохранённых сессий:"
  echo -e "$PENDING_DATA"
  echo ""
  echo "Предложи пользователю: «Обнаружены $PENDING_COUNT незафиксированных сессий. Обработать сейчас (/recover-sessions) или перейти к работе?»"
  echo "</session-recovery>"
fi

exit 0
