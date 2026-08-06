import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { dataPath, sharedDataPath } from "./paths";
import { PERSONAL_TYPES, SHARED_TYPES } from "@/lib/types/wiki";
import type {
  WikiType,
  WikiPage,
  WikiEdge,
  WikiIssue,
  WikiGraph,
} from "@/lib/types/wiki";

export type { WikiType, WikiPage, WikiEdge, WikiIssue, WikiGraph };

const LINK_RE = /\[\[([^\]|]+?)(?:\|[^\]]*)?\]\]/g;

function readDir(base: string, type: WikiType, shared: boolean): WikiPage[] {
  const dir = path.join(base, type);
  let names: string[];
  try {
    names = fs.readdirSync(dir).filter(
      (f) =>
        f.endsWith(".md") &&
        !f.startsWith("_") &&
        // Шаблоны установщика лежат рядом с развёрнутыми страницами.
        // Без этой отсечки каждая страница попадала бы в граф дважды —
        // как страница и как собственный шаблон
        !/\.(demo|example|reference)\.md$/.test(f)
    );
  } catch {
    return [];
  }

  const pages: WikiPage[] = [];
  for (const name of names) {
    let raw: string;
    try {
      raw = fs.readFileSync(path.join(dir, name), "utf-8");
    } catch {
      continue;
    }
    let fm: Record<string, unknown> = {};
    let body = raw;
    let broken: string | null = null;
    try {
      const parsed = matter(raw);
      fm = parsed.data as Record<string, unknown>;
      body = parsed.content;
    } catch (e) {
      // Страница попадает в граф и без разбираемого frontmatter, но молчать
      // об этом нельзя: без метаданных она теряет заголовок, статус и
      // источники — и выглядит как страница, у которой их просто нет.
      // Частая причина — незакавыченное двоеточие в значении YAML
      broken = e instanceof Error ? e.message.split("\n")[0] : "не разбирается";
    }

    const slug = name.replace(/\.md$/, "");
    const links = new Set<string>();
    for (const m of body.matchAll(LINK_RE)) {
      const target = m[1].trim();
      // Ссылка без типа считается ссылкой внутри своего типа
      links.add(target.includes("/") ? target : `${type}/${target}`);
    }

    pages.push({
      id: `${type}/${slug}`,
      type,
      slug,
      title: typeof fm.title === "string" ? fm.title : slug,
      status: typeof fm.status === "string" ? fm.status : null,
      created: fm.created ? String(fm.created).slice(0, 10) : null,
      updated: fm.updated ? String(fm.updated).slice(0, 10) : null,
      sources: Array.isArray(fm.sources) ? fm.sources.map(String) : [],
      url: typeof fm.url === "string" ? fm.url : null,
      links: [...links],
      body,
      shared,
      broken,
    });
  }
  return pages;
}

/** Время последнего изменения файла-источника, к которому привязана страница. */
function newestSourceDate(page: WikiPage, profileRoot: string, sharedRoot: string): string | null {
  let newest: number | null = null;
  for (const rel of page.sources) {
    const base = page.shared ? sharedRoot : profileRoot;
    // Источник не должен уводить за пределы своего корня
    const target = path.resolve(base, rel);
    if (target !== base && !target.startsWith(base + path.sep)) continue;
    try {
      const st = fs.statSync(target);
      newest = newest === null ? st.mtimeMs : Math.max(newest, st.mtimeMs);
    } catch {
      /* источник мог быть переименован — это ловит отдельная проверка */
    }
  }
  return newest === null ? null : new Date(newest).toISOString().slice(0, 10);
}

/**
 * Разбор wiki в граф.
 *
 * Граф считается при запросе, а не читается из кеша: кеш разошёлся бы со
 * страницами — ровно та проблема, ради которой числа не копируются в wiki.
 */
export function readWikiGraph(): WikiGraph {
  const profileRoot = (() => {
    try {
      return dataPath("wiki");
    } catch {
      return "";
    }
  })();
  const sharedRoot = sharedDataPath("wiki");

  const pages: WikiPage[] = [];
  if (profileRoot) {
    for (const t of PERSONAL_TYPES) pages.push(...readDir(profileRoot, t, false));
  }
  for (const t of SHARED_TYPES) pages.push(...readDir(sharedRoot, t, true));

  const byId = new Map(pages.map((p) => [p.id, p]));
  const edges: WikiEdge[] = [];
  const inbound = new Map<string, number>();
  const issues: WikiIssue[] = [];

  for (const p of pages) {
    for (const target of p.links) {
      if (byId.has(target)) {
        edges.push({ from: p.id, to: target });
        inbound.set(target, (inbound.get(target) ?? 0) + 1);
      } else {
        issues.push({
          kind: "dead-link",
          page: p.id,
          detail: `ссылка на [[${target}]] — такой страницы нет`,
        });
      }
    }
  }

  const dataRootForProfile = profileRoot ? path.dirname(profileRoot) : "";
  const dataRootShared = path.dirname(sharedRoot);

  for (const p of pages) {
    if (p.broken) {
      issues.push({
        kind: "broken-frontmatter",
        page: p.id,
        detail: `метаданные не разбираются (${p.broken}) — заголовок, статус и источники потеряны`,
      });
    }
    if (!inbound.get(p.id) && p.type !== "synthesis") {
      issues.push({
        kind: "orphan",
        page: p.id,
        detail: "на страницу никто не ссылается",
      });
    }
    // Страница-источник сама является первоисточником: sources[] ей не нужен,
    // но нужен проверяемый URL. Ссылка без URL — ровно то, что запрещает
    // evidence-base.md: правдоподобное утверждение, которое нельзя проверить
    if (p.type === "source") {
      if (!p.url) {
        issues.push({
          kind: "no-source",
          page: p.id,
          detail: "страница-источник без URL — сослаться на неё нельзя",
        });
      }
      continue;
    }
    if (p.sources.length === 0) {
      issues.push({
        kind: "no-source",
        page: p.id,
        detail: "нет ни одного источника в sources[]",
      });
      continue;
    }
    const newest = newestSourceDate(p, dataRootForProfile, dataRootShared);
    if (newest && p.updated && newest > p.updated) {
      issues.push({
        kind: "stale",
        page: p.id,
        detail: `источник обновлён ${newest}, страница — ${p.updated}`,
      });
    }
  }

  const counts: Record<string, number> = {};
  for (const p of pages) counts[p.type] = (counts[p.type] ?? 0) + 1;

  return { pages, edges, issues, counts };
}
