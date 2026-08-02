import { requestMemoryChat, type AiMemoryPayload } from "../../utils/ai-service.client.js";
import { ApiError } from "../../utils/api-error.util.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { MemoryVaultModel } from "../memory-vault/memory-vault.model.js";
import { areAcceptedFamilyMembers } from "../users/user-family-membership.service.js";
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

const resolveReadableUserId = async (
  authenticatedUser: AuthenticatedUser,
  familyMemberUserId: string | undefined,
): Promise<string> => {
  if (!familyMemberUserId || familyMemberUserId === authenticatedUser.id) {
    return authenticatedUser.id;
  }

  const isFamilyMember = await areAcceptedFamilyMembers(authenticatedUser.id, familyMemberUserId);

  if (!isFamilyMember) {
    throw new ApiError(
      403,
      "You do not have permission to view this family member's memories.",
      "FORBIDDEN",
    );
  }

  return familyMemberUserId;
};

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
  const readableUserId = await resolveReadableUserId(user, input.familyMemberUserId);
  const memories = await MemoryVaultModel.find({
    userId: readableUserId,
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
