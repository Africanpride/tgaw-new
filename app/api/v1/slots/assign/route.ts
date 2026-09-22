import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { adminAssignSlot } from "@/lib/services/slotService";
import { assignSlotSchema } from "@/lib/schemas/slotSchema";
import { extractNextRequestContext, logAudit } from "@/lib/services/auditService";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = session?.user?.role as string;
  if (!session?.user || !["leader", "superadmin", "coordinator"].includes(role)) {
    return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });
  }

  const body = await req.json();
  const validation = assignSlotSchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json({ success: false, error: validation.error.format() }, { status: 400 });
  }

  try {
    const slot = await prisma.slot.findUnique({ where: { id: validation.data.slotId } });
    await adminAssignSlot(validation.data.slotId, validation.data.userId, session.user.id, validation.data.notes);
    const { ip, userAgent } = extractNextRequestContext(req as unknown as { headers: { get(k: string): string | null } })
    await logAudit({
      actorId: session.user.id,
      actorRole: role,
      action: "SLOT_ASSIGN",
      targetType: "Slot",
      targetId: validation.data.slotId,
      metadata: {
        slotId: validation.data.slotId,
        targetUserId: validation.data.userId,
        notes: validation.data.notes ?? null,
        previousBookerId: slot?.bookedBy ?? null,
        slotType: slot?.type ?? null,
        date: slot?.date ?? null,
        startTime: slot?.startTime ?? null,
      },
      ip,
      userAgent,
    })
    revalidatePath("/overview");
    revalidatePath("/calendar");
    revalidatePath("/booking");
    return NextResponse.json({ success: true, data: { success: true } });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
