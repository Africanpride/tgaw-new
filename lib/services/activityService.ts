import { prisma } from "@/lib/db/prisma"

export type ActivityType = "post" | "member" | "prayer_answered" | "booking" | "event" | "comment"

export interface ActivityItem {
  id: string
  type: ActivityType
  category: "praise" | "prayer" | "member" | "all"
  title: string
  subtitle: string
  href: string
  initials: string
  name: string
  image?: string | null
  createdAt: string
}

function initialsFor(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "?"
}
function tintFor(category: ActivityItem["category"]): string {
  switch (category) {
    case "praise": return "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
    case "prayer": return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
    case "member": return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
    default: return "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300"
  }
}

function isPraiseType(t: string) {
  return t === "PRAISE_REPORT" || t === "TESTIMONIAL"
}

function isPrayerType(t: string) {
  return t === "PRAYER_REQUEST" || t === "PRAYER_ANSWER"
}

function categoryForPostType(t: string): ActivityItem["category"] {
  if (t === "PRAYER_ANSWER") return "prayer"
  if (isPraiseType(t)) return "praise"
  if (isPrayerType(t)) return "prayer"
  return "all"
}

function parentNounFor(t: string): string {
  if (t === "PRAISE_REPORT") return "a praise report"
  if (t === "TESTIMONIAL") return "a testimony"
  if (t === "PRAYER_REQUEST") return "a prayer request"
  if (t === "PRAYER_ANSWER") return "a prayer update"
  if (t === "BIBLE_VERSE") return "a verse"
  return "a post"
}

const SLOT_LABEL: Record<string, string> = {
  BIBLE: "Bible reading",
  PRAYER: "prayer",
  PRAISE_WORSHIP: "praise & worship",
}

function categoryForSlotType(t: string): ActivityItem["category"] {
  if (t === "PRAYER") return "prayer"
  if (t === "PRAISE_WORSHIP") return "praise"
  return "all"
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return "just now"
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export async function getCommunityActivity(limit = 8): Promise<ActivityItem[]> {
  const today = new Date().toISOString().split("T")[0]
  const [posts, members, slots, events, comments] = await Promise.all([
    prisma.post.findMany({
      where: { isHidden: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, type: true, body: true, authorId: true, createdAt: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 2,
      select: { id: true, name: true, image: true, createdAt: true },
    }),
    prisma.slot.findMany({
      // NOTE: slots are pre-generated weeks ahead, so createdAt is the grid
      // date — not the booking date. updatedAt is touched on every booking
      // write, so it (and not createdAt) is the booking-action timestamp.
      where: { bookedBy: { not: null }, date: { gte: today } },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: { id: true, type: true, date: true, bookedBy: true, updatedAt: true },
    }),
    prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      take: 2,
      select: { id: true, type: true, title: true, createdAt: true },
    }),
    prisma.comment.findMany({
      where: { isHidden: false },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: { id: true, postId: true, authorId: true, body: true, createdAt: true },
    }),
  ])

  // Parent post types for comment categorisation
  const commentPostIds = [...new Set(comments.map((c) => c.postId))]
  const commentParents = commentPostIds.length
    ? await prisma.post.findMany({
        where: { id: { in: commentPostIds } },
        select: { id: true, type: true },
      })
    : []
  const parentTypeMap = new Map(commentParents.map((p) => [p.id, p.type]))

  const authorIds = [
    ...new Set([
      ...posts.map((p) => p.authorId),
      ...comments.map((c) => c.authorId),
      ...slots.map((s) => s.bookedBy).filter((id): id is string => !!id),
    ]),
  ]
  const authors = authorIds.length ? await prisma.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, name: true, image: true } }) : []
  const authorMap = new Map(authors.map((u) => [u.id, u]))

  const postActivities: ActivityItem[] = posts.map((p) => {
    const author = authorMap.get(p.authorId)
    const name = author?.name ?? "Member"
    const category = categoryForPostType(p.type)
    const type: ActivityType = p.type === "PRAYER_ANSWER" ? "prayer_answered" : "post"
    let title = ""
    if (p.type === "PRAISE_REPORT") title = `${name} posted a praise report`
    else if (p.type === "TESTIMONIAL") title = `${name} shared a testimony`
    else if (p.type === "PRAYER_REQUEST") title = `${name} shared a prayer request`
    else if (p.type === "PRAYER_ANSWER") title = `${name} marked a prayer as answered`
    else if (p.type === "BIBLE_VERSE") title = `${name} shared a verse`
    else title = `${name} posted`
    if (p.body) {
      const snippet = p.body.slice(0, 48)
      title = `${title} — ${snippet}${p.body.length > 48 ? "…" : ""}`
    }
    // tint is derived, not stored
    return {
      id: `post-${p.id}`,
      type,
      category,
      title,
      subtitle: timeAgo(p.createdAt),
      href: `/feed#${p.id}`,
      initials: initialsFor(name),
      name,
      image: author?.image ?? null,
      createdAt: p.createdAt.toISOString(),
    }
  })

  const memberActivities: ActivityItem[] = members.map((u) => ({
    id: `member-${u.id}`,
    type: "member" as const,
    category: "member" as const,
    title: `${u.name} joined`,
    subtitle: `Welcome — ${timeAgo(u.createdAt)}`,
    href: `/feed`,
    initials: initialsFor(u.name),
    name: u.name,
    image: u.image ?? null,
    createdAt: u.createdAt.toISOString(),
  }))

  const bookingActivities: ActivityItem[] = slots
    .filter((s) => s.bookedBy)
    .map((s) => {
      const booker = authorMap.get(s.bookedBy!)
      const name = booker?.name ?? "A member"
      const label = SLOT_LABEL[s.type] ?? "devotion"
      return {
        id: `booking-${s.id}`,
        type: "booking" as const,
        category: categoryForSlotType(s.type),
        title: `${name} booked a ${label} slot`,
        subtitle: timeAgo(s.updatedAt),
        href: `/booking`,
        initials: initialsFor(name),
        name,
        image: booker?.image ?? null,
        createdAt: s.updatedAt.toISOString(),
      }
    })

  const eventActivities: ActivityItem[] = events.map((e) => ({
    id: `event-${e.id}`,
    type: "event" as const,
    category: "all" as const,
    title: `New event — ${e.title}`,
    subtitle: timeAgo(e.createdAt),
    href: `/calendar`,
    initials: "✦",
    name: "TGAW",
    image: null,
    createdAt: e.createdAt.toISOString(),
  }))

  const commentActivities: ActivityItem[] = comments.map((c) => {
    const author = authorMap.get(c.authorId)
    const name = author?.name ?? "Member"
    const parentType = parentTypeMap.get(c.postId) ?? "TEXT"
    let title = `${name} commented on ${parentNounFor(parentType)}`
    if (c.body) {
      const snippet = c.body.slice(0, 48)
      title = `${title} — ${snippet}${c.body.length > 48 ? "…" : ""}`
    }
    return {
      id: `comment-${c.id}`,
      type: "comment" as const,
      category: categoryForPostType(parentType),
      title,
      subtitle: timeAgo(c.createdAt),
      href: `/feed#${c.postId}`,
      initials: initialsFor(name),
      name,
      image: author?.image ?? null,
      createdAt: c.createdAt.toISOString(),
    }
  })

  const all = [
    ...postActivities,
    ...memberActivities,
    ...bookingActivities,
    ...eventActivities,
    ...commentActivities,
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
    .map((a) => ({ ...a, subtitle: a.subtitle }))

  // ensure tint is computed via helper if needed client-side; we keep category for client tint
  return all
}
