import { z } from "zod";

export const eventTypeSchema = z.enum([
	"BIBLE",
	"PRAYER",
	"PRAISE_WORSHIP",
	"SPECIAL",
]);

export const createEventSchema = z.object({
	type: eventTypeSchema,
	title: z.string().min(1, "Title is required"),
	passage: z.string().optional(),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date (YYYY-MM-DD)"),
	time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time (HH:MM)"),
	duration: z.number().int().positive(),
	capacity: z.number().int().positive().nullable().optional(),
	zoomUrl: z.string().url().optional().or(z.literal("")),
	notes: z.string().optional(),
	/** Types the coordinator chooses to block (SPECIAL events only). */
	blockTypes: z
		.array(z.enum(["BIBLE", "PRAYER", "PRAISE_WORSHIP"]))
		.optional(),
});

export const updateEventSchema = createEventSchema.partial();
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
