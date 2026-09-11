"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useHealthData } from "@/lib/hooks/use-health-data";
import { formatRub } from "@/lib/utils";
import { toast } from "sonner";
import { mutate } from "swr";
import type { GoalsFile, Milestone } from "@/lib/types/goal";

const milestoneTypeIcons: Record<string, string> = {
  visit: "🏥",
  lab: "🧪",
  procedure: "⚕️",
  action: "✅",
  metric: "📊",
  treatment: "💊",
};

function MilestoneRow({ milestone }: { milestone: Milestone }) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(milestone.notes ?? "");
  const [editingCost, setEditingCost] = useState(false);
  const [cost, setCost] = useState(String(milestone.cost_actual_rub ?? ""));

  async function toggleStatus() {
    const newStatus =
      milestone.status === "completed" ? "not_started" : "completed";
    try {
      const res = await fetch(
        `/api/goals/milestone/${encodeURIComponent(milestone.id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!res.ok) throw new Error();
      toast.success(
        newStatus === "completed" ? "Milestone completed" : "Milestone reopened"
      );
      mutate("/api/goals");
    } catch {
      toast.error("Update failed");
    }
  }

  async function saveNotes() {
    try {
      const res = await fetch(
        `/api/goals/milestone/${encodeURIComponent(milestone.id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes }),
        }
      );
      if (!res.ok) throw new Error();
      toast.success("Note saved");
      mutate("/api/goals");
      setEditingNotes(false);
    } catch {
      toast.error("Save failed");
    }
  }

  async function saveCost() {
    try {
      const res = await fetch(
        `/api/goals/milestone/${encodeURIComponent(milestone.id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cost_actual_rub: Number(cost) || 0 }),
        }
      );
      if (!res.ok) throw new Error();
      toast.success("Cost updated");
      mutate("/api/goals");
      setEditingCost(false);
    } catch {
      toast.error("Save failed");
    }
  }

  return (
    <div className="flex items-start gap-2 text-sm py-1">
      <Checkbox
        checked={milestone.status === "completed"}
        onCheckedChange={toggleStatus}
        className="mt-0.5"
      />
      <span>{milestoneTypeIcons[milestone.type] ?? "📌"}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={
              milestone.status === "completed"
                ? "line-through text-muted-foreground"
                : ""
            }
          >
            {milestone.title}
          </span>
          <StatusBadge status={milestone.status} />
          {milestone.oms_available && (
            <Badge variant="outline" className="text-xs">
              OMS
            </Badge>
          )}
        </div>

        {/* Notes inline edit */}
        <div className="mt-1">
          {editingNotes ? (
            <div className="flex gap-1">
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-7 text-xs"
                placeholder="Note..."
                onKeyDown={(e) => e.key === "Enter" && saveNotes()}
              />
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={saveNotes}>
                ✓
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setEditingNotes(false)}
              >
                ✕
              </Button>
            </div>
          ) : (
            <button
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setEditingNotes(true)}
            >
              {milestone.notes || "+ note"}
            </button>
          )}
        </div>

        {/* Cost inline edit */}
        <div className="mt-0.5">
          {editingCost ? (
            <div className="flex gap-1 items-center">
              <Input
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="h-7 text-xs w-24"
                type="number"
                placeholder="₽"
                onKeyDown={(e) => e.key === "Enter" && saveCost()}
              />
              <span className="text-xs text-muted-foreground">₽</span>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={saveCost}>
                ✓
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setEditingCost(false)}
              >
                ✕
              </Button>
            </div>
          ) : (
            <button
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setEditingCost(true)}
            >
              {milestone.cost_actual_rub
                ? formatRub(milestone.cost_actual_rub)
                : "+ cost"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function DirectionCards() {
  const { data: goals, isLoading } = useHealthData<GoalsFile>("goals");

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!goals) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Areas</CardTitle>
        <CardDescription>
          {goals.directions.length} health areas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="space-y-2">
          {goals.directions.map((d) => {
            const total = d.milestones.length;
            const done = d.milestones.filter(
              (m) => m.status === "completed"
            ).length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <AccordionItem
                key={d.kr}
                value={d.kr}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">
                          {d.kr}
                        </span>
                        <StatusBadge status={d.status} />
                      </div>
                      <p className="text-sm font-medium">{d.area}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={pct} className="h-1.5 w-24" />
                        <span className="text-xs text-muted-foreground">
                          {done}/{total}
                        </span>
                        {d.cost_actual_rub > 0 && (
                          <span className="text-xs text-muted-foreground">
                            · {formatRub(d.cost_actual_rub)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1 pt-2">
                    <p className="text-xs text-muted-foreground mb-2">
                      {d.goal}
                    </p>
                    {d.milestones.map((m) => (
                      <MilestoneRow key={m.id} milestone={m} />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
