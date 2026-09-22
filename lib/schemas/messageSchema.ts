import { z } from "zod";

export const createMessageSchema = z.object({
	conversationId: z.string().min(1, "Conversation ID is required"),
	body: z.string().min(1, "Message body is required"),
	attachmentUrl: z.string().url().optional().or(z.literal("")),
	replyToId: z.string().optional(),
});

export const editMessageSchema = z.object({
	body: z.string().min(1, "Message body is required"),
});

export const updateMessageSchema = z.object({
	readBy: z.array(z.string()).optional(),
});

export const reactionSchema = z.object({
	emoji: z.string().min(1, "Emoji is required").max(8),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type EditMessageInput = z.infer<typeof editMessageSchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;
export type ReactionInput = z.infer<typeof reactionSchema>;
