"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  TestTubes,
  Activity,
  Calendar,
  Pill,
  Smile,
  Brain,
  Target,
  CheckSquare,
  Heart,
  User,
  Search,
} from "lucide-react";
import type { VisitIndex } from "@/lib/types/visit";
import type { LabIndex } from "@/lib/types/lab";
import type { MedsFile } from "@/lib/types/medication";

const pages = [
  { name: "Обзор", href: "/", icon: LayoutDashboard },
  { name: "Анализы", href: "/labs", icon: TestTubes },
  { name: "Тело", href: "/body", icon: Activity },
  { name: "Визиты", href: "/visits", icon: Calendar },
  { name: "Лекарства", href: "/meds", icon: Pill },
  { name: "Зубы", href: "/dental", icon: Smile },
  { name: "Ментальное", href: "/mental", icon: Brain },
  { name: "Цели", href: "/goals", icon: Target },
  { name: "Задачи", href: "/tasks", icon: CheckSquare },
  { name: "WHOOP", href: "/whoop", icon: Heart },
  { name: "Профиль", href: "/profile", icon: User },
];

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [visits, setVisits] = useState<VisitIndex | null>(null);
  const [labs, setLabs] = useState<LabIndex | null>(null);
  const [markers, setMarkers] = useState<string[]>([]);
  const [meds, setMeds] = useState<MedsFile | null>(null);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    // Load search data lazily
    if (!visits) fetch("/api/visits").then((r) => r.json()).then(setVisits).catch(() => {});
    if (!labs) fetch("/api/labs").then((r) => r.json()).then(setLabs).catch(() => {});
    if (!markers.length) fetch("/api/labs/markers/list").then((r) => r.json()).then(setMarkers).catch(() => {});
    if (!meds) fetch("/api/meds").then((r) => r.json()).then(setMeds).catch(() => {});
  }, [open, visits, labs, markers.length, meds]);

  const go = useCallback(
    (href: string) => {
      router.push(href);
      setOpen(false);
    },
    [router]
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Поиск</span>
        <kbd className="hidden sm:inline pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Поиск страниц, визитов, анализов, лекарств..." />
        <CommandList>
          <CommandEmpty>Ничего не найдено</CommandEmpty>

          <CommandGroup heading="Страницы">
            {pages.map((p) => (
              <CommandItem key={p.href} onSelect={() => go(p.href)}>
                <p.icon className="mr-2 h-4 w-4" />
                {p.name}
              </CommandItem>
            ))}
          </CommandGroup>

          {markers.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Маркеры анализов">
                {markers.slice(0, 20).map((m) => (
                  <CommandItem key={m} onSelect={() => go("/labs")}>
                    <TestTubes className="mr-2 h-4 w-4" />
                    {m}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {visits?.visits && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Визиты">
                {visits.visits.slice(-15).reverse().map((v) => (
                  <CommandItem key={v.file} onSelect={() => go("/visits")}>
                    <Calendar className="mr-2 h-4 w-4" />
                    {v.date} — {v.brief || v.specialty}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {meds && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Лекарства">
                {[...meds.medications, ...meds.supplements].map((m) => (
                  <CommandItem key={m.id} onSelect={() => go("/meds")}>
                    <Pill className="mr-2 h-4 w-4" />
                    {m.name} — {m.dosage}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
