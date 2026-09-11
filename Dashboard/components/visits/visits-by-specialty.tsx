"use client";

import {
  BarChart,
  Bar,
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
import type { VisitIndex } from "@/lib/types/visit";

export function VisitsBySpecialty() {
  const { data: index, isLoading } = useHealthData<VisitIndex>("visits");

  const counts: Record<string, number> = {};
  index?.visits?.forEach((v) => {
    const s = v.specialty || "Other";
    counts[s] = (counts[s] || 0) + 1;
  });

  const chartData = Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visits by specialty</CardTitle>
        <CardDescription>{index?.total ?? 0} visits</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            No data
          </p>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11 }}
                  width={120}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload as { name: string; count: number };
                    return (
                      <div className="rounded-lg border bg-popover p-2 text-sm shadow-md">
                        <p className="font-medium">{d.name}</p>
                        <p>{d.count} visits</p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="var(--chart-1)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
