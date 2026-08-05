"use client";

import { PageHeader } from "@/components/shared/page-header";
import { RecoveryGauge } from "@/components/whoop/recovery-gauge";
import { WhoopTrends } from "@/components/whoop/whoop-trends";
import { SleepDashboard } from "@/components/whoop/sleep-dashboard";
import { StrainOverview } from "@/components/whoop/strain-overview";
import { WeeklySummary } from "@/components/whoop/weekly-summary";

export default function WhoopPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="WHOOP"
        description="Recovery, strain, sleep — live data"
      />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <WeeklySummary />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <RecoveryGauge />
        <StrainOverview />
      </div>
      <WhoopTrends />
      <SleepDashboard />
    </div>
  );
}
