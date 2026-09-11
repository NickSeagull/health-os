import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { HealthDisclaimer } from "@/components/layout/health-disclaimer";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "sonner";
import { CommandSearch } from "@/components/layout/command-search";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Health OS",
  description: "Personal Health Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <span className="text-sm font-medium text-muted-foreground flex-1">
                  Health OS
                </span>
                <CommandSearch />
              </header>
              <HealthDisclaimer />
              <main className="flex-1 overflow-auto p-4 md:p-6">
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
