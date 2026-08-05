import { NextResponse } from "next/server";
import { listInBodyFiles } from "@/lib/data/labs";

export async function GET() {
  const data = await listInBodyFiles();
  return NextResponse.json(data);
}
