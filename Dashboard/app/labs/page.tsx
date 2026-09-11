"use client";

import { PageHeader } from "@/components/shared/page-header";
import { MarkerTrendChart } from "@/components/labs/marker-trend-chart";
import { MarkerStatusGrid } from "@/components/labs/marker-status-grid";
import { LabHistoryTable } from "@/components/labs/lab-history-table";
import { AbnormalityScatter } from "@/components/labs/abnormality-scatter";
import { NewLabDialog } from "@/components/labs/new-lab-dialog";

export default function LabsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Labs"
        description="Lab history, marker trends, and abnormalities"
        actions={<NewLabDialog />}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <MarkerTrendChart />
        <AbnormalityScatter />
      </div>
      <MarkerStatusGrid />
      <LabHistoryTable />
    </div>
  );
}
