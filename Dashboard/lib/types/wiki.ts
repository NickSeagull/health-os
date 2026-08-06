/**
 * Типы и подписи wiki-слоя.
 *
 * Вынесены отдельно от чтения с диска: клиентские компоненты импортируют
 * подписи и типы, и если бы они лежали рядом с `fs`, сборка тянула бы
 * серверный модуль в браузерный бандл.
 */

/** Типы страниц, привязанных к конкретному человеку. */
export const PERSONAL_TYPES = [
  "condition",
  "hypothesis",
  "symptom",
  "doctor",
  "synthesis",
] as const;

/** Типы страниц, общих для всех профилей: литература и справка по маркерам. */
export const SHARED_TYPES = ["source", "marker"] as const;

export type WikiType =
  | (typeof PERSONAL_TYPES)[number]
  | (typeof SHARED_TYPES)[number];

export const TYPE_LABEL: Record<WikiType, string> = {
  condition: "Состояние",
  hypothesis: "Гипотеза",
  symptom: "Симптом",
  doctor: "Врач",
  synthesis: "Разбор",
  source: "Источник",
  marker: "Маркер",
};

export type WikiPage = {
  id: string; // "condition/iron-deficiency"
  type: WikiType;
  slug: string;
  title: string;
  status: string | null;
  created: string | null;
  updated: string | null;
  sources: string[];
  url: string | null;
  links: string[]; // исходящие, нормализованные
  body: string;
  shared: boolean;
  /** Сообщение об ошибке разбора frontmatter, если он не разобрался. */
  broken: string | null;
};

export type WikiEdge = { from: string; to: string };

export type WikiIssue = {
  kind: "orphan" | "dead-link" | "stale" | "no-source" | "broken-frontmatter";
  page: string;
  detail: string;
};

export type WikiGraph = {
  pages: WikiPage[];
  edges: WikiEdge[];
  issues: WikiIssue[];
  counts: Record<string, number>;
};
