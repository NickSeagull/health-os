"use client";

import { PageHeader } from "@/components/shared/page-header";
import { TractionOverview } from "@/components/traction/traction-overview";

export default function TractionPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Traction" description="Прогресс по направлениям здоровья" />
      <TractionOverview />
    </div>
  );
}
