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
import type { ProfileData } from "@/lib/types/profile";

export function FamilyHistoryCard() {
  const { data: profile, isLoading } = useHealthData<ProfileData>("profile");

  if (isLoading) return <Card><CardContent className="pt-6"><Skeleton className="h-32" /></CardContent></Card>;
  if (!profile) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Family history</CardTitle>
        <CardDescription>{profile.family_history.length} records</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {profile.family_history.map((f, i) => (
            <div key={i} className="rounded-lg border p-3">
              <p className="text-sm font-medium">
                {f.relative} — {f.name}
              </p>
              <p className="text-xs text-muted-foreground">{f.condition}</p>
              {f.notes && <p className="text-xs text-muted-foreground mt-1">{f.notes}</p>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
