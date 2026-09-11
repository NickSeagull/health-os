import type { LabFileData, LabMarker } from "@/lib/types/lab";

/**
 * Collect markers from all three schema generations.
 *
 * This module intentionally has no `fs` or other server dependencies: client
 * components also parse the same data (`/api/labs/[file]` returns the file as-is),
 * while importing `lib/data/labs.ts` on the client would pull in Node modules and
 * break the build.
 *
 * Data/labs/ contains markers[] (v1), panels[].markers[] (v2), and
 * studies[].markers[] (v3). Reading only the root markers[] hides 28% of the
 * dataset, including the entire 2026 batch.
 */
export function collectMarkers(lab: LabFileData | null | undefined): LabMarker[] {
  if (!lab) return [];
  const out: LabMarker[] = [];
  if (Array.isArray(lab.markers)) out.push(...lab.markers);
  for (const panel of lab.panels ?? []) {
    if (Array.isArray(panel.markers)) out.push(...panel.markers);
  }
  for (const study of lab.studies ?? []) {
    if (Array.isArray(study.markers)) out.push(...study.markers);
  }
  return out;
}
