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
    strain: number;
    calories: number;
  };
  activities?: {
    title: string;
    strain: number;
    start: string;
    end: string;
  }[];
}

export function StrainOverview() {
  const { data, isLoading } = useHealthData<HomeData>("whoop", {
    refreshInterval: 60000,
  });

  const strain = data?.live_metadata?.strain;
  const calories = data?.live_metadata?.calories;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Strain</CardTitle>
        <CardDescription>Нагрузка сегодня</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : strain == null ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Нет данных
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{strain.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">из 21.0</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{calories}</p>
                <p className="text-xs text-muted-foreground">kcal</p>
              </div>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${Math.min(100, (strain / 21) * 100)}%` }}
              />
            </div>
            {data?.activities && data.activities.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Активности
                </p>
                {data.activities.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{a.title}</span>
                    <span className="text-muted-foreground">
                      {a.strain.toFixed(1)}
                    </span>
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
