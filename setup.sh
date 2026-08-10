#!/usr/bin/env bash
#
# Health-OS — установка.
#
#   ./setup.sh          рабочий режим: пустые шаблоны, готовые к заполнению
#   ./setup.sh --demo   демо-режим: данные вымышленного пациента, чтобы осмотреться
#
# Скрипт идемпотентен: существующие файлы не перезаписываются никогда.

set -euo pipefail

MODE="blank"
ASSUME_YES="no"
for arg in "$@"; do
  case "$arg" in
    --demo) MODE="demo" ;;
    -y|--yes) ASSUME_YES="yes" ;;   # принять условия без вопроса — для автоматизации
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
echo "Health-OS — установка (режим: $MODE)"
echo "═══════════════════════════════════════════════"
echo
echo "${YELLOW}⚠️  ПРОЧТИТЕ ПЕРЕД УСТАНОВКОЙ${NC}"
echo
echo "  Это ${YELLOW}не медицинское изделие${NC}: программа не зарегистрирована,"
echo "  не сертифицирована и не проходила клинических испытаний."
echo "  Она не диагностирует, не лечит и не заменяет врача."
echo
echo "  Некоммерческий проект. Предоставляется «как есть», без гарантий."
echo "  ${YELLOW}Использование — исключительно на собственный риск.${NC}"
echo "  Авторы не отвечают за вред здоровью, ошибочные выводы и утрату данных."
echo
echo "  За сохранность и законность обработки своих данных отвечаете вы."
echo "  Содержимое файлов передаётся в API языковой модели при каждом обращении."
echo
echo "  Все демонстрационные данные вымышлены."
echo
echo "  Полные условия: DISCLAIMER.md"
echo
echo "  🚨 При неотложном состоянии — скорая помощь. Программа не мониторинг."
echo
if [ "$ASSUME_YES" = "yes" ]; then
  ok "условия приняты (флаг --yes)"
else
  printf "  Принимаете условия? [y/N] "
  if read -r ACCEPT </dev/tty 2>/dev/null; then
    case "$ACCEPT" in
      [yYдД]*) echo; ok "условия приняты" ;;
      *) echo; err "Установка отменена. Без принятия условий использовать программу нельзя."; exit 1 ;;
    esac
  else
    echo
    err "Терминал недоступен. Для неинтерактивной установки: ./setup.sh --yes"
    exit 1
  fi
fi
echo

# ── 1. Проверка окружения ──────────────────────────────────────────
echo "Проверяю окружение"
MISSING=0
need() {
  if command -v "$1" >/dev/null 2>&1; then ok "$1"; else err "$1 — $2"; MISSING=1; fi
}
need python3 "нужен для проверок целостности"
if command -v python3 >/dev/null 2>&1; then
  # Скрипт целостности использует аннотации вида `bool | None` — это Python 3.10+
  if python3 -c 'import sys; sys.exit(0 if sys.version_info >= (3,10) else 1)' 2>/dev/null; then
    ok "python3 $(python3 -c 'import sys;print(".".join(map(str,sys.version_info[:3])))')"
  else
    err "python3 $(python3 -c 'import sys;print(".".join(map(str,sys.version_info[:3])))') — нужен 3.10 или новее"
    MISSING=1
  fi
fi
need jq       "нужен для хуков сессий"
need git      "нужен для локального контроля версий"

if command -v node >/dev/null 2>&1; then
  NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
  if [ "$NODE_MAJOR" -ge 20 ]; then ok "node $(node -v)"; else warn "node $(node -v) — дашборду нужен 20+"; fi
else
  warn "node не найден — система работает, дашборд не запустится"
fi

if [ "$MISSING" -eq 1 ]; then
  echo
  err "Не хватает обязательных зависимостей. Установите их и запустите скрипт снова."
  exit 1
fi
echo

# ── 2. Файлы данных ────────────────────────────────────────────────
echo "Разворачиваю файлы данных"

# Смешивать режимы нельзя: демо-файлы лягут поверх пустых, а индексы останутся
# от чистой установки — получится рассогласованное состояние, которое падает
# на проверке целостности. Проверяем до первого копирования.
EXISTING=$(find Data/profiles -type f \( -name "*.json" -o -name "*.csv" -o -name "*.jsonl" -o -name "*.md" \) \
  ! -name "*.example.*" ! -name "*.demo.*" ! -name "*.reference.*" 2>/dev/null | wc -l | tr -d ' ')

if [ "$EXISTING" -gt 0 ] && [ "$MODE" = "demo" ]; then
  echo
  err "В Data/profiles/ уже есть $EXISTING файлов, развёрнутых ранее."
  err "Накладывать демо-набор поверх них нельзя — индексы разойдутся с файлами."
  echo
  echo "  Если это ваши данные — не запускайте --demo, вы их перезапишете."
  echo "  Если это прошлая установка и её не жаль, очистите каталог:"
  echo
  echo "    rm -rf Data/profiles/*/ && rm -f Data/profiles/_active.json"
  echo
  echo "  Затем запустите ./setup.sh --demo снова."
  echo
  exit 1
fi

# Данные раскладываются по профилям: Data/profiles/<id>/. Первый профиль —
# владелец установки. Шаблоны при этом остаются на месте, в Data/: они общие
# и служат источником для каждого нового профиля.
PROFILE="${PROFILE:-owner}"
PROFILE_DIR="Data/profiles/$PROFILE"

mkdir -p "$PROFILE_DIR"/{context,labs/pdfs,doctors/visits,doctors/prep,dental,\
medications,mental,goals,costs,traction,consilium,history,wiki/condition,\
wiki/hypothesis,wiki/symptom,wiki/synthesis} 2>/dev/null
mkdir -p Data/wiki/source Data/wiki/marker 2>/dev/null

# Куда разворачивается шаблон. Всё, что лежит в Data/profiles/, — служебное
# (указатель активного профиля) и остаётся на своём уровне. Остальное уходит
# внутрь профиля: Data/labs/_index.example.json → Data/profiles/owner/labs/_index.json
target_for() {
  local tpl="$1" suffix="$2" ext="$3"
  local rel="${tpl#Data/}"
  local stem="${rel%$suffix}"
  case "$rel" in
    # Служебное: указатель активного профиля лежит над профилями
    profiles/*)              printf 'Data/%s.%s' "$stem" "$ext" ;;
    # Общая wiki: литература и справка по маркерам одинаковы для всех людей,
    # дублировать их по профилям бессмысленно
    wiki/source/*|wiki/marker/*) printf 'Data/%s.%s' "$stem" "$ext" ;;
    # Личная wiki и все остальные данные — внутрь профиля
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
    skip "$base — уже есть, не трогаю"
    KEPT=$((KEPT+1))
  else
    mkdir -p "$(dirname "$target")"
    cp "$tpl" "$target"
    ok "$base"
    CREATED=$((CREATED+1))
  fi
done < <(find Data -name "*$SUFFIX" -print0 2>/dev/null)

# Остальные форматы: таблицы, построчные журналы, протоколы в Markdown
for ext in csv jsonl md; do
  pat=".example.$ext"; [ "$MODE" = "demo" ] && pat=".demo.$ext"
  while IFS= read -r -d '' tpl; do
    target="$(target_for "$tpl" "$pat" "$ext")"
    base="$(basename "$target")"
    if [ -e "$target" ]; then skip "$base — уже есть"; KEPT=$((KEPT+1))
    else mkdir -p "$(dirname "$target")"; cp "$tpl" "$target"; ok "$base"; CREATED=$((CREATED+1)); fi
  done < <(find Data -name "*$pat" -print0 2>/dev/null)
done

# Годовые файлы: цели и расходы называются по году — 2026.json, 2026.jsonl.
# Шаблоны лежат под нейтральными именами, чтобы не устаревать; здесь имя
# получает актуальный год. Без этого дашборд, ищущий файл по маске \d{4}.json,
# целей просто не находит.
YEAR="$(date +%Y)"
for pair in "$PROFILE_DIR/goals/goals.json:$PROFILE_DIR/goals/$YEAR.json" "$PROFILE_DIR/costs/costs.jsonl:$PROFILE_DIR/costs/$YEAR.jsonl"; do
  src="${pair%%:*}"; dst="${pair##*:}"
  if [ -f "$src" ] && [ ! -e "$dst" ]; then
    mv "$src" "$dst"
    ok "$(basename "$dst") — годовой файл"
  elif [ -f "$src" ] && [ -e "$dst" ]; then
    rm -f "$src"
    skip "$(basename "$dst") — уже есть"
  fi
done

echo "  создано: $CREATED, сохранено существующих: $KEPT"
echo

# ── 3. Конфигурация MCP ────────────────────────────────────────────
echo "Настраиваю интеграции"
if [ -f ".mcp.json" ]; then
  skip ".mcp.json — уже есть"
elif [ -f ".mcp.json.example" ]; then
  cp .mcp.json.example .mcp.json
  chmod 600 .mcp.json
  ok ".mcp.json создан из шаблона (права 600)"
  warn "впишите свои ключи вручную — в шаблоне заглушки"
fi
echo

# ── 4. Права доступа ───────────────────────────────────────────────
echo "Ограничиваю права"
chmod -R go-rwx Data 2>/dev/null && ok "Data/ — только для владельца"
[ -f .mcp.json ] && chmod 600 .mcp.json && ok ".mcp.json — 600"
chmod +x .claude/hooks/*.sh 2>/dev/null && ok "хуки исполняемые"
echo

# ── 5. Локальный git ───────────────────────────────────────────────
echo "Проверяю изоляцию репозитория"
if [ ! -d .git ]; then
  git init -q
  ok "git-репозиторий создан"
fi

if git remote | grep -q .; then
  # После клонирования с GitHub origin есть всегда — это норма, а не авария.
  # Красный крест здесь пугал бы каждого нового пользователя на ровном месте.
  REMOTE_NAME=$(git remote | head -1)
  REMOTE_URL=$(git remote get-url "$REMOTE_NAME" 2>/dev/null || echo "")
  warn "У репозитория есть remote: $REMOTE_NAME → $REMOTE_URL"
  echo "     Если это origin от клонирования — снимите его, чтобы медданные"
  echo "     физически некуда было отправить:"
  echo
  echo "       git remote remove $REMOTE_NAME"
  echo
  echo "     Обновляться после этого можно так (см. INSTALL.md, раздел «Обновление»):"
  echo "       git fetch <адрес> && git merge FETCH_HEAD"
else
  ok "remote отсутствует — данные останутся локально"
fi

# Проверяем, что предохранитель работает
PROBE="Data/__gitignore_probe.json"
echo '{}' > "$PROBE"
if git check-ignore -q "$PROBE" 2>/dev/null; then
  ok ".gitignore закрывает Data/ — проверено"
else
  err ".gitignore НЕ закрывает Data/ — это опасно, не начинайте вносить данные"
fi
rm -f "$PROBE"
echo

# ── 6. Итог ────────────────────────────────────────────────────────
echo "═══════════════════════════════════════════════"
if [ "$MODE" = "demo" ]; then
  echo "Готово. Развёрнут демо-набор вымышленного пациента."
  echo
  echo "Посмотреть дашборд:"
  echo "  cd Dashboard && npm install && npm run dev"
  echo
  echo "Когда наиграетесь — удалите демо-данные и запустите ./setup.sh заново."
else
  echo "Готово. Файлы данных пусты и ждут наполнения."
  echo
  echo "Дальше:"
  echo "  1. Откройте проект в Claude Code"
  echo "  2. Запустите /onboarding — система соберёт стартовую медкарту"
  echo "  3. Кладите PDF анализов в Inbox/ и запускайте /inbox"
  echo
  echo "Пошагово: docs/ONBOARDING.md"
fi
echo
echo "⚕️  Система не ставит диагнозов и не заменяет врача."
echo
echo "─────────────────────────────────────────────────"
echo "  Разбор системы:  https://youtu.be/sA1rrgo8x64"
echo "  Автор:           Александр Ярыгин, @alxyrgin"
echo "  Telegram:        https://t.me/+oYugtGxjawYxZmVi"
echo "  При поддержке Glake AI:  https://glake.ai/?utm_source=cli&utm_medium=setup&utm_campaign=health-os"
echo
