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
import { useHealthData } from "@/lib/hooks/use-health-data";
import { formatDateShort } from "@/lib/utils";

interface HistoryDay {
  date: string;
  live_metadata?: {
    recovery: number;
    strain: number;
  };
}

export function WhoopTrends() {
  const { data: history, isLoading } = useHealthData<HistoryDay[]>(
    "whoop/history?days=30",
    { refreshInterval: 300000 }
  );

  const chartData = history
    ?.filter((d) => d.live_metadata)
    .map((d) => ({
      date: d.date,
      recovery: d.live_metadata!.recovery,
      strain: d.live_metadata!.strain,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recovery & Strain — 30 дней</CardTitle>
        <CardDescription>Тренды из WHOOP API</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : !chartData?.length ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            Нет данных — проверьте WHOOP credentials в .env.local
          </p>
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
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-popover p-3 text-sm shadow-md">
                        <p className="font-medium">{formatDateShort(d.date)}</p>
                        <p className="text-emerald-500">
                          Recovery: {d.recovery}%
                        </p>
                        <p className="text-blue-500">
                          Strain: {d.strain?.toFixed(1)}
                        </p>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="recovery"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                  name="Recovery %"
                />
                <Line
                  type="monotone"
                  dataKey="strain"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="Strain"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
