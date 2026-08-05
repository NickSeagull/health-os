"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHealthData } from "@/lib/hooks/use-health-data";
import { formatDate } from "@/lib/utils";
import { collectMarkers } from "@/lib/lab-markers";
import type { LabIndex, LabIndexEntry, LabFileData } from "@/lib/types/lab";

export function LabHistoryTable() {
  const { data: labs, isLoading } = useHealthData<LabIndex>("labs");
  const [selected, setSelected] = useState<LabIndexEntry | null>(null);
  const [detail, setDetail] = useState<LabFileData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [labFilter, setLabFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Панель детали читала только detail.markers — у анализов v2 и v3 его нет,
  // и вместо таблицы показывалось «Не удалось загрузить данные»
  const detailMarkers = collectMarkers(detail);

  const allTypes = [...new Set(labs?.analyses?.map((a) => a.type) ?? [])].sort();
  const allLabs = [...new Set(labs?.analyses?.map((a) => a.lab).filter(Boolean) ?? [])].sort();

  const sorted = labs?.analyses
    ?.slice()
    .filter((a) => typeFilter === "all" || a.type === typeFilter)
    .filter((a) => labFilter === "all" || a.lab === labFilter)
    .filter((a) => !search || a.type.toLowerCase().includes(search.toLowerCase()) || a.lab.toLowerCase().includes(search.toLowerCase()) || a.date.includes(search))
    .sort((a, b) => b.date.localeCompare(a.date));

  async function openDetail(entry: LabIndexEntry) {
    setSelected(entry);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/labs/${encodeURIComponent(entry.file)}`);
      const data = await res.json();
      setDetail(data);
    } catch {
      setDetail(null);
    }
    setDetailLoading(false);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Все анализы</CardTitle>
          <CardDescription>
            {sorted?.length ?? 0} исследований
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Input
              placeholder="Поиск..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-40"
            />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 w-40">
                <SelectValue placeholder="Тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                {allTypes.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={labFilter} onValueChange={setLabFilter}>
              <SelectTrigger className="h-8 w-48">
                <SelectValue placeholder="Лаборатория" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все лаборатории</SelectItem>
                {allLabs.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Лаборатория
                    </TableHead>
                    <TableHead>Маркеров</TableHead>
                    <TableHead>Флаги</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted?.map((entry) => (
                    <TableRow
                      key={entry.file}
                      className="cursor-pointer hover:bg-accent/50"
                      onClick={() => openDetail(entry)}
                    >
                      <TableCell className="text-sm">
                        {formatDate(entry.date)}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {entry.type}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {entry.lab}
                      </TableCell>
                      <TableCell className="text-sm">
                        {entry.markers_count}
                      </TableCell>
                      <TableCell>
                        {entry.flags?.length ? (
                          <Badge variant="destructive" className="text-xs">
                            {entry.flags.length}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            ОК
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-auto">
          <SheetHeader>
            <SheetTitle>{selected?.type}</SheetTitle>
            <SheetDescription>
              {selected && formatDate(selected.date)} · {selected?.lab}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            {detailLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : detailMarkers.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Маркер</TableHead>
                    <TableHead>Значение</TableHead>
                    <TableHead>Норма</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailMarkers.map((m, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm font-medium">
                        {m.name}
                      </TableCell>
                      <TableCell className="text-sm">
                        {m.value_text ?? m.value} {m.unit}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {m.reference_min != null && m.reference_max != null
                          ? `${m.reference_min}–${m.reference_max}`
                          : (m.reference_text ?? m.reference_range ?? "—")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            m.status === "normal" ? "secondary" : "destructive"
                          }
                          className="text-xs"
                        >
                          {m.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">
                Не удалось загрузить данные
              </p>
            )}
            {detail?.summary && (
              <div className="mt-4 rounded-lg bg-muted p-3">
                <p className="text-xs font-medium mb-1">Резюме</p>
                {/* summary бывает связным текстом (v1) либо объектом со счётчиками (v2) */}
                {typeof detail.summary === "string" ? (
                  <p className="text-sm">{detail.summary}</p>
                ) : (
                  <p className="text-sm">
                    {[
                      detail.summary.total != null && `всего ${detail.summary.total}`,
                      detail.summary.normal != null && `в норме ${detail.summary.normal}`,
                      detail.summary.high != null && `повышено ${detail.summary.high}`,
                      detail.summary.low != null && `понижено ${detail.summary.low}`,
                      detail.summary.critical != null &&
                        detail.summary.critical > 0 &&
                        `критических ${detail.summary.critical}`,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
