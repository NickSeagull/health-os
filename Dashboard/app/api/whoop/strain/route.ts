import { NextRequest, NextResponse } from "next/server";
import { getStrainDeepDive } from "@/lib/data/whoop";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? undefined;
  try {
    const data = await getStrainDeepDive(date);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "WHOOP API error" },
      { status: 502 }
    );
  }
}
