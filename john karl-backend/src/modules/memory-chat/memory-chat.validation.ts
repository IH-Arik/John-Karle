import { z } from "zod";

export const memoryChatBodySchema = z
  .object({
    person: z.string().trim().min(1).max(120),
    question: z.string().trim().min(1).max(2000),
    familyMemberUserId: z
      .string()
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid family member user id.")
      .optional(),
  })
  .strict();

export type MemoryChatInput = z.infer<typeof memoryChatBodySchema>;
