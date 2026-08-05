import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Активен", variant: "default" },
  in_progress: { label: "В работе", variant: "default" },
  completed: { label: "Завершён", variant: "secondary" },
  resolved: { label: "Решён", variant: "secondary" },
  investigating: { label: "Исследование", variant: "outline" },
  monitoring: { label: "Мониторинг", variant: "outline" },
  not_started: { label: "Не начат", variant: "outline" },
  as_needed: { label: "По потребности", variant: "outline" },
  suspended: { label: "Приостановлен", variant: "destructive" },
  inactive: { label: "Неактивен", variant: "secondary" },
  normal: { label: "Норма", variant: "default" },
  high: { label: "Выше нормы", variant: "destructive" },
  low: { label: "Ниже нормы", variant: "destructive" },
  stable: { label: "Стабильно", variant: "default" },
  confirmed: { label: "Подтверждён", variant: "outline" },
  in_treatment: { label: "На лечении", variant: "default" },
  skipped: { label: "Пропущен", variant: "secondary" },
  // Статусы из канонических enum, которых в карте не было: milestone (Блок 13),
  // курс лекарства (Блок 11) и маркер анализа (Блок 1)
  blocked: { label: "Заблокирован", variant: "destructive" },
  cancelled: { label: "Отменён", variant: "secondary" },
  paused: { label: "На паузе", variant: "secondary" },
  finished: { label: "Завершён", variant: "secondary" },
  critical: { label: "Критическое", variant: "destructive" },
  variant: { label: "Полиморфизм", variant: "outline" },
  detected: { label: "Обнаружено", variant: "destructive" },
  deviation: { label: "Отклонение", variant: "destructive" },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusMap[status] ?? { label: status, variant: "outline" as const };
  return (
    <Badge variant={config.variant} className={cn("text-xs", className)}>
      {config.label}
    </Badge>
  );
}
