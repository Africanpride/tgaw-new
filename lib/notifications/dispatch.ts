import { prisma } from "@/lib/db/prisma"
import { sendEmail } from "@/lib/notifications/email"
import { sendPush } from "@/lib/notifications/push"

type NotificationType =
  | "NEW_MESSAGE"
  | "NEW_COMMENT"
  | "NEW_LIKE"
  | "NEW_FOLLOWER"
  | "GROUP_INVITE"
  | "PRAYER_UPDATE"
  | "SLOT_REMINDER"
  | "ADMIN_BROADCAST"

interface DispatchParams {
  userId: string
  type: NotificationType
  title: string
  body: string
  link?: string
}

export async function dispatchNotification(params: DispatchParams) {
  const { userId, type, title, body, link } = params

  await prisma.notification.create({
    data: { userId, type, channel: "EMAIL", title, body, link },
  })

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user?.email) return

  try {
    await sendEmail(user.email, title, `<p>${body}</p>`)
  } catch {
    console.error(`[ERROR] Failed to send email to ${user.email}`)
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  })

  for (const sub of subscriptions) {
    try {
      await sendPush(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        title,
        body
      )
    } catch {
      console.error(`[ERROR] Failed to send push to ${sub.endpoint}`)
    }
  }
}
