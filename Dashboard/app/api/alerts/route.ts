import { NextResponse } from "next/server";
import { readAlerts } from "@/lib/data/alerts";

export async function GET() {
  const alerts = await readAlerts();
  return NextResponse.json(alerts);
}
