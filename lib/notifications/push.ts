import webpush from "web-push"

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_CONTACT_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function sendPush(
  subscription: webpush.PushSubscription,
  title: string,
  body: string
) {
  await webpush.sendNotification(
    subscription,
    JSON.stringify({ title, body })
  )
}
