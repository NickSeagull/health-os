"use client";

import { PageHeader } from "@/components/shared/page-header";
import { WeightProgression } from "@/components/body/weight-progression";
import { BmiZoneChart } from "@/components/body/bmi-zone-chart";
import { BloodPressureChart } from "@/components/body/blood-pressure-chart";
import { InBodyComposition } from "@/components/body/inbody-composition";
import { BodyCompositionGauges } from "@/components/body/body-composition-gauges";
import { AddMeasurementDialog } from "@/components/body/add-measurement-dialog";

export default function BodyPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Body"
        description="Body metrics, composition, and blood pressure"
        actions={<AddMeasurementDialog />}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <WeightProgression />
        <BmiZoneChart />
      </div>
      <BloodPressureChart />
      <div className="grid gap-6 lg:grid-cols-2">
        <InBodyComposition />
        <BodyCompositionGauges />
      </div>
    </div>
  );
}
