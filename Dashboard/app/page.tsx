"use client";

import { PageHeader } from "@/components/shared/page-header";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { ActiveThreads } from "@/components/dashboard/active-threads";
import { RecentLabs } from "@/components/dashboard/recent-labs";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { KrProgressOverview } from "@/components/dashboard/kr-progress-overview";
import { UpcomingEvents } from "@/components/dashboard/upcoming-events";
import { ErrorBoundary } from "@/components/shared/error-boundary";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Обзор" description="Сводка по здоровью" />
      <ErrorBoundary>
        <SummaryCards />
      </ErrorBoundary>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <ErrorBoundary>
            <ActiveThreads />
          </ErrorBoundary>
          <ErrorBoundary>
            <KrProgressOverview />
          </ErrorBoundary>
        </div>
        <div className="space-y-6">
          <ErrorBoundary>
            <RecentLabs />
          </ErrorBoundary>
          <ErrorBoundary>
            <UpcomingEvents />
          </ErrorBoundary>
          <ErrorBoundary>
            <AlertsPanel />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
