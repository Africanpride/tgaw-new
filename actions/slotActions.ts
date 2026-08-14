"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { bookSlots, cancelSlot } from "@/lib/services/slotService";
import { bookSlotsSchema, cancelSlotSchema } from "@/lib/schemas/slotSchema";
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
    await bookSlots(validation.data.slotIds, session.user.id, validation.data.notes);
    
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
