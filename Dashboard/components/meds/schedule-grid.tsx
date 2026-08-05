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
import type { MedsFile, Medication, Supplement } from "@/lib/types/medication";

type MedItem = (Medication | Supplement) & { category: string };

const timeSlots = [
  { key: "утро", label: "Утро", emoji: "🌅" },
  { key: "день", label: "День", emoji: "☀️" },
  { key: "вечер", label: "Вечер", emoji: "🌆" },
  { key: "ночь", label: "Ночь", emoji: "🌙" },
];

function matchTiming(timing: string[], slot: string): boolean {
  return timing.some((t) => t.toLowerCase().includes(slot));
}

export function ScheduleGrid() {
  const { data: meds, isLoading } = useHealthData<MedsFile>("meds");

  const allItems: MedItem[] = [
    ...(meds?.medications?.filter((m) => m.status === "active").map((m) => ({
      ...m,
      category: "med",
    })) ?? []),
    ...(meds?.supplements?.filter((s) => s.status === "active").map((s) => ({
      ...s,
      category: "supplement",
    })) ?? []),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Расписание приёма</CardTitle>
        <CardDescription>{allItems.length} активных препаратов</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : allItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Нет активных препаратов
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {timeSlots.map((slot) => {
              const items = allItems.filter((m) =>
                matchTiming(m.timing, slot.key)
              );
              return (
                <div key={slot.key} className="rounded-lg border p-3">
                  <h4 className="text-sm font-medium mb-2">
                    {slot.emoji} {slot.label}
                  </h4>
                  {items.length === 0 ? (
                    <p className="text-xs text-muted-foreground">—</p>
                  ) : (
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.dosage}
                            </p>
                          </div>
                          <Badge
                            variant={
                              item.category === "med" ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {item.category === "med" ? "Лек" : "БАД"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
