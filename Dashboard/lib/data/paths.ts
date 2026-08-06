import fs from "fs";
import path from "path";

/**
 * Корень всех данных. Внутри него лежат профили, общая wiki и справочники.
 */
export const DATA_BASE = path.join(process.cwd(), "..", "Data");
export const PROFILES_BASE = path.join(DATA_BASE, "profiles");
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

const PROFILE_ID = /^[a-z0-9][a-z0-9-]{1,31}$/;

export class ProfileError extends Error {}

export type ProfileInfo = {
  id: string;
  displayName: string;
  relationship: string | null;
  dateOfBirth: string | null;
  sex: string | null;
  isActive: boolean;
};

/** Каталоги профилей на диске, отсортированные по идентификатору. */
export function listProfileIds(): string[] {
  try {
    return fs
      .readdirSync(PROFILES_BASE, { withFileTypes: true })
      .filter((e) => e.isDirectory() && PROFILE_ID.test(e.name))
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
}

const POINTER = path.join(PROFILES_BASE, "_active.json");

// Указатель читается на каждое обращение к пути, поэтому результат кешируется
// и сбрасывается по времени изменения файла. Так переключение профиля из
// дашборда или из Claude Code подхватывается сразу, без перезапуска сервера,
// и при этом не стоит одного чтения диска на каждый вызов dataPath().
let cached: { mtimeMs: number; id: string } | null = null;

/**
 * Активный профиль — единый для дашборда и Claude Code.
 *
 * Источник истины один: `Data/profiles/_active.json`. Если бы дашборд держал
 * профиль отдельно (например, в cookie), две половины системы могли бы
 * разойтись и показывать данные разных людей, не сообщая об этом.
 *
 * Указатель сломан — молча подставлять «какой-нибудь» профиль нельзя:
 * так на экран попадут чужие данные под чужим именем. Единственное
 * исключение — когда профиль ровно один и выбор однозначен.
 */
export function activeProfileId(): string {
  const ids = listProfileIds();
  if (ids.length === 0) {
    throw new ProfileError(
      "Профилей нет. Запустите ./setup.sh в корне проекта."
    );
  }

  try {
    const st = fs.statSync(POINTER);
    if (cached && cached.mtimeMs === st.mtimeMs && ids.includes(cached.id)) {
      return cached.id;
    }
    const raw = JSON.parse(fs.readFileSync(POINTER, "utf-8"));
    const id = raw?.active;
    if (typeof id === "string" && PROFILE_ID.test(id) && ids.includes(id)) {
      cached = { mtimeMs: st.mtimeMs, id };
      return id;
    }
    if (ids.length === 1) return ids[0];
    throw new ProfileError(
      `Указатель активного профиля ведёт на «${id}», а такого профиля нет. ` +
        `Доступны: ${ids.join(", ")}. Исправьте Data/profiles/_active.json.`
    );
  } catch (e) {
    if (e instanceof ProfileError) throw e;
    if (ids.length === 1) return ids[0];
    throw new ProfileError(
      "Не удалось прочитать Data/profiles/_active.json, а профилей несколько. " +
        `Доступны: ${ids.join(", ")}.`
    );
  }
}

/** Карточки всех профилей — для переключателя. */
export function listProfiles(): ProfileInfo[] {
  let active = "";
  try {
    active = activeProfileId();
  } catch {
    /* переключатель должен работать и при сломанном указателе */
  }
  return listProfileIds().map((id) => {
    let basic: Record<string, unknown> = {};
    try {
      const raw = JSON.parse(
        fs.readFileSync(path.join(PROFILES_BASE, id, "profile.json"), "utf-8")
      );
      basic = (raw?.basic ?? {}) as Record<string, unknown>;
    } catch {
      /* профиль без разбираемого profile.json всё равно показываем */
    }
    return {
      id,
      displayName: (basic.display_name as string) || id,
      relationship: (basic.relationship as string) ?? null,
      dateOfBirth: (basic.date_of_birth as string) ?? null,
      sex: (basic.sex as string) ?? null,
      isActive: id === active,
    };
  });
}

/** Записать активный профиль. Идентификатор проверяется до записи. */
export function setActiveProfile(id: string): void {
  if (!PROFILE_ID.test(id)) throw new ProfileError("Недопустимый идентификатор профиля");
  if (!listProfileIds().includes(id)) throw new ProfileError(`Профиля «${id}» нет`);

  let prev: { history?: unknown[] } = {};
  try {
    prev = JSON.parse(fs.readFileSync(POINTER, "utf-8"));
  } catch {
    /* указателя ещё нет — создаём с нуля */
  }
  const now = new Date().toISOString().slice(0, 19);
  const history = Array.isArray(prev.history) ? prev.history : [];
  history.push({ profile: id, at: now });

  fs.writeFileSync(
    POINTER,
    JSON.stringify(
      { version: 1, active: id, switched_at: now, history: history.slice(-20) },
      null,
      2
    ) + "\n",
    "utf-8"
  );
  cached = null;
}

/** Корень данных активного профиля. */
export function dataRoot(): string {
  return path.join(PROFILES_BASE, activeProfileId());
}

/**
 * Путь внутри активного профиля.
 *
 * Вызывать **внутри функций**, а не в константах уровня модуля: константа
 * вычисляется один раз при импорте и после переключения профиля продолжила бы
 * указывать на каталог предыдущего человека.
 */
export function dataPath(...segments: string[]) {
  return path.join(dataRoot(), ...segments);
}

/**
 * Путь к общесистемным данным — тем, что одинаковы для всех профилей:
 * справочник маркеров, карты специальностей, общая wiki с литературой.
 */
export function sharedDataPath(...segments: string[]) {
  return path.join(DATA_BASE, ...segments);
}

export function cachePath(...segments: string[]) {
  return path.join(CACHE_ROOT, ...segments);
}

export function whoopCachePath(...segments: string[]) {
  return path.join(WHOOP_ROOT, ...segments);
}
