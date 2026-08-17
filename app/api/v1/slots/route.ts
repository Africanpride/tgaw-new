import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSlotsForDate, getDefaultMeetingLinks } from "@/lib/services/slotService";
import { EventType } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const type = searchParams.get("type") as EventType | null;

  if (!date || (date !== "DEFAULT" && !/^\d{4}-\d{2}-\d{2}$/.test(date))) {
    return NextResponse.json({ success: false, error: "Valid date (YYYY-MM-DD or DEFAULT) is required" }, { status: 400 });
  }

  // For DEFAULT we only need meeting links, not slot generation
  if (date === "DEFAULT") {
    try {
      const meetingLinksMap = await getDefaultMeetingLinks();
      return NextResponse.json({ success: true, data: { slots: [], meetingLinks: meetingLinksMap, userBookingCounts: { BIBLE: 0, PRAYER: 0, PRAISE_WORSHIP: 0 } } });
    } catch (error: unknown) {
      return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
  }

  try {
    const data = await getSlotsForDate(date, type || undefined, session.user.id, session.user.role as string);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
