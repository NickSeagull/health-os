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
    label: "Битые ссылки",
    hint: "Упомянуто, но своей страницы не имеет — например, препарат назван в протоколе визита и отсутствует в списке лекарств",
    icon: Unlink,
  },
  orphan: {
    label: "Сиротки",
    hint: "На страницу никто не ссылается: анализ загружен и не интерпретирован, гипотеза без следующего шага",
    icon: CircleOff,
  },
  stale: {
    label: "Устаревшее",
    hint: "Источник обновился позже страницы — вывод остался от прошлых данных",
    icon: Clock,
  },
  "broken-frontmatter": {
    label: "Метаданные не разбираются",
    hint: "Frontmatter страницы сломан — чаще всего незакавыченное двоеточие в значении. Заголовок, статус и источники теряются, и страница выглядит так, будто их просто нет",
    icon: FileWarning,
  },
  "no-source": {
    label: "Без источника",
    hint: "Утверждение не опирается ни на одну запись в Data/ — это дефект страницы, а не стиль",
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
            <CardTitle>Граф связей</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {e instanceof Error ? e.message : "Не удалось прочитать wiki"}
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
        <h1 className="text-2xl font-semibold tracking-tight">Граф связей</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Состояния, гипотезы, симптомы, врачи и источники — и связи между ними.
          Значения показателей остаются в записях: страница ссылается на запись,
          а не копирует её.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold">{pages.length}</div>
            <div className="text-xs text-muted-foreground">страниц</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold">{edges.length}</div>
            <div className="text-xs text-muted-foreground">связей</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold">
              {Object.keys(counts).length}
            </div>
            <div className="text-xs text-muted-foreground">типов сущностей</div>
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
            <div className="text-xs text-muted-foreground">требует внимания</div>
          </CardContent>
        </Card>
      </div>

      <WikiGraph pages={pages} edges={edges} />

      {issues.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Здоровье wiki</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Рабочий список, а не украшение. Разобрать —{" "}
              <code className="font-mono text-xs">/wiki lint</code> в Claude Code.
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
                        …и ещё {list.length - 12}
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
            <CardTitle className="text-base">Состав</CardTitle>
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
