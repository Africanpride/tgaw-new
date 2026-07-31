import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { createGroupSchema } from "@/lib/schemas/groupSchema"

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session?.user)
    return NextResponse.json(
      { success: false, error: "Unauthorised" },
      { status: 401 }
    )

  const groups = await prisma.group.findMany({
    where: {
      members: { some: { userId: session.user.id! } },
    },
    include: { _count: { select: { members: true } } },
  })

  return NextResponse.json({ success: true, data: groups })
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session?.user)
    return NextResponse.json(
      { success: false, error: "Unauthorised" },
      { status: 401 }
    )

  const body = await req.json()
  const validation = createGroupSchema.safeParse(body)
  if (!validation.success)
    return NextResponse.json(
      { success: false, error: validation.error.format() },
      { status: 400 }
    )

  const group = await prisma.group.create({
    data: {
      ...validation.data,
      ownerId: session.user.id!,
      members: {
        create: {
          userId: session.user.id!,
          role: "owner",
        },
      },
    },
  })

  return NextResponse.json({ success: true, data: group }, { status: 201 })
}
