"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { useHealthData } from "@/lib/hooks/use-health-data";
import type { ProfileData } from "@/lib/types/profile";

export function ChronicCard() {
  const { data: profile, isLoading } = useHealthData<ProfileData>("profile");

  if (isLoading) return <Card><CardContent className="pt-6"><Skeleton className="h-48" /></CardContent></Card>;
  if (!profile) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chronic conditions</CardTitle>
        <CardDescription>{profile.chronic_conditions.length} records</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[400px] overflow-auto">
          {profile.chronic_conditions.map((c, i) => (
            <div key={i} className="flex items-start justify-between gap-2 rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{c.condition}</p>
                <p className="text-xs text-muted-foreground">
                  Since {c.since}{c.notes && ` · ${c.notes}`}
                </p>
              </div>
              <StatusBadge status={c.status} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
