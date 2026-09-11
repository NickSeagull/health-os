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
    sleep_ms: number;
  };
}

export function SleepDashboard() {
  const { data, isLoading } = useHealthData<HomeData>("whoop", {
    refreshInterval: 60000,
  });

  const sleepMs = data?.live_metadata?.sleep_ms;
  const sleepHours = sleepMs ? (sleepMs / 3600000).toFixed(1) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sleep</CardTitle>
        <CardDescription>Last night</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : sleepHours == null ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No sleep data
          </p>
        ) : (
          <div className="flex items-center gap-6">
            <div>
              <p className="text-4xl font-bold">{sleepHours}h</p>
              <p className="text-xs text-muted-foreground">Duration</p>
            </div>
            <div className="flex-1">
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    parseFloat(sleepHours) >= 7
                      ? "bg-emerald-500"
                      : parseFloat(sleepHours) >= 6
                        ? "bg-amber-500"
                        : "bg-red-500"
                  }`}
                  style={{
                    width: `${Math.min(100, (parseFloat(sleepHours) / 9) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Target: 7–9 hours
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
