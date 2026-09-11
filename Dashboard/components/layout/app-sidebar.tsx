"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  TrendingUp,
  Network,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "./theme-toggle";
import { ProfileSwitcher } from "./profile-switcher";

const navItems = [
  { title: "Overview", href: "/", icon: LayoutDashboard },
  { title: "Labs", href: "/labs", icon: TestTubes },
  { title: "Body", href: "/body", icon: Activity },
  { title: "Visits", href: "/visits", icon: Calendar },
  { title: "Medications", href: "/meds", icon: Pill },
  { title: "Dental", href: "/dental", icon: Smile },
  { title: "Mental health", href: "/mental", icon: Brain },
  { title: "Goals", href: "/goals", icon: Target },
  { title: "Tasks", href: "/tasks", icon: CheckSquare },
  { title: "Traction", href: "/traction", icon: TrendingUp },
  { title: "Relationship graph", href: "/wiki", icon: Network },
  { title: "WHOOP", href: "/whoop", icon: Heart },
  { title: "Profile", href: "/profile", icon: User },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="gap-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            H
          </div>
          <span className="font-semibold tracking-tight">Health OS</span>
        </Link>
        <ProfileSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="gap-3 px-4 py-3">
        <ThemeToggle />
      </SidebarFooter>
    </Sidebar>
  );
}
