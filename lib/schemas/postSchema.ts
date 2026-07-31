import { z } from "zod";

export const postTypeSchema = z.enum([
	"TEXT",
	"MEDIA",
	"LINK",
	"POLL",
	"BIBLE_VERSE",
	"QUOTE",
	"SERMON",
	"GOSPEL_TRACT",
	"ARTICLE",
	"PRAYER_REQUEST",
	"PRAYER_ANSWER",
	"TESTIMONIAL",
	"PRAISE_REPORT",
]);

export const createPostSchema = z.object({
	type: postTypeSchema,
	body: z.string().optional(),
	mediaUrls: z.array(z.string().url()).optional().default([]),
	linkUrl: z.string().url().optional().or(z.literal("")),
	versePassage: z.string().optional(),
	isAnswered: z.boolean().optional(),
	poll: z
		.object({
			question: z.string().min(1, "Poll question is required"),
			options: z
				.array(z.string().min(1))
				.min(2, "At least 2 options required")
				.max(10),
			closesAt: z.string().datetime().optional(),
		})
		.optional(),
});

export const updatePostSchema = z.object({
	body: z.string().optional(),
	isHidden: z.boolean().optional(),
	isAnswered: z.boolean().optional(),
});

export const createCommentSchema = z.object({
	body: z.string().min(1, "Comment body is required"),
});

export const updateCommentSchema = z.object({
	body: z.string().optional(),
	isHidden: z.boolean().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
