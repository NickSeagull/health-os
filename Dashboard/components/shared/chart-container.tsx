"use client";

import { ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ChartContainerProps {
  children: React.ReactElement;
  height?: number;
  loading?: boolean;
  className?: string;
}

export function ChartContainer({
  children,
  height = 300,
  loading,
  className,
}: ChartContainerProps) {
  if (loading) {
    return <Skeleton className={cn("w-full", className)} style={{ height }} />;
  }

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}
