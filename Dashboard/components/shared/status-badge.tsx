import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Active", variant: "default" },
  in_progress: { label: "In progress", variant: "default" },
  completed: { label: "Completed", variant: "secondary" },
  resolved: { label: "Resolved", variant: "secondary" },
  investigating: { label: "Investigating", variant: "outline" },
  monitoring: { label: "Monitoring", variant: "outline" },
  not_started: { label: "Not started", variant: "outline" },
  as_needed: { label: "As needed", variant: "outline" },
  suspended: { label: "Suspended", variant: "destructive" },
  inactive: { label: "Inactive", variant: "secondary" },
  normal: { label: "Normal", variant: "default" },
  high: { label: "Above range", variant: "destructive" },
  low: { label: "Below range", variant: "destructive" },
  stable: { label: "Stable", variant: "default" },
  confirmed: { label: "Confirmed", variant: "outline" },
  in_treatment: { label: "In treatment", variant: "default" },
  skipped: { label: "Skipped", variant: "secondary" },
  // Canonical enum statuses previously missing from this map: milestone (Block 13),
  // medication course (Block 11), and lab marker (Block 1).
  blocked: { label: "Blocked", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "secondary" },
  paused: { label: "Paused", variant: "secondary" },
  finished: { label: "Finished", variant: "secondary" },
  critical: { label: "Critical", variant: "destructive" },
  variant: { label: "Polymorphism", variant: "outline" },
  detected: { label: "Detected", variant: "destructive" },
  deviation: { label: "Deviation", variant: "destructive" },
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
