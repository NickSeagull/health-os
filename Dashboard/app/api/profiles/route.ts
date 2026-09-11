import { NextResponse } from "next/server";
import { listProfiles, setActiveProfile, ProfileError } from "@/lib/data/paths";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ profiles: listProfiles() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not read profiles" },
      { status: 500 }
    );
  }
}

/**
 * Switch the active profile.
 *
 * There is one pointer for the whole system; Claude Code reads the same file.
 * This keeps the dashboard and assistant from diverging and showing different people's data.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON" }, { status: 400 });
  }

  const id = (body as { id?: unknown } | null)?.id;
  if (typeof id !== "string") {
    return NextResponse.json({ error: "Profile id is required" }, { status: 400 });
  }

  try {
    setActiveProfile(id);
    return NextResponse.json({ ok: true, active: id });
  } catch (e) {
    if (e instanceof ProfileError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not switch profile" }, { status: 500 });
  }
}
