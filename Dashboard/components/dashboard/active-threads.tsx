"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { useHealthData } from "@/lib/hooks/use-health-data";
import { formatDate } from "@/lib/utils";
import type { GoalsFile } from "@/lib/types/goal";

export function ActiveThreads() {
  const { data: goals, isLoading } = useHealthData<GoalsFile>("goals");

  const directions = goals?.directions?.filter(
    (d) => d.status !== "resolved" && d.status !== "not_started"
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active areas</CardTitle>
        <CardDescription>
          Current treatment and research areas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !directions?.length ? (
          <p className="text-sm text-muted-foreground">No active areas</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Area</TableHead>
                <TableHead>KR</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">
                  Last activity
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  Milestones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {directions.map((d) => {
                const done = d.milestones.filter(
                  (m) => m.status === "completed"
                ).length;
                return (
                  <TableRow key={d.kr}>
                    <TableCell className="font-medium">{d.area}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {d.kr}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={d.status} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {formatDate(d.last_activity)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      {done}/{d.milestones.length}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        <Link
          href="/goals"
          className="mt-3 inline-block text-xs text-muted-foreground hover:text-foreground"
        >
          All areas →
        </Link>
      </CardContent>
    </Card>
  );
}
