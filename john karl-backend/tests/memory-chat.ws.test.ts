import { createServer, type Server } from "node:http";
import { AddressInfo } from "node:net";

import { WebSocket } from "ws";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-with-enough-length-for-auth-tests";
process.env.LOG_LEVEL = "silent";

const verifyTokenMock = vi.fn();
const chatMock = vi.fn();
const synthesizeSpeechMock = vi.fn();

vi.mock("../src/modules/auth/auth.tokens.js", () => ({
  verifyToken: verifyTokenMock,
}));

vi.mock("../src/modules/memory-chat/memory-chat.service.js", () => ({
  chat: chatMock,
}));

vi.mock("../src/modules/memory-chat/memory-chat-speech.service.js", () => ({
  synthesizeSpeech: synthesizeSpeechMock,
}));

const { registerMemoryChatVoiceWebSocket } = await import(
  "../src/modules/memory-chat/memory-chat.ws.js"
);
const { UserModel } = await import("../src/modules/users/user.model.js");

const mockExecResolved = <T>(value: T) => ({
  exec: vi.fn().mockResolvedValue(value),
});

const VALID_USER_ID = "507f1f77bcf86cd799439013";

let server: Server;
let baseUrl: string;

const openSocket = (token?: string): WebSocket => {
  const url = token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl;
  return new WebSocket(url);
};

const waitFor = <T = unknown>(ws: WebSocket, event: "open" | "close" | "unexpected-response") =>
  new Promise<T>((resolve, reject) => {
    ws.once(event, (...args: unknown[]) => resolve(args[0] as T));
    ws.once("error", () => {
      // Some rejection paths emit both 'error' and 'unexpected-response';
      // only reject if we weren't waiting specifically for an error-adjacent event.
      if (event !== "close" && event !== "unexpected-response") reject(new Error("ws error"));
    });
  });

type WsMessage = Record<string, unknown>;

const collectMessages = (ws: WebSocket, count: number, timeoutMs = 2000): Promise<WsMessage[]> =>
  new Promise((resolve, reject) => {
    const messages: WsMessage[] = [];
    const timer = setTimeout(() => reject(new Error(`timed out waiting for ${count} messages`)), timeoutMs);
    ws.on("message", (data) => {
      messages.push(JSON.parse(data.toString()));
      if (messages.length >= count) {
        clearTimeout(timer);
        resolve(messages);
      }
    });
  });

describe("memory chat voice websocket", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();

    verifyTokenMock.mockImplementation((token: string) => {
      if (token === "user-token") {
        return {
          sub: VALID_USER_ID,
          email: "user@example.com",
          role: "user",
          tokenVersion: 0,
          type: "access",
        };
      }
      throw new Error("invalid token");
    });

    vi.spyOn(UserModel, "findById").mockImplementation((userId: string) => {
      if (userId === VALID_USER_ID) {
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
    synthesizeSpeechMock.mockReset();

    server = createServer();
    registerMemoryChatVoiceWebSocket(server);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    baseUrl = `ws://127.0.0.1:${port}/ws/memory-chat/voice`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("rejects a connection with no token", async () => {
    const ws = openSocket();
    await expect(waitFor(ws, "unexpected-response")).resolves.toBeDefined();
  });

  it("rejects a connection with an invalid token", async () => {
    const ws = openSocket("bad-token");
    await expect(waitFor(ws, "unexpected-response")).resolves.toBeDefined();
  });

  it("streams text then a single audio chunk then done for a one-sentence answer", async () => {
    chatMock.mockResolvedValue({
      answer: "Margaret loved gardening.",
      citations: [],
    });
    synthesizeSpeechMock.mockResolvedValue(Buffer.from([1, 2, 3]));

    const ws = openSocket("user-token");
    await waitFor(ws, "open");

    ws.send(
      JSON.stringify({ type: "ask", id: "turn-1", person: "Margaret", question: "What did she love?", voice: "female" }),
    );

    const messages = await collectMessages(ws, 3);
    expect(messages[0]).toMatchObject({ type: "text", id: "turn-1", answer: "Margaret loved gardening." });
    expect(messages[1]).toMatchObject({ type: "audio_chunk", id: "turn-1", index: 0, total: 1 });
    expect(Buffer.from(messages[1].audioBase64 as string, "base64")).toEqual(Buffer.from([1, 2, 3]));
    expect(messages[2]).toMatchObject({ type: "done", id: "turn-1" });

    ws.close();
  });

  it("streams multiple ordered audio chunks for a multi-sentence answer", async () => {
    chatMock.mockResolvedValue({
      answer: "Margaret loved gardening. She also baked bread. She read every evening.",
      citations: [],
    });
    synthesizeSpeechMock.mockImplementation(async ({ text }: { text: string }) => Buffer.from(text));

    const ws = openSocket("user-token");
    await waitFor(ws, "open");
    ws.send(JSON.stringify({ type: "ask", id: "turn-1", person: "Margaret", question: "Tell me about her.", voice: "male" }));

    const messages = await collectMessages(ws, 5);
    const chunks = messages.filter((m) => m.type === "audio_chunk") as { index: number; total: number }[];
    expect(chunks).toHaveLength(3);
    expect(chunks.map((c) => c.index)).toEqual([0, 1, 2]);
    expect(chunks.every((c) => c.total === 3)).toBe(true);
    expect(messages[4]).toMatchObject({ type: "done", id: "turn-1" });

    ws.close();
  });

  it("sends an error message and stays connected when chat() throws", async () => {
    chatMock.mockRejectedValue(new Error("AI service unavailable"));

    const ws = openSocket("user-token");
    await waitFor(ws, "open");
    ws.send(JSON.stringify({ type: "ask", id: "turn-1", person: "Margaret", question: "Hi", voice: "female" }));

    const messages = await collectMessages(ws, 1);
    expect(messages[0]).toMatchObject({ type: "error", id: "turn-1", message: "AI service unavailable" });

    ws.close();
  });

  it("sends an error for a malformed ask payload", async () => {
    const ws = openSocket("user-token");
    await waitFor(ws, "open");
    ws.send(JSON.stringify({ type: "ask", id: "turn-1" })); // missing required fields

    const messages = await collectMessages(ws, 1);
    expect(messages[0]).toMatchObject({ type: "error", message: "Invalid request." });

    ws.close();
  });

  it("suppresses the response for a turn that was cancelled before it resolved", async () => {
    let resolveChat!: (value: { answer: string; citations: never[] }) => void;
    chatMock.mockReturnValue(
      new Promise((resolve) => {
        resolveChat = resolve;
      }),
    );

    const ws = openSocket("user-token");
    await waitFor(ws, "open");
    ws.send(JSON.stringify({ type: "ask", id: "turn-1", person: "Margaret", question: "Hi", voice: "female" }));

    // Cancel before the in-flight chat() call resolves, and give the cancel
    // message time to actually reach and be processed by the server (it's a
    // real network round trip, unlike resolving a local promise) before
    // resolving chat() out from under it.
    await new Promise((resolve) => setTimeout(resolve, 20));
    ws.send(JSON.stringify({ type: "cancel" }));
    await new Promise((resolve) => setTimeout(resolve, 50));
    resolveChat({ answer: "Margaret loved gardening.", citations: [] });

    let receivedAnything = false;
    ws.on("message", () => {
      receivedAnything = true;
    });
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(receivedAnything).toBe(false);

    ws.close();
  });
});
