import { z } from "zod";

export const memoryChatSpeechBodySchema = z
  .object({
    text: z.string().trim().min(1).max(2000),
    voice: z.enum(["male", "female"]),
  })
  .strict();

export type MemoryChatSpeechInput = z.infer<typeof memoryChatSpeechBodySchema>;
