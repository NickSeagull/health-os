import path from "path";

export const DATA_ROOT = path.join(process.cwd(), "..", "Data");
export const CACHE_ROOT = path.join(process.cwd(), "..", "Cache");

/**
 * Каталог с кешем метрик WHOOP.
 *
 * По умолчанию — `Cache/whoop` внутри проекта. Раньше здесь был жёстко
 * зашит путь во внешний каталог конкретной установки: у всех остальных
 * раздел WHOOP просто оставался пустым, без всякого сообщения об ошибке.
 *
 * Переопределяется переменной окружения `HEALTH_OS_WHOOP_DIR`
 * в `Dashboard/.env.local`, если кеш лежит в другом месте.
 */
export const WHOOP_ROOT =
  process.env.HEALTH_OS_WHOOP_DIR || path.join(CACHE_ROOT, "whoop");

export function dataPath(...segments: string[]) {
  return path.join(DATA_ROOT, ...segments);
}

export function cachePath(...segments: string[]) {
  return path.join(CACHE_ROOT, ...segments);
}

export function whoopCachePath(...segments: string[]) {
  return path.join(WHOOP_ROOT, ...segments);
}
