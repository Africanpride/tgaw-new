import { prisma } from "@/lib/db/prisma"

type SlotCountArgs = Parameters<typeof prisma.slot.count>[0]
type MessageCountArgs = Parameters<typeof prisma.message.count>[0]

type MobileDockDatabase = {
  slot: { count: (args: SlotCountArgs) => Promise<number> }
  message: { count: (args: MessageCountArgs) => Promise<number> }
}

export const dockItems = [
  { href: "/overview", label: "Home", icon: "home" },
  { href: "/feed", label: "Feed", icon: "pen" },
  { href: "/booking", label: "Booking", icon: "calendar" },
  { href: "/messages", label: "Messages", icon: "messages" },
  { href: "/settings", label: "Profile", icon: "profile" },
] as const

export function isDockPathActive(pathname: string, href: string) {
  if (pathname === href) return true
  return (
    (href === "/feed" || href === "/messages") &&
    pathname.startsWith(`${href}/`)
  )
}

export function formatDockBadge(count: number | null | undefined) {
  if (!count) return null
  return count > 9 ? "9+" : String(count)
}

export function getDockInitials(name: string | null | undefined) {
  if (!name) return "?"
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export function floatingBarClass() {
  return "fixed right-0 left-0 z-40 flex justify-center px-4 bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] md:bottom-4 md:px-0"
}

export function selectedSlotsBarClass() {
  return "flex w-full items-center gap-3 rounded-xs border bg-popover px-3 py-2 shadow-lg md:w-auto"
}

export async function getMobileDockCounts(
  userId: string,
  db: MobileDockDatabase = prisma as unknown as MobileDockDatabase,
) {
  const now = new Date()
  const today = now.toISOString().split("T")[0]
  const nowTime = `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`
  const [todayBookings, unreadCandidates, readMessages] = await Promise.all([
    db.slot.count({
      where: {
        bookedBy: userId,
        OR: [{ date: { gt: today } }, { date: today, endTime: { gt: nowTime } }],
      },
    }),
    db.message.count({
      where: {
        conversation: { memberIds: { has: userId } },
        senderId: { not: userId },
      },
    }),
    db.message.count({
      where: {
        conversation: { memberIds: { has: userId } },
        senderId: { not: userId },
        readBy: { has: userId },
      },
    }),
  ])

  return { todayBookings, unreadMessages: unreadCandidates - readMessages }
}
