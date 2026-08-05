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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useHealthData } from "@/lib/hooks/use-health-data";
import { toast } from "sonner";
import { mutate } from "swr";
import { unknownToothCount } from "@/lib/dental-summary";
import type { ToothMap, Tooth, DentalProceduresFile, ToothStatus } from "@/lib/types/dental";

const statusColors: Record<ToothStatus, string> = {
  healthy: "#ffffff",
  filled: "#3b82f6",
  crowned: "#1d4ed8",
  extracted: "#9ca3af",
  implant: "#8b5cf6",
  needs_treatment: "#ef4444",
  root_canal: "#f97316",
};

const statusLabels: Record<ToothStatus, string> = {
  healthy: "Здоров",
  filled: "Пломба",
  crowned: "Коронка",
  extracted: "Удалён",
  implant: "Имплант",
  needs_treatment: "Нужно лечение",
  root_canal: "Каналы",
};

const allStatuses: ToothStatus[] = [
  "healthy", "filled", "crowned", "extracted", "implant", "needs_treatment", "root_canal",
];

const upperRight = ["18", "17", "16", "15", "14", "13", "12", "11"];
const upperLeft = ["21", "22", "23", "24", "25", "26", "27", "28"];
const lowerLeft = ["31", "32", "33", "34", "35", "36", "37", "38"];
const lowerRight = ["48", "47", "46", "45", "44", "43", "42", "41"];

/** Цвет и обводка для зуба, о котором в карте нет записи */
const UNKNOWN_FILL = "transparent";
const UNKNOWN_STROKE = "#a1a1aa";

function ToothCell({ number, tooth }: { number: string; tooth: Tooth | undefined }) {
  // `teeth` разрежен: отсутствие ключа означает «статус неизвестен», а не «здоров».
  // Прежний дефолт `?? "healthy"` рисовал 30 из 32 зубов зелёными без единого осмотра
  // и подставлял «healthy» в запись при сохранении заметки.
  const [status, setStatus] = useState<ToothStatus | "">(tooth?.status ?? "");
  const [notes, setNotes] = useState(tooth?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const known = status !== "";
  const color = known ? statusColors[status] : UNKNOWN_FILL;
  const darkStroke = !known
    ? UNKNOWN_STROKE
    : status === "healthy"
      ? "#d4d4d8"
      : color;

  async function handleSave() {
    if (!known) {
      toast.error("Выберите статус зуба");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/dental/tooth/${number}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "" }));
        throw new Error(error || "Ошибка сохранения");
      }
      toast.success(`Зуб ${number} обновлён`);
      mutate("/api/dental");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка сохранения");
    }
    setSaving(false);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex flex-col items-center gap-0.5 group">
          <svg width="28" height="28" viewBox="0 0 28 28" className="group-hover:scale-110 transition-transform">
            <rect
              x="2" y="2" width="24" height="24" rx="4"
              fill={color} stroke={darkStroke} strokeWidth="2"
              className="dark:stroke-zinc-600"
            />
            {status === "extracted" && (
              <>
                <line x1="6" y1="6" x2="22" y2="22" stroke="#6b7280" strokeWidth="2" />
                <line x1="22" y1="6" x2="6" y2="22" stroke="#6b7280" strokeWidth="2" />
              </>
            )}
          </svg>
          <span className="text-[10px] text-muted-foreground">{number}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="space-y-3">
          <span className="font-medium text-sm">Зуб {number}</span>
          <div>
            <Label className="text-xs">Статус</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ToothStatus)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Нет данных" />
              </SelectTrigger>
              <SelectContent>
                {allStatuses.map((s) => (
                  <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Заметки</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="text-xs"
            />
          </div>
          <Button size="sm" className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? "..." : "Сохранить"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ToothMapSvg() {
  const { data, isLoading } = useHealthData<{
    toothMap: ToothMap;
    procedures: DentalProceduresFile;
  }>("dental");

  const teeth = data?.toothMap?.teeth ?? {};
  const summary = data?.toothMap?.summary;
  // Разница между рядом и числом записей — не «здоровые», а неосмотренные.
  // Без этой строки карта выглядит полной при двух заполненных зубах из 32
  const unknown = unknownToothCount(teeth);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Карта зубов</CardTitle>
        <CardDescription>
          {summary
            ? `${summary.total} позиций · ${summary.healthy} здоровых · ${summary.extracted} удалено · ${unknown} без данных`
            : "ISO 3950 · Нажмите на зуб для редактирования"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 text-xs">
              {Object.entries(statusLabels).map(([s, label]) => (
                <div key={s} className="flex items-center gap-1">
                  <div
                    className="h-3 w-3 rounded border"
                    style={{
                      backgroundColor: statusColors[s as ToothStatus],
                      borderColor: s === "healthy" ? "#d4d4d8" : statusColors[s as ToothStatus],
                    }}
                  />
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground text-center">Верхняя челюсть</p>
              <div className="flex justify-center gap-1">
                {upperRight.map((n) => (<ToothCell key={n} number={n} tooth={teeth[n]} />))}
                <div className="w-px bg-border mx-1" />
                {upperLeft.map((n) => (<ToothCell key={n} number={n} tooth={teeth[n]} />))}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-center gap-1">
                {lowerRight.map((n) => (<ToothCell key={n} number={n} tooth={teeth[n]} />))}
                <div className="w-px bg-border mx-1" />
                {lowerLeft.map((n) => (<ToothCell key={n} number={n} tooth={teeth[n]} />))}
              </div>
              <p className="text-xs text-muted-foreground text-center">Нижняя челюсть</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
