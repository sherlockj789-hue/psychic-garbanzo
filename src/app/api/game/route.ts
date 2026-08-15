import { NextRequest, NextResponse } from "next/server";
import { generateQuiz, generateScenario, generateSequence, generateArcade, generateMemory } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") ?? "quiz";
  const career = req.nextUrl.searchParams.get("career") ?? "";
  const topic = req.nextUrl.searchParams.get("topic") ?? "";

  if (!topic) {
    return NextResponse.json({ error: "Missing topic" }, { status: 400 });
  }

  try {
    if (type === "scenario") {
      return NextResponse.json(await generateScenario(career, topic));
    }
    if (type === "sequence") {
      return NextResponse.json(await generateSequence(career, topic));
    }
    if (type === "arcade") {
      return NextResponse.json(await generateArcade(career, topic));
    }
    if (type === "memory") {
      return NextResponse.json(await generateMemory(career, topic));
    }
    return NextResponse.json(await generateQuiz(career, topic));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to generate game" },
      { status: 500 },
    );
  }
}
