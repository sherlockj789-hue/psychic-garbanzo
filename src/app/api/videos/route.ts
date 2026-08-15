import { NextRequest, NextResponse } from "next/server";
import { findVideos } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const career = req.nextUrl.searchParams.get("career") ?? "";
  const topic = req.nextUrl.searchParams.get("topic") ?? undefined;

  if (!career) {
    return NextResponse.json({ error: "Missing career" }, { status: 400 });
  }

  try {
    const data = await findVideos(career, topic);
    return NextResponse.json({ videos: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to find videos" },
      { status: 500 },
    );
  }
}
