"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useHealthData } from "@/lib/hooks/use-health-data";
import { formatDate } from "@/lib/utils";
import type { EnvironmentData } from "@/lib/types/environment";

export function EnvironmentCard() {
  const { data: env, isLoading } = useHealthData<EnvironmentData>("environment");

  if (isLoading)
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-40" />
        </CardContent>
      </Card>
    );
  // The route returns an error object when the file is missing; use version to distinguish it.
  if (!env || typeof env.version !== "number") return null;

  const loc = env.location;
  const care = env.healthcare_access;
  const work = env.work;
  const anchors = env.stress_context?.chronology_anchors ?? [];
  const gaps = env._needs_input ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>External context</CardTitle>
        <CardDescription>
          Location, climate, work, and chronology
          {env.updated && ` · updated ${formatDate(env.updated)}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-3 text-sm">
          {loc && (
            <div>
              <dt className="text-muted-foreground">Location</dt>
              <dd>
                {[loc.city, loc.district, loc.street].filter(Boolean).join(", ")}
                {loc.latitude != null && ` · ${loc.latitude}°N`}
              </dd>
            </div>
          )}
          {care && (
            <div>
              <dt className="text-muted-foreground">Healthcare access</dt>
              <dd>
                {care.insurance}
                {care.dms === false && " · No private insurance"}
                {care.travel_readiness && ` · ${care.travel_readiness}`}
              </dd>
            </div>
          )}
          {work && (
            <div>
              <dt className="text-muted-foreground">Work</dt>
              <dd>
                {[work.field, work.posture].filter(Boolean).join(" · ")}
                {work.screen_hours_per_day != null &&
                  ` · ${work.screen_hours_per_day} h of screen time`}
              </dd>
            </div>
          )}
          {env.climate?.type && (
            <div>
              <dt className="text-muted-foreground">Climate</dt>
              <dd>{env.climate.type}</dd>
            </div>
          )}
        </dl>

        {/* Climate and latitude implications: seasonal vitamin D deficiency,
            daylight variation, and winter dryness. */}
        {!!env.climate?.derived_facts?.length && (
          <div>
            <p className="text-xs font-medium mb-1.5">Environmental implications</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {env.climate.derived_facts.map((fact, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="shrink-0">·</span>
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!!work?.health_implications?.length && (
          <div>
            <p className="text-xs font-medium mb-1.5">Work implications</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {work.health_implications.map((item, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="shrink-0">·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!!anchors.length && (
          <div>
            <p className="text-xs font-medium mb-1.5">Chronology anchors</p>
            <ul className="space-y-1.5 text-xs">
              {anchors
                .slice()
                .sort((a, b) => b.year - a.year)
                .map((a, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="shrink-0 font-medium tabular-nums">
                      {a.year}
                      {a.age != null && ` (${a.age} years)`}
                    </span>
                    <span className="text-muted-foreground">
                      {a.event}
                      {a.needs_clarification && (
                        <Badge variant="outline" className="ml-1.5 text-[10px]">
                          clarify
                        </Badge>
                      )}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {!!gaps.length && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
            <p className="text-xs font-medium mb-1.5">
              Incomplete: {gaps.length} sections
            </p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {gaps.map((gap, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="shrink-0">·</span>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
