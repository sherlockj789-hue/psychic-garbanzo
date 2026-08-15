import { NextRequest, NextResponse } from "next/server";
import { generateLesson } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const career = req.nextUrl.searchParams.get("career") ?? "";
  const grade = Number(req.nextUrl.searchParams.get("grade") ?? 0);
  const lesson = Number(req.nextUrl.searchParams.get("lesson") ?? 0);

  if (!career || !grade || !lesson) {
    return NextResponse.json({ error: "Missing career, grade, or lesson" }, { status: 400 });
  }
  if (grade < 1 || grade > 12 || lesson < 1 || lesson > 10) {
    return NextResponse.json({ error: "Invalid grade or lesson" }, { status: 400 });
  }

  try {
    const data = await generateLesson(career, grade, lesson);
    if (!data) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to generate lesson" },
      { status: 500 },
    );
  }
}
