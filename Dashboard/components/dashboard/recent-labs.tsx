"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useHealthData } from "@/lib/hooks/use-health-data";
import { formatDate } from "@/lib/utils";
import type { LabIndex } from "@/lib/types/lab";

export function RecentLabs() {
  const { data: labs, isLoading } = useHealthData<LabIndex>("labs");

  const recent = labs?.analyses
    ?.sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Последние анализы</CardTitle>
        <CardDescription>Последних исследований: {recent?.length ?? 0}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !recent?.length ? (
          <p className="text-sm text-muted-foreground">Нет данных</p>
        ) : (
          <div className="space-y-3">
            {recent.map((lab) => (
              <div
                key={lab.file}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{lab.type}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(lab.date)} · {lab.lab}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {lab.flags?.length ? (
                    <Badge variant="destructive" className="text-xs">
                      {lab.flags.length} флаг
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      ОК
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <Link
          href="/labs"
          className="mt-3 inline-block text-xs text-muted-foreground hover:text-foreground"
        >
          Все анализы →
        </Link>
      </CardContent>
    </Card>
  );
}
