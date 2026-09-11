import fs from "fs";
import path from "path";

/**
 * Root of all data. It contains profiles, the shared wiki, and reference data.
 */
export const DATA_BASE = path.join(process.cwd(), "..", "Data");
export const PROFILES_BASE = path.join(DATA_BASE, "profiles");
export const CACHE_ROOT = path.join(process.cwd(), "..", "Cache");

/**
 * Directory containing the WHOOP metrics cache.
 *
 * By default this is `Cache/whoop` inside the project. Previously this used a
 * hard-coded path to a particular installation's external directory, leaving
 * the WHOOP section empty for every other installation without reporting an error.
 *
 * Override it with `HEALTH_OS_WHOOP_DIR` in `Dashboard/.env.local` when the
 * cache is stored elsewhere.
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

/** Profile directories on disk, sorted by identifier. */
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

// Read the pointer on every path lookup, caching the result and invalidating it
// when the file changes. This makes profile switches from the dashboard or Claude
// Code take effect immediately without restarting the server, without an extra
// disk read for every dataPath() call.
let cached: { mtimeMs: number; id: string } | null = null;

/**
 * The active profile is shared by the dashboard and Claude Code.
 *
 * There is one source of truth: `Data/profiles/_active.json`. If the dashboard
 * kept the profile separately (for example, in a cookie), the two parts of the
 * system could diverge and show different people's data without reporting it.
 *
 * A broken pointer must not silently select an arbitrary profile: that could
 * put someone else's data on screen under the wrong name. The only exception is
 * when exactly one profile exists and the choice is unambiguous.
 */
export function activeProfileId(): string {
  const ids = listProfileIds();
  if (ids.length === 0) {
    throw new ProfileError(
      "No profiles found. Run ./setup.sh from the project root."
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
      `The active profile pointer refers to "${id}", but that profile does not exist. ` +
        `Available profiles: ${ids.join(", ")}. Fix Data/profiles/_active.json.`
    );
  } catch (e) {
    if (e instanceof ProfileError) throw e;
    if (ids.length === 1) return ids[0];
    throw new ProfileError(
      "Could not read Data/profiles/_active.json and multiple profiles exist. " +
        `Available profiles: ${ids.join(", ")}.`
    );
  }
}

/** Cards for all profiles, used by the profile switcher. */
export function listProfiles(): ProfileInfo[] {
  let active = "";
  try {
    active = activeProfileId();
  } catch {
    /* The switcher must work even when the pointer is broken. */
  }
  return listProfileIds().map((id) => {
    let basic: Record<string, unknown> = {};
    try {
      const raw = JSON.parse(
        fs.readFileSync(path.join(PROFILES_BASE, id, "profile.json"), "utf-8")
      );
      basic = (raw?.basic ?? {}) as Record<string, unknown>;
    } catch {
      /* Show a profile even when its profile.json cannot be parsed. */
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

/** Write the active profile. Validate the identifier before writing. */
export function setActiveProfile(id: string): void {
  if (!PROFILE_ID.test(id)) throw new ProfileError("Invalid profile identifier");
  if (!listProfileIds().includes(id)) throw new ProfileError(`Profile "${id}" does not exist`);

  let prev: { history?: unknown[] } = {};
  try {
    prev = JSON.parse(fs.readFileSync(POINTER, "utf-8"));
  } catch {
    /* The pointer does not exist yet; create it from scratch. */
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

/** Data root for the active profile. */
export function dataRoot(): string {
  return path.join(PROFILES_BASE, activeProfileId());
}

/**
 * Path inside the active profile.
 *
 * Call this **inside functions**, not in module-level constants: a constant is
 * evaluated once at import time and would continue pointing to the previous
 * person's directory after a profile switch.
 */
export function dataPath(...segments: string[]) {
  return path.join(dataRoot(), ...segments);
}

/**
 * Path to system-wide data shared by all profiles: the marker reference,
 * specialty maps, and the shared literature wiki.
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
