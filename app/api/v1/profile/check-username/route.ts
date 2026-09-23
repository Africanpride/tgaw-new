import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const username = searchParams.get("username")?.trim().toLowerCase()

  if (!username || username.length < 3) {
    return NextResponse.json({ available: false, reason: "too_short" })
  }

  const existing = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  })

  return NextResponse.json({ available: !existing })
}
