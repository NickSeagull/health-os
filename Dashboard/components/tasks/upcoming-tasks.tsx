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
import type { TodoistTask, TodoistSection } from "@/lib/data/todoist";

const priorityColors: Record<number, string> = {
  4: "bg-red-500",
  3: "bg-orange-500",
  2: "bg-blue-500",
  1: "bg-zinc-400",
};

const priorityLabels: Record<number, string> = {
  4: "p1",
  3: "p2",
  2: "p3",
  1: "p4",
};

export function UpcomingTasks() {
  const { data, isLoading } = useHealthData<{
    tasks: TodoistTask[];
    sections: TodoistSection[];
  }>("tasks", { refreshInterval: 60000 });

  const tasks = data?.tasks
    ?.filter((t) => t.due && !t.is_completed)
    .sort((a, b) => (a.due?.date ?? "").localeCompare(b.due?.date ?? ""));

  const overdue = tasks?.filter(
    (t) => t.due && new Date(t.due.date) < new Date(new Date().toISOString().slice(0, 10))
  );
  const upcoming = tasks?.filter(
    (t) => t.due && new Date(t.due.date) >= new Date(new Date().toISOString().slice(0, 10))
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming tasks</CardTitle>
        <CardDescription>
          {tasks?.length ?? 0} tasks with deadlines
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-4 max-h-[400px] overflow-auto">
            {overdue && overdue.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-500 mb-2">
                  Overdue ({overdue.length})
                </p>
                {overdue.map((t) => (
                  <TaskRow key={t.id} task={t} overdue />
                ))}
              </div>
            )}
            {upcoming && upcoming.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Upcoming
                </p>
                {upcoming.map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))}
              </div>
            )}
            {!tasks?.length && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tasks with deadlines
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TaskRow({ task, overdue }: { task: TodoistTask; overdue?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border p-2.5 mb-1.5 ${
        overdue ? "border-red-500/30 bg-red-500/5" : ""
      }`}
    >
      <div
        className={`h-2 w-2 rounded-full shrink-0 ${priorityColors[task.priority]}`}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm truncate">{task.content}</p>
        <p className="text-xs text-muted-foreground">
          {task.due?.string}
          {task.due?.is_recurring && " 🔁"}
        </p>
      </div>
      <Badge variant="outline" className="text-xs shrink-0">
        {priorityLabels[task.priority]}
      </Badge>
    </div>
  );
}
