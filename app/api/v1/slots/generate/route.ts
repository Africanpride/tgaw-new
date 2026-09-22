import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { generateSlotsForDateRange } from "@/lib/services/slotService";
import { extractNextRequestContext, logAudit } from "@/lib/services/auditService";
import { format, endOfMonth, addMonths, startOfMonth } from "date-fns";

export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get("CRON_SECRET");
  const session = await auth.api.getSession({ headers: await headers() });
  const role = session?.user?.role as string;
  
  if (cronSecret !== process.env.CRON_SECRET && (!session?.user || !["leader", "superadmin", "coordinator"].includes(role))) {
    return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });
  }

  try {
    const today = new Date();
    const startDate = format(startOfMonth(today), "yyyy-MM-dd");
    const endDate = format(endOfMonth(addMonths(today, 1)), "yyyy-MM-dd");

    const createdCount = await generateSlotsForDateRange(startDate, endDate);
    const actorId = session?.user?.id ?? "cron";
    const actorRole = (session?.user as { role?: string } | undefined)?.role ?? "system";
    const { ip, userAgent } = extractNextRequestContext(req as unknown as { headers: { get(k: string): string | null } });
    await logAudit({ actorId, actorRole, action: "SLOTS_GENERATE", targetType: "Slot", targetId: `${startDate}:${endDate}`, metadata: { startDate, endDate, createdCount }, ip, userAgent });
    return NextResponse.json({ success: true, data: { createdCount, startDate, endDate } });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
