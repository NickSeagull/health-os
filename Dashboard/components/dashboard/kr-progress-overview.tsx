"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { useHealthData } from "@/lib/hooks/use-health-data";
import type { GoalsFile } from "@/lib/types/goal";

export function KrProgressOverview() {
  const { data: goals, isLoading } = useHealthData<GoalsFile>("goals");

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>KR progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!goals) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>KR progress</CardTitle>
        <CardDescription>
          {goals.directions.length} areas across {goals.phases.length} phases
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {goals.directions.map((d) => {
            const total = d.milestones.length;
            const done = d.milestones.filter(
              (m) => m.status === "completed"
            ).length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <Link
                key={d.kr}
                href="/goals"
                className="rounded-lg border p-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {d.kr}
                  </span>
                  <StatusBadge status={d.status} />
                </div>
                <p className="text-sm font-medium truncate mb-2">{d.area}</p>
                <div className="flex items-center gap-2">
                  <Progress value={pct} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {done}/{total}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
