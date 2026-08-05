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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { mutate } from "swr";

const schema = z.object({
  date: z.string().min(1, "Укажите дату"),
  specialty: z.string().min(1, "Укажите специальность"),
  doctor: z.string().optional(),
  clinic: z.string().optional(),
  brief: z.string().min(1, "Краткое описание"),
  content: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function NewVisitDialog() {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<"md" | "json">("md");
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
    try {
      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, format }),
      });
      if (!res.ok) throw new Error("Create failed");
      toast.success("Визит создан");
      mutate("/api/visits");
      reset();
      setOpen(false);
    } catch {
      toast.error("Ошибка создания визита");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Новый визит
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Новый визит</DialogTitle>
          <DialogDescription>Создать запись о визите к врачу</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Формат</Label>
            <Select
              value={format}
              onValueChange={(v) => setFormat(v as "md" | "json")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="md">Markdown (свободная форма)</SelectItem>
                <SelectItem value="json">JSON (структурированный)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Дата</Label>
              <Input type="date" {...register("date")} />
              {errors.date && (
                <p className="text-xs text-destructive mt-1">
                  {errors.date.message}
                </p>
              )}
            </div>
            <div>
              <Label>Специальность</Label>
              <Input
                {...register("specialty")}
                placeholder="кардиология"
              />
              {errors.specialty && (
                <p className="text-xs text-destructive mt-1">
                  {errors.specialty.message}
                </p>
              )}
            </div>
            <div>
              <Label>Врач</Label>
              <Input {...register("doctor")} placeholder="ФИО врача" />
            </div>
            <div>
              <Label>Клиника</Label>
              <Input {...register("clinic")} placeholder="Название клиники" />
            </div>
          </div>
          <div>
            <Label>Краткое описание</Label>
            <Input
              {...register("brief")}
              placeholder="Первичный приём, жалобы на..."
            />
            {errors.brief && (
              <p className="text-xs text-destructive mt-1">
                {errors.brief.message}
              </p>
            )}
          </div>
          {format === "md" && (
            <div>
              <Label>Содержание (Markdown)</Label>
              <Textarea
                {...register("content")}
                rows={8}
                placeholder={`# Визит к врачу\n\n- **Дата:** ${new Date().toISOString().slice(0, 10)}\n- **Врач:** \n- **Клиника:** \n\n## Жалобы\n\n## Осмотр\n\n## Диагноз\n\n## Рекомендации`}
              />
            </div>
          )}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Создание..." : "Создать визит"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
