import { prisma } from "@/lib/db/prisma";
import { EventType, Prisma } from "@prisma/client";
import { addDays, addMonths, endOfMonth, format, parse, startOfMonth } from "date-fns";

/**
 * Generate 48 slots per day for a given date range.
 */
export async function generateSlotsForDateRange(startDateStr: string, endDateStr: string) {
  const startDate = parse(startDateStr, "yyyy-MM-dd", new Date());
  const endDate = parse(endDateStr, "yyyy-MM-dd", new Date());

  const newSlots: { type: EventType; date: string; startTime: string; endTime: string }[] = [];
  const dates: string[] = [];
  let currentDate = startDate;

  while (currentDate <= endDate) {
    const dateStr = format(currentDate, "yyyy-MM-dd");
    dates.push(dateStr);

    for (const type of [EventType.BIBLE, EventType.PRAYER, EventType.PRAISE_WORSHIP]) {
      for (let i = 0; i < 48; i++) {
        const startTotalMinutes = i * 30;
        const startHours = Math.floor(startTotalMinutes / 60).toString().padStart(2, '0');
        const startMins = (startTotalMinutes % 60).toString().padStart(2, '0');
        
        const endTotalMinutes = (i + 1) * 30;
        const endHours = Math.floor(endTotalMinutes / 60).toString().padStart(2, '0');
        const endMins = (endTotalMinutes % 60).toString().padStart(2, '0');

        newSlots.push({
          type,
          date: dateStr,
          startTime: `${startHours}:${startMins}`,
          endTime: endHours === "24" ? "24:00" : `${endHours}:${endMins}`,
        });
      }
    }
    currentDate = addDays(currentDate, 1);
  }

  if (newSlots.length === 0) return 0;

  // Idempotent batch creation: fetch existing keys once, then bulk insert.
  const existing = await prisma.slot.findMany({
    where: {
      date: { in: dates },
      type: { in: [EventType.BIBLE, EventType.PRAYER, EventType.PRAISE_WORSHIP] },
    },
    select: { type: true, date: true, startTime: true },
  });
  const existingKeys = new Set(existing.map((s) => `${s.type}|${s.date}|${s.startTime}`));

  const toCreate = newSlots.filter(
    (slot) => !existingKeys.has(`${slot.type}|${slot.date}|${slot.startTime}`)
  );

  if (toCreate.length === 0) return 0;

  try {
    const result = await prisma.slot.createMany({ data: toCreate });
    return result.count;
  } catch (error) {
    // Concurrent generation can hit the unique constraint — slots already exist.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return 0;
    }
    throw error;
  }
}

/**
 * Ensure slots exist for a date, generating the rolling month window on demand
 * (spec §2.1: auto-generate on first load when slots don't exist).
 */
export async function ensureSlotsForDate(dateStr: string) {
  const existingCount = await prisma.slot.count({
    where: { date: dateStr },
  });
  if (existingCount > 0) return;

  const today = new Date();
  const startDate = format(startOfMonth(today), "yyyy-MM-dd");
  const endDate = format(endOfMonth(addMonths(today, 1)), "yyyy-MM-dd");
  await generateSlotsForDateRange(startDate, endDate);
}

export async function getBookingConfig() {
  const config = await prisma.bookingConfig.findFirst();
  if (!config) {
    return await prisma.bookingConfig.create({
      data: {
        updatedBy: "system",
      },
    });
  }
  return config;
}

export async function updateBookingConfig(
  adminUserId: string,
  data: {
    maxBibleSlotsPerDay?: number;
    maxPrayerSlotsPerDay?: number;
    maxWorshipSlotsPerDay?: number;
    visibilityMode?: number;
  }
) {
  const config = await getBookingConfig();
  return prisma.bookingConfig.update({
    where: { id: config.id },
    data: {
      ...data,
      updatedBy: adminUserId,
    },
  });
}

export async function getSlotsForDate(date: string, type?: EventType, currentUserId?: string, userRole?: string) {
  await ensureSlotsForDate(date);
  const config = await getBookingConfig();
  
  const slots = await prisma.slot.findMany({
    where: {
      date,
      ...(type ? { type } : {}),
    },
    orderBy: {
      startTime: 'asc',
    },
  });

  const meetingLinks = await prisma.meetingLink.findMany({
    where: {
      OR: [
        { date },
        { date: "DEFAULT" },
      ],
    },
  });

  const userIds = slots.map(s => s.bookedBy).filter(Boolean) as string[];
  const users = await prisma.user.findMany({
    where: { id: { in: [...new Set(userIds)] } },
    select: { id: true, name: true, image: true },
  });
  const userMap = new Map(users.map(u => [u.id, u]));

  const formattedSlots = slots.map(slot => {
    const isBooked = !!slot.bookedBy;
    const isOwnBooking = slot.bookedBy === currentUserId;
    let bookedByName = null;
    let bookedByImage = null;

    if (isBooked) {
      const user = userMap.get(slot.bookedBy!);
      
      const canSeeDetails = 
        config.visibilityMode === 1 || 
        config.visibilityMode === 3 || 
        isOwnBooking || 
        (config.visibilityMode === 4 && (userRole === "leader" || userRole === "superadmin" || userRole === "coordinator"));
        
      if (canSeeDetails && user) {
        bookedByName = user.name;
        bookedByImage = user.image;
      }
    }

    return {
      ...slot,
      isBooked,
      isOwnBooking,
      bookedByName,
      bookedByImage,
      notes: isOwnBooking || (userRole === "leader" || userRole === "superadmin") ? slot.notes : null,
    };
  });

  const userBookingCounts = { BIBLE: 0, PRAYER: 0, PRAISE_WORSHIP: 0 };
  if (currentUserId) {
    for (const t of ["BIBLE", "PRAYER", "PRAISE_WORSHIP"] as EventType[]) {
      userBookingCounts[t] = await getUserBookingCountForDate(currentUserId, date, t);
    }
  }

  const getLinkForType = (t: EventType) => {
    return (
      meetingLinks.find((m) => m.type === t && m.date === date) ||
      meetingLinks.find((m) => m.type === t && m.date === "DEFAULT") ||
      null
    );
  };

  const meetingLinksMap = {
    BIBLE: getLinkForType("BIBLE"),
    PRAYER: getLinkForType("PRAYER"),
    PRAISE_WORSHIP: getLinkForType("PRAISE_WORSHIP"),
  };

  return {
    slots: formattedSlots,
    meetingLinks: meetingLinksMap,
    config,
    userBookingCounts,
  };
}

export async function getUserBookingCountForDate(userId: string, date: string, type: EventType) {
  return prisma.slot.count({
    where: {
      date,
      type,
      bookedBy: userId,
    },
  });
}

export async function checkCrossTypeOverlap(userId: string, date: string, startTime: string, endTime: string, excludeType: EventType) {
  const overlappingSlots = await prisma.slot.findMany({
    where: {
      date,
      bookedBy: userId,
      type: { not: excludeType },
      OR: [
        {
          startTime: { lt: endTime },
          endTime: { gt: startTime }
        }
      ]
    },
  });
  return overlappingSlots.length > 0;
}

export async function bookSlots(slotIds: string[], userId: string, notes?: string) {
  const slots = await prisma.slot.findMany({
    where: { id: { in: slotIds } },
    orderBy: { startTime: 'asc' },
  });

  if (slots.length !== slotIds.length) {
    throw new Error("One or more slots not found");
  }

  const firstSlot = slots[0];
  const type = firstSlot.type;
  const date = firstSlot.date;

  // 1. Same type and date check
  if (!slots.every(s => s.type === type && s.date === date)) {
    throw new Error("Slots must be of the same type and on the same date");
  }

  // 2. Consecutive check
  for (let i = 0; i < slots.length - 1; i++) {
    if (slots[i].endTime !== slots[i + 1].startTime) {
      throw new Error("Slots must be consecutive");
    }
  }

  // 3. Not already booked check
  if (slots.some(s => s.bookedBy)) {
    throw new Error("One or more slots are already booked");
  }

  // 4. Cross-type overlap check
  const hasOverlap = await checkCrossTypeOverlap(userId, date, firstSlot.startTime, slots[slots.length - 1].endTime, type);
  if (hasOverlap) {
    throw new Error("You have an overlapping booking of a different type");
  }

  // 5. Booking limit check
  const config = await getBookingConfig();
  let maxSlots = 2;
  let typeLabel = "this type";
  if (type === "BIBLE") {
    maxSlots = config.maxBibleSlotsPerDay;
    typeLabel = "Bible reading";
  } else if (type === "PRAYER") {
    maxSlots = config.maxPrayerSlotsPerDay;
    typeLabel = "Prayer";
  } else if (type === "PRAISE_WORSHIP") {
    maxSlots = config.maxWorshipSlotsPerDay;
    typeLabel = "Praise & Worship";
  }

  const currentCount = await getUserBookingCountForDate(userId, date, type);
  if (currentCount + slots.length > maxSlots) {
    throw new Error(`Booking limit exceeded. Maximum is ${maxSlots} slots per day for ${typeLabel}.`);
  }

  // 6. Book atomically
  await prisma.slot.updateMany({
    where: { id: { in: slotIds } },
    data: {
      bookedBy: userId,
      notes,
    },
  });

  // Stub notification
  console.log(`[Notification Stub] Booking confirmed for user ${userId} on ${date} ${type}`);

  return await prisma.slot.findMany({
    where: { id: { in: slotIds } },
  });
}

export async function cancelSlot(slotId: string, userId: string) {
  const slot = await prisma.slot.findUnique({ where: { id: slotId } });
  if (!slot) throw new Error("Slot not found");
  if (slot.bookedBy !== userId) throw new Error("Not authorized to cancel this slot");

  const slotStartDateTime = new Date(`${slot.date}T${slot.startTime}:00Z`);
  if (slotStartDateTime <= new Date()) {
    throw new Error("Cannot cancel a booking that is in the past or already started");
  }

  await prisma.slot.update({
    where: { id: slotId },
    data: {
      bookedBy: null,
      notes: null,
      assignedBy: null,
    },
  });

  // Stub notification
  console.log(`[Notification Stub] User ${userId} cancelled ${slot.type} slot on ${slot.date}`);
  return true;
}

export async function adminAssignSlot(slotId: string, targetUserId: string, adminUserId: string, notes?: string) {
  const slot = await prisma.slot.findUnique({ where: { id: slotId } });
  if (!slot) throw new Error("Slot not found");

  if (slot.bookedBy) {
    // Notify previous holder
    console.log(`[Notification Stub] Previous holder ${slot.bookedBy} displaced from slot ${slotId}`);
  }

  await prisma.slot.update({
    where: { id: slotId },
    data: {
      bookedBy: targetUserId,
      assignedBy: adminUserId,
      notes,
    },
  });

  // Notify assigned user
  console.log(`[Notification Stub] Admin ${adminUserId} assigned slot ${slotId} to user ${targetUserId}`);
  return true;
}

export async function adminCancelSlot(slotId: string, adminUserId: string, reason?: string) {
  const slot = await prisma.slot.findUnique({ where: { id: slotId } });
  if (!slot) throw new Error("Slot not found");

  const prevUserId = slot.bookedBy;

  await prisma.slot.update({
    where: { id: slotId },
    data: {
      bookedBy: null,
      notes: null,
      assignedBy: null,
    },
  });

  if (prevUserId) {
    console.log(`[Notification Stub] Admin ${adminUserId} force-cancelled slot ${slotId} for user ${prevUserId}. Reason: ${reason}`);
  }
  
  return true;
}

export async function upsertMeetingLink(type: EventType, date: string, url: string, label?: string, createdBy: string = "system") {
  return prisma.meetingLink.upsert({
    where: {
      type_date: {
        type,
        date,
      },
    },
    update: { url, label },
    create: {
      type,
      date,
      url,
      label,
      createdBy,
    },
  });
}

export async function deleteMeetingLink(type: EventType, date: string) {
  return prisma.meetingLink.deleteMany({
    where: {
      type,
      date,
    },
  });
}

export async function getDefaultMeetingLinks(): Promise<{
  BIBLE: { url: string; label: string | null } | null;
  PRAYER: { url: string; label: string | null } | null;
  PRAISE_WORSHIP: { url: string; label: string | null } | null;
}> {
  const links = await prisma.meetingLink.findMany({ where: { date: "DEFAULT" } });
  const map: { BIBLE: { url: string; label: string | null } | null; PRAYER: { url: string; label: string | null } | null; PRAISE_WORSHIP: { url: string; label: string | null } | null } = {
    BIBLE: null,
    PRAYER: null,
    PRAISE_WORSHIP: null,
  };
  for (const link of links) {
    map[link.type as keyof typeof map] = { url: link.url, label: link.label ?? null };
  }
  return map;
}
