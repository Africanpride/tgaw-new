import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { addGroupMemberSchema } from "@/lib/schemas/groupSchema"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const members = await prisma.groupMember.findMany({
    where: { groupId: id },
  })
  return NextResponse.json({ success: true, data: members })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session?.user)
    return NextResponse.json(
      { success: false, error: "Unauthorised" },
      { status: 401 }
    )

  const { id } = await params
  const body = await req.json()
  const validation = addGroupMemberSchema.safeParse(body)
  if (!validation.success)
    return NextResponse.json(
      { success: false, error: validation.error.format() },
      { status: 400 }
    )

  const member = await prisma.groupMember.create({
    data: {
      groupId: id,
      userId: validation.data.userId,
      role: validation.data.role,
    },
  })

  return NextResponse.json({ success: true, data: member }, { status: 201 })
}
