import { z } from "zod";

export const slotTypeSchema = z.enum(["BIBLE", "PRAYER", "PRAISE_WORSHIP"]);

// Book one or more consecutive slots
export const bookSlotsSchema = z.object({
  slotIds: z.array(z.string().min(1)).min(1, "Select at least one slot"),
  notes: z.string().max(500).optional(),
});

// Cancel a booking
export const cancelSlotSchema = z.object({
  slotId: z.string().min(1),
});

// Admin: assign a slot to a user
export const assignSlotSchema = z.object({
  slotId: z.string().min(1),
  userId: z.string().min(1),
  notes: z.string().max(500).optional(),
});

// Admin: force-cancel a slot
export const adminCancelSlotSchema = z.object({
  slotId: z.string().min(1),
  reason: z.string().max(500).optional(),
});

// Admin: update booking config
export const updateBookingConfigSchema = z.object({
  maxBibleSlotsPerDay: z.number().int().min(0).max(48).optional(),
  maxPrayerSlotsPerDay: z.number().int().min(0).max(48).optional(),
  maxWorshipSlotsPerDay: z.number().int().min(0).max(48).optional(),
  visibilityMode: z.number().int().min(1).max(4).optional(),
});

// Meeting link management (leader/superadmin only)
export const upsertMeetingLinkSchema = z.object({
  type: slotTypeSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date (YYYY-MM-DD)"),
  url: z.string().url("Must be a valid URL"),
  label: z.string().max(100).optional(),
});

export type BookSlotsInput = z.infer<typeof bookSlotsSchema>;
export type CancelSlotInput = z.infer<typeof cancelSlotSchema>;
export type AssignSlotInput = z.infer<typeof assignSlotSchema>;
export type AdminCancelSlotInput = z.infer<typeof adminCancelSlotSchema>;
export type UpdateBookingConfigInput = z.infer<typeof updateBookingConfigSchema>;
export type UpsertMeetingLinkInput = z.infer<typeof upsertMeetingLinkSchema>;
