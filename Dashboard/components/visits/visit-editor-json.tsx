"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, X } from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";

const schema = z.object({
  date: z.string().min(1),
  type: z.string().optional(),
  specialty: z.string().optional(),
  doctor: z.string().optional(),
  clinic: z.string().optional(),
  reason: z.string().optional(),
  findings: z.string().optional(),
  diagnosis: z.string().optional(),
  follow_up: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface VisitEditorJsonProps {
  filename: string;
  initialData: Record<string, unknown>;
  onClose: () => void;
}

export function VisitEditorJson({
  filename,
  initialData,
  onClose,
}: VisitEditorJsonProps) {
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      date: (initialData.date as string) ?? "",
      type: (initialData.type as string) ?? "",
      specialty: (initialData.specialty as string) ?? "",
      doctor: (initialData.doctor as string) ?? "",
      clinic: (initialData.clinic as string) ?? "",
      reason: (initialData.reason as string) ?? "",
      findings: Array.isArray(initialData.findings)
        ? initialData.findings.join("\n")
        : "",
      diagnosis: Array.isArray(initialData.diagnosis)
        ? initialData.diagnosis.join("\n")
        : "",
      follow_up: (initialData.follow_up as string) ?? "",
    },
  });

  async function onSubmit(data: FormData) {
    setSaving(true);
    try {
      const body = {
        ...initialData,
        ...data,
        findings: data.findings?.split("\n").filter(Boolean) ?? [],
        diagnosis: data.diagnosis?.split("\n").filter(Boolean) ?? [],
        follow_up: data.follow_up || null,
      };
      const res = await fetch(`/api/visits/${encodeURIComponent(filename)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Visit saved");
      mutate("/api/visits");
      onClose();
    } catch {
      toast.error("Save failed");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Edit</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" type="button" onClick={onClose}>
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
          <Button size="sm" type="submit" disabled={saving}>
            <Save className="h-3 w-3 mr-1" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Date</Label>
          <Input {...register("date")} />
        </div>
        <div>
          <Label>Specialty</Label>
          <Input {...register("specialty")} />
        </div>
        <div>
          <Label>Doctor</Label>
          <Input {...register("doctor")} />
        </div>
        <div>
          <Label>Clinic</Label>
          <Input {...register("clinic")} />
        </div>
        <div>
          <Label>Visit type</Label>
          <Input {...register("type")} />
        </div>
        <div>
          <Label>Follow-up</Label>
          <Input type="date" {...register("follow_up")} />
        </div>
      </div>
      <div>
        <Label>Reason for visit</Label>
        <Textarea {...register("reason")} rows={2} />
      </div>
      <div>
        <Label>Findings (one per line)</Label>
        <Textarea {...register("findings")} rows={3} />
      </div>
      <div>
        <Label>Diagnosis (one per line)</Label>
        <Textarea {...register("diagnosis")} rows={2} />
      </div>
    </form>
  );
}
