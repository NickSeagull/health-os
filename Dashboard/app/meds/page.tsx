"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ScheduleGrid } from "@/components/meds/schedule-grid";
import { MedCards } from "@/components/meds/med-cards";

export default function MedsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Лекарства"
        description="Текущие препараты, БАДы, наружные"
      />
      <ScheduleGrid />
      <MedCards />
    </div>
  );
}
