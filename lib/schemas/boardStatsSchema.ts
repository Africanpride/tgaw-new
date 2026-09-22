import { z } from "zod"

export const boardStatsQuerySchema = z.object({
  range: z.enum(["week", "month"]).default("week"),
})

export type BoardStatsQuery = z.infer<typeof boardStatsQuerySchema>
