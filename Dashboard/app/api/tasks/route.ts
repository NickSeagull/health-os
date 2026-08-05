import { NextResponse } from "next/server";
import { getProjectTasks, getProjectSections } from "@/lib/data/todoist";

export async function GET() {
  try {
    const [tasks, sections] = await Promise.all([
      getProjectTasks(),
      getProjectSections(),
    ]);
    return NextResponse.json({ tasks, sections });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Todoist API error" },
      { status: 502 }
    );
  }
}
