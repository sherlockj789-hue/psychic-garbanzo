import { NextRequest, NextResponse } from "next/server";
import { generateShift } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const career = req.nextUrl.searchParams.get("career") ?? "";
  if (!career) {
    return NextResponse.json({ error: "Missing career" }, { status: 400 });
  }
  try {
    const data = await generateShift(career);
    if (!data) {
      return NextResponse.json({ error: "Career not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to generate shift" },
      { status: 500 },
    );
  }
}
