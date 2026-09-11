/**
 * Types and labels for the wiki layer.
 *
 * Kept separate from disk access: client components import the labels and types,
 * and colocating them with `fs` would pull a server module into the browser bundle.
 */

/** Page types tied to a specific person. */
export const PERSONAL_TYPES = [
  "condition",
  "hypothesis",
  "symptom",
  "doctor",
  "synthesis",
] as const;

/** Page types shared by all profiles: literature and marker references. */
export const SHARED_TYPES = ["source", "marker"] as const;

export type WikiType =
  | (typeof PERSONAL_TYPES)[number]
  | (typeof SHARED_TYPES)[number];

export const TYPE_LABEL: Record<WikiType, string> = {
  condition: "Condition",
  hypothesis: "Hypothesis",
  symptom: "Symptom",
  doctor: "Doctor",
  synthesis: "Synthesis",
  source: "Source",
  marker: "Marker",
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
  links: string[]; // outgoing, normalized
  body: string;
  shared: boolean;
  /** Frontmatter parse error, when parsing failed. */
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
