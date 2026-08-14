import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSlotsForDate } from "@/lib/services/slotService";
import { EventType } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const type = searchParams.get("type") as EventType | null;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ success: false, error: "Valid date (YYYY-MM-DD) is required" }, { status: 400 });
  }

  try {
    const data = await getSlotsForDate(date, type || undefined, session.user.id, session.user.role as string);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
