"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { MarkerTrendPoint } from "@/lib/types/lab";

const KEY_MARKERS = [
  "Hemoglobin", "White blood cells", "Platelets", "ESR",
  "Glucose", "Creatinine", "ALT", "AST",
  "Total cholesterol", "LDL", "HDL", "Triglycerides",
  "TSH", "Free T4", "Total testosterone", "Cortisol",
  "Vitamin D", "Vitamin B12", "Ferritin", "Iron",
];

interface MarkerLatest {
  name: string;
  value: number;
  status: string;
  date: string;
  unit: string;
}

export function MarkerStatusGrid() {
  const [markers, setMarkers] = useState<MarkerLatest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMarkers() {
      const results: MarkerLatest[] = [];
      for (const name of KEY_MARKERS) {
        try {
          const res = await fetch(
            `/api/labs/markers?name=${encodeURIComponent(name)}`
          );
          const pts: MarkerTrendPoint[] = await res.json();
          if (pts.length > 0) {
            const last = pts[pts.length - 1];
            results.push({
              name,
              value: last.value,
              status: last.status,
              date: last.date,
              unit: last.unit,
            });
          }
        } catch {
          // skip
        }
      }
      setMarkers(results);
      setLoading(false);
    }
    loadMarkers();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Key markers</CardTitle>
        <CardDescription>
          Latest values for {markers.length} markers
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 20 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : markers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {markers.map((m) => (
              <div
                key={m.name}
                className={cn(
                  "rounded-lg border p-2.5 text-center",
                  m.status === "normal" && "bg-emerald-500/5 border-emerald-500/20",
                  m.status === "high" && "bg-red-500/5 border-red-500/20",
                  m.status === "low" && "bg-orange-500/5 border-orange-500/20",
                  m.status === "borderline" && "bg-yellow-500/5 border-yellow-500/20"
                )}
              >
                <p className="text-xs text-muted-foreground truncate">
                  {m.name}
                </p>
                <p className="text-sm font-bold mt-0.5">
                  {m.value} <span className="text-xs font-normal">{m.unit}</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
