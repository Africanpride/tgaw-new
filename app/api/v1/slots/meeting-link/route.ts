import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { upsertMeetingLink, deleteMeetingLink } from "@/lib/services/slotService";
import { extractNextRequestContext, logAudit } from "@/lib/services/auditService";
import { upsertMeetingLinkSchema } from "@/lib/schemas/slotSchema";
import { EventType } from "@prisma/client";

export async function PUT(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = session?.user?.role as string;
  if (!session?.user || !["leader", "superadmin", "coordinator"].includes(role)) {
    return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });
  }

  const body = await req.json();
  const validation = upsertMeetingLinkSchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json({ success: false, error: validation.error.format() }, { status: 400 });
  }

  try {
    const link = await upsertMeetingLink(validation.data.type, validation.data.date, validation.data.url, validation.data.label, session.user.id);
    const { ip, userAgent } = extractNextRequestContext(req as unknown as { headers: { get(k: string): string | null } });
    await logAudit({ actorId: session.user.id, actorRole: role, action: "MEETING_LINK_UPSERT", targetType: "MeetingLink", targetId: `${validation.data.type}:${validation.data.date}`, metadata: { type: validation.data.type, date: validation.data.date, url: validation.data.url, label: validation.data.label ?? null }, ip, userAgent });
    return NextResponse.json({ success: true, data: link });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = session?.user?.role as string;
  if (!session?.user || !["leader", "superadmin", "coordinator"].includes(role)) {
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
    const { ip, userAgent } = extractNextRequestContext(req as unknown as { headers: { get(k: string): string | null } });
    await logAudit({ actorId: (await auth.api.getSession({ headers: await headers() }))?.user?.id ?? "unknown", actorRole: role, action: "MEETING_LINK_DELETE", targetType: "MeetingLink", targetId: `${type}:${date}`, metadata: { type, date }, ip, userAgent });
    return NextResponse.json({ success: true, data: { success: true } });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
