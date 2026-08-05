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
  // Роут отдаёт объект ошибки, если файла нет — по version отличаем данные от него
  if (!env || typeof env.version !== "number") return null;

  const loc = env.location;
  const care = env.healthcare_access;
  const work = env.work;
  const anchors = env.stress_context?.chronology_anchors ?? [];
  const gaps = env._needs_input ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Внешний контекст</CardTitle>
        <CardDescription>
          Локация, климат, работа, хронология
          {env.updated && ` · обновлено ${formatDate(env.updated)}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-3 text-sm">
          {loc && (
            <div>
              <dt className="text-muted-foreground">Локация</dt>
              <dd>
                {[loc.city, loc.district, loc.street].filter(Boolean).join(", ")}
                {loc.latitude != null && ` · ${loc.latitude}°N`}
              </dd>
            </div>
          )}
          {care && (
            <div>
              <dt className="text-muted-foreground">Доступ к медпомощи</dt>
              <dd>
                {care.insurance}
                {care.dms === false && " · ДМС нет"}
                {care.travel_readiness && ` · ${care.travel_readiness}`}
              </dd>
            </div>
          )}
          {work && (
            <div>
              <dt className="text-muted-foreground">Работа</dt>
              <dd>
                {[work.field, work.posture].filter(Boolean).join(" · ")}
                {work.screen_hours_per_day != null &&
                  ` · ${work.screen_hours_per_day} ч экрана`}
              </dd>
            </div>
          )}
          {env.climate?.type && (
            <div>
              <dt className="text-muted-foreground">Климат</dt>
              <dd>{env.climate.type}</dd>
            </div>
          )}
        </dl>

        {/* Выводы из климата и широты — то, ради чего файл и заведён:
            сезонный дефицит витамина D, амплитуда светового дня, сухость зимой */}
        {!!env.climate?.derived_facts?.length && (
          <div>
            <p className="text-xs font-medium mb-1.5">Следствия среды</p>
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
            <p className="text-xs font-medium mb-1.5">Следствия работы</p>
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
            <p className="text-xs font-medium mb-1.5">Якоря хронологии</p>
            <ul className="space-y-1.5 text-xs">
              {anchors
                .slice()
                .sort((a, b) => b.year - a.year)
                .map((a, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="shrink-0 font-medium tabular-nums">
                      {a.year}
                      {a.age != null && ` (${a.age} л.)`}
                    </span>
                    <span className="text-muted-foreground">
                      {a.event}
                      {a.needs_clarification && (
                        <Badge variant="outline" className="ml-1.5 text-[10px]">
                          уточнить
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
              Не заполнено: {gaps.length} блоков
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
