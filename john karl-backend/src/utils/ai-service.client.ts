import { env } from "../config/env.config.js";
import { logger } from "./logger.util.js";
import { ApiError } from "./api-error.util.js";

export type AiMemoryPayload = {
  type: "photo" | "video" | "journal" | "voice";
  title: string;
  narrative: string;
  date: string;
  tags: string[];
  location?: string;
};

type AiUsage = {
  input_tokens?: number;
  output_tokens?: number;
};

type MemoryChatRequestBody = {
  conversation_id: string;
  person: string;
  question: string;
  memories: AiMemoryPayload[];
};

type AiCitation = {
  memory_title: string;
  cited_text: string;
};

type MemoryChatResponseBody = {
  success: boolean;
  request_id: string;
  answer: string;
  citations: AiCitation[];
  usage: AiUsage;
  latency_ms: number;
};

type MemoryQuoteRequestBody = {
  memory_id: string;
  person: string;
  memory: AiMemoryPayload;
};

type MemoryQuoteResponseBody = {
  success: boolean;
  request_id: string;
  pull_quote: string;
  commentary: string;
  usage: AiUsage;
  latency_ms: number;
};

type CachedMemoryQuoteResponseBody = {
  success: boolean;
  memory_id: string;
  pull_quote: string;
  commentary: string;
};

const isAiServiceConfigured = (): boolean =>
  Boolean(env.AI_SERVICE_URL && env.AI_SERVICE_API_KEY);

const aiServiceHeaders = (): Record<string, string> => ({
  "Content-Type": "application/json",
  "X-API-Key": env.AI_SERVICE_API_KEY,
});

const requireAiServiceConfigured = (): void => {
  if (!isAiServiceConfigured()) {
    throw new ApiError(
      503,
      "The AI service is not configured.",
      "AI_SERVICE_UNAVAILABLE",
    );
  }
};

const parseAiServiceResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new ApiError(502, "The AI service rejected the request.", "AI_SERVICE_ERROR", {
      status: response.status,
    });
  }

  return (await response.json()) as T;
};

export const requestMemoryChat = async (
  body: MemoryChatRequestBody,
): Promise<MemoryChatResponseBody> => {
  requireAiServiceConfigured();

  let response: Response;
  try {
    response = await fetch(`${env.AI_SERVICE_URL}/api/v1/ai/memory-chat`, {
      method: "POST",
      headers: aiServiceHeaders(),
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new ApiError(502, "Could not reach the AI service.", "AI_SERVICE_UNREACHABLE", {
      cause: error,
    });
  }

  return parseAiServiceResponse<MemoryChatResponseBody>(response);
};

export const requestMemoryQuoteGeneration = async (
  body: MemoryQuoteRequestBody,
): Promise<MemoryQuoteResponseBody> => {
  requireAiServiceConfigured();

  const response = await fetch(`${env.AI_SERVICE_URL}/api/v1/ai/memory-quote`, {
    method: "POST",
    headers: aiServiceHeaders(),
    body: JSON.stringify(body),
  });

  return parseAiServiceResponse<MemoryQuoteResponseBody>(response);
};

/**
 * Fire-and-forget trigger for quote generation on memory create/update.
 *
 * Best-effort, matching this codebase's existing pattern for non-critical
 * side effects (see notification `.catch(() => undefined)` calls elsewhere):
 * a slow or unavailable AI service must never fail or delay a memory
 * save. Failures are logged, not thrown.
 */
export const triggerMemoryQuoteGeneration = (body: MemoryQuoteRequestBody): void => {
  void requestMemoryQuoteGeneration(body).catch((error: unknown) => {
    logger.warn({ err: error, memoryId: body.memory_id }, "memory quote generation trigger failed");
  });
};

export const fetchCachedMemoryQuote = async (
  memoryId: string,
): Promise<CachedMemoryQuoteResponseBody | null> => {
  if (!isAiServiceConfigured()) {
    return null;
  }

  const response = await fetch(
    `${env.AI_SERVICE_URL}/api/v1/ai/memory-quote/${encodeURIComponent(memoryId)}`,
    {
      method: "GET",
      headers: aiServiceHeaders(),
    },
  );

  if (response.status === 404) {
    return null;
  }

  return parseAiServiceResponse<CachedMemoryQuoteResponseBody>(response);
};
