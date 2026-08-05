"use client";

import { PageHeader } from "@/components/shared/page-header";
import { VisitsBySpecialty } from "@/components/visits/visits-by-specialty";
import { VisitTimeline } from "@/components/visits/visit-timeline";
import { VisitFrequencyHeatmap } from "@/components/visits/visit-frequency-heatmap";
import { NewVisitDialog } from "@/components/visits/new-visit-dialog";

export default function VisitsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Визиты"
        description="История визитов к врачам"
        actions={<NewVisitDialog />}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <VisitsBySpecialty />
        <VisitFrequencyHeatmap />
      </div>
      <VisitTimeline />
    </div>
  );
}
