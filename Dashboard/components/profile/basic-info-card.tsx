"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHealthData } from "@/lib/hooks/use-health-data";
import { calcAge, formatDate } from "@/lib/utils";
import type { ProfileData } from "@/lib/types/profile";

export function BasicInfoCard() {
  const { data: profile, isLoading } = useHealthData<ProfileData>("profile");

  if (isLoading) return <Card><CardContent className="pt-6"><Skeleton className="h-40" /></CardContent></Card>;
  if (!profile) return null;

  const b = profile.basic;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Основные данные</CardTitle>
        <CardDescription>PHR — Personal Health Record</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-2 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Имя</dt>
            <dd className="font-medium">{b.full_name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Дата рождения</dt>
            <dd className="font-medium">{formatDate(b.date_of_birth)} ({calcAge(b.date_of_birth)} лет)</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Группа крови</dt>
            <dd className="font-medium">{b.blood_type}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Рост</dt>
            <dd className="font-medium">{b.height_cm} см</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Место рождения</dt>
            <dd className="font-medium">{b.birth_place}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Экстренный контакт</dt>
            <dd className="font-medium">{b.emergency_contact.name} ({b.emergency_contact.relation})</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
