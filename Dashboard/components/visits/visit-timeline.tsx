"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil } from "lucide-react";
import { useHealthData } from "@/lib/hooks/use-health-data";
import { formatDate } from "@/lib/utils";
import type { VisitIndex, VisitIndexEntry } from "@/lib/types/visit";
import { specialtyColors } from "@/lib/chart-theme";
import { VisitEditorMd } from "./visit-editor-md";
import { VisitEditorJson } from "./visit-editor-json";

export function VisitTimeline() {
  const { data: index, isLoading } = useHealthData<VisitIndex>("visits");
  const [selected, setSelected] = useState<VisitIndexEntry | null>(null);
  const [detail, setDetail] = useState<string>("");
  const [detailJson, setDetailJson] = useState<Record<string, unknown> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  const sorted = index?.visits
    ?.slice()
    .sort((a, b) => b.date.localeCompare(a.date));

  const byYear: Record<string, VisitIndexEntry[]> = {};
  sorted?.forEach((v) => {
    const year = v.date.slice(0, 4);
    (byYear[year] ??= []).push(v);
  });

  async function openVisit(entry: VisitIndexEntry) {
    setSelected(entry);
    setEditing(false);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/visits/${encodeURIComponent(entry.file)}`);
      const data = await res.json();
      if (entry.format === "md") {
        setDetail(data.raw || JSON.stringify(data, null, 2));
        setDetailJson(null);
      } else {
        setDetail(JSON.stringify(data, null, 2));
        setDetailJson(data);
      }
    } catch {
      setDetail("Ошибка загрузки");
      setDetailJson(null);
    }
    setDetailLoading(false);
  }

  function handleClose() {
    setSelected(null);
    setEditing(false);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Timeline визитов</CardTitle>
          <CardDescription>
            {sorted?.length ?? 0} записей по годам
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-6 max-h-[600px] overflow-auto">
              {Object.entries(byYear)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([year, visits]) => (
                  <div key={year}>
                    <h3 className="text-sm font-bold mb-2 sticky top-0 bg-card py-1 z-10">
                      {year}{" "}
                      <span className="text-muted-foreground font-normal">
                        ({visits.length})
                      </span>
                    </h3>
                    <div className="space-y-1 border-l-2 border-muted ml-2 pl-4">
                      {visits.map((v) => {
                        const color =
                          specialtyColors[
                            v.specialty?.toLowerCase() ?? ""
                          ] ?? "#6b7280";
                        return (
                          <div
                            key={v.file}
                            className="relative flex items-start gap-3 py-2 cursor-pointer hover:bg-accent/50 rounded-r-lg px-2 -ml-2"
                            onClick={() => openVisit(v)}
                          >
                            <div
                              className="absolute -left-[21px] top-3 h-2.5 w-2.5 rounded-full border-2 border-background"
                              style={{ backgroundColor: color }}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {v.brief || v.specialty}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {v.specialty}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(v.date)} · {v.clinic}
                                {v.doctor && ` · ${v.doctor}`}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={handleClose}>
        <SheetContent className="w-full sm:max-w-2xl overflow-auto">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle>
                  {selected?.brief || selected?.specialty}
                </SheetTitle>
                <SheetDescription>
                  {selected && formatDate(selected.date)} · {selected?.clinic}
                </SheetDescription>
              </div>
              {!editing && !detailLoading && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Редактировать
                </Button>
              )}
            </div>
          </SheetHeader>
          <div className="mt-4">
            {detailLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : editing && selected ? (
              selected.format === "md" ? (
                <VisitEditorMd
                  filename={selected.file}
                  initialContent={detail}
                  onClose={() => setEditing(false)}
                />
              ) : detailJson ? (
                <VisitEditorJson
                  filename={selected.file}
                  initialData={detailJson}
                  onClose={() => setEditing(false)}
                />
              ) : null
            ) : (
              <pre className="whitespace-pre-wrap text-sm font-mono bg-muted rounded-lg p-4 max-h-[70vh] overflow-auto">
                {detail}
              </pre>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
