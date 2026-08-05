import { NextRequest, NextResponse } from "next/server";
import { aggregateMarker } from "@/lib/data/labs";

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name");
  if (!name) {
    return NextResponse.json(
      { error: "Missing 'name' parameter" },
      { status: 400 }
    );
  }
  const points = await aggregateMarker(name);
  return NextResponse.json(points);
}
