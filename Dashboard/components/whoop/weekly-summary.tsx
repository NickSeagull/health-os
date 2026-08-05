"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHealthData } from "@/lib/hooks/use-health-data";

interface HistoryDay {
  date: string;
  live_metadata?: {
    recovery: number;
    strain: number;
    sleep_ms: number;
    calories: number;
  };
}

export function WeeklySummary() {
  const { data: history, isLoading } = useHealthData<HistoryDay[]>(
    "whoop/history?days=7",
    { refreshInterval: 300000 }
  );

  const withData = history?.filter((d) => d.live_metadata) ?? [];

  if (isLoading) {
    return (
      <>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </>
    );
  }

  if (withData.length === 0) {
    return (
      <Card className="sm:col-span-2 lg:col-span-4">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            WHOOP данные недоступны
          </p>
        </CardContent>
      </Card>
    );
  }

  const avgRecovery = Math.round(
    withData.reduce((s, d) => s + (d.live_metadata?.recovery ?? 0), 0) / withData.length
  );
  const avgSleep = (
    withData.reduce((s, d) => s + (d.live_metadata?.sleep_ms ?? 0), 0) /
    withData.length /
    3600000
  ).toFixed(1);
  const totalStrain = withData
    .reduce((s, d) => s + (d.live_metadata?.strain ?? 0), 0)
    .toFixed(1);
  const totalCalories = Math.round(
    withData.reduce((s, d) => s + (d.live_metadata?.calories ?? 0), 0)
  );

  const cards = [
    { title: "Avg Recovery", value: `${avgRecovery}%`, color: avgRecovery >= 67 ? "text-emerald-500" : avgRecovery >= 34 ? "text-amber-500" : "text-red-500" },
    { title: "Avg Sleep", value: `${avgSleep}ч`, color: parseFloat(avgSleep) >= 7 ? "text-emerald-500" : "text-amber-500" },
    { title: "Total Strain", value: totalStrain, color: "text-blue-500" },
    { title: "Total Calories", value: totalCalories.toLocaleString(), color: "text-orange-500" },
  ];

  return (
    <>
      {cards.map((c) => (
        <Card key={c.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {c.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-muted-foreground">
              {withData.length} дней
            </p>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
