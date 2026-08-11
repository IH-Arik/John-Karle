import type { IncomingMessage, Server } from "node:http";

import { WebSocketServer, type WebSocket } from "ws";
import { z } from "zod";

import { logger } from "../../utils/logger.util.js";
import { verifyToken } from "../auth/auth.tokens.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { UserModel } from "../users/user.model.js";
import { synthesizeSpeech } from "./memory-chat-speech.service.js";
import { chat } from "./memory-chat.service.js";

const VOICE_WS_PATH = "/ws/memory-chat/voice";

const askMessageSchema = z
  .object({
    type: z.literal("ask"),
    id: z.string().trim().min(1).max(100),
    person: z.string().trim().min(1).max(120),
    question: z.string().trim().min(1).max(2000),
    familyMemberUserId: z
      .string()
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/)
      .optional(),
    voice: z.enum(["male", "female"]),
  })
  .strict();

// Splits on sentence-ending punctuation while keeping the punctuation, so
// each chunk is a complete, naturally-spoken unit for Polly.
const splitIntoSentences = (text: string): string[] =>
  text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

const send = (socket: WebSocket, payload: Record<string, unknown>): void => {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
};

const authenticateUpgradeRequest = async (
  request: IncomingMessage,
): Promise<AuthenticatedUser | null> => {
  const url = new URL(request.url ?? "", "http://internal");
  const token = url.searchParams.get("token");

  if (!token) {
    return null;
  }

  try {
    const payload = verifyToken(token, "access");
    const user = await UserModel.findById(payload.sub).exec();

    if (!user || user.refreshTokenVersion !== payload.tokenVersion) {
      return null;
    }

    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      tokenVersion: user.refreshTokenVersion,
    };
  } catch {
    return null;
  }
};

const handleAsk = async (
  socket: WebSocket,
  user: AuthenticatedUser,
  currentAskIdRef: { current: string | null },
  raw: unknown,
): Promise<void> => {
  const parsed = askMessageSchema.safeParse(raw);
  if (!parsed.success) {
    send(socket, { type: "error", message: "Invalid request." });
    return;
  }

  const { id, person, question, familyMemberUserId, voice } = parsed.data;
  currentAskIdRef.current = id;

  let result;
  try {
    result = await chat(user, { person, question, familyMemberUserId });
  } catch (error) {
    logger.error({ err: error, id }, "voice call: chat() failed");
    if (currentAskIdRef.current !== id) return; // superseded by a newer question
    const message = error instanceof Error ? error.message : "Could not process that question.";
    send(socket, { type: "error", id, message });
    return;
  }

  if (currentAskIdRef.current !== id) return; // superseded before text was sent

  send(socket, { type: "text", id, answer: result.answer, citations: result.citations });

  const sentences = splitIntoSentences(result.answer);
  for (let index = 0; index < sentences.length; index += 1) {
    if (currentAskIdRef.current !== id) return; // superseded mid-stream

    try {
      const audio = await synthesizeSpeech({ text: sentences[index], voice });
      if (currentAskIdRef.current !== id) return;

      send(socket, {
        type: "audio_chunk",
        id,
        index,
        total: sentences.length,
        audioBase64: audio.toString("base64"),
      });
    } catch (error) {
      logger.error({ err: error, id, index }, "voice call: sentence synthesis failed");
      // Skip this sentence's audio rather than aborting the whole answer.
    }
  }

  if (currentAskIdRef.current === id) {
    send(socket, { type: "done", id });
  }
};

export const registerMemoryChatVoiceWebSocket = (server: Server): void => {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const { pathname } = new URL(request.url ?? "", "http://internal");
    if (pathname !== VOICE_WS_PATH) {
      return;
    }

    authenticateUpgradeRequest(request)
      .then((user) => {
        if (!user) {
          logger.warn("voice call: upgrade rejected (auth failed)");
          socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
          socket.destroy();
          return;
        }

        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request, user);
        });
      })
      .catch((error) => {
        logger.error({ err: error }, "voice call: upgrade handling error");
        socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
        socket.destroy();
      });
  });

  wss.on("connection", (ws: WebSocket, _request: IncomingMessage, user: AuthenticatedUser) => {
    const currentAskIdRef = { current: null as string | null };

    ws.on("message", (data) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(data.toString());
      } catch {
        send(ws, { type: "error", message: "Invalid JSON." });
        return;
      }

      if ((parsed as { type?: unknown }).type === "ask") {
        void handleAsk(ws, user, currentAskIdRef, parsed);
      } else if ((parsed as { type?: unknown }).type === "cancel") {
        currentAskIdRef.current = null;
      }
    });

    ws.on("error", (error) => {
      logger.error({ err: error, userId: user.id }, "voice call websocket error");
    });
  });
};
