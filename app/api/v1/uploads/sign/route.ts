import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getSignedUploadParams } from "@/lib/storage/cloudinary"

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session?.user)
    return NextResponse.json(
      { success: false, error: "Unauthorised" },
      { status: 401 }
    )

  const body = await req.json()
  const folder = body.folder || "tgaw-uploads"

  const params = getSignedUploadParams(folder)
  return NextResponse.json({ success: true, data: params })
}
