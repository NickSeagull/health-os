"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, Check, Baby, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { toast } from "sonner";

type ProfileInfo = {
  id: string;
  displayName: string;
  relationship: string | null;
  dateOfBirth: string | null;
  sex: string | null;
  isActive: boolean;
};

const RELATIONSHIP: Record<string, string> = {
  self: "Self",
  spouse: "Spouse",
  child: "Child",
  parent: "Parent",
  other: "Other",
};

/** Full years as of today. Age is not stored; it changes over time. */
function ageYears(dob: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

function describe(p: ProfileInfo): string {
  const parts: string[] = [];
  if (p.relationship && RELATIONSHIP[p.relationship]) parts.push(RELATIONSHIP[p.relationship]);
  const age = ageYears(p.dateOfBirth);
  if (age !== null) parts.push(`${age} ${plural(age)}`);
  return parts.join(" · ");
}

function plural(n: number): string {
  return n === 1 ? "year" : "years";
}

/**
 * Profile switcher.
 *
 * Always visible in the header: using the wrong profile is the most costly
 * error in this subsystem, and it happens when the current person is not shown.
 */
export function ProfileSwitcher() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<ProfileInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    fetch("/api/profiles")
      .then((r) => r.json())
      .then((d) => (d.error ? setError(d.error) : setProfiles(d.profiles ?? [])))
      .catch(() => setError("Profiles unavailable"));
  }, []);

  async function switchTo(id: string) {
    setSwitching(true);
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not switch profile");
        return;
      }
      setProfiles((prev) =>
        prev ? prev.map((p) => ({ ...p, isActive: p.id === id })) : prev
      );
      const name = profiles?.find((p) => p.id === id)?.displayName ?? id;
      toast.success(`Active profile: ${name}`);
      router.refresh();
    } finally {
      setSwitching(false);
    }
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/40 px-3 py-2 text-xs text-destructive">
        {error}
      </div>
    );
  }

  const active = profiles?.find((p) => p.isActive) ?? null;
  const isChild = (ageYears(active?.dateOfBirth ?? null) ?? 99) < 18;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          disabled={switching}
          className="data-[state=open]:bg-sidebar-accent"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            {isChild ? <Baby className="h-4 w-4" /> : <User className="h-4 w-4" />}
          </div>
          <div className="grid flex-1 text-left leading-tight">
            <span className="truncate text-sm font-medium">
              {active?.displayName ?? (profiles ? "No profile selected" : "…")}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {active ? describe(active) : ""}
            </span>
          </div>
          <ChevronsUpDown className="ml-auto h-4 w-4 opacity-50" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Active profile
        </DropdownMenuLabel>
        {(profiles ?? []).map((p) => {
          const age = ageYears(p.dateOfBirth);
          return (
            <DropdownMenuItem
              key={p.id}
              onSelect={() => !p.isActive && switchTo(p.id)}
              className="gap-2"
            >
              {age !== null && age < 18 ? (
                <Baby className="h-4 w-4 shrink-0 opacity-60" />
              ) : (
                <User className="h-4 w-4 shrink-0 opacity-60" />
              )}
              <div className="grid flex-1 leading-tight">
                <span className="truncate text-sm">{p.displayName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {describe(p)}
                </span>
              </div>
              {p.isActive && <Check className="h-4 w-4 shrink-0" />}
            </DropdownMenuItem>
          );
        })}
        {profiles?.length === 0 && (
          <div className="px-2 py-3 text-xs text-muted-foreground">
            No profiles. Run <code>./setup.sh</code>
          </div>
        )}
        <DropdownMenuLabel className="border-t pt-2 text-xs font-normal text-muted-foreground">
          Add a family member with the <code>/profiles</code> command in Claude Code
        </DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
