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
import { formatDate } from "@/lib/utils";
import type { ToothMap, DentalProceduresFile } from "@/lib/types/dental";

export function DentalProcedureTimeline() {
  const { data, isLoading } = useHealthData<{
    toothMap: ToothMap;
    procedures: DentalProceduresFile;
  }>("dental");

  const procs = data?.procedures?.procedures
    ?.filter((p) => p.date)
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Procedure history</CardTitle>
        <CardDescription>{procs?.length ?? 0} procedures</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !procs?.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No procedure records
          </p>
        ) : (
          <div className="space-y-2 border-l-2 border-muted ml-2 pl-4">
            {procs.map((p, i) => (
              <div key={i} className="relative py-2">
                <div className="absolute -left-[21px] top-3 h-2.5 w-2.5 rounded-full bg-primary border-2 border-background" />
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">{p.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.date && formatDate(p.date)} ·{" "}
                      {p.teeth.length > 0 && `Teeth: ${p.teeth.join(", ")}`}
                    </p>
                    {p.notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {p.notes}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {p.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
