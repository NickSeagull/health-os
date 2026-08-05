"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { useHealthData } from "@/lib/hooks/use-health-data";
import type { GoalsFile, Milestone } from "@/lib/types/goal";

interface TimelineMilestone extends Milestone {
  area: string;
  kr: string;
}

export function MilestoneTimeline() {
  const { data: goals, isLoading } = useHealthData<GoalsFile>("goals");

  if (isLoading) return <Skeleton className="h-[350px]" />;
  if (!goals) return null;

  const allMilestones: TimelineMilestone[] = goals.directions.flatMap((d) =>
    d.milestones.map((m) => ({ ...m, area: d.area, kr: d.kr }))
  );

  const withDeadline = allMilestones
    .filter((m) => m.deadline)
    .sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? ""));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline milestones</CardTitle>
        <CardDescription>
          {withDeadline.length} milestones с дедлайнами
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[400px] overflow-auto border-l-2 border-muted ml-2 pl-4">
          {withDeadline.map((m) => (
            <div key={m.id} className="relative py-1.5">
              <div
                className={`absolute -left-[21px] top-2.5 h-2.5 w-2.5 rounded-full border-2 border-background ${
                  m.status === "completed"
                    ? "bg-emerald-500"
                    : m.status === "in_progress"
                      ? "bg-blue-500"
                      : "bg-zinc-400"
                }`}
              />
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{m.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.kr} · {m.area} · {m.deadline}
                  </p>
                </div>
                <StatusBadge status={m.status} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
