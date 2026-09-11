"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHealthData } from "@/lib/hooks/use-health-data";
import type { InBodyData } from "@/lib/types/lab";

function GaugeBar({
  label,
  value,
  min,
  max,
  targetMin,
  targetMax,
  unit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  targetMin: number;
  targetMax: number;
  unit: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const targetStartPct = ((targetMin - min) / (max - min)) * 100;
  const targetEndPct = ((targetMax - min) / (max - min)) * 100;
  const inTarget = value >= targetMin && value <= targetMax;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={inTarget ? "text-emerald-500" : "text-amber-500"}>
          {value} {unit}
        </span>
      </div>
      <div className="relative h-3 rounded-full bg-muted overflow-hidden">
        <div
          className="absolute h-full bg-emerald-500/20 rounded-full"
          style={{
            left: `${targetStartPct}%`,
            width: `${targetEndPct - targetStartPct}%`,
          }}
        />
        <div
          className={`absolute h-full rounded-full transition-all ${inTarget ? "bg-emerald-500" : "bg-amber-500"}`}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min}</span>
        <span>
          Target: {targetMin}–{targetMax}
        </span>
        <span>{max}</span>
      </div>
    </div>
  );
}

export function BodyCompositionGauges() {
  const { data: inbody, isLoading } = useHealthData<InBodyData[]>("labs/inbody");

  const latest = inbody?.at(-1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Body composition metrics</CardTitle>
        <CardDescription>
          {latest ? `Latest measurement: ${latest.date}` : "No data"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !latest ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            No InBody data
          </p>
        ) : (
          <div className="space-y-6">
            <GaugeBar
              label="Body fat percentage"
              value={latest.metrics.body_fat_pct}
              min={5}
              max={40}
              targetMin={10}
              targetMax={20}
              unit="%"
            />
            <GaugeBar
              label="Muscle mass"
              value={latest.metrics.skeletal_muscle_mass_kg}
              min={20}
              max={50}
              targetMin={35}
              targetMax={45}
              unit="kg"
            />
            <GaugeBar
              label="Visceral fat"
              value={latest.metrics.visceral_fat_level}
              min={0}
              max={20}
              targetMin={1}
              targetMax={9}
              unit="level"
            />
            <GaugeBar
              label="InBody Score"
              value={latest.metrics.inbody_score}
              min={50}
              max={100}
              targetMin={75}
              targetMax={90}
              unit="points"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
