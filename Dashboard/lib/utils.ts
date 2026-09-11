import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, differenceInYears, parseISO } from "date-fns";
import { enUS } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, fmt: string = "d MMM yyyy"): string {
  if (typeof date === "string") {
    const parsed = parseISO(date);
    if (isNaN(parsed.getTime())) return date;
    return format(parsed, fmt, { locale: enUS });
  }
  return format(date, fmt, { locale: enUS });
}

export function formatDateShort(date: string | Date): string {
  if (typeof date === "string") {
    const parsed = parseISO(date);
    if (isNaN(parsed.getTime())) return date;
  }
  return formatDate(date, "dd.MM.yyyy");
}

export function calcAge(dateOfBirth: string): number {
  return differenceInYears(new Date(), parseISO(dateOfBirth));
}

export function formatRub(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function statusColor(status: string): string {
  switch (status) {
    case "active":
    case "in_progress":
    case "completed":
    case "normal":
      return "text-emerald-500";
    case "investigating":
    case "borderline":
      return "text-amber-500";
    case "high":
    case "critical":
    case "needs_treatment":
      return "text-red-500";
    case "low":
    case "monitoring":
      return "text-blue-500";
    default:
      return "text-muted-foreground";
  }
}
