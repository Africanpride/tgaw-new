import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"
import { getIO } from "@/lib/socket/server"

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

  // Compute unread count per conversation
  const conversationsWithMeta = await Promise.all(conversations.map(async (conv) => {
    const lastMsg = conv.messages[0]
    const hasUnread = lastMsg
      ? !lastMsg.readBy.includes(myId) && lastMsg.senderId !== myId
      : false

    // Count unread messages
    let unreadCount = 0
    if (hasUnread) {
      unreadCount = await prisma.message.count({
        where: {
          conversationId: conv.id,
          deletedAt: null,
          senderId: { not: myId },
          NOT: { readBy: { has: myId } },
        },
      })
    }

    return {
      ...conv,
      hasUnread,
      unreadCount,
      members: conv.memberIds.map((id) => memberMap.get(id)).filter(Boolean),
    }
  }))

  return NextResponse.json({ success: true, data: conversationsWithMeta })
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 })
  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 })

  const { type, groupId } = parsed.data
  let { memberIds } = parsed.data
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

  // Broadcast to all conversation members that a new conversation was created
  const io = getIO()
  if (io) {
    for (const mId of conv.memberIds) {
      io.to(`user:${mId}`).emit("conversation:new", conv)
      io.to(mId).emit("conversation:new", conv)
    }
  }

  return NextResponse.json({ success: true, data: conv }, { status: 201 })
}
