"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
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
import { mutate } from "swr";
import { toast } from "sonner";

/**
 * Пустое поле ввода приходит как "", а `z.coerce.number()` превращает "" в 0 —
 * так в CSV попадали нули вместо пустых значений (вес 0 кг, давление 0/0).
 * Пустую строку нужно гасить до undefined ещё до приведения к числу.
 */
const optionalNumber = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().optional()
);

const schema = z.object({
  date: z.string().min(1, "Укажите дату"),
  weight_kg: optionalNumber,
  systolic: optionalNumber,
  diastolic: optionalNumber,
  heart_rate: optionalNumber,
  waist_cm: optionalNumber,
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function AddMeasurementDialog() {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
    },
  });

  async function onSubmit(data: FormData) {
    // Ответ роута раньше игнорировался: отказ по валидации выглядел как успешное
    // сохранение, диалог закрывался, а строки в CSV не появлялось
    const res = await fetch("/api/body-metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "" }));
      toast.error(error || "Не удалось сохранить измерение");
      return;
    }

    toast.success("Измерение сохранено");
    mutate("/api/body-metrics");
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Добавить
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новое измерение</DialogTitle>
          <DialogDescription>Добавить метрики тела</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="date">Дата</Label>
              <Input id="date" type="date" {...register("date")} />
              {errors.date && (
                <p className="text-xs text-destructive mt-1">
                  {errors.date.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="weight_kg">Вес (кг)</Label>
              <Input
                id="weight_kg"
                type="number"
                step="0.1"
                {...register("weight_kg")}
              />
            </div>
            <div>
              <Label htmlFor="systolic">Систолическое</Label>
              <Input
                id="systolic"
                type="number"
                {...register("systolic")}
              />
            </div>
            <div>
              <Label htmlFor="diastolic">Диастолическое</Label>
              <Input
                id="diastolic"
                type="number"
                {...register("diastolic")}
              />
            </div>
            <div>
              <Label htmlFor="heart_rate">ЧСС</Label>
              <Input
                id="heart_rate"
                type="number"
                {...register("heart_rate")}
              />
            </div>
            <div>
              <Label htmlFor="waist_cm">Талия (см)</Label>
              <Input
                id="waist_cm"
                type="number"
                step="0.1"
                {...register("waist_cm")}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Заметки</Label>
            <Textarea id="notes" {...register("notes")} />
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Сохранение..." : "Сохранить"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
