"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
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

export function BmiZoneChart() {
  const { data: metrics, isLoading } = useHealthData<BodyMetric[]>("body-metrics");

  const filtered = metrics
    ?.filter((m) => m.bmi && new Date(m.date) >= new Date("2010-01-01"))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Card>
      <CardHeader>
        <CardTitle>BMI ranges</CardTitle>
        <CardDescription>Body mass index by range</CardDescription>
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
              <AreaChart data={filtered}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateShort}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  domain={[15, 35]}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload as BodyMetric;
                    const bmi = d.bmi!;
                    const zone =
                      bmi < 18.5
                        ? "Underweight"
                        : bmi < 25
                          ? "Normal"
                          : bmi < 30
                            ? "Overweight"
                            : "Obesity";
                    return (
                      <div className="rounded-lg border bg-popover p-3 text-sm shadow-md">
                        <p className="font-medium">{formatDateShort(d.date)}</p>
                        <p>BMI: {bmi}</p>
                        <p className="text-xs text-muted-foreground">{zone}</p>
                      </div>
                    );
                  }}
                />
                <ReferenceArea y1={15} y2={18.5} fill="#eab308" fillOpacity={0.07} />
                <ReferenceArea y1={18.5} y2={25} fill="#22c55e" fillOpacity={0.07} />
                <ReferenceArea y1={25} y2={30} fill="#f97316" fillOpacity={0.07} />
                <ReferenceArea y1={30} y2={35} fill="#ef4444" fillOpacity={0.07} />
                <ReferenceLine y={18.5} stroke="#eab308" strokeDasharray="3 3" />
                <ReferenceLine y={25} stroke="#22c55e" strokeDasharray="3 3" />
                <ReferenceLine y={30} stroke="#f97316" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="bmi"
                  stroke="var(--chart-1)"
                  fill="var(--chart-1)"
                  fillOpacity={0.1}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
