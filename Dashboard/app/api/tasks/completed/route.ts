import { NextResponse } from "next/server";
import { getCompletedTasks } from "@/lib/data/todoist";

export async function GET() {
  try {
    const data = await getCompletedTasks();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Todoist API error" },
      { status: 502 }
    );
  }
}
