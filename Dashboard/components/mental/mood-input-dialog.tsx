"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SmilePlus } from "lucide-react";
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

const schema = z.object({
  mood: z.coerce.number().min(1).max(10),
  energy: z.coerce.number().min(1).max(10),
  stress: z.coerce.number().min(1).max(10),
  sleep_quality: z.coerce.number().min(1).max(10),
  notes: z.string().optional(),
  tags: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function MoodInputDialog() {
  const [open, setOpen] = useState(false);
  // Keep the help text in state so it remains visible after the dialog closes
  // instead of flashing as a toast (Block 4 of critical-values.md).
  const [crisisHelp, setCrisisHelp] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: { mood: 7, energy: 7, stress: 3, sleep_quality: 7 },
  });

  async function onSubmit(data: FormData) {
    const entry = {
      ts: new Date().toISOString(),
      mood: data.mood,
      energy: data.energy,
      stress: data.stress,
      sleep_quality: data.sleep_quality,
      notes: data.notes ?? "",
      tags: data.tags ? data.tags.split(",").map((t) => t.trim()) : [],
    };

    const res = await fetch("/api/mental", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "" }));
      toast.error(error || "Could not save entry");
      return;
    }

    const result = await res.json().catch(() => null);
    setCrisisHelp(result?.crisis?.help ?? null);

    mutate("/api/mental");
    reset();
    setOpen(false);
  }

  const fields = [
    { name: "mood" as const, label: "Mood", emoji: "😊" },
    { name: "energy" as const, label: "Energy", emoji: "⚡" },
    { name: "stress" as const, label: "Stress", emoji: "😰" },
    { name: "sleep_quality" as const, label: "Sleep quality", emoji: "😴" },
  ];

  return (
    <>
      {crisisHelp && (
        <div
          role="alert"
          className="rounded-lg border border-red-600 bg-red-600/10 p-4 text-sm whitespace-pre-line"
        >
          <p className="mb-2 font-medium">⚠️ Please note</p>
          {crisisHelp}
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setCrisisHelp(null)}
          >
            Hide
          </Button>
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <SmilePlus className="h-4 w-4 mr-1" />
          Check in
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mood check-in</DialogTitle>
          <DialogDescription>Rate each item on a scale from 1 to 10</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.name}>
                <Label>
                  {f.emoji} {f.label}
                </Label>
                <Input
                  type="range"
                  min="1"
                  max="10"
                  {...register(f.name)}
                  className="mt-1"
                />
              </div>
            ))}
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea {...register("notes")} placeholder="How was your day..." />
          </div>
          <div>
            <Label>Tags (comma-separated)</Label>
            <Input {...register("tags")} placeholder="work, exercise, sleep" />
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </form>
      </DialogContent>
      </Dialog>
    </>
  );
}
