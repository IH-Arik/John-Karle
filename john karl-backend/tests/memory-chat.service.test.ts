import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-with-enough-length-for-auth-tests";
process.env.LOG_LEVEL = "silent";

const requestMemoryChatMock = vi.fn();
const areAcceptedFamilyMembersMock = vi.fn();

vi.mock("../src/utils/ai-service.client.js", () => ({
  requestMemoryChat: requestMemoryChatMock,
}));

vi.mock("../src/modules/users/user-family-membership.service.js", () => ({
  areAcceptedFamilyMembers: areAcceptedFamilyMembersMock,
}));

const memoryChatService = await import("../src/modules/memory-chat/memory-chat.service.js");
const { MemoryVaultModel } = await import("../src/modules/memory-vault/memory-vault.model.js");

const mockExecResolved = <T>(value: T) => ({
  exec: vi.fn().mockResolvedValue(value),
});

describe("memory chat service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    requestMemoryChatMock.mockReset();
    areAcceptedFamilyMembersMock.mockReset();
  });

  it("scopes retrieval to the requesting user's own memories for the named person", async () => {
    const userId = new Types.ObjectId();
    const findSpy = vi.spyOn(MemoryVaultModel, "find").mockReturnValue({
      sort: vi.fn().mockReturnValue(
        mockExecResolved([
          {
            type: "journal",
            title: "First Steps",
            narrative: "She walked across the room.",
            date: new Date("2026-01-15T00:00:00.000Z"),
            tags: ["milestone"],
            location: undefined,
          },
        ]),
      ),
    } as never);

    requestMemoryChatMock.mockResolvedValue({
      success: true,
      request_id: "req-1",
      answer: "Margaret loved walking around the garden.",
      citations: [{ memory_title: "First Steps", cited_text: "She walked across the room." }],
      usage: {},
      latency_ms: 120,
    });

    const result = await memoryChatService.chat(
      {
        id: userId.toString(),
        email: "user@example.com",
        role: "user",
        tokenVersion: 0,
      },
      { person: "Margaret", question: "What did Margaret love to do?" },
    );

    expect(findSpy).toHaveBeenCalledWith({
      userId: userId.toString(),
      whoseMemoryIsThis: "Margaret",
    });
    expect(requestMemoryChatMock).toHaveBeenCalledWith(
      expect.objectContaining({
        conversation_id: `${userId.toString()}:margaret`,
        person: "Margaret",
        question: "What did Margaret love to do?",
        memories: [
          expect.objectContaining({
            title: "First Steps",
            narrative: "She walked across the room.",
          }),
        ],
      }),
    );
    expect(result).toEqual({
      answer: "Margaret loved walking around the garden.",
      citations: [{ memoryTitle: "First Steps", citedText: "She walked across the room." }],
    });
  });

  it("searches an accepted family member's memories when familyMemberUserId is provided", async () => {
    const requesterId = new Types.ObjectId();
    const familyMemberId = new Types.ObjectId();

    areAcceptedFamilyMembersMock.mockResolvedValue(true);
    const findSpy = vi.spyOn(MemoryVaultModel, "find").mockReturnValue({
      sort: vi.fn().mockReturnValue(mockExecResolved([])),
    } as never);

    requestMemoryChatMock.mockResolvedValue({
      success: true,
      request_id: "req-2",
      answer: "Margaret loved gardening.",
      citations: [],
      usage: {},
      latency_ms: 90,
    });

    await memoryChatService.chat(
      {
        id: requesterId.toString(),
        email: "requester@example.com",
        role: "user",
        tokenVersion: 0,
      },
      {
        person: "Margaret",
        question: "What did Margaret love to do?",
        familyMemberUserId: familyMemberId.toString(),
      },
    );

    expect(areAcceptedFamilyMembersMock).toHaveBeenCalledWith(
      requesterId.toString(),
      familyMemberId.toString(),
    );
    expect(findSpy).toHaveBeenCalledWith({
      userId: familyMemberId.toString(),
      whoseMemoryIsThis: "Margaret",
    });
    expect(requestMemoryChatMock).toHaveBeenCalledWith(
      expect.objectContaining({
        conversation_id: `${requesterId.toString()}:margaret`,
      }),
    );
  });

  it("rejects familyMemberUserId access for users who are not accepted family members", async () => {
    const requesterId = new Types.ObjectId();
    const familyMemberId = new Types.ObjectId();

    areAcceptedFamilyMembersMock.mockResolvedValue(false);

    await expect(
      memoryChatService.chat(
        {
          id: requesterId.toString(),
          email: "requester@example.com",
          role: "user",
          tokenVersion: 0,
        },
        {
          person: "Margaret",
          question: "What did Margaret love to do?",
          familyMemberUserId: familyMemberId.toString(),
        },
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
