import type { Tooth, ToothMap, ToothStatus } from "@/lib/types/dental";

/**
 * Пересчёт `summary` карты зубов и разбор номеров по ISO 3950 (FDI).
 * Модуль без серверных зависимостей — карту рисует клиентский компонент,
 * а роут пишет по тем же правилам, чтобы два источника записи не разошлись.
 */

export const TOOTH_STATUSES = [
  "healthy",
  "filled",
  "crowned",
  "implant",
  "extracted",
  "needs_treatment",
  "root_canal",
] as const satisfies readonly ToothStatus[];

/** Полный зубной ряд взрослого — константа, а не производная от данных */
export const TOTAL_TEETH = 32;

/** Все допустимые позиции: квадранты 1–4, зубы 1–8 в каждом */
export const FDI_NUMBERS: string[] = [1, 2, 3, 4].flatMap((quadrant) =>
  [1, 2, 3, 4, 5, 6, 7, 8].map((tooth) => `${quadrant}${tooth}`)
);

export function isFdiToothNumber(value: string): boolean {
  return FDI_NUMBERS.includes(value);
}

/**
 * `teeth` разрежен: ключи есть только у зубов с известным статусом.
 *
 * Отсюда два правила Блока 6 `data-schemas.md`, которые прежний роут нарушал:
 * `total` — это всегда 32, а не число записей (иначе правка одного зуба
 * переписывала заголовок карты с «32 зубов» на «3 зубов»), а статусные счётчики
 * считаются только по присутствующим записям. Отсутствие ключа — «статус
 * неизвестен», и такой зуб не попадает ни в один счётчик.
 */
export function recountToothSummary(teeth: Record<string, Tooth>): ToothMap["summary"] {
  const summary: ToothMap["summary"] = {
    total: TOTAL_TEETH,
    healthy: 0,
    filled: 0,
    crowned: 0,
    implant: 0,
    extracted: 0,
    needs_treatment: 0,
    root_canal: 0,
  };

  for (const tooth of Object.values(teeth ?? {})) {
    // Проверка нужна на случай статуса с диска, которого нет в enum
    const status = tooth?.status;
    if (status && TOOTH_STATUSES.includes(status)) {
      summary[status] += 1;
    }
  }

  return summary;
}

/** Сколько зубов остались без записи — разница между рядом и известными статусами */
export function unknownToothCount(teeth: Record<string, Tooth>): number {
  return TOTAL_TEETH - Object.keys(teeth ?? {}).length;
}
