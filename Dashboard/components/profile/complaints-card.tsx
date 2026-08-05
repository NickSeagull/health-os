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
import type { ProfileData } from "@/lib/types/profile";

export function ComplaintsCard() {
  const { data: profile, isLoading } = useHealthData<ProfileData>("profile");

  if (isLoading) return <Card><CardContent className="pt-6"><Skeleton className="h-48" /></CardContent></Card>;
  if (!profile) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Текущие жалобы</CardTitle>
        <CardDescription>{profile.current_complaints.length} активных</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[400px] overflow-auto">
          {profile.current_complaints.map((c, i) => (
            <div key={i} className="rounded-lg border p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{c.area}</span>
                <div className="flex gap-1">
                  <Badge variant={c.priority === "high" ? "destructive" : "outline"} className="text-xs">
                    {c.priority}
                  </Badge>
                  <StatusBadge status={c.status} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{c.description}</p>
              <p className="text-xs text-muted-foreground mt-1">С {c.since}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
