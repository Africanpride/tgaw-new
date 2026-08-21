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

interface UserRow {
  id: string;
  name: string;
  initials: string | null;
  image: string | null;
  role: string;
}

export async function getOnlineUsers(): Promise<OnlineUser[]> {
  const rows = await prisma.presence.findMany({
    select: { userId: true },
  });
  if (rows.length === 0) return [];
  const userIds: string[] = [...new Set(rows.map((r) => r.userId))];

  const found: UserRow[] = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      name: true,
      initials: true,
      image: true,
      role: true,
    },
  });

  // Fallback for legacy seeded users whose _id is a raw ObjectId — Prisma
  // string filters don't match them (same workaround as slotService).
  if (found.length !== userIds.length) {
    const missingIds = userIds.filter(
      (id) => !found.some((u) => u.id === id),
    );
    const objectIds = missingIds
      .filter((id) => /^[0-9a-fA-F]{24}$/.test(id))
      .map((id) => ({ $oid: id }));
    if (objectIds.length > 0) {
      const rawUsers = (await prisma.user.findRaw({
        filter: { _id: { $in: objectIds } },
      })) as unknown as Array<{
        _id: { $oid: string };
        name?: string;
        initials?: string | null;
        image?: string | null;
        role?: string;
      }>;
      for (const ru of rawUsers ?? []) {
        found.push({
          id: ru._id.$oid,
          name: ru.name ?? "",
          initials: ru.initials ?? null,
          image: ru.image ?? null,
          role: ru.role ?? "member",
        });
      }
    }
  }

  return found.map((u) => ({
    id: u.id,
    name: u.name,
    initials: u.initials,
    image: u.image,
    role: u.role,
  }));
}
