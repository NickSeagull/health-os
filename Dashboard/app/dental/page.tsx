"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ToothMapSvg } from "@/components/dental/tooth-map-svg";
import { DentalProcedureTimeline } from "@/components/dental/dental-procedure-timeline";

export default function DentalPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Зубы" description="Карта зубов, процедуры" />
      <ToothMapSvg />
      <DentalProcedureTimeline />
    </div>
  );
}
