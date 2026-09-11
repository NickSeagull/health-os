"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useHealthData } from "@/lib/hooks/use-health-data";
import { formatRub } from "@/lib/utils";
import type { TractionReview } from "@/lib/types/traction";

export function TractionOverview() {
  const { data: reviews, isLoading } = useHealthData<TractionReview[]>("traction");

  const latest = reviews?.at(-1);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (!latest) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center py-8">
            No traction data. The first review will be created after the weekly review.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalDone = latest.directions_summary.reduce((s, d) => s + d.milestones_done, 0);
  const totalAll = latest.directions_summary.reduce((s, d) => s + d.milestones_total, 0);
  const overallPct = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Overall progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{overallPct}%</p>
            <Progress value={overallPct} className="h-1.5 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">{totalDone}/{totalAll} milestones</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatRub(latest.cost_total_rub)}</p>
            <p className="text-xs text-muted-foreground">of {formatRub(latest.cost_estimate_total_rub)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Workouts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{latest.fitness.workouts_this_month}/{latest.fitness.target}</p>
            <p className="text-xs text-muted-foreground">{latest.fitness.mode}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Period</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{latest.period}</p>
            <Badge variant="outline" className="text-xs mt-1">{latest.type}</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Directions */}
      <Card>
        <CardHeader>
          <CardTitle>Areas</CardTitle>
          <CardDescription>{latest.directions_summary.length} areas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {latest.directions_summary.map((d) => {
              const pct = d.milestones_total > 0
                ? Math.round((d.milestones_done / d.milestones_total) * 100)
                : 0;
              return (
                <div key={d.kr} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-12">{d.kr}</span>
                  <span className="text-sm font-medium w-40 truncate">{d.area}</span>
                  <Progress value={pct} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {d.milestones_done}/{d.milestones_total}
                  </span>
                  <Badge variant="outline" className="text-xs w-24 justify-center">
                    {d.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Highlights & Blockers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Highlights</CardTitle>
          </CardHeader>
          <CardContent>
            {latest.highlights.length === 0 ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : (
              <ul className="space-y-1">
                {latest.highlights.map((h, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-emerald-500">✓</span>
                    {h}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Blockers</CardTitle>
          </CardHeader>
          <CardContent>
            {latest.blockers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No blockers</p>
            ) : (
              <ul className="space-y-1">
                {latest.blockers.map((b, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-red-500">!</span>
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
