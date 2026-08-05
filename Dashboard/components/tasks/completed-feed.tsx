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
import { formatDate } from "@/lib/utils";

interface CompletedData {
  items: {
    task_id: string;
    content: string;
    completed_at: string;
  }[];
}

export function CompletedFeed() {
  const { data, isLoading } = useHealthData<CompletedData>(
    "tasks/completed",
    { refreshInterval: 120000 }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Завершённые</CardTitle>
        <CardDescription>Последние выполненные задачи</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !data?.items?.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Нет завершённых задач
          </p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-auto">
            {data.items.slice(0, 20).map((item) => (
              <div
                key={item.task_id}
                className="flex items-center gap-2 text-sm py-1.5 border-b last:border-0"
              >
                <span className="text-emerald-500">✓</span>
                <span className="flex-1 truncate">{item.content}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDate(item.completed_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
