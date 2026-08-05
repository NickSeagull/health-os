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
import { useHealthData } from "@/lib/hooks/use-health-data";
import type { ProfileData } from "@/lib/types/profile";

const severityColor = {
  mild: "secondary" as const,
  moderate: "outline" as const,
  severe: "destructive" as const,
};

export function AllergiesCard() {
  const { data: profile, isLoading } = useHealthData<ProfileData>("profile");

  if (isLoading) return <Card><CardContent className="pt-6"><Skeleton className="h-32" /></CardContent></Card>;
  if (!profile) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Аллергии</CardTitle>
        <CardDescription>{profile.allergies.length} записей</CardDescription>
      </CardHeader>
      <CardContent>
        {profile.allergies.length === 0 ? (
          <p className="text-sm text-muted-foreground">Аллергии не указаны</p>
        ) : (
          <div className="space-y-3">
            {profile.allergies.map((a, i) => (
              <div key={i} className="rounded-lg border p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{a.allergen}</span>
                  <Badge variant={severityColor[a.severity]}>{a.severity}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {a.type} · {a.reaction}
                </p>
                {a.notes && <p className="text-xs text-muted-foreground mt-1">{a.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
