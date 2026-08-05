import { NextResponse } from "next/server";
import { listUniqueMarkers } from "@/lib/data/labs";

export async function GET() {
  const markers = await listUniqueMarkers();
  return NextResponse.json(markers);
}
