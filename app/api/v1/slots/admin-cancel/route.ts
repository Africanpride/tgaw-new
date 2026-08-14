import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { adminCancelSlot } from "@/lib/services/slotService";
import { adminCancelSlotSchema } from "@/lib/schemas/slotSchema";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = session?.user?.role as string;
  if (!session?.user || (role !== "leader" && role !== "superadmin")) {
    return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });
  }

  const body = await req.json();
  const validation = adminCancelSlotSchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json({ success: false, error: validation.error.format() }, { status: 400 });
  }

  try {
    await adminCancelSlot(validation.data.slotId, session.user.id, validation.data.reason);
    return NextResponse.json({ success: true, data: { success: true } });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
