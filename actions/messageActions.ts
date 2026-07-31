"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { headers } from "next/headers"

export async function getConversations() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorised")

  const conversations = await prisma.conversation.findMany({
    where: { memberIds: { has: session.user.id! } },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  })

  return conversations
}

export async function markMessageRead(messageId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorised")

  const message = await prisma.message.findUnique({ where: { id: messageId } })
  if (!message) throw new Error("Not found")

  const readBy = message.readBy.includes(session.user.id!)
    ? message.readBy
    : [...message.readBy, session.user.id!]

  await prisma.message.update({
    where: { id: messageId },
    data: { readBy },
  })
}
