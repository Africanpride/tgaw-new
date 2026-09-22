import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"

const createSchema = z.object({
  type: z.enum(["DIRECT", "GROUP"]),
  groupId: z.string().optional(),
  memberIds: z.array(z.string()).min(1).max(20),
})

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 })

  const myId = session.user.id!

  const conversations = await prisma.conversation.findMany({
    where: { memberIds: { has: myId } },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  })

  // Resolve member details
  const allMemberIds = [...new Set(conversations.flatMap((c) => c.memberIds))]
  const members = await prisma.user.findMany({
    where: { id: { in: allMemberIds } },
    select: { id: true, name: true, initials: true, image: true, username: true },
  })
  const memberMap = new Map(members.map((m) => [m.id, m]))

  // Compute unread status per conversation
  const conversationsWithMeta = conversations.map((conv) => {
    const lastMsg = conv.messages[0]
    const hasUnread = lastMsg
      ? !lastMsg.readBy.includes(myId) && lastMsg.senderId !== myId
      : false

    return {
      ...conv,
      hasUnread,
      members: conv.memberIds.map((id) => memberMap.get(id)).filter(Boolean),
    }
  })

  return NextResponse.json({ success: true, data: conversationsWithMeta })
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 })
  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 })

  let { type, groupId, memberIds } = parsed.data
  // ensure current user in memberIds
  if (!memberIds.includes(session.user.id!)) memberIds = [...memberIds, session.user.id!]

  // for DIRECT, deduplicate: find existing with same 2 members
  if (type === "DIRECT" && memberIds.length === 2) {
    const existing = await prisma.conversation.findFirst({
      where: { type: "DIRECT", memberIds: { hasEvery: memberIds } },
    })
    // need exact match (not superset) — filter in memory
    const exact = existing && existing.memberIds.length === 2 && memberIds.every((id) => existing.memberIds.includes(id))
    if (exact) return NextResponse.json({ success: true, data: existing })
  }

  const conv = await prisma.conversation.create({
    data: { type: type as never, groupId: groupId || undefined, memberIds },
  })
  return NextResponse.json({ success: true, data: conv }, { status: 201 })
}
