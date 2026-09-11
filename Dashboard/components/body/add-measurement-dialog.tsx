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
 * An empty input arrives as "", and `z.coerce.number()` turns it into 0.
 * This used to write zeros instead of empty values to CSV (0 kg weight, 0/0 blood pressure).
 * Convert empty strings to undefined before coercing them to numbers.
 */
const optionalNumber = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().optional()
);

const schema = z.object({
  date: z.string().min(1, "Enter a date"),
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
    // The route response used to be ignored: a validation failure looked like
    // a successful save, the dialog closed, and no CSV row was created.
    const res = await fetch("/api/body-metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "" }));
      toast.error(error || "Could not save measurement");
      return;
    }

    toast.success("Measurement saved");
    mutate("/api/body-metrics");
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New measurement</DialogTitle>
          <DialogDescription>Add body metrics</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...register("date")} />
              {errors.date && (
                <p className="text-xs text-destructive mt-1">
                  {errors.date.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="weight_kg">Weight (kg)</Label>
              <Input
                id="weight_kg"
                type="number"
                step="0.1"
                {...register("weight_kg")}
              />
            </div>
            <div>
              <Label htmlFor="systolic">Systolic</Label>
              <Input
                id="systolic"
                type="number"
                {...register("systolic")}
              />
            </div>
            <div>
              <Label htmlFor="diastolic">Diastolic</Label>
              <Input
                id="diastolic"
                type="number"
                {...register("diastolic")}
              />
            </div>
            <div>
              <Label htmlFor="heart_rate">Heart rate</Label>
              <Input
                id="heart_rate"
                type="number"
                {...register("heart_rate")}
              />
            </div>
            <div>
              <Label htmlFor="waist_cm">Waist (cm)</Label>
              <Input
                id="waist_cm"
                type="number"
                step="0.1"
                {...register("waist_cm")}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} />
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
