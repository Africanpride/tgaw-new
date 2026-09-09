import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { bookSlots } from "@/lib/services/slotService";
import { bookSlotsSchema } from "@/lib/schemas/slotSchema";
import { extractNextRequestContext, logAudit } from "@/lib/services/auditService";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });
  }

  const body = await req.json();
  const validation = bookSlotsSchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json({ success: false, error: validation.error.format() }, { status: 400 });
  }

  try {
    const bookedSlots = await bookSlots(validation.data.slotIds, session.user.id, validation.data.notes);
    const { ip, userAgent } = extractNextRequestContext(req as unknown as { headers: { get(k: string): string | null } });
    // fire-and-forget — do not block booking response (7d TTL keeps DB bounded)
    void logAudit({
      actorId: session.user.id,
      actorRole: (session.user as { role?: string })?.role ?? null,
      action: "SLOT_BOOK",
      targetType: "Slot",
      targetId: validation.data.slotIds.join(","),
      metadata: { slotIds: validation.data.slotIds, count: bookedSlots.length, notes: validation.data.notes ?? null, slots: bookedSlots.map((s) => ({ id: s.id, type: s.type, date: s.date, startTime: s.startTime })) },
      ip,
      userAgent,
    }).catch(() => {});
    return NextResponse.json({ success: true, data: bookedSlots });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
