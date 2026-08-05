"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer,
  Legend,
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

export function BloodPressureChart() {
  const { data: metrics, isLoading } = useHealthData<BodyMetric[]>("body-metrics");

  const filtered = metrics
    ?.filter((m) => m.systolic && m.diastolic)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (!isLoading && (!filtered || filtered.length === 0)) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Артериальное давление</CardTitle>
        <CardDescription>Систолическое / диастолическое</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[250px] w-full" />
        ) : (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filtered}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateShort}
                  tick={{ fontSize: 11 }}
                />
                <YAxis domain={[50, 160]} tick={{ fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload as BodyMetric;
                    return (
                      <div className="rounded-lg border bg-popover p-3 text-sm shadow-md">
                        <p className="font-medium">{formatDateShort(d.date)}</p>
                        <p>
                          {d.systolic}/{d.diastolic} мм рт.ст.
                        </p>
                        {d.heart_rate && <p>ЧСС: {d.heart_rate} уд/мин</p>}
                      </div>
                    );
                  }}
                />
                <Legend />
                <ReferenceArea
                  y1={60}
                  y2={80}
                  fill="#22c55e"
                  fillOpacity={0.05}
                  label={{ value: "Диаст. норма", fontSize: 9 }}
                />
                <ReferenceArea
                  y1={90}
                  y2={120}
                  fill="#22c55e"
                  fillOpacity={0.05}
                  label={{ value: "Сист. норма", fontSize: 9 }}
                />
                <Line
                  type="monotone"
                  dataKey="systolic"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Систолическое"
                />
                <Line
                  type="monotone"
                  dataKey="diastolic"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Диастолическое"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
