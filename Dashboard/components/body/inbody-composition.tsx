"use client";

import {
  AreaChart,
  Area,
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
import type { InBodyData } from "@/lib/types/lab";

interface ChartPoint {
  date: string;
  water: number;
  protein: number;
  minerals: number;
  fat: number;
  weight: number;
}

export function InBodyComposition() {
  const { data: inbody, isLoading } = useHealthData<InBodyData[]>("labs/inbody");

  const chartData: ChartPoint[] =
    inbody?.map((d) => ({
      date: d.date,
      water: d.composition.total_body_water_l,
      protein: d.composition.protein_kg,
      minerals: d.composition.minerals_kg,
      fat: d.composition.body_fat_mass_kg,
      weight: d.composition.weight_kg,
    })) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Body composition (InBody)</CardTitle>
        <CardDescription>
          {chartData.length} measurements · Stacked composition
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            No InBody data
          </p>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateShort}
                  tick={{ fontSize: 11 }}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload as ChartPoint;
                    return (
                      <div className="rounded-lg border bg-popover p-3 text-sm shadow-md">
                        <p className="font-medium">{formatDateShort(d.date)}</p>
                        <p>Weight: {d.weight} kg</p>
                        <p>Water: {d.water} L</p>
                        <p>Protein: {d.protein} kg</p>
                        <p>Minerals: {d.minerals} kg</p>
                        <p>Fat: {d.fat} kg</p>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="water"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                  name="Water"
                />
                <Area
                  type="monotone"
                  dataKey="protein"
                  stackId="1"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.6}
                  name="Protein"
                />
                <Area
                  type="monotone"
                  dataKey="minerals"
                  stackId="1"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.6}
                  name="Minerals"
                />
                <Area
                  type="monotone"
                  dataKey="fat"
                  stackId="1"
                  stroke="#f97316"
                  fill="#f97316"
                  fillOpacity={0.6}
                  name="Fat"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
