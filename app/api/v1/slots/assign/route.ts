import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { adminAssignSlot } from "@/lib/services/slotService";
import { assignSlotSchema } from "@/lib/schemas/slotSchema";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = session?.user?.role as string;
  if (!session?.user || (role !== "leader" && role !== "superadmin")) {
    return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });
  }

  const body = await req.json();
  const validation = assignSlotSchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json({ success: false, error: validation.error.format() }, { status: 400 });
  }

  try {
    await adminAssignSlot(validation.data.slotId, validation.data.userId, session.user.id, validation.data.notes);
    revalidatePath("/overview");
    revalidatePath("/calendar");
    revalidatePath("/booking");
    return NextResponse.json({ success: true, data: { success: true } });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
