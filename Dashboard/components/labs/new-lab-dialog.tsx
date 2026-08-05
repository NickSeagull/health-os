"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { mutate } from "swr";

interface MarkerInput {
  name: string;
  value: string;
  unit: string;
  reference_min: string;
  reference_max: string;
}

export function NewLabDialog() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [lab, setLab] = useState("");
  const [type, setType] = useState("");
  const [summary, setSummary] = useState("");
  const [markers, setMarkers] = useState<MarkerInput[]>([
    { name: "", value: "", unit: "", reference_min: "", reference_max: "" },
  ]);
  const [saving, setSaving] = useState(false);

  function addMarker() {
    setMarkers([...markers, { name: "", value: "", unit: "", reference_min: "", reference_max: "" }]);
  }

  function removeMarker(idx: number) {
    setMarkers(markers.filter((_, i) => i !== idx));
  }

  function updateMarker(idx: number, field: keyof MarkerInput, value: string) {
    const updated = [...markers];
    updated[idx] = { ...updated[idx], [field]: value };
    setMarkers(updated);
  }

  async function handleSave() {
    if (!date || !type) {
      toast.error("Укажите дату и тип анализа");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/labs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          lab,
          type,
          summary,
          markers: markers
            .filter((m) => m.name && m.value)
            .map((m) => {
              const val = parseFloat(m.value);
              const refMin = parseFloat(m.reference_min);
              const refMax = parseFloat(m.reference_max);
              let status = "normal";
              if (!isNaN(val) && !isNaN(refMin) && val < refMin) status = "low";
              if (!isNaN(val) && !isNaN(refMax) && val > refMax) status = "high";
              return {
                name: m.name,
                value: isNaN(val) ? m.value : val,
                unit: m.unit,
                reference_min: isNaN(refMin) ? undefined : refMin,
                reference_max: isNaN(refMax) ? undefined : refMax,
                status,
              };
            }),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Анализ добавлен");
      mutate("/api/labs");
      mutate("/api/labs/markers/list");
      setOpen(false);
      // Reset
      setMarkers([{ name: "", value: "", unit: "", reference_min: "", reference_max: "" }]);
      setSummary("");
    } catch {
      toast.error("Ошибка сохранения");
    }
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Добавить анализ
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Новый анализ</DialogTitle>
          <DialogDescription>Ручной ввод результатов</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Дата</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Тип анализа</Label>
              <Input value={type} onChange={(e) => setType(e.target.value)} placeholder="biochemistry" />
            </div>
            <div>
              <Label>Лаборатория</Label>
              <Input value={lab} onChange={(e) => setLab(e.target.value)} placeholder="Гемотест" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Маркеры</Label>
              <Button size="sm" variant="outline" onClick={addMarker}>
                <Plus className="h-3 w-3 mr-1" />
                Маркер
              </Button>
            </div>
            <div className="space-y-2">
              {markers.map((m, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      placeholder="Название"
                      value={m.name}
                      onChange={(e) => updateMarker(i, "name", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="w-20">
                    <Input
                      placeholder="Значение"
                      value={m.value}
                      onChange={(e) => updateMarker(i, "value", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="w-16">
                    <Input
                      placeholder="Ед."
                      value={m.unit}
                      onChange={(e) => updateMarker(i, "unit", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="w-16">
                    <Input
                      placeholder="Min"
                      value={m.reference_min}
                      onChange={(e) => updateMarker(i, "reference_min", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="w-16">
                    <Input
                      placeholder="Max"
                      value={m.reference_max}
                      onChange={(e) => updateMarker(i, "reference_max", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => removeMarker(i)}
                    disabled={markers.length <= 1}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Резюме</Label>
            <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} placeholder="Краткий вывод по анализу..." />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Сохранение..." : "Сохранить анализ"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
