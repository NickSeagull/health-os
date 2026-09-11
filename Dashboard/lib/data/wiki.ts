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
        // Installer templates live beside deployed pages. Without this filter,
        // every page would enter the graph twice: as a page and as its own template.
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
      // Keep the page in the graph even when its frontmatter cannot be parsed,
      // but report it: without metadata it loses its title, status, and sources,
      // appearing to have none. A common cause is an unquoted colon in a YAML value.
      broken = e instanceof Error ? e.message.split("\n")[0] : "cannot be parsed";
    }

    const slug = name.replace(/\.md$/, "");
    const links = new Set<string>();
    for (const m of body.matchAll(LINK_RE)) {
      const target = m[1].trim();
      // A link without a type is considered to be within the current type.
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

/** Last modification time of the source file linked to a page. */
function newestSourceDate(page: WikiPage, profileRoot: string, sharedRoot: string): string | null {
  let newest: number | null = null;
  for (const rel of page.sources) {
    const base = page.shared ? sharedRoot : profileRoot;
    // A source must not escape its root.
    const target = path.resolve(base, rel);
    if (target !== base && !target.startsWith(base + path.sep)) continue;
    try {
      const st = fs.statSync(target);
      newest = newest === null ? st.mtimeMs : Math.max(newest, st.mtimeMs);
    } catch {
      /* The source may have been renamed; a separate check reports that. */
    }
  }
  return newest === null ? null : new Date(newest).toISOString().slice(0, 10);
}

/**
 * Parse the wiki into a graph.
 *
 * Compute the graph on request rather than reading it from a cache: a cache could
 * diverge from the pages, which is exactly why numbers are not copied into the wiki.
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
          detail: `link to [[${target}]] points to a missing page`,
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
        detail: `frontmatter cannot be parsed (${p.broken}); title, status, and sources are unavailable`,
      });
    }
    if (!inbound.get(p.id) && p.type !== "synthesis") {
      issues.push({
        kind: "orphan",
        page: p.id,
        detail: "no page links to this page",
      });
    }
    // A source page is itself a primary source, so it needs no sources[] entry,
    // but it does need a verifiable URL. A link without a URL is exactly what
    // evidence-base.md forbids: a plausible claim that cannot be checked.
    if (p.type === "source") {
      if (!p.url) {
        issues.push({
          kind: "no-source",
          page: p.id,
          detail: "source page has no URL and cannot be cited",
        });
      }
      continue;
    }
    if (p.sources.length === 0) {
      issues.push({
        kind: "no-source",
        page: p.id,
        detail: "sources[] contains no sources",
      });
      continue;
    }
    const newest = newestSourceDate(p, dataRootForProfile, dataRootShared);
    if (newest && p.updated && newest > p.updated) {
      issues.push({
        kind: "stale",
        page: p.id,
        detail: `source updated ${newest}; page updated ${p.updated}`,
      });
    }
  }

  const counts: Record<string, number> = {};
  for (const p of pages) counts[p.type] = (counts[p.type] ?? 0) + 1;

  return { pages, edges, issues, counts };
}
