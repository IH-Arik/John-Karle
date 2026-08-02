import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-with-enough-length-for-auth-tests";
process.env.LOG_LEVEL = "silent";

const verifyTokenMock = vi.fn();
const chatMock = vi.fn();

vi.mock("../src/modules/auth/auth.tokens.js", () => ({
  verifyToken: verifyTokenMock,
}));

vi.mock("../src/modules/legacy-access/legacy-access.activity.js", () => ({
  trackAuthenticatedUserActivity: (_req: unknown, _res: unknown, next: (error?: unknown) => void) =>
    next(),
}));

vi.mock("../src/modules/memory-chat/memory-chat.service.js", () => ({
  chat: chatMock,
}));

const { createApp } = await import("../src/app.js");
const { UserModel } = await import("../src/modules/users/user.model.js");

const app = createApp();

const authHeadersFor = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

const mockExecResolved = <T>(value: T) => ({
  exec: vi.fn().mockResolvedValue(value),
});

describe("memory chat routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    verifyTokenMock.mockImplementation((token: string) => {
      if (token === "user-token") {
        return {
          sub: "507f1f77bcf86cd799439013",
          email: "user@example.com",
          role: "user",
          tokenVersion: 0,
          type: "access",
        };
      }

      throw new Error("invalid token");
    });

    vi.spyOn(UserModel, "findById").mockImplementation((userId: string) => {
      if (userId === "507f1f77bcf86cd799439013") {
        return mockExecResolved({
          _id: userId,
          email: "user@example.com",
          role: "user",
          refreshTokenVersion: 0,
        }) as never;
      }

      return mockExecResolved(null) as never;
    });

    chatMock.mockReset();
  });

  it("requires an access token to ask a memory chat question", async () => {
    const response = await request(app)
      .post("/api/v1/memory-chat")
      .send({ person: "Margaret", question: "What did she love?" });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      message: "Authentication token is required.",
    });
  });

  it("validates the request body after authentication", async () => {
    const response = await request(app)
      .post("/api/v1/memory-chat")
      .set(authHeadersFor("user-token"))
      .send({ person: "", question: "" });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      message: "Validation failed",
    });
  });

  it("returns the answer and citations for a valid question", async () => {
    chatMock.mockResolvedValue({
      answer: "Margaret loved gardening.",
      citations: [{ memoryTitle: "Garden Day", citedText: "She spent hours in the garden." }],
    });

    const response = await request(app)
      .post("/api/v1/memory-chat")
      .set(authHeadersFor("user-token"))
      .send({ person: "Margaret", question: "What did Margaret love to do?" });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Memory chat response generated successfully.",
      data: {
        answer: "Margaret loved gardening.",
        citations: [{ memoryTitle: "Garden Day", citedText: "She spent hours in the garden." }],
      },
    });
    expect(chatMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: "507f1f77bcf86cd799439013" }),
      { person: "Margaret", question: "What did Margaret love to do?" },
    );
  });
});
