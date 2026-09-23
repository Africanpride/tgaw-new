import { z } from "zod";

export const updateTranslationConfigSchema = z.object({
  enableFr: z.boolean().optional(),
  enableEs: z.boolean().optional(),
  enablePt: z.boolean().optional(),
});

export type UpdateTranslationConfigInput = z.infer<typeof updateTranslationConfigSchema>;
