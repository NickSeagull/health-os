"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { Pencil, Plus, Archive } from "lucide-react";
import { useHealthData } from "@/lib/hooks/use-health-data";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { mutate } from "swr";
import type { MedsFile, Medication, Supplement, Topical } from "@/lib/types/medication";

const medSchema = z.object({
  name: z.string().min(1),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  timing: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
});
type MedForm = z.infer<typeof medSchema>;

function EditMedDialog({
  med,
  category,
  meds,
}: {
  med: Medication | Supplement | Topical;
  category: "medications" | "supplements" | "topical";
  meds: MedsFile;
}) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit } = useForm<MedForm>({
    resolver: zodResolver(medSchema) as Resolver<MedForm>,
    defaultValues: {
      name: med.name,
      dosage: "dosage" in med ? med.dosage : "",
      frequency: med.frequency,
      timing: "timing" in med ? (med.timing as string[]).join(", ") : "",
      reason: med.reason,
      notes: "notes" in med ? (med.notes as string) ?? "" : "",
      status: med.status,
    },
  });

  async function onSubmit(data: MedForm) {
    const updated = { ...meds };
    const list = updated[category] as unknown as Array<Record<string, unknown>>;
    const idx = list.findIndex((m) => m.id === med.id);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        name: data.name,
        dosage: data.dosage,
        frequency: data.frequency,
        timing: data.timing?.split(",").map((t) => t.trim()).filter(Boolean) ?? [],
        reason: data.reason ?? "",
        notes: data.notes ?? "",
        status: data.status ?? med.status,
      };
    }
    try {
      const res = await fetch("/api/meds", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error();
      toast.success("Medication updated");
      mutate("/api/meds");
      setOpen(false);
    } catch {
      toast.error("Save failed");
    }
  }

  async function archiveMed() {
    const updated = { ...meds };
    const list = updated[category] as unknown as Array<Record<string, unknown>>;
    const idx = list.findIndex((m) => m.id === med.id);
    if (idx >= 0) list[idx].status = "completed";
    try {
      await fetch("/api/meds", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      toast.success("Course completed");
      mutate("/api/meds");
      setOpen(false);
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
          <Pencil className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit: {med.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Name</Label><Input {...register("name")} /></div>
            <div><Label>Dosage</Label><Input {...register("dosage")} /></div>
            <div><Label>Frequency</Label><Input {...register("frequency")} /></div>
            <div><Label>Timing (comma-separated)</Label><Input {...register("timing")} placeholder="morning, evening" /></div>
          </div>
          <div><Label>Reason</Label><Input {...register("reason")} /></div>
          <div><Label>Notes</Label><Textarea {...register("notes")} rows={2} /></div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">Save</Button>
            <Button type="button" variant="outline" onClick={archiveMed}>
              <Archive className="h-3 w-3 mr-1" />
              Complete course
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddMedDialog({
  category,
  meds,
}: {
  category: "medications" | "supplements" | "topical";
  meds: MedsFile;
}) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<MedForm>({
    resolver: zodResolver(medSchema) as Resolver<MedForm>,
  });

  async function onSubmit(data: MedForm) {
    const updated = { ...meds };
    const newItem = {
      id: `${category.slice(0, 3)}_${Date.now()}`,
      name: data.name,
      dosage: data.dosage,
      frequency: data.frequency,
      timing: data.timing?.split(",").map((t) => t.trim()).filter(Boolean) ?? [],
      reason: data.reason ?? "",
      status: "active",
      started: new Date().toISOString().slice(0, 10),
      ...(category === "medications" && {
        with_food: false,
        side_effects: [],
        notes: data.notes ?? "",
      }),
      ...(category === "topical" && { type: "topical" }),
    };
    (updated[category] as unknown[]).push(newItem);
    try {
      await fetch("/api/meds", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      toast.success("Medication added");
      mutate("/api/meds");
      reset();
      setOpen(false);
    } catch {
      toast.error("Could not add medication");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New medication</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Name</Label><Input {...register("name")} /></div>
            <div><Label>Dosage</Label><Input {...register("dosage")} /></div>
            <div><Label>Frequency</Label><Input {...register("frequency")} /></div>
            <div><Label>Timing</Label><Input {...register("timing")} placeholder="morning, evening" /></div>
          </div>
          <div><Label>Reason</Label><Input {...register("reason")} /></div>
          <Button type="submit" className="w-full">Add</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MedCards() {
  const { data: meds, isLoading } = useHealthData<MedsFile>("meds");

  if (isLoading) return <Card><CardContent className="pt-6"><Skeleton className="h-48" /></CardContent></Card>;
  if (!meds) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Medications</CardTitle>
        <CardDescription>Detailed list</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="medications">
          <TabsList>
            <TabsTrigger value="medications">Medications ({meds.medications.length})</TabsTrigger>
            <TabsTrigger value="supplements">Supplements ({meds.supplements.length})</TabsTrigger>
            <TabsTrigger value="topical">Topical ({meds.topical.length})</TabsTrigger>
          </TabsList>

          {(["medications", "supplements", "topical"] as const).map((cat) => (
            <TabsContent key={cat} value={cat} className="mt-4">
              <div className="flex justify-end mb-3">
                <AddMedDialog category={cat} meds={meds} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {(meds[cat] as Array<Medication | Supplement | Topical>).map((m) => (
                  <div key={m.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{m.name}</h4>
                      <div className="flex items-center gap-1">
                        <StatusBadge status={m.status} />
                        <EditMedDialog med={m} category={cat} meds={meds} />
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {"dosage" in m && <p>Dosage: {m.dosage}</p>}
                      <p>Frequency: {m.frequency}</p>
                      <p>Reason: {m.reason}</p>
                      {"started" in m && <p>Started: {formatDate((m as Medication).started)}</p>}
                    </div>
                    {"timing" in m && (m as Medication).timing.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {(m as Medication).timing.map((t) => (
                          <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
