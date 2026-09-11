"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, Info, AlertCircle, ShieldAlert } from "lucide-react";
import { useHealthData } from "@/lib/hooks/use-health-data";
import type { HealthAlert, AlertSeverity } from "@/lib/types/alert";
import { cn } from "@/lib/utils";

/**
 * Styling follows the severity definitions in Block 5 of `critical-values.md`.
 * The `critical` level was previously missing here, even though it marks
 * processing stops, suicidal signs in the mood journal, and critical lab values.
 */
const severityConfig: Record<
  AlertSeverity,
  { icon: typeof AlertTriangle; className: string; iconColor: string }
> = {
  critical: {
    icon: ShieldAlert,
    className: "border-red-600 bg-red-600/10",
    iconColor: "text-red-600",
  },
  high: {
    icon: AlertTriangle,
    className: "border-red-500/50 bg-red-500/5",
    iconColor: "text-red-500",
  },
  medium: {
    icon: AlertCircle,
    className: "border-amber-500/50 bg-amber-500/5",
    iconColor: "text-amber-500",
  },
  low: {
    icon: Info,
    className: "border-blue-500/50 bg-blue-500/5",
    iconColor: "text-blue-500",
  },
};

/** Fallback for an unknown severity: alerts must never be silently dropped. */
const unknownSeverity = severityConfig.high;

export function AlertsPanel() {
  const { data: alerts } = useHealthData<HealthAlert[]>("alerts");

  // The route may return an error object instead of an array.
  const list = Array.isArray(alerts) ? alerts : [];
  const activeAlerts = list.filter((a) => !a.acknowledged);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alerts</CardTitle>
        <CardDescription>Require attention</CardDescription>
      </CardHeader>
      <CardContent>
        {!activeAlerts.length ? (
          <p className="text-sm text-muted-foreground">No active alerts</p>
        ) : (
          <div className="space-y-2">
            {activeAlerts.map((alert, i) => {
              const config = severityConfig[alert.severity] ?? unknownSeverity;
              const Icon = config.icon;
              return (
                <div
                  key={alert.id ? `${alert.date ?? ""}-${alert.id}` : i}
                  className={cn("rounded-lg border p-3", config.className)}
                >
                  <div className="flex items-start gap-2">
                    <Icon
                      className={cn("h-4 w-4 mt-0.5 shrink-0", config.iconColor)}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{alert.title}</p>
                      {alert.detail && (
                        <p className="text-xs text-muted-foreground">
                          {alert.detail}
                        </p>
                      )}
                      {alert.marker && (
                        <p className="text-xs text-muted-foreground">
                          {alert.marker}
                          {alert.value != null && `: ${alert.value}`}
                          {alert.reference && ` (reference ${alert.reference})`}
                        </p>
                      )}
                      {alert.action && (
                        <p className="text-xs font-medium mt-1">
                          {alert.action}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
