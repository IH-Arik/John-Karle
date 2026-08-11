import { File, Paths } from 'expo-file-system';

import { SecureStorageService } from '@/utils/storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || '';

export type AssistantVoice = 'male' | 'female';

/**
 * Fetches synthesized speech audio for the given text and writes it to a
 * local cache file, returning a `file://` uri playable by expo-audio.
 *
 * Bypasses the shared `api` client, which always parses responses as JSON —
 * this endpoint returns raw `audio/mpeg` bytes.
 */
export const synthesizeSpeechToFile = async (text: string, voice: AssistantVoice): Promise<string> => {
    const token = await SecureStorageService.getItem('authToken');

    const response = await fetch(`${BASE_URL}/memory-chat/speech`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text, voice }),
    });

    if (!response.ok) {
        throw new Error(`Speech synthesis failed with status ${response.status}`);
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    const file = new File(Paths.cache, `voice-${Date.now()}.mp3`);
    file.create();
    file.write(bytes);

    return file.uri;
};

/**
 * Writes a base64-encoded audio chunk (as streamed over the voice-call
 * WebSocket) to a local cache file, returning a `file://` uri playable by
 * expo-audio.
 */
export const writeBase64AudioToFile = (base64: string): string => {
    const file = new File(Paths.cache, `voice-chunk-${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`);
    file.create();
    file.write(base64, { encoding: 'base64' });
    return file.uri;
};

/** Converts the REST API base url (…/api/v1) into the voice-call WebSocket url. */
export const buildVoiceCallWsUrl = (token: string): string => {
    const restBase = BASE_URL.replace(/\/api\/v1\/?$/, '');
    const wsBase = restBase.replace(/^http/, 'ws');
    return `${wsBase}/ws/memory-chat/voice?token=${encodeURIComponent(token)}`;
};
