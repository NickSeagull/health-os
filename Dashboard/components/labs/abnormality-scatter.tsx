"use client";

import { useEffect, useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateShort } from "@/lib/utils";
import { collectMarkers } from "@/lib/lab-markers";
import type { LabIndex, LabFileData } from "@/lib/types/lab";

interface AbnormalPoint {
  dateNum: number;
  dateStr: string;
  marker: string;
  value: number;
  unit: string;
  status: string;
  markerIdx: number;
}

export function AbnormalityScatter() {
  const [points, setPoints] = useState<AbnormalPoint[]>([]);
  const [markerNames, setMarkerNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const idxRes = await fetch("/api/labs");
        const idx: LabIndex = await idxRes.json();

        // Read each file once. The previous code traversed the entire index
        // first for names and then for points, making 120 requests instead of 60.
        const raw: Omit<AbnormalPoint, "markerIdx">[] = [];
        const names = new Set<string>();

        for (const entry of idx.analyses) {
          if (entry.type === "body_composition") continue;
          try {
            const res = await fetch(`/api/labs/${encodeURIComponent(entry.file)}`);
            const lab: LabFileData = await res.json();

            // Collect markers from markers[], panels[], and studies[]. Reading
            // only lab.markers hid all abnormalities from 2026.
            for (const m of collectMarkers(lab)) {
              if (m.status === "normal" || typeof m.value !== "number") continue;
              names.add(m.name);
              raw.push({
                dateNum: new Date(lab.date).getTime(),
                dateStr: lab.date,
                marker: m.name,
                value: m.value,
                unit: m.unit,
                status: m.status,
              });
            }
          } catch {
            // skip
          }
        }

        const nameList = Array.from(names).sort();
        setMarkerNames(nameList);
        setPoints(
          raw.map((p) => ({ ...p, markerIdx: nameList.indexOf(p.marker) }))
        );
      } catch {
        // skip
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Abnormalities</CardTitle>
        <CardDescription>
          All out-of-range results on one chart
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : points.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            No abnormalities
          </p>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ left: 10, right: 10, bottom: 10 }}>
                <XAxis
                  dataKey="dateNum"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={(v) => formatDateShort(new Date(v))}
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  dataKey="markerIdx"
                  type="number"
                  domain={[-1, markerNames.length]}
                  tickFormatter={(v) => markerNames[v] ?? ""}
                  tick={{ fontSize: 9 }}
                  width={100}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload as AbnormalPoint;
                    return (
                      <div className="rounded-lg border bg-popover p-2 text-xs shadow-md">
                        <p className="font-medium">{d.marker}</p>
                        <p>
                          {d.value} {d.unit} ({d.status})
                        </p>
                        <p className="text-muted-foreground">
                          {formatDateShort(d.dateStr)}
                        </p>
                      </div>
                    );
                  }}
                />
                <Scatter data={points} shape="circle">
                  {points.map((p, i) => (
                    <Cell
                      key={i}
                      fill={
                        p.status === "critical"
                          ? "#dc2626"
                          : p.status === "high"
                            ? "#ef4444"
                            : p.status === "low"
                              ? "#f97316"
                              : "#eab308"
                      }
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
