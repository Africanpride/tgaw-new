"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { bookSlots, cancelSlot } from "@/lib/services/slotService";
import { bookSlotsSchema, cancelSlotSchema } from "@/lib/schemas/slotSchema";
import { logAudit } from "@/lib/services/auditService";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export async function bookSlotAction(data: { slotIds: string[], notes?: string }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { success: false, error: "Unauthorised" };
  }

  const validation = bookSlotsSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  try {
    const bookedSlots = await bookSlots(validation.data.slotIds, session.user.id, validation.data.notes);
    
    // fire-and-forget — 7d TTL, do not block booking
    void (async () => {
      try {
        const h = await headers();
        const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
        const ua = h.get("user-agent") ?? null;
        const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
        void logAudit({
          actorId: session.user.id,
          actorRole: dbUser?.role ?? (session.user as { role?: string })?.role ?? null,
          action: "SLOT_BOOK",
          targetType: "Slot",
          targetId: validation.data.slotIds.join(","),
          metadata: { slotIds: validation.data.slotIds, count: bookedSlots.length, notes: validation.data.notes ?? null, slots: bookedSlots.map((s) => ({ id: s.id, type: s.type, date: s.date, startTime: s.startTime })) },
          ip,
          userAgent: ua,
        }).catch(() => {});
      } catch {}
    })();
    
    revalidatePath("/booking");
    revalidatePath("/bible");
    revalidatePath("/prayer");
    revalidatePath("/worship");
    revalidatePath("/calendar");
    
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function cancelSlotAction(data: { slotId: string }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { success: false, error: "Unauthorised" };
  }

  const validation = cancelSlotSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  try {
    await cancelSlot(validation.data.slotId, session.user.id);
    
    void (async () => {
      try {
        const h = await headers();
        const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
        const ua = h.get("user-agent") ?? null;
        const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
        void logAudit({
          actorId: session.user.id,
          actorRole: dbUser?.role ?? (session.user as { role?: string })?.role ?? null,
          action: "SLOT_CANCEL",
          targetType: "Slot",
          targetId: validation.data.slotId,
          metadata: { slotId: validation.data.slotId },
          ip,
          userAgent: ua,
        }).catch(() => {});
      } catch {}
    })();
    
    revalidatePath("/booking");
    revalidatePath("/bible");
    revalidatePath("/prayer");
    revalidatePath("/worship");
    revalidatePath("/calendar");
    
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
