import { z } from "zod"

export const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  isPrivate: z.boolean().optional().default(false),
})

export const updateGroupSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  isPrivate: z.boolean().optional(),
})

export const addGroupMemberSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["member", "moderator", "owner"]).optional().default("member"),
})

export type CreateGroupInput = z.infer<typeof createGroupSchema>
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>
export type AddGroupMemberInput = z.infer<typeof addGroupMemberSchema>
