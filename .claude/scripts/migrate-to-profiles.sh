#!/usr/bin/env bash
#
# Перенос плоской структуры Data/ в Data/profiles/<id>/
#
# До появления профилей все данные лежали прямо в Data/. Скрипт переносит их
# в профиль владельца, оставляя на месте общесистемные справочники и шаблоны.
#
#   ./.claude/scripts/migrate-to-profiles.sh            показать план, ничего не делать
#   ./.claude/scripts/migrate-to-profiles.sh --apply    выполнить перенос
#
# Обратного хода нет. Единственный способ вернуться — резервная копия.

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
    *) err "неизвестный аргумент: $a"; exit 1 ;;
  esac
done

if ! [[ "$PROFILE" =~ ^[a-z0-9][a-z0-9-]{1,31}$ ]]; then
  err "недопустимый идентификатор профиля: «${PROFILE}»"
  echo "     Разрешены строчная латиница, цифры и дефис, 2–32 символа."
  exit 1
fi

echo
echo "Health-OS — перенос данных в профиль «${PROFILE}»"
echo "═══════════════════════════════════════════════"
echo

if [ ! -d Data ]; then err "каталога Data/ нет — переносить нечего"; exit 1; fi

DEST="Data/profiles/$PROFILE"

# ── Что переносим ──────────────────────────────────────────────────
# Всё содержимое Data/, кроме: самого каталога профилей, общей wiki,
# общесистемных справочников и файлов-шаблонов.
# `mapfile` недоступен: macOS поставляется с bash 3.2, где его нет.
# Собираем список во временный файл — работает в любой версии.
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
  ok "Данных в плоской структуре нет — переносить нечего."
  if [ -d "$DEST" ]; then ok "Профиль «${PROFILE}» уже существует."; fi
  echo
  exit 0
fi

echo "Будет перенесено файлов: $COUNT"
echo
while IFS= read -r f; do
  echo "  ${DIM}$f${NC}  →  $DEST/${f#Data/}"
done < <(head -40 "$LIST")
[ "$COUNT" -gt 40 ] && echo "  ${DIM}… и ещё $(( COUNT - 40 ))${NC}"
echo
echo "Останутся на месте (общесистемные):"
echo "  Data/labs/_marker-aliases.json   справочник маркеров"
echo "  Data/specialists/                зоны ответственности специальностей"
echo "  Data/wiki/                       общее знание: источники, справка"
echo "  Data/*.example.*, *.demo.*       шаблоны установщика"
echo

if [ "$APPLY" != "yes" ]; then
  warn "Это предварительный просмотр. Ничего не изменено."
  echo
  echo "  Сделайте резервную копию каталога Data/ — обратного хода у переноса нет:"
  echo "      cp -R Data Data.backup-\$(date +%Y%m%d)"
  echo
  echo "  Затем выполните перенос:"
  echo "      $0 --apply"
  echo
  exit 0
fi

# ── Выполнение ─────────────────────────────────────────────────────
if [ -d "$DEST" ] && [ -n "$(find "$DEST" -type f 2>/dev/null | head -1)" ]; then
  err "Профиль «${PROFILE}» уже содержит файлы."
  err "Перенос поверх существующего профиля смешал бы два набора данных."
  echo
  echo "  Укажите другой профиль:  $0 --apply --profile=<id>"
  echo
  exit 1
fi

echo "Переношу"
MOVED=0
while IFS= read -r f; do
  [ -f "$f" ] || continue
  rel="${f#Data/}"
  target="$DEST/$rel"
  mkdir -p "$(dirname "$target")"
  mv "$f" "$target"
  MOVED=$((MOVED+1))
done < "$LIST"
ok "перенесено файлов: $MOVED"

# Пустые каталоги, оставшиеся после переноса, кроме тех, где лежат шаблоны
find Data -mindepth 1 -maxdepth 2 -type d -empty \
  ! -path "Data/profiles*" ! -path "Data/wiki*" -delete 2>/dev/null || true

# ── Указатель активного профиля ────────────────────────────────────
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
  ok "_active.json создан, активный профиль — «${PROFILE}»"
else
  ok "_active.json уже есть, не трогаю"
fi

chmod -R go-rwx Data 2>/dev/null || true

echo
echo "═══════════════════════════════════════════════"
echo "Готово. Проверяю целостность:"
echo
python3 .claude/scripts/check-integrity.py || {
  echo
  warn "Проверка целостности нашла проблемы — разберитесь до внесения новых данных."
  exit 1
}
echo
echo "Добавить члена семьи:  /profiles создать"
echo
