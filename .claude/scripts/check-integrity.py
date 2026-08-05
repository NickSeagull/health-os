#!/usr/bin/env python3
"""
Health-OS — проверка целостности данных.

Запуск:
    python3 .claude/scripts/check-integrity.py           # кратко
    python3 .claude/scripts/check-integrity.py -v        # с деталями

Зачем это нужно. Схема, описанная в инструкции скилла, и схема реального
файла расходятся незаметно: скилл правится, данные остаются, никто не падает.
Большинство дефектов такого рода обнаруживаются не ошибкой, а неверным выводом
— тренд не находит половину истории, индекс теряет файл, счётчик считает не то.
Скрипт ловит этот класс до того, как он повлияет на медицинское заключение.

Отсутствующие файлы не считаются ошибкой: на свежей установке данных ещё нет.
"""

import csv
import json
import os
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "Data"
VERBOSE = "-v" in sys.argv or "--verbose" in sys.argv

OK, WARN, SKIP = "✅", "⚠️ ", "·"
problems: list[str] = []
checks_run = 0


def report(passed: bool | None, title: str, details: list[str] | None = None) -> None:
    """passed=None означает «нечего проверять» — не ошибка."""
    global checks_run
    if passed is None:
        print(f"  {SKIP} {title} — нет данных")
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


# ── 1. Синтаксис JSON ──────────────────────────────────────────────
def check_json_valid():
    files = list(iter_data_json())
    if not files:
        return report(None, "Синтаксис JSON")
    bad = []
    for p in files:
        try:
            json.loads(p.read_text(encoding="utf-8"))
        except Exception as e:
            bad.append(f"{p.relative_to(ROOT)}: {e}")
    report(not bad, f"Синтаксис JSON ({len(files)} файлов)", bad)


# ── 2. Поле version ────────────────────────────────────────────────
def check_version_field():
    files = [p for p in iter_data_json() if not p.name.startswith("_")]
    if not files:
        return report(None, "Поле version")
    missing = []
    for p in files:
        d = load_json(p)
        if isinstance(d, dict) and "version" not in d:
            missing.append(str(p.relative_to(ROOT)))
    report(not missing, f"Поле version ({len(files)} файлов)", missing)


# ── 3. Полнота индексов ────────────────────────────────────────────
def check_index_complete(idx_path: Path, entries_key: str, dir_path: Path, exts, title: str):
    if not idx_path.exists() or not dir_path.exists():
        return report(None, title)
    idx = load_json(idx_path)
    if not idx:
        return report(False, title, ["индекс не читается"])
    listed = {e.get("file") for e in idx.get(entries_key, [])}
    on_disk = {
        p.name for p in dir_path.iterdir()
        if p.suffix in exts
        and not p.name.startswith("_")
        # Шаблоны и демо-файлы не являются записями пациента и в индекс не входят.
        # Без этого фильтра свежая установка сразу рапортует о расхождении
        and ".example." not in p.name
        and ".demo." not in p.name
        and ".reference." not in p.name
    }
    missing = sorted(on_disk - listed)
    ghost = sorted(listed - on_disk)
    details = [f"нет в индексе: {f}" for f in missing] + [f"нет на диске: {f}" for f in ghost]
    report(not details, f"{title} ({len(on_disk)} на диске, {len(listed)} в индексе)", details)


# ── 4. Однородность CSV ────────────────────────────────────────────
def check_csv():
    p = DATA / "body-metrics.csv"
    if not p.exists():
        return report(None, "Однородность CSV")
    with p.open(encoding="utf-8") as f:
        rows = list(csv.reader(f))
    if not rows:
        return report(None, "Однородность CSV")
    width = len(rows[0])
    bad = [f"строка {i}: {len(r)} полей вместо {width}"
           for i, r in enumerate(rows[1:], start=2) if len(r) != width]
    # Настоящий CSV-парсер, а не split по запятой: заметка в кавычках
    # законно содержит запятую, и наивная проверка на ней ложно срабатывает
    report(not bad, f"Однородность CSV ({len(rows)-1} строк, {width} колонок)", bad)


# ── 5. Даты ────────────────────────────────────────────────────────
ISO = re.compile(r"^\d{4}-\d{2}-\d{2}$")
PERIOD = re.compile(r"^\d{4}(-\d{2})?(-\d{2})?$|^\d{4}-\d{4}$|^~")


def check_dates():
    files = list(iter_data_json())
    if not files:
        return report(None, "Формат дат")
    today = date.today().isoformat()
    bad = []

    def walk(node, path, src):
        if isinstance(node, dict):
            for k, v in node.items():
                if k in ("date", "started", "deadline", "result_date", "analysis_date") and isinstance(v, str) and v:
                    if not ISO.match(v):
                        if not PERIOD.match(v):
                            bad.append(f"{src}: {path}.{k} = «{v}» — не ISO 8601")
                    elif v > today and k != "deadline":
                        bad.append(f"{src}: {path}.{k} = {v} — дата из будущего")
                walk(v, f"{path}.{k}", src)
        elif isinstance(node, list):
            for i, v in enumerate(node):
                walk(v, f"{path}[{i}]", src)

    for p in files:
        d = load_json(p)
        if d is not None:
            walk(d, "", str(p.relative_to(ROOT)))
    report(not bad, "Формат дат", bad[:15])


# ── 6. Достижимость маркеров ───────────────────────────────────────
def check_markers_reachable():
    labs = DATA / "labs"
    if not labs.exists():
        return report(None, "Достижимость маркеров")
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
            hidden.append(f"{p.name}: +{extra} вне плоского markers[]")
    if total == 0:
        return report(None, "Достижимость маркеров")
    # Это не ошибка данных, а напоминание: читать нужно все три схемы
    passed = True
    report(passed, f"Достижимость маркеров ({total} всего, {total-flat} через panels/studies)", hidden)


# ── 7. Инвариант карты зубов ───────────────────────────────────────
def check_tooth_map():
    p = DATA / "dental" / "tooth-map.json"
    if not p.exists():
        return report(None, "Карта зубов")
    d = load_json(p) or {}
    s = d.get("summary") or {}
    teeth = d.get("teeth") or {}
    bad = []
    if s.get("total") not in (32, None):
        bad.append(f"summary.total = {s.get('total')}, ожидается 32 — массив teeth разрежен и не отражает полный ряд")
    counted = sum(v for k, v in s.items() if k != "total" and isinstance(v, int))
    if counted > len(teeth):
        bad.append(f"сумма статусов {counted} превышает число записей {len(teeth)}")
    report(not bad, "Карта зубов", bad)


# ── 8. Смета целей ─────────────────────────────────────────────────
def check_goals_cost():
    files = sorted((DATA / "goals").glob("*.json")) if (DATA / "goals").exists() else []
    files = [f for f in files if not f.name.startswith("_")]
    if not files:
        return report(None, "Смета целей")
    bad = []
    for p in files:
        g = load_json(p) or {}
        dirs = g.get("directions") or []
        cs = g.get("cost_summary") or {}
        if not dirs or not cs:
            continue
        est = sum(d.get("cost_estimate_rub") or 0 for d in dirs)
        if cs.get("total_estimate_rub") not in (None, est):
            bad.append(f"{p.name}: total_estimate_rub = {cs['total_estimate_rub']}, сумма по направлениям = {est}")
        by_phase = cs.get("by_phase") or {}
        ph: dict = {}
        for d in dirs:
            ph[d.get("phase")] = ph.get(d.get("phase"), 0) + (d.get("cost_estimate_rub") or 0)
        for k, v in by_phase.items():
            if isinstance(v, dict) and v.get("estimate") not in (None, ph.get(k, 0)):
                bad.append(f"{p.name}: {k}.estimate = {v['estimate']}, сумма = {ph.get(k, 0)}")
    report(not bad, "Смета целей", bad)


# ── 9. format соответствует расширению ─────────────────────────────
def check_visit_format():
    p = DATA / "doctors" / "visits" / "_index.json"
    if not p.exists():
        return report(None, "Соответствие format и расширения")
    idx = load_json(p) or {}
    bad = []
    for e in idx.get("visits", []):
        f, fmt = e.get("file", ""), e.get("format")
        if fmt and not f.endswith("." + fmt):
            bad.append(f"{f}: format = {fmt}")
    report(not bad, "Соответствие format и расширения", bad)


# ── 10. Ссылки на файлы разрешаются ────────────────────────────────
def check_file_refs():
    if not DATA.exists():
        return report(None, "Ссылки на файлы")
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
                    bad.append(f"{p.relative_to(ROOT)}: {key} = «{v}» не найден")
    if checked == 0:
        return report(None, "Ссылки на файлы")
    report(not bad, f"Ссылки на файлы ({checked} проверено)", bad[:10])


# ── main ───────────────────────────────────────────────────────────
def main() -> int:
    print()
    print("Health-OS — проверка целостности данных")
    print("═" * 47)
    print()

    check_json_valid()
    check_version_field()
    check_index_complete(
        DATA / "labs" / "_index.json", "analyses", DATA / "labs", {".json"}, "Индекс анализов полон"
    )
    check_index_complete(
        DATA / "doctors" / "visits" / "_index.json", "visits",
        DATA / "doctors" / "visits", {".json", ".md"}, "Индекс визитов полон"
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
        print("Данных пока нет — проверять нечего. Это нормально для свежей установки.")
        return 0
    if problems:
        print(f"Проблем: {len(problems)} из {checks_run} проверок")
        for p in problems:
            print(f"  • {p}")
        print()
        print("Запустите с флагом -v, чтобы увидеть детали.")
        return 1
    print(f"Все проверки пройдены ({checks_run})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
