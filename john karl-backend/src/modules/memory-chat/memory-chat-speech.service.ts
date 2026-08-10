import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";

import { env } from "../../config/env.config.js";
import { ApiError } from "../../utils/api-error.util.js";
import type { MemoryChatSpeechInput } from "./memory-chat-speech.validation.js";

const VOICE_IDS = {
  male: "Matthew",
  female: "Joanna",
} as const;

let pollyClient: PollyClient | null = null;

const getPollyClient = (): PollyClient => {
  if (pollyClient) {
    return pollyClient;
  }

  if (!env.AWS_REGION || !env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
    throw new ApiError(500, "AWS credentials are not configured.", "AWS_CONFIGURATION_ERROR");
  }

  pollyClient = new PollyClient({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });

  return pollyClient;
};

export const synthesizeSpeech = async (input: MemoryChatSpeechInput): Promise<Buffer> => {
  const client = getPollyClient();

  let response;
  try {
    response = await client.send(
      new SynthesizeSpeechCommand({
        Text: input.text,
        VoiceId: VOICE_IDS[input.voice],
        Engine: "neural",
        OutputFormat: "mp3",
      }),
    );
  } catch (error) {
    throw new ApiError(502, "Speech synthesis failed.", "SPEECH_SYNTHESIS_ERROR", {
      cause: error instanceof Error ? error.message : error,
    });
  }

  if (!response.AudioStream) {
    throw new ApiError(502, "Speech synthesis returned no audio.", "SPEECH_SYNTHESIS_ERROR");
  }

  const bytes = await response.AudioStream.transformToByteArray();
  return Buffer.from(bytes);
};
