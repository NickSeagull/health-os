import { NextResponse } from "next/server";
import { readEnvironment } from "@/lib/data/environment";

export async function GET() {
  const environment = await readEnvironment();
  if (!environment) {
    return NextResponse.json({ error: "Environment not found" }, { status: 404 });
  }
  return NextResponse.json(environment);
}
