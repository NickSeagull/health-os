"use client";

import { PageHeader } from "@/components/shared/page-header";
import { PhaseProgressBars } from "@/components/goals/phase-progress-bars";
import { DirectionCards } from "@/components/goals/direction-cards";
import { CostWaterfall } from "@/components/goals/cost-waterfall";
import { MilestoneTimeline } from "@/components/goals/milestone-timeline";

export default function GoalsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Goals" description="Progress on OKR O5 — health" />
      <PhaseProgressBars />
      <DirectionCards />
      <div className="grid gap-6 lg:grid-cols-2">
        <CostWaterfall />
        <MilestoneTimeline />
      </div>
    </div>
  );
}
