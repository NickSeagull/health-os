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
 * В профиле поля вида `cigarettes` и `tracking` лежат булевыми, а React не печатает
 * boolean: на экране было «Сигареты: » с пустотой и «дефицит (сушка) · true».
 */
function renderValue(value: unknown, whenTrue = "да", whenFalse = "нет"): string {
  if (value === true) return whenTrue;
  if (value === false) return whenFalse;
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.join("; ");
  return String(value);
}

/** Заполнен ли блок хоть одним значением, кроме пояснительных notes */
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

  // Четыре блока добавлены после онбординга и пока пусты. Карточка показывала
  // шесть заполненных полей и выглядела полной — пользователь не узнавал,
  // что клинически значимые данные не собраны
  const gaps: { key: string; label: string; why?: string }[] = [
    {
      key: "caffeine",
      label: "Кофеин",
      why: l.caffeine?.notes,
    },
    {
      key: "hydration",
      label: "Гидратация",
      why: l.hydration?.notes,
    },
    {
      key: "screen_and_light",
      label: "Экраны и свет",
      why: l.screen_and_light?.notes,
    },
    {
      key: "sleep_regularity",
      label: "Регулярность сна",
      why: l.sleep_regularity?.variability_notes,
    },
  ].filter(({ key }) => {
    const block = l[key as keyof typeof l];
    return isBlockEmpty(typeof block === "object" ? block : undefined);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Образ жизни</CardTitle>
        <CardDescription>Активность, сон, питание, стимуляторы</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Тренировки</dt>
            <dd>
              {l.exercise.type} · {l.exercise.frequency}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Сон</dt>
            <dd>
              {l.sleep.target_bedtime}–{l.sleep.target_wakeup} ·{" "}
              {renderValue(l.sleep.duration_hours)} ч
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Питание</dt>
            <dd>
              {l.nutrition.current_phase}
              {` · подсчёт калорий: ${renderValue(l.nutrition.tracking, "ведётся", "не ведётся")}`}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Курение</dt>
            <dd>
              Сигареты: {renderValue(l.smoking.cigarettes, "да", "нет")} · Кальян:{" "}
              {renderValue(l.smoking.hookah, "да", "нет")}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Алкоголь</dt>
            <dd>{renderValue(l.alcohol)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Работа</dt>
            <dd>{renderValue(l.work)}</dd>
          </div>

          {l.caffeine && !isBlockEmpty(l.caffeine) && (
            <div>
              <dt className="text-muted-foreground">Кофеин</dt>
              <dd>
                {[
                  l.caffeine.coffee_cups_per_day != null &&
                    `кофе ${l.caffeine.coffee_cups_per_day} чашек/день`,
                  l.caffeine.tea && `чай: ${l.caffeine.tea}`,
                  l.caffeine.energy_drinks && `энергетики: ${l.caffeine.energy_drinks}`,
                  l.caffeine.last_intake_time &&
                    `последний приём ${l.caffeine.last_intake_time}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </dd>
            </div>
          )}
          {l.hydration && !isBlockEmpty(l.hydration) && (
            <div>
              <dt className="text-muted-foreground">Гидратация</dt>
              <dd>{l.hydration.water_liters_per_day} л/день</dd>
            </div>
          )}
          {l.screen_and_light && !isBlockEmpty(l.screen_and_light) && (
            <div>
              <dt className="text-muted-foreground">Экраны и свет</dt>
              <dd>
                {[
                  l.screen_and_light.screen_hours_per_day != null &&
                    `${l.screen_and_light.screen_hours_per_day} ч экрана/день`,
                  l.screen_and_light.evening_screen_cutoff &&
                    `отбой экранов ${l.screen_and_light.evening_screen_cutoff}`,
                  l.screen_and_light.morning_daylight_minutes != null &&
                    `утренний свет ${l.screen_and_light.morning_daylight_minutes} мин`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </dd>
            </div>
          )}
          {l.sleep_regularity && !isBlockEmpty(l.sleep_regularity) && (
            <div>
              <dt className="text-muted-foreground">Регулярность сна</dt>
              <dd>
                будни {renderValue(l.sleep_regularity.actual_bedtime_weekday)} · выходные{" "}
                {renderValue(l.sleep_regularity.actual_bedtime_weekend)}
              </dd>
            </div>
          )}
        </dl>

        {gaps.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
            <p className="text-xs font-medium mb-2">
              Не заполнено: {gaps.length} из 10 блоков
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
