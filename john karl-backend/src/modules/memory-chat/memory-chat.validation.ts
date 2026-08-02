import { z } from "zod";

export const memoryChatBodySchema = z
  .object({
    person: z.string().trim().min(1).max(120),
    question: z.string().trim().min(1).max(2000),
  })
  .strict();

export type MemoryChatInput = z.infer<typeof memoryChatBodySchema>;
