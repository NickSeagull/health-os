import { readWikiGraph } from "@/lib/data/wiki";
import { TYPE_LABEL } from "@/lib/types/wiki";
import type { WikiIssue } from "@/lib/types/wiki";
import { WikiGraph } from "@/components/wiki/wiki-graph";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Unlink, CircleOff, Clock, FileWarning } from "lucide-react";

export const dynamic = "force-dynamic";

const ISSUE_META: Record<
  WikiIssue["kind"],
  { label: string; hint: string; icon: typeof AlertTriangle }
> = {
  "dead-link": {
    label: "Broken links",
    hint: "Mentioned without its own page — for example, a medication named in a visit protocol but missing from the medication list",
    icon: Unlink,
  },
  orphan: {
    label: "Orphans",
    hint: "No page links here: a lab report was uploaded but not interpreted, or a hypothesis has no next step",
    icon: CircleOff,
  },
  stale: {
    label: "Stale",
    hint: "The source was updated after the page, so the conclusion is based on old data",
    icon: Clock,
  },
  "broken-frontmatter": {
    label: "Unreadable metadata",
    hint: "The page frontmatter is malformed — usually an unquoted colon in a value. The title, status, and sources are lost, making the page appear to have none",
    icon: FileWarning,
  },
  "no-source": {
    label: "No source",
    hint: "The claim is not supported by any record in Data/ — this is a page defect, not a stylistic choice",
    icon: AlertTriangle,
  },
};

export default async function WikiPage() {
  let graph;
  try {
    graph = readWikiGraph();
  } catch (e) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Relationship graph</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {e instanceof Error ? e.message : "Could not read the wiki"}
          </CardContent>
        </Card>
      </div>
    );
  }

  const { pages, edges, issues, counts } = graph;
  const grouped = new Map<WikiIssue["kind"], WikiIssue[]>();
  for (const i of issues) {
    const arr = grouped.get(i.kind) ?? [];
    arr.push(i);
    grouped.set(i.kind, arr);
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Relationship graph</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conditions, hypotheses, symptoms, doctors, and sources — and the links between them.
          Marker values stay in their records: a page links to a record
          instead of copying it.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold">{pages.length}</div>
            <div className="text-xs text-muted-foreground">pages</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold">{edges.length}</div>
            <div className="text-xs text-muted-foreground">links</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold">
              {Object.keys(counts).length}
            </div>
            <div className="text-xs text-muted-foreground">entity types</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div
              className={
                "text-2xl font-semibold " + (issues.length ? "text-amber-500" : "")
              }
            >
              {issues.length}
            </div>
            <div className="text-xs text-muted-foreground">need attention</div>
          </CardContent>
        </Card>
      </div>

      <WikiGraph pages={pages} edges={edges} />

      {issues.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Health wiki</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A working list, not decoration. Review it with{" "}
              <code className="font-mono text-xs">/wiki lint</code> in Claude Code.
            </p>
          </div>
          {[...grouped.entries()].map(([kind, list]) => {
            const meta = ISSUE_META[kind];
            const Icon = meta.icon;
            return (
              <Card key={kind}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-4 w-4 text-amber-500" />
                    {meta.label}
                    <span className="text-sm font-normal text-muted-foreground">
                      {list.length}
                    </span>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{meta.hint}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {list.slice(0, 12).map((i, n) => (
                      <li key={n} className="text-sm">
                        <span className="font-mono text-xs">{i.page}</span>
                        <span className="text-muted-foreground"> — {i.detail}</span>
                      </li>
                    ))}
                    {list.length > 12 && (
                      <li className="text-xs text-muted-foreground">
                        …and {list.length - 12} more
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {pages.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Contents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              {Object.entries(counts)
                .sort((a, b) => b[1] - a[1])
                .map(([type, n]) => (
                  <span key={type}>
                    <span className="text-muted-foreground">
                      {TYPE_LABEL[type as keyof typeof TYPE_LABEL] ?? type}:
                    </span>{" "}
                    {n}
                  </span>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
