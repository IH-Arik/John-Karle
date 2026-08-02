import { requestMemoryChat, type AiMemoryPayload } from "../../utils/ai-service.client.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { MemoryVaultModel } from "../memory-vault/memory-vault.model.js";
import type { MemoryChatInput } from "./memory-chat.validation.js";

export type MemoryChatCitation = {
  memoryTitle: string;
  citedText: string;
};

export type MemoryChatResult = {
  answer: string;
  citations: MemoryChatCitation[];
};

const buildConversationId = (userId: string, person: string): string =>
  `${userId}:${person.trim().toLowerCase()}`;

const toAiMemoryPayload = (memory: {
  type: AiMemoryPayload["type"];
  title: string;
  narrative: string;
  date: Date;
  tags: string[];
  location?: string;
}): AiMemoryPayload => ({
  type: memory.type,
  title: memory.title,
  narrative: memory.narrative,
  date: memory.date.toISOString(),
  tags: memory.tags,
  location: memory.location,
});

export const chat = async (
  user: AuthenticatedUser,
  input: MemoryChatInput,
): Promise<MemoryChatResult> => {
  const memories = await MemoryVaultModel.find({
    userId: user.id,
    whoseMemoryIsThis: input.person,
  })
    .sort({ date: -1, createdAt: -1 })
    .exec();

  const response = await requestMemoryChat({
    conversation_id: buildConversationId(user.id, input.person),
    person: input.person,
    question: input.question,
    memories: memories.map(toAiMemoryPayload),
  });

  return {
    answer: response.answer,
    citations: response.citations.map((citation) => ({
      memoryTitle: citation.memory_title,
      citedText: citation.cited_text,
    })),
  };
};
