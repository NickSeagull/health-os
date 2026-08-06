import { NextResponse } from "next/server";
import { listProfiles, setActiveProfile, ProfileError } from "@/lib/data/paths";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ profiles: listProfiles() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Не удалось прочитать профили" },
      { status: 500 }
    );
  }
}

/**
 * Переключение активного профиля.
 *
 * Указатель один на всю систему — тот же файл читает Claude Code. Так дашборд
 * и ассистент не могут разойтись и показывать данные разных людей.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ожидается JSON" }, { status: 400 });
  }

  const id = (body as { id?: unknown } | null)?.id;
  if (typeof id !== "string") {
    return NextResponse.json({ error: "Не передан id профиля" }, { status: 400 });
  }

  try {
    setActiveProfile(id);
    return NextResponse.json({ ok: true, active: id });
  } catch (e) {
    if (e instanceof ProfileError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Не удалось переключить профиль" }, { status: 500 });
  }
}
