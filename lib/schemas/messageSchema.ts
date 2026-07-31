import { z } from "zod"

export const createMessageSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  body: z.string().min(1, "Message body is required"),
  attachmentUrl: z.string().url().optional().or(z.literal("")),
})

export const updateMessageSchema = z.object({
  readBy: z.array(z.string()).optional(),
})

export type CreateMessageInput = z.infer<typeof createMessageSchema>
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>
