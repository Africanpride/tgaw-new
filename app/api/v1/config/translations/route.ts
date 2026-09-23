import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getTranslationConfig, getEnabledLocales, updateTranslationConfig } from "@/lib/services/translationConfigService";
import { updateTranslationConfigSchema } from "@/lib/schemas/translationConfigSchema";
import { extractNextRequestContext, logAudit } from "@/lib/services/auditService";

export async function GET() {
  try {
    const config = await getTranslationConfig();
    const enabledLocales = await getEnabledLocales();
    return NextResponse.json(
      { success: true, data: { enabledLocales, config: { enableFr: config.enableFr, enableEs: config.enableEs, enablePt: config.enablePt } } },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = session?.user?.role as string;
  if (!session?.user || role !== "superadmin") {
    return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });
  }

  const body = await req.json();
  const validation = updateTranslationConfigSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ success: false, error: validation.error.format() }, { status: 400 });
  }

  try {
    const before = await getTranslationConfig();
    const config = await updateTranslationConfig(validation.data, session.user.id);
    const { ip, userAgent } = extractNextRequestContext(req as unknown as { headers: { get(k: string): string | null } });
    await logAudit({
      actorId: session.user.id,
      actorRole: role,
      action: "TRANSLATION_CONFIG_CHANGE",
      targetType: "TranslationConfig",
      targetId: config.id,
      metadata: { before: { enableFr: before.enableFr, enableEs: before.enableEs, enablePt: before.enablePt }, after: validation.data },
      ip,
      userAgent,
    });
    const enabledLocales = await getEnabledLocales();
    return NextResponse.json({ success: true, data: { enabledLocales, config: { enableFr: config.enableFr, enableEs: config.enableEs, enablePt: config.enablePt } } });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
