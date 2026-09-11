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
import type { ProfileData } from "@/lib/types/profile";

/**
 * Profile fields such as `cigarettes` and `tracking` are booleans, and React
 * does not render boolean values: the screen showed "Cigarettes: " as empty
 * and "deficit (cutting) · true".
 */
function renderValue(value: unknown, whenTrue = "yes", whenFalse = "no"): string {
  if (value === true) return whenTrue;
  if (value === false) return whenFalse;
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.join("; ");
  return String(value);
}

/** Whether a block has at least one value besides explanatory notes. */
function isBlockEmpty(block: object | undefined | null): boolean {
  if (!block) return true;
  return Object.entries(block)
    .filter(([k]) => k !== "notes" && k !== "variability_notes")
    .every(([, v]) => v === null || v === undefined || v === "");
}

export function LifestyleCard() {
  const { data: profile, isLoading } = useHealthData<ProfileData>("profile");

  if (isLoading)
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-40" />
        </CardContent>
      </Card>
    );
  if (!profile) return null;

  const l = profile.lifestyle;

  // Four blocks were added after onboarding and are still empty. The card used
  // to show six populated fields and look complete, hiding that clinically
  // meaningful data had not been collected.
  const gaps: { key: string; label: string; why?: string }[] = [
    {
      key: "caffeine",
      label: "Caffeine",
      why: l.caffeine?.notes,
    },
    {
      key: "hydration",
      label: "Hydration",
      why: l.hydration?.notes,
    },
    {
      key: "screen_and_light",
      label: "Screens and light",
      why: l.screen_and_light?.notes,
    },
    {
      key: "sleep_regularity",
      label: "Sleep regularity",
      why: l.sleep_regularity?.variability_notes,
    },
  ].filter(({ key }) => {
    const block = l[key as keyof typeof l];
    return isBlockEmpty(typeof block === "object" ? block : undefined);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lifestyle</CardTitle>
        <CardDescription>Activity, sleep, nutrition, and stimulants</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Exercise</dt>
            <dd>
              {l.exercise.type} · {l.exercise.frequency}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Sleep</dt>
            <dd>
              {l.sleep.target_bedtime}–{l.sleep.target_wakeup} ·{" "}
              {renderValue(l.sleep.duration_hours)} h
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Nutrition</dt>
            <dd>
              {l.nutrition.current_phase}
              {` · calorie tracking: ${renderValue(l.nutrition.tracking, "active", "inactive")}`}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Smoking</dt>
            <dd>
              Cigarettes: {renderValue(l.smoking.cigarettes)} · Hookah: {" "}
              {renderValue(l.smoking.hookah)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Alcohol</dt>
            <dd>{renderValue(l.alcohol)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Work</dt>
            <dd>{renderValue(l.work)}</dd>
          </div>

          {l.caffeine && !isBlockEmpty(l.caffeine) && (
            <div>
              <dt className="text-muted-foreground">Caffeine</dt>
              <dd>
                {[
                  l.caffeine.coffee_cups_per_day != null &&
                    `coffee ${l.caffeine.coffee_cups_per_day} cups/day`,
                  l.caffeine.tea && `tea: ${l.caffeine.tea}`,
                  l.caffeine.energy_drinks && `energy drinks: ${l.caffeine.energy_drinks}`,
                  l.caffeine.last_intake_time &&
                    `last intake ${l.caffeine.last_intake_time}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </dd>
            </div>
          )}
          {l.hydration && !isBlockEmpty(l.hydration) && (
            <div>
              <dt className="text-muted-foreground">Hydration</dt>
              <dd>{l.hydration.water_liters_per_day} L/day</dd>
            </div>
          )}
          {l.screen_and_light && !isBlockEmpty(l.screen_and_light) && (
            <div>
              <dt className="text-muted-foreground">Screens and light</dt>
              <dd>
                {[
                  l.screen_and_light.screen_hours_per_day != null &&
                    `${l.screen_and_light.screen_hours_per_day} h screen time/day`,
                  l.screen_and_light.evening_screen_cutoff &&
                    `screens off at ${l.screen_and_light.evening_screen_cutoff}`,
                  l.screen_and_light.morning_daylight_minutes != null &&
                    `morning daylight ${l.screen_and_light.morning_daylight_minutes} min`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </dd>
            </div>
          )}
          {l.sleep_regularity && !isBlockEmpty(l.sleep_regularity) && (
            <div>
              <dt className="text-muted-foreground">Sleep regularity</dt>
              <dd>
                Weekdays {renderValue(l.sleep_regularity.actual_bedtime_weekday)} · weekends{" "}
                {renderValue(l.sleep_regularity.actual_bedtime_weekend)}
              </dd>
            </div>
          )}
        </dl>

        {gaps.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
            <p className="text-xs font-medium mb-2">
              Incomplete: {gaps.length} of 10 sections
            </p>
            <ul className="space-y-1.5">
              {gaps.map((g) => (
                <li key={g.key} className="text-xs">
                  <Badge variant="outline" className="mr-1.5 text-[10px]">
                    {g.label}
                  </Badge>
                  <span className="text-muted-foreground">{g.why}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
