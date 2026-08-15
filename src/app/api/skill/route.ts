import { NextRequest, NextResponse } from "next/server";
import { generateSkill } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug") ?? "";
  const title = req.nextUrl.searchParams.get("title") ?? slug;

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  try {
    const data = await generateSkill(slug, title);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to generate skill lesson" },
      { status: 500 },
    );
  }
}
