"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHealthData } from "@/lib/hooks/use-health-data";
import type { TodoistTask, TodoistSection } from "@/lib/data/todoist";

const COLORS = ["#ef4444", "#f97316", "#3b82f6", "#9ca3af"];
const LABELS = ["p1 (Срочно)", "p2 (Высокий)", "p3 (Средний)", "p4 (Обычный)"];

export function TaskPriorityChart() {
  const { data, isLoading } = useHealthData<{
    tasks: TodoistTask[];
    sections: TodoistSection[];
  }>("tasks", { refreshInterval: 60000 });

  const priorityCounts = [0, 0, 0, 0];
  data?.tasks?.forEach((t) => {
    // Todoist: 4=p1, 3=p2, 2=p3, 1=p4
    const idx = 4 - t.priority;
    if (idx >= 0 && idx < 4) priorityCounts[idx]++;
  });

  const chartData = LABELS.map((name, i) => ({
    name,
    value: priorityCounts[i],
  })).filter((d) => d.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Приоритеты</CardTitle>
        <CardDescription>Распределение по приоритетам</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[250px] w-full" />
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            Нет данных
          </p>
        ) : (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={(entry) => `${entry.value}`}
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[LABELS.indexOf(chartData[i].name)]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
