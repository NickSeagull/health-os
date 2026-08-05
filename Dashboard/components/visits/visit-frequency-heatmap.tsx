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
import type { VisitIndex } from "@/lib/types/visit";

export function VisitFrequencyHeatmap() {
  const { data: index, isLoading } = useHealthData<VisitIndex>("visits");

  const yearCounts: Record<string, number> = {};
  index?.visits?.forEach((v) => {
    const year = v.date.slice(0, 4);
    yearCounts[year] = (yearCounts[year] || 0) + 1;
  });

  const years = Object.entries(yearCounts)
    .sort(([a], [b]) => a.localeCompare(b));

  const maxCount = Math.max(...years.map(([, c]) => c), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Частота визитов</CardTitle>
        <CardDescription>По годам</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : years.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            Нет данных
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {years.map(([year, count]) => {
              const intensity = count / maxCount;
              const bg =
                intensity > 0.7
                  ? "bg-emerald-500"
                  : intensity > 0.4
                    ? "bg-emerald-400"
                    : intensity > 0.2
                      ? "bg-emerald-300"
                      : "bg-emerald-200";

              return (
                <div
                  key={year}
                  className={`rounded-lg p-3 text-center ${bg} text-white`}
                >
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-xs opacity-80">{year}</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
