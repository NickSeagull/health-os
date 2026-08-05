"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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
import { EmptyState } from "@/components/shared/empty-state";
import { Brain } from "lucide-react";
import { useHealthData } from "@/lib/hooks/use-health-data";
import { formatDateShort } from "@/lib/utils";
import type { MoodEntry } from "@/lib/types/mood";

export function MoodChart() {
  const { data: entries, isLoading } = useHealthData<MoodEntry[]>("mental");

  const chartData = entries
    ?.map((e) => ({
      ...e,
      date: e.ts.slice(0, 10),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Настроение / Энергия / Стресс / Сон</CardTitle>
        <CardDescription>
          {entries?.length ?? 0} записей
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : !chartData || chartData.length < 2 ? (
          <EmptyState
            icon={<Brain className="h-8 w-8" />}
            title="Недостаточно данных для графика"
            description={
              chartData?.length === 1
                ? "Есть 1 запись. Добавьте ещё для построения графика."
                : "Начните отмечать настроение — данные появятся здесь"
            }
          />
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateShort}
                  tick={{ fontSize: 11 }}
                />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-popover p-3 text-sm shadow-md">
                        <p className="font-medium">{formatDateShort(d.date)}</p>
                        <p>Настроение: {d.mood}/10</p>
                        <p>Энергия: {d.energy}/10</p>
                        <p>Стресс: {d.stress}/10</p>
                        <p>Сон: {d.sleep_quality}/10</p>
                        {d.notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {d.notes}
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="mood"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="Настроение"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="energy"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Энергия"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="stress"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Стресс"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="sleep_quality"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="Сон"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
