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
  date: z.string().min(1, "Enter a date"),
  specialty: z.string().min(1, "Enter a specialty"),
  doctor: z.string().optional(),
  clinic: z.string().optional(),
  brief: z.string().min(1, "Enter a brief description"),
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
      toast.success("Visit created");
      mutate("/api/visits");
      reset();
      setOpen(false);
    } catch {
      toast.error("Could not create visit");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          New visit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New visit</DialogTitle>
          <DialogDescription>Create a doctor visit record</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Format</Label>
            <Select
              value={format}
              onValueChange={(v) => setFormat(v as "md" | "json")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="md">Markdown (free form)</SelectItem>
                <SelectItem value="json">JSON (structured)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Date</Label>
              <Input type="date" {...register("date")} />
              {errors.date && (
                <p className="text-xs text-destructive mt-1">
                  {errors.date.message}
                </p>
              )}
            </div>
            <div>
              <Label>Specialty</Label>
              <Input
                {...register("specialty")}
                placeholder="cardiology"
              />
              {errors.specialty && (
                <p className="text-xs text-destructive mt-1">
                  {errors.specialty.message}
                </p>
              )}
            </div>
            <div>
              <Label>Doctor</Label>
              <Input {...register("doctor")} placeholder="Doctor's name" />
            </div>
            <div>
              <Label>Clinic</Label>
              <Input {...register("clinic")} placeholder="Clinic name" />
            </div>
          </div>
          <div>
            <Label>Brief description</Label>
            <Input
              {...register("brief")}
              placeholder="Initial visit, complaints of..."
            />
            {errors.brief && (
              <p className="text-xs text-destructive mt-1">
                {errors.brief.message}
              </p>
            )}
          </div>
          {format === "md" && (
            <div>
            <Label>Content (Markdown)</Label>
              <Textarea
                {...register("content")}
                rows={8}
                placeholder={`# Doctor visit\n\n- **Date:** ${new Date().toISOString().slice(0, 10)}\n- **Doctor:** \n- **Clinic:** \n\n## Complaints\n\n## Examination\n\n## Diagnosis\n\n## Recommendations`}
              />
            </div>
          )}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Creating..." : "Create visit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
