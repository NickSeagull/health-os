"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useHealthData } from "@/lib/hooks/use-health-data";
import type { GoalsFile } from "@/lib/types/goal";

export function PhaseProgressBars() {
  const { data: goals, isLoading } = useHealthData<GoalsFile>("goals");

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!goals) return null;

  const phaseData = goals.phases.map((phase) => {
    const dirs = goals.directions.filter((d) => d.phase === phase.id);
    const total = dirs.reduce((sum, d) => sum + d.milestones.length, 0);
    const done = dirs.reduce(
      (sum, d) => sum + d.milestones.filter((m) => m.status === "completed").length,
      0
    );
    return { ...phase, total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Прогресс по фазам</CardTitle>
        <CardDescription>3 фазы лечения</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {phaseData.map((phase) => (
          <div key={phase.id}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">
                {phase.name} ({phase.period})
              </span>
              <span className="text-xs text-muted-foreground">
                {phase.done}/{phase.total} · {phase.pct}%
              </span>
            </div>
            <Progress value={phase.pct} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
