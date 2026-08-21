import { prisma } from "@/lib/db/prisma";

/**
 * Users count as online for this long after their last heartbeat. The raw
 * Mongo TTL index (scripts/presence-ttl.ts) evicts stale rows, so a missing
 * row == offline.
 */
export const PRESENCE_TTL_SECONDS = 300;

export async function touchPresence(userId: string): Promise<void> {
  const lastSeenAt = new Date();
  await prisma.presence.upsert({
    where: { userId },
    update: { lastSeenAt },
    create: { userId, lastSeenAt },
  });
}

export interface OnlineUser {
  id: string;
  name: string;
  initials: string | null;
  image: string | null;
  role: string;
}

export async function getOnlineUsers(): Promise<OnlineUser[]> {
  const rows = await prisma.presence.findMany({ select: { userId: true } });
  if (rows.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: rows.map((r) => r.userId) } },
    select: {
      id: true,
      name: true,
      initials: true,
      image: true,
      role: true,
    },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    initials: u.initials,
    image: u.image,
    role: u.role,
  }));
}
