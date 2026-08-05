"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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
import { formatRub } from "@/lib/utils";
import { estimateMismatch } from "@/lib/goals-cost";
import type { GoalsFile } from "@/lib/types/goal";

export function CostWaterfall() {
  const { data: goals, isLoading } = useHealthData<GoalsFile>("goals");

  if (isLoading) return <Skeleton className="h-[350px]" />;
  if (!goals) return null;

  const phaseData = goals.phases.map((phase) => {
    const dirs = goals.directions.filter((d) => d.phase === phase.id);
    const estimate = dirs.reduce((s, d) => s + d.cost_estimate_rub, 0);
    const actual = dirs.reduce((s, d) => s + d.cost_actual_rub, 0);
    return {
      name: phase.name,
      estimate,
      actual,
      remaining: Math.max(0, estimate - actual),
    };
  });

  // Столбцы считаются по directions[], а подпись бралась из cost_summary —
  // карточка могла противоречить сама себе: сумма столбцов не сходилась с заголовком.
  // Правильное поведение — показать расхождение, а не выбрать одно из чисел молча
  const mismatches = estimateMismatch(goals);
  const computedTotal = goals.directions.reduce(
    (s, d) => s + (d.cost_estimate_rub ?? 0),
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Бюджет</CardTitle>
        <CardDescription>
          Итого: {formatRub(computedTotal)} оценка /{" "}
          {formatRub(goals.cost_summary.total_actual_rub)} факт
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={phaseData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${Math.round(v / 1000)}k`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-popover p-3 text-sm shadow-md">
                      <p className="font-medium">{d.name}</p>
                      <p>Оценка: {formatRub(d.estimate)}</p>
                      <p>Факт: {formatRub(d.actual)}</p>
                      <p>Остаток: {formatRub(d.remaining)}</p>
                    </div>
                  );
                }}
              />
              <Legend />
              <Bar
                dataKey="actual"
                fill="#22c55e"
                name="Факт"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="remaining"
                fill="#3b82f6"
                fillOpacity={0.3}
                name="Остаток"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {mismatches.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
            <p className="text-xs font-medium mb-2">
              Смета в данных не сходится: {mismatches.length}{" "}
              {mismatches.length === 1 ? "расхождение" : "расхождения"}
            </p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {mismatches.map((m) => (
                <li key={m.scope}>
                  {m.scope}: в {"«"}cost_summary{"»"} {formatRub(m.declared)}, по
                  направлениям {formatRub(m.computed)}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              На графике — суммы по направлениям. Пересчитать{" "}
              {"«"}cost_summary{"»"} нужно в{" "}
              <span className="font-mono">Data/goals/2026.json</span>.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
