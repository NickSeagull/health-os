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

interface HomeData {
  live_metadata?: {
    recovery: number;
    strain: number;
    sleep_ms: number;
    calories: number;
  };
  gauges?: { title: string; score_display: string; fill: number }[];
}

export function RecoveryGauge() {
  const { data, isLoading } = useHealthData<HomeData>("whoop", {
    refreshInterval: 60000,
  });

  const recovery = data?.live_metadata?.recovery;
  const recoveryColor =
    recovery == null
      ? "text-muted-foreground"
      : recovery >= 67
        ? "text-emerald-500"
        : recovery >= 34
          ? "text-amber-500"
          : "text-red-500";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recovery</CardTitle>
        <CardDescription>Сегодня</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : recovery == null ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Нет данных — проверьте WHOOP credentials
          </p>
        ) : (
          <div className="flex flex-col items-center">
            <div className="relative h-32 w-32">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={`${recovery * 2.51} 251`}
                  strokeLinecap="round"
                  className={recoveryColor}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-3xl font-bold ${recoveryColor}`}>
                  {recovery}%
                </span>
              </div>
            </div>
            {data?.gauges && (
              <div className="grid grid-cols-2 gap-3 mt-4 w-full">
                {data.gauges.map((g) => (
                  <div key={g.title} className="text-center">
                    <p className="text-xs text-muted-foreground">{g.title}</p>
                    <p className="text-sm font-medium">{g.score_display}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
