"use client";

import { PageHeader } from "@/components/shared/page-header";
import { MoodChart } from "@/components/mental/mood-chart";
import { MoodInputDialog } from "@/components/mental/mood-input-dialog";

export default function MentalPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Ментальное"
        description="Настроение, энергия, стресс, сон"
        actions={<MoodInputDialog />}
      />
      <MoodChart />
    </div>
  );
}
