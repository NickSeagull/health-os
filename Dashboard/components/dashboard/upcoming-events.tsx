"use client";

import Link from "next/link";
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
import type { GoalsFile, Milestone } from "@/lib/types/goal";
import type { TodoistTask, TodoistSection } from "@/lib/data/todoist";

interface UpcomingItem {
  date: string;
  title: string;
  type: "milestone" | "task";
  link: string;
}

export function UpcomingEvents() {
  const { data: goals } = useHealthData<GoalsFile>("goals");
  const { data: taskData } = useHealthData<{
    tasks: TodoistTask[];
    sections: TodoistSection[];
  }>("tasks", { refreshInterval: 60000 });

  const items: UpcomingItem[] = [];
  const today = new Date().toISOString().slice(0, 10);

  // Milestones with deadlines
  goals?.directions?.forEach((d) => {
    d.milestones.forEach((m) => {
      if (m.deadline && m.status !== "completed" && m.deadline >= today) {
        items.push({
          date: m.deadline,
          title: `${d.kr}: ${m.title}`,
          type: "milestone",
          link: "/goals",
        });
      }
    });
  });

  // Todoist tasks with due dates
  taskData?.tasks
    ?.filter((t) => t.due && !t.is_completed)
    .forEach((t) => {
      items.push({
        date: t.due!.date,
        title: t.content,
        type: "task",
        link: "/tasks",
      });
    });

  items.sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = items.slice(0, 8);

  const isLoading = !goals && !taskData;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming events</CardTitle>
        <CardDescription>Milestones + tasks</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming events</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((item, i) => (
              <Link
                key={i}
                href={item.link}
                className="flex items-center gap-2 rounded-lg border p-2.5 hover:bg-accent/50 transition-colors"
              >
                <Badge
                  variant={item.type === "milestone" ? "default" : "outline"}
                  className="text-xs shrink-0"
                >
                  {item.type === "milestone" ? "KR" : "Task"}
                </Badge>
                <span className="text-sm truncate flex-1">{item.title}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDate(item.date)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
