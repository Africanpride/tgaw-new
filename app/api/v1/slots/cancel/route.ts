import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { cancelSlot } from "@/lib/services/slotService";
import { cancelSlotSchema } from "@/lib/schemas/slotSchema";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });
  }

  const body = await req.json();
  const validation = cancelSlotSchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json({ success: false, error: validation.error.format() }, { status: 400 });
  }

  try {
    await cancelSlot(validation.data.slotId, session.user.id);
    return NextResponse.json({ success: true, data: { success: true } });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
