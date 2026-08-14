import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { upsertMeetingLink, deleteMeetingLink } from "@/lib/services/slotService";
import { upsertMeetingLinkSchema } from "@/lib/schemas/slotSchema";
import { EventType } from "@prisma/client";

export async function PUT(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = session?.user?.role as string;
  if (!session?.user || (role !== "leader" && role !== "superadmin")) {
    return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });
  }

  const body = await req.json();
  const validation = upsertMeetingLinkSchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json({ success: false, error: validation.error.format() }, { status: 400 });
  }

  try {
    const link = await upsertMeetingLink(validation.data.type, validation.data.date, validation.data.url, validation.data.label, session.user.id);
    return NextResponse.json({ success: true, data: link });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = session?.user?.role as string;
  if (!session?.user || (role !== "leader" && role !== "superadmin")) {
    return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as EventType;
  const date = searchParams.get("date");

  if (!type || !date) {
    return NextResponse.json({ success: false, error: "Missing type or date" }, { status: 400 });
  }

  try {
    await deleteMeetingLink(type, date);
    return NextResponse.json({ success: true, data: { success: true } });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
