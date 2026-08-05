import { NextResponse } from "next/server";
import { readToothMap, readDentalProcedures } from "@/lib/data/dental";

export async function GET() {
  const [toothMap, procedures] = await Promise.all([
    readToothMap(),
    readDentalProcedures(),
  ]);
  return NextResponse.json({ toothMap, procedures });
}
