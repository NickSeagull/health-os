import { NextRequest, NextResponse } from "next/server";
import { getHistoryDays } from "@/lib/data/whoop";

export async function GET(request: NextRequest) {
  const days = parseInt(request.nextUrl.searchParams.get("days") ?? "30", 10);
  try {
    const data = await getHistoryDays(Math.min(days, 90));
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "WHOOP API error" },
      { status: 502 }
    );
  }
}
