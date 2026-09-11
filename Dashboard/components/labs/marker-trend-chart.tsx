"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useHealthData } from "@/lib/hooks/use-health-data";
import { formatDateShort } from "@/lib/utils";
import type { MarkerTrendPoint } from "@/lib/types/lab";

export function MarkerTrendChart() {
  const [selectedMarker, setSelectedMarker] = useState<string>("");
  const { data: markerList } = useHealthData<string[]>("labs/markers/list");
  const { data: points, isLoading } = useHealthData<MarkerTrendPoint[]>(
    selectedMarker ? `labs/markers?name=${encodeURIComponent(selectedMarker)}` : null,
    { refreshInterval: 0 }
  );

  useEffect(() => {
    if (markerList?.length && !selectedMarker) {
      setSelectedMarker(markerList[0]);
    }
  }, [markerList, selectedMarker]);

  const refMin = points?.[0]?.reference_min;
  const refMax = points?.[0]?.reference_max;
  const unit = points?.[0]?.unit ?? "";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Marker trend</CardTitle>
            <CardDescription>Values over time</CardDescription>
          </div>
          <Select value={selectedMarker} onValueChange={setSelectedMarker}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a marker" />
            </SelectTrigger>
            <SelectContent>
              {markerList?.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading || !points ? (
          <Skeleton className="h-[300px] w-full" />
        ) : points.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            No data for this marker
          </p>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateShort}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  label={{
                    value: unit,
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 11 },
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload as MarkerTrendPoint;
                    return (
                      <div className="rounded-lg border bg-popover p-3 text-sm shadow-md">
                        <p className="font-medium">{formatDateShort(d.date)}</p>
                        <p>
                          {d.value} {d.unit}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Reference: {d.reference_min}–{d.reference_max}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {d.lab}
                        </p>
                      </div>
                    );
                  }}
                />
                {refMin != null && refMax != null && (
                  <ReferenceArea
                    y1={refMin}
                    y2={refMax}
                    fill="hsl(142.1 76.2% 36.3%)"
                    fillOpacity={0.08}
                    strokeOpacity={0}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={(props: Record<string, unknown>) => {
                    const { cx, cy, payload } = props as {
                      cx: number;
                      cy: number;
                      payload: MarkerTrendPoint;
                    };
                    const color =
                      payload.status === "normal"
                        ? "#22c55e"
                        : payload.status === "critical"
                          ? "#dc2626"
                          : "#ef4444";
                    return (
                      <circle
                        key={`${payload.date}`}
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill={color}
                        stroke="white"
                        strokeWidth={2}
                      />
                    );
                  }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
