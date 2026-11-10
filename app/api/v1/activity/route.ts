import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getCommunityActivity } from "@/lib/services/activityService"

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const limit = Math.min(20, Math.max(1, Number(searchParams.get("limit") ?? 8) || 8))
  const data = await getCommunityActivity(limit)
  return NextResponse.json({ success: true, data }, { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" } })
}
