"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHealthData } from "@/lib/hooks/use-health-data";
import { formatDateShort } from "@/lib/utils";
import type { BodyMetric } from "@/lib/types/body-metric";

export function WeightProgression() {
  const { data: metrics, isLoading } = useHealthData<BodyMetric[]>("body-metrics");

  const filtered = metrics
    ?.filter((m) => m.weight_kg && new Date(m.date) >= new Date("2010-01-01"))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weight progression</CardTitle>
        <CardDescription>Adult period (since 2010)</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : !filtered?.length ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            No data
          </p>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filtered}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateShort}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  domain={["dataMin - 5", "dataMax + 5"]}
                  tick={{ fontSize: 11 }}
                  label={{
                    value: "kg",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 11 },
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload as BodyMetric;
                    return (
                      <div className="rounded-lg border bg-popover p-3 text-sm shadow-md">
                        <p className="font-medium">{formatDateShort(d.date)}</p>
                        <p>Weight: {d.weight_kg} kg</p>
                        {d.body_fat_pct && <p>Body fat: {d.body_fat_pct}%</p>}
                        {d.bmi && <p>BMI: {d.bmi}</p>}
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="weight_kg"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Weight"
                />
                {filtered.some((m) => m.body_fat_pct) && (
                  <Line
                    type="monotone"
                    dataKey="body_fat_pct"
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 3 }}
                    name="Body fat %"
                    yAxisId="right"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
