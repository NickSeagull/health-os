import { NextResponse } from "next/server";
import { readTractionReviews } from "@/lib/data/traction";

export async function GET() {
  const reviews = await readTractionReviews();
  return NextResponse.json(reviews);
}
