import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-with-enough-length-for-auth-tests";
process.env.LOG_LEVEL = "silent";
process.env.AWS_REGION = "ap-southeast-1";
process.env.AWS_ACCESS_KEY_ID = "test-access-key";
process.env.AWS_SECRET_ACCESS_KEY = "test-secret-key";

const pollySendMock = vi.fn();

vi.mock("@aws-sdk/client-polly", () => ({
  PollyClient: class {
    send = pollySendMock;
  },
  SynthesizeSpeechCommand: class {
    constructor(public readonly input: unknown) {}
  },
}));

const memoryChatSpeechService = await import(
  "../src/modules/memory-chat/memory-chat-speech.service.js"
);

describe("memory chat speech service", () => {
  beforeEach(() => {
    pollySendMock.mockReset();
  });

  it("synthesizes audio using the male voice", async () => {
    pollySendMock.mockResolvedValue({
      AudioStream: { transformToByteArray: async () => new Uint8Array([1, 2, 3]) },
    });

    const result = await memoryChatSpeechService.synthesizeSpeech({
      text: "Margaret loved gardening.",
      voice: "male",
    });

    expect(result).toEqual(Buffer.from([1, 2, 3]));
    expect(pollySendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          Text: "Margaret loved gardening.",
          VoiceId: "Matthew",
          Engine: "neural",
          OutputFormat: "mp3",
        }),
      }),
    );
  });

  it("synthesizes audio using the female voice", async () => {
    pollySendMock.mockResolvedValue({
      AudioStream: { transformToByteArray: async () => new Uint8Array([4, 5, 6]) },
    });

    await memoryChatSpeechService.synthesizeSpeech({
      text: "Margaret loved gardening.",
      voice: "female",
    });

    expect(pollySendMock).toHaveBeenCalledWith(
      expect.objectContaining({ input: expect.objectContaining({ VoiceId: "Joanna" }) }),
    );
  });

  it("propagates a synthesis error as an ApiError", async () => {
    pollySendMock.mockRejectedValue(new Error("Polly is down"));

    await expect(
      memoryChatSpeechService.synthesizeSpeech({ text: "Hello", voice: "male" }),
    ).rejects.toMatchObject({ statusCode: 502, code: "SPEECH_SYNTHESIS_ERROR" });
  });

  it("throws when Polly returns no audio stream", async () => {
    pollySendMock.mockResolvedValue({ AudioStream: undefined });

    await expect(
      memoryChatSpeechService.synthesizeSpeech({ text: "Hello", voice: "male" }),
    ).rejects.toMatchObject({ statusCode: 502, code: "SPEECH_SYNTHESIS_ERROR" });
  });
});
