import { z } from "zod"

export const coordinatorStatsQuerySchema = z.object({
  range: z.enum(["week", "month"]).default("week"),
})

export type CoordinatorStatsQuery = z.infer<typeof coordinatorStatsQuerySchema>
