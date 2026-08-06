"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { WikiEdge, WikiPage, WikiType } from "@/lib/types/wiki";
import { TYPE_LABEL } from "@/lib/types/wiki";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Node = { id: string; x: number; y: number; vx: number; vy: number; page: WikiPage };

const COLOR: Record<WikiType, string> = {
  condition: "var(--chart-1)",
  hypothesis: "var(--chart-2)",
  symptom: "var(--chart-3)",
  doctor: "var(--chart-4)",
  synthesis: "var(--chart-5)",
  source: "var(--chart-2)",
  marker: "var(--chart-1)",
};

const W = 900;
const H = 560;

/**
 * Раскладка силовым методом.
 *
 * Считается на клиенте за фиксированное число шагов и замирает: анимация,
 * которая никогда не останавливается, мешает читать граф и греет процессор.
 */
function layout(pages: WikiPage[], edges: WikiEdge[]): Node[] {
  const nodes: Node[] = pages.map((p, i) => {
    // Стартовое размещение по кругу — детерминированное, чтобы граф
    // не прыгал при каждом открытии страницы
    const a = (2 * Math.PI * i) / Math.max(pages.length, 1);
    return {
      id: p.id,
      x: W / 2 + Math.cos(a) * 200,
      y: H / 2 + Math.sin(a) * 200,
      vx: 0,
      vy: 0,
      page: p,
    };
  });
  const index = new Map(nodes.map((n, i) => [n.id, i]));
  const links = edges
    .map((e) => [index.get(e.from), index.get(e.to)] as const)
    .filter((p): p is readonly [number, number] => p[0] !== undefined && p[1] !== undefined);

  const STEPS = 320;
  for (let step = 0; step < STEPS; step++) {
    const cooling = 1 - step / STEPS;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) {
          // Совпавшие узлы разводятся детерминированным смещением,
          // а не случайным: граф должен выглядеть одинаково при каждом входе
          dx = ((i % 7) - 3) || 1;
          dy = ((j % 5) - 2) || 1;
          d2 = dx * dx + dy * dy;
        }
        const f = 5200 / d2;
        const d = Math.sqrt(d2);
        const fx = (dx / d) * f;
        const fy = (dy / d) * f;
        a.vx -= fx;
        a.vy -= fy;
        b.vx += fx;
        b.vy += fy;
      }
    }

    for (const [ai, bi] of links) {
      const a = nodes[ai];
      const b = nodes[bi];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1;
      const f = (d - 110) * 0.02;
      const fx = (dx / d) * f;
      const fy = (dy / d) * f;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    }

    for (const n of nodes) {
      n.vx += (W / 2 - n.x) * 0.004;
      n.vy += (H / 2 - n.y) * 0.004;
      n.x += n.vx * cooling;
      n.y += n.vy * cooling;
      n.vx *= 0.82;
      n.vy *= 0.82;
      n.x = Math.max(40, Math.min(W - 40, n.x));
      n.y = Math.max(30, Math.min(H - 30, n.y));
    }
  }
  return nodes;
}

export function WikiGraph({ pages, edges }: { pages: WikiPage[]; edges: WikiEdge[] }) {
  const [hidden, setHidden] = useState<Set<WikiType>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const visiblePages = useMemo(
    () => pages.filter((p) => !hidden.has(p.type)),
    [pages, hidden]
  );
  const visibleIds = useMemo(() => new Set(visiblePages.map((p) => p.id)), [visiblePages]);
  const visibleEdges = useMemo(
    () => edges.filter((e) => visibleIds.has(e.from) && visibleIds.has(e.to)),
    [edges, visibleIds]
  );

  const nodes = useMemo(() => layout(visiblePages, visibleEdges), [visiblePages, visibleEdges]);
  const pos = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  useEffect(() => setReady(true), []);

  const neighbours = useMemo(() => {
    if (!selected) return null;
    const s = new Set<string>([selected]);
    for (const e of visibleEdges) {
      if (e.from === selected) s.add(e.to);
      if (e.to === selected) s.add(e.from);
    }
    return s;
  }, [selected, visibleEdges]);

  const types = useMemo(() => {
    const set = new Set<WikiType>();
    for (const p of pages) set.add(p.type);
    return [...set].sort();
  }, [pages]);

  function toggle(t: WikiType) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
    setSelected(null);
  }

  if (pages.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Wiki пока пуста.
        <br />
        Запустите <code className="font-mono">/wiki build</code> в Claude Code — слой
        соберётся из уже имеющихся данных.
      </div>
    );
  }

  const active = selected ? pages.find((p) => p.id === selected) ?? null : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {types.map((t) => (
          <Button
            key={t}
            variant={hidden.has(t) ? "outline" : "secondary"}
            size="sm"
            onClick={() => toggle(t)}
            className="gap-2"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: COLOR[t], opacity: hidden.has(t) ? 0.3 : 1 }}
            />
            {TYPE_LABEL[t]}
            <span className="text-xs text-muted-foreground">
              {pages.filter((p) => p.type === t).length}
            </span>
          </Button>
        ))}
        {selected && (
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
            Показать всё
          </Button>
        )}
      </div>

      <div ref={wrapRef} className="overflow-x-auto rounded-lg border bg-card">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-[560px] w-full min-w-[700px]"
          style={{ opacity: ready ? 1 : 0, transition: "opacity .25s" }}
          role="img"
          aria-label="Граф связей медкарты"
        >
          <g>
            {visibleEdges.map((e, i) => {
              const a = pos.get(e.from);
              const b = pos.get(e.to);
              if (!a || !b) return null;
              const dim = neighbours && !(neighbours.has(e.from) && neighbours.has(e.to));
              return (
                <line
                  key={i}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="currentColor"
                  className="text-muted-foreground"
                  strokeWidth={1}
                  opacity={dim ? 0.06 : 0.28}
                />
              );
            })}
          </g>
          <g>
            {nodes.map((n) => {
              const dim = neighbours && !neighbours.has(n.id);
              const r = n.id === selected ? 9 : 6;
              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x},${n.y})`}
                  opacity={dim ? 0.15 : 1}
                  onClick={() => setSelected(n.id === selected ? null : n.id)}
                  className="cursor-pointer"
                >
                  <circle r={r} fill={COLOR[n.page.type]} />
                  <text
                    y={-r - 5}
                    textAnchor="middle"
                    className="pointer-events-none fill-foreground text-[10px]"
                  >
                    {n.page.title.length > 26
                      ? n.page.title.slice(0, 25) + "…"
                      : n.page.title}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {active && (
        <div className="rounded-lg border p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{TYPE_LABEL[active.type]}</Badge>
            {active.status && <Badge variant="outline">{active.status}</Badge>}
            <span className="font-medium">{active.title}</span>
            {active.updated && (
              <span className="text-xs text-muted-foreground">
                обновлено {active.updated}
              </span>
            )}
          </div>
          {active.sources.length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-muted-foreground">Источники</div>
              <ul className="mt-1 space-y-0.5">
                {active.sources.map((s) => (
                  <li key={s} className="font-mono text-xs">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
            {active.body.trim().slice(0, 500)}
            {active.body.trim().length > 500 ? "…" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
