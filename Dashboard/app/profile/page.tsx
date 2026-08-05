"use client";

import { PageHeader } from "@/components/shared/page-header";
import { BasicInfoCard } from "@/components/profile/basic-info-card";
import { AllergiesCard } from "@/components/profile/allergies-card";
import { ChronicCard } from "@/components/profile/chronic-card";
import { ComplaintsCard } from "@/components/profile/complaints-card";
import { LifestyleCard } from "@/components/profile/lifestyle-card";
import { FamilyHistoryCard } from "@/components/profile/family-history-card";
import { EnvironmentCard } from "@/components/profile/environment-card";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Профиль" description="Персональная медицинская карта" />
      <div className="grid gap-6 lg:grid-cols-2">
        <BasicInfoCard />
        <AllergiesCard />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChronicCard />
        <ComplaintsCard />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <FamilyHistoryCard />
        <LifestyleCard />
      </div>
      <EnvironmentCard />
    </div>
  );
}
