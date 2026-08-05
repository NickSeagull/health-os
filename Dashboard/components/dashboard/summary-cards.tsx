"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Heart, Pill, Target } from "lucide-react";
import { useHealthData } from "@/lib/hooks/use-health-data";
import { calcAge } from "@/lib/utils";
import type { ProfileData } from "@/lib/types/profile";
import type { GoalsFile } from "@/lib/types/goal";
import type { MedsFile } from "@/lib/types/medication";
import type { BodyMetric } from "@/lib/types/body-metric";

export function SummaryCards() {
  const { data: profile } = useHealthData<ProfileData>("profile");
  const { data: goals } = useHealthData<GoalsFile>("goals");
  const { data: meds } = useHealthData<MedsFile>("meds");
  const { data: metrics } = useHealthData<BodyMetric[]>("body-metrics");

  const lastMetric = metrics?.filter((m) => m.weight_kg)?.at(-1);
  const activeDirections = goals?.directions?.filter(
    (d) => d.status !== "resolved"
  )?.length;
  const activeMeds =
    (meds?.medications?.filter((m) => m.status === "active")?.length ?? 0) +
    (meds?.supplements?.filter((s) => s.status === "active")?.length ?? 0);

  const cards = [
    {
      title: "Вес / BMI",
      value: lastMetric
        ? `${lastMetric.weight_kg} кг / ${lastMetric.bmi ?? "—"}`
        : "—",
      icon: Activity,
      description: lastMetric ? `Последнее: ${lastMetric.date}` : "",
    },
    {
      title: "Возраст",
      value: profile ? `${calcAge(profile.basic.date_of_birth)} лет` : "—",
      icon: Heart,
      description: profile?.basic.blood_type
        ? `Группа крови: ${profile.basic.blood_type}`
        : "",
    },
    {
      title: "Активные KR",
      value: activeDirections ?? "—",
      icon: Target,
      description: goals ? `Из ${goals.directions.length} направлений` : "",
    },
    {
      title: "Препараты",
      value: activeMeds ?? "—",
      icon: Pill,
      description: "Лекарства + БАДы",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {!profile && !goals ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{card.value}</div>
                {card.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.description}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
