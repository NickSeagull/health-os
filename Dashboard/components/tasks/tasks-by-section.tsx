"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

export function TasksBySection() {
  const { data, isLoading } = useHealthData<{
    tasks: TodoistTask[];
    sections: TodoistSection[];
  }>("tasks", { refreshInterval: 60000 });

  const sectionMap = new Map(
    data?.sections?.map((s) => [s.id, s.name]) ?? []
  );

  const counts: Record<string, number> = {};
  data?.tasks?.forEach((t) => {
    const name = sectionMap.get(t.section_id ?? "") ?? "Без секции";
    counts[name] = (counts[name] || 0) + 1;
  });

  const chartData = Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Задачи по секциям</CardTitle>
        <CardDescription>{data?.tasks?.length ?? 0} активных</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            Нет данных
          </p>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11 }}
                  width={120}
                />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="var(--chart-1)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
