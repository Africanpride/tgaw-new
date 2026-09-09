import { prisma } from "../lib/db/prisma";
import { generateSlotsForDateRange } from "../lib/services/slotService";
import { format, startOfMonth, endOfMonth, addMonths } from "date-fns";

/**
 * Migration Script: Cutover to 1-Hour Devotional Slots
 * Usage:
 *   bun run scripts/migrate-slots-to-hourly.ts <YYYY-MM-DD>
 *   bun run scripts/migrate-slots-to-hourly.ts --wipe-all
 */
async function main() {
  const arg = process.argv[2];
  const isWipeAll = arg === "--wipe-all" || arg === "wipe" || process.argv.includes("--wipe-all");

  const today = new Date();
  const startDate = format(startOfMonth(today), "yyyy-MM-dd");
  const endDate = format(endOfMonth(addMonths(today, 1)), "yyyy-MM-dd");

  if (isWipeAll) {
    console.log("=== Devotional Slots Migration: Full Wipe & Fresh Start ===");

    // 1. Delete all existing slot records
    const deleted = await prisma.slot.deleteMany({});
    console.log(`✓ Deleted all ${deleted.count} legacy slot records.`);

    // 2. Update existing BookingConfig singleton defaults
    const configUpdated = await prisma.bookingConfig.updateMany({
      data: {
        maxBibleSlotsPerDay: 1,
        maxPrayerSlotsPerDay: 1,
        maxWorshipSlotsPerDay: 1,
      },
    });
    if (configUpdated.count > 0) {
      console.log(`✓ Updated BookingConfig defaults to 1 slot/day (1 hr budget).`);
    }

    // 3. Generate fresh hourly slots for current month through next month
    console.log(`Generating fresh hourly slots from ${startDate} to ${endDate}...`);
    const created = await generateSlotsForDateRange(startDate, endDate);
    console.log(`✓ Successfully generated ${created} hourly slots.`);

    console.log("=== Fresh Start Migration Completed Successfully ===");
    return;
  }

  const CUTOVER = arg;
  if (!CUTOVER || !/^\d{4}-\d{2}-\d{2}$/.test(CUTOVER)) {
    console.error("❌ Error: Valid CUTOVER date argument (YYYY-MM-DD) or --wipe-all flag required.");
    console.error("Usage: bun run scripts/migrate-slots-to-hourly.ts <YYYY-MM-DD>");
    console.error("   or: bun run scripts/migrate-slots-to-hourly.ts --wipe-all");
    process.exit(1);
  }

  console.log(`=== Devotional Slots Migration: Cutover at ${CUTOVER} ===`);

  // 1. Guardrail: Detect any existing confirmed bookings on or after CUTOVER
  const futureBooked = await prisma.slot.findMany({
    where: {
      date: { gte: CUTOVER },
      bookedBy: { not: null },
    },
    select: {
      id: true,
      type: true,
      date: true,
      startTime: true,
      endTime: true,
      bookedBy: true,
    },
  });

  if (futureBooked.length > 0) {
    console.error(`🚨 Halting: Found ${futureBooked.length} confirmed future booking(s) on or after ${CUTOVER}:`);
    console.table(futureBooked);
    console.error("Resolve these with the users/owner or choose a later CUTOVER date before proceeding.");
    process.exit(1);
  }

  // 2. Delete unbooked slots from CUTOVER date onward
  const deleted = await prisma.slot.deleteMany({
    where: {
      date: { gte: CUTOVER },
      bookedBy: null,
    },
  });
  console.log(`✓ Deleted ${deleted.count} unbooked 30-minute slots from ${CUTOVER} onward.`);
  console.log(`✓ Past slots (< ${CUTOVER}) preserved intact for audit & history.`);

  // 3. Update existing BookingConfig singleton defaults if present
  const configUpdated = await prisma.bookingConfig.updateMany({
    data: {
      maxBibleSlotsPerDay: 1,
      maxPrayerSlotsPerDay: 1,
      maxWorshipSlotsPerDay: 1,
    },
  });
  if (configUpdated.count > 0) {
    console.log(`✓ Updated BookingConfig defaults to 1 slot/day (1 hr budget).`);
  }

  // 4. Pre-generate hourly slots from CUTOVER through the end of next month
  console.log(`Generating hourly slots from ${CUTOVER} to ${endDate}...`);
  const created = await generateSlotsForDateRange(CUTOVER, endDate);
  console.log(`✓ Successfully generated ${created} hourly slots.`);

  console.log("=== Migration Completed Successfully ===");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
