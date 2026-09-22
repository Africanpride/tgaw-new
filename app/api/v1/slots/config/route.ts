import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getBookingConfig, updateBookingConfig } from "@/lib/services/slotService";
import { extractNextRequestContext, logAudit } from "@/lib/services/auditService";
import { updateBookingConfigSchema } from "@/lib/schemas/slotSchema";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = session?.user?.role as string;
  if (!session?.user || !["leader", "superadmin", "coordinator"].includes(role)) {
    return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });
  }

  try {
    const config = await getBookingConfig();
    return NextResponse.json({ success: true, data: config });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = session?.user?.role as string;
  if (!session?.user || !["leader", "superadmin", "coordinator"].includes(role)) {
    return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });
  }

  const body = await req.json();
  const validation = updateBookingConfigSchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json({ success: false, error: validation.error.format() }, { status: 400 });
  }

  try {
    const before = await getBookingConfig();
    const config = await updateBookingConfig(session.user.id, validation.data);
    const { ip, userAgent } = extractNextRequestContext(req as unknown as { headers: { get(k: string): string | null } });
    await logAudit({ actorId: session.user.id, actorRole: role, action: "BOOKING_CONFIG_CHANGE", targetType: "BookingConfig", targetId: config.id, metadata: { before: { maxBibleSlotsPerDay: before.maxBibleSlotsPerDay, maxPrayerSlotsPerDay: before.maxPrayerSlotsPerDay, maxWorshipSlotsPerDay: before.maxWorshipSlotsPerDay, visibilityMode: before.visibilityMode, liveGridUpcoming: (before as any).liveGridUpcoming }, after: validation.data }, ip, userAgent });
    return NextResponse.json({ success: true, data: config });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
