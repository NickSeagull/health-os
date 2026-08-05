"use client";

import { PageHeader } from "@/components/shared/page-header";
import { UpcomingTasks } from "@/components/tasks/upcoming-tasks";
import { TasksBySection } from "@/components/tasks/tasks-by-section";
import { CompletedFeed } from "@/components/tasks/completed-feed";
import { TaskPriorityChart } from "@/components/tasks/task-priority-chart";

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Задачи"
        description="Todoist — проект «Здоровье»"
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingTasks />
        <TasksBySection />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <CompletedFeed />
        <TaskPriorityChart />
      </div>
    </div>
  );
}
