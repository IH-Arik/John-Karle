import { AssistantVoice, buildVoiceCallWsUrl, writeBase64AudioToFile } from '@/services/speech-api';
import { Feather } from '@expo/vector-icons';
import { File } from 'expo-file-system';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import React, { useCallback, useRef, useState } from 'react';
import { Alert, Animated, AppState, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ms, vs } from 'react-native-size-matters';

import { useAuth } from '@/hooks/use-auth';
import { ChatGPTVoiceOrb } from '@/components/ChatGPTVoiceOrb';
import { SecureStorageService } from '@/utils/storage';

type CallState = 'starting' | 'listening' | 'thinking' | 'speaking' | 'ended';

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY_MS = 1500;
const IDLE_TIMEOUT_MS = 2 * 60 * 1000;
const MAX_CALL_DURATION_MS = 10 * 60 * 1000;

export default function VoiceCallScreen() {
    const { user } = useAuth();
    const params = useLocalSearchParams<{ person?: string; familyMemberUserId?: string; voice?: AssistantVoice }>();
    const router = useRouter();

    const currentUserName = user?.firstName || user?.name || 'you';
    const hasSpecificPerson = !!(params.person && params.person.trim() && params.person !== 'Margaret');
    const personName = hasSpecificPerson ? params.person!.trim() : currentUserName;
    const familyMemberUserId = params.familyMemberUserId || undefined;
    const voice: AssistantVoice = params.voice === 'male' ? 'male' : 'female';

    const [callState, setCallState] = useState<CallState>('starting');
    const [liveTranscript, setLiveTranscript] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Event handlers close over stale state via React state, so track the
    // authoritative state in a ref -- this loop is entirely event-driven.
    const callStateRef = useRef<CallState>('starting');
    const playerRef = useRef<AudioPlayer | null>(null);

    // Streaming voice-call transport: one persistent WebSocket for the whole
    // call, one logical "turn" per question. turnIdRef lets us discard
    // messages/audio that belong to a turn the user has since barged into.
    const wsRef = useRef<WebSocket | null>(null);
    const turnIdRef = useRef<string | null>(null);
    const chunkQueueRef = useRef<string[]>([]);
    const isPlayingChunkRef = useRef(false);
    const turnDoneRef = useRef(false);
    const reconnectAttemptsRef = useRef(0);
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const errorMessageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Whether the recognizer is actually running right now. Start/stop calls
    // go through startRecognizer()/stopRecognizer() below, which are
    // idempotent against this flag -- calling .start() on an already-active
    // session is what broke turn 2 the first time barge-in was attempted.
    const recognizerActiveRef = useRef(false);

    // Orb scale: driven by live mic volume while listening, by a steady
    // breathing loop while thinking/speaking (no output-level metering is
    // available for played-back audio, so speaking uses a simulated pulse).
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const breathingLoopRef = useRef<Animated.CompositeAnimation | null>(null);
    const speechHapticTimerRef = useRef<any>(null);

    const stopBreathing = () => {
        breathingLoopRef.current?.stop();
        breathingLoopRef.current = null;
        if (speechHapticTimerRef.current) {
            clearInterval(speechHapticTimerRef.current);
            speechHapticTimerRef.current = null;
        }
    };

    const startThinkingPulse = () => {
        stopBreathing();
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, { toValue: 1.12, duration: 750, useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 1.0, duration: 750, useNativeDriver: true }),
            ]),
        );
        breathingLoopRef.current = loop;
        loop.start();
    };

    const startSpeechPulse = () => {
        stopBreathing();

        // High-frequency word cadence animation simulating dynamic spoken word pitch & syllables
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, { toValue: 1.24, duration: 130, useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 1.06, duration: 110, useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 1.30, duration: 170, useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 1.02, duration: 120, useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 1.20, duration: 150, useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 1.0, duration: 190, useNativeDriver: true }),
            ]),
        );
        breathingLoopRef.current = loop;
        loop.start();

        // Haptic vibration ticks synced with word speech frequency bursts
        speechHapticTimerRef.current = setInterval(() => {
            if (callStateRef.current === 'speaking') {
                Haptics.selectionAsync();
            } else {
                if (speechHapticTimerRef.current) {
                    clearInterval(speechHapticTimerRef.current);
                    speechHapticTimerRef.current = null;
                }
            }
        }, 260);
    };

    const settleScale = () => {
        stopBreathing();
        Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    };

    const setState = (next: CallState) => {
        callStateRef.current = next;
        setCallState(next);

        if (next === 'speaking') {
            startSpeechPulse();
        } else if (next === 'thinking') {
            startThinkingPulse();
        } else if (next === 'listening') {
            settleScale();
        } else {
            settleScale();
        }
    };

    const clearAllTimers = () => {
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
            idleTimerRef.current = null;
        }
        if (maxDurationTimerRef.current) {
            clearTimeout(maxDurationTimerRef.current);
            maxDurationTimerRef.current = null;
        }
        if (errorMessageTimerRef.current) {
            clearTimeout(errorMessageTimerRef.current);
            errorMessageTimerRef.current = null;
        }
    };

    const resetIdleTimer = () => {
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
        }
        idleTimerRef.current = setTimeout(() => {
            if (callStateRef.current !== 'ended') {
                handleEndCall('Call ended due to inactivity.');
            }
        }, IDLE_TIMEOUT_MS);
    };

    const handleEndCall = (reason?: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setState('ended');
        stopRecognizer();
        playerRef.current?.remove();
        wsRef.current?.close();
        clearAllTimers();
        if (reason) {
            Alert.alert('Call ended', reason, [{ text: 'OK', onPress: () => router.back() }]);
        } else {
            router.back();
        }
    };

    useFocusEffect(
        useCallback(() => {
        let cancelled = false;

        const connectWebSocket = async () => {
            const token = await SecureStorageService.getItem('authToken');
            if (!token) {
                Alert.alert('Sign-in required', 'Please sign in again to start a voice call.', [
                    { text: 'OK', onPress: () => router.back() },
                ]);
                return;
            }

            if (cancelled) return;

            const ws = new WebSocket(buildVoiceCallWsUrl(token));
            wsRef.current = ws;

            ws.onopen = () => {
                if (cancelled) return;
                reconnectAttemptsRef.current = 0;
                beginListening();
            };
            ws.onmessage = (event) => handleWsMessage(event.data);
            ws.onclose = () => {
                if (cancelled || callStateRef.current === 'ended') return;
                attemptReconnect();
            };
        };

        const attemptReconnect = () => {
            if (cancelled || callStateRef.current === 'ended') return;

            if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
                handleEndCall('The voice call connection was lost.');
                return;
            }

            reconnectAttemptsRef.current += 1;
            stopRecognizer();
            playerRef.current?.pause();
            setStatusMessage('Reconnecting…');
            setTimeout(() => {
                if (!cancelled && callStateRef.current !== 'ended') {
                    connectWebSocket();
                }
            }, RECONNECT_DELAY_MS);
        };

        const start = async () => {
            await setAudioModeAsync({
                allowsRecording: true,
                playsInSilentMode: true,
                interruptionMode: 'mixWithOthers',
            });

            const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
            if (!permission.granted) {
                Alert.alert('Permission needed', 'Please allow microphone access to start a voice call.', [
                    { text: 'OK', onPress: () => router.back() },
                ]);
                return;
            }

            if (cancelled) return;

            maxDurationTimerRef.current = setTimeout(() => {
                if (callStateRef.current !== 'ended') {
                    handleEndCall('This call reached the maximum length and was ended.');
                }
            }, MAX_CALL_DURATION_MS);
            resetIdleTimer();

            await connectWebSocket();
        };

        start();

        // A voice call doesn't make sense to keep running silently while the
        // app is backgrounded -- end it cleanly rather than leaving the mic
        // and socket alive with no visible call UI.
        const appStateSub = AppState.addEventListener('change', (nextState) => {
            if (nextState !== 'active' && callStateRef.current !== 'ended') {
                handleEndCall();
            }
        });

        return () => {
            cancelled = true;
            callStateRef.current = 'ended';
            stopRecognizer();
            playerRef.current?.remove();
            stopBreathing();
            clearAllTimers();
            wsRef.current?.close();
            appStateSub.remove();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []),
    );

    const startRecognizer = () => {
        if (recognizerActiveRef.current) return;
        recognizerActiveRef.current = true;
        ExpoSpeechRecognitionModule.start({
            lang: 'en-US',
            interimResults: true,
            continuous: true,
            volumeChangeEventOptions: { enabled: true, intervalMillis: 100 },
            // Strips the device's own speaker output (the AI's voice) back
            // out of the mic input, so it isn't picked up as new speech.
            iosVoiceProcessingEnabled: true,
        });
    };

    const stopRecognizer = () => {
        if (!recognizerActiveRef.current) return;
        recognizerActiveRef.current = false;
        ExpoSpeechRecognitionModule.stop();
    };

    const beginListening = () => {
        setLiveTranscript('');
        setState('listening');
        setStatusMessage('Listening…');
        startRecognizer();
    };

    useSpeechRecognitionEvent('volumechange', (event) => {
        if (callStateRef.current !== 'listening') return;

        // `value` ranges roughly -2 (silence) to 10 (loud). Map it to a
        // gentle 1.0-1.3 scale so the orb visibly reacts to the user's voice.
        const normalized = Math.max(0, Math.min(1, (event.value + 2) / 8));
        const targetScale = 1 + normalized * 0.3;
        Animated.timing(scaleAnim, { toValue: targetScale, duration: 120, useNativeDriver: true }).start();
    });

    useSpeechRecognitionEvent('result', (event) => {
        const transcript = event.results[0]?.transcript?.trim();

        // Barge-in gate: react to actual transcribed words, not raw sound
        // onset (the old 'speechstart' event fires for coughs, background
        // chatter, a chair creaking -- anything loud enough, not just
        // speech). A real transcript is a much stronger signal that this is
        // genuine human voice. Require more than one character so a stray
        // single-letter misfire doesn't cut the AI off.
        if (transcript && transcript.length > 1 && callStateRef.current === 'speaking') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            wsRef.current?.send(JSON.stringify({ type: 'cancel' }));
            turnIdRef.current = null;
            chunkQueueRef.current = [];
            isPlayingChunkRef.current = false;
            playerRef.current?.pause();
            setState('listening');
        }

        if (transcript) {
            setLiveTranscript(transcript);
        }

        if (event.isFinal && transcript && callStateRef.current !== 'thinking') {
            handleAsk(transcript);
        }
    });

    useSpeechRecognitionEvent('error', (event) => {
        recognizerActiveRef.current = false;
        if (event.error === 'not-allowed') {
            Alert.alert('Permission needed', 'Please allow microphone access to continue.', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        }
        // Other recognizer errors (no-speech, network hiccups, etc.) are
        // transient during a live call -- the loop restarts on 'end'.
    });

    useSpeechRecognitionEvent('end', () => {
        recognizerActiveRef.current = false;
        // The recognizer stops itself after each final result. Restart it
        // automatically whenever we're still meant to have the mic open
        // (listening for a question, or speaking and listening for a
        // barge-in).
        if (callStateRef.current === 'listening' || callStateRef.current === 'speaking') {
            startRecognizer();
        }
    });

    const handleAsk = (question: string) => {
        resetIdleTimer();
        stopRecognizer();
        const id = `${Date.now()}`;
        turnIdRef.current = id;
        chunkQueueRef.current = [];
        isPlayingChunkRef.current = false;
        turnDoneRef.current = false;

        setState('thinking');
        setStatusMessage(`"${question}"`);

        const body: Record<string, unknown> = { type: 'ask', id, person: personName, question, voice };
        if (familyMemberUserId) {
            body.familyMemberUserId = familyMemberUserId;
        }
        wsRef.current?.send(JSON.stringify(body));
    };

    const deleteChunkFile = (uri: string) => {
        try {
            new File(uri).delete();
        } catch {
            // Best-effort cleanup -- a leftover cache file isn't worth surfacing.
        }
    };

    const playNextChunk = () => {
        if (isPlayingChunkRef.current) return;

        const nextUri = chunkQueueRef.current.shift();
        if (!nextUri) {
            if (turnDoneRef.current && callStateRef.current === 'speaking') {
                beginListening();
            }
            return;
        }

        isPlayingChunkRef.current = true;

        // Reuse a single persistent player for the whole call instead of
        // creating a new one per chunk -- with a fresh AudioPlayer per
        // chunk, the previous instance wasn't guaranteed to have fully
        // stopped natively before the next one started playing, which
        // could sound like two overlapping voices.
        if (!playerRef.current) {
            const player = createAudioPlayer({ uri: nextUri });
            playerRef.current = player;
            player.addListener('playbackStatusUpdate', (status) => {
                if (status.didJustFinish) {
                    isPlayingChunkRef.current = false;
                    deleteChunkFile(nextUri);
                    playNextChunk();
                }
            });
            player.play();
        } else {
            playerRef.current.replace({ uri: nextUri });
            playerRef.current.play();
        }
    };

    const showTransientError = (message: string) => {
        setErrorMessage(message);
        if (errorMessageTimerRef.current) {
            clearTimeout(errorMessageTimerRef.current);
        }
        errorMessageTimerRef.current = setTimeout(() => setErrorMessage(''), 3000);
    };

    const handleWsMessage = (raw: string) => {
        let msg: any;
        try {
            msg = JSON.parse(raw);
        } catch {
            return;
        }

        if (msg.id && msg.id !== turnIdRef.current) return; // superseded by a barge-in

        if (msg.type === 'text') {
            setState('speaking');
            setStatusMessage(msg.answer);
            startRecognizer(); // listen for a barge-in while the AI talks
        } else if (msg.type === 'audio_chunk') {
            const uri = writeBase64AudioToFile(msg.audioBase64);
            chunkQueueRef.current.push(uri);
            playNextChunk();
        } else if (msg.type === 'done') {
            turnDoneRef.current = true;
            playNextChunk();
        } else if (msg.type === 'error') {
            if (callStateRef.current !== 'ended') {
                showTransientError(msg.message || "Sorry, something went wrong with that question.");
                beginListening();
            }
        }
    };

    const orbColor =
        callState === 'listening' ? '#8EA281' : callState === 'thinking' ? '#6E6D7A' : callState === 'speaking' ? '#6C8FD1' : '#3A3A3A';

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{hasSpecificPerson ? `Talking about ${personName}` : 'Voice call'}</Text>
            </View>

            <View style={styles.centerArea}>
                <ChatGPTVoiceOrb callState={callState} scaleAnim={scaleAnim} size={ms(180)} />
                <Text style={styles.statusLabel}>
                    {callState === 'starting' && 'Connecting…'}
                    {callState === 'listening' && (liveTranscript || 'Listening…')}
                    {callState === 'thinking' && 'Thinking…'}
                    {callState === 'speaking' && 'Speaking…'}
                </Text>
                {statusMessage && callState !== 'listening' ? (
                    <Text style={styles.transcript} numberOfLines={4}>
                        {statusMessage}
                    </Text>
                ) : null}
                {errorMessage ? <Text style={styles.errorLabel}>{errorMessage}</Text> : null}
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.endBtn} onPress={() => handleEndCall()}>
                    <Feather name="x" size={ms(26)} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    header: {
        alignItems: 'center',
        paddingTop: vs(12),
    },
    title: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: ms(15),
        fontWeight: '500',
    },
    centerArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: ms(32),
    },
    orb: {
        width: ms(160),
        height: ms(160),
        borderRadius: ms(80),
    },
    statusLabel: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: ms(15),
        marginTop: vs(28),
        textAlign: 'center',
    },
    transcript: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: ms(13),
        marginTop: vs(10),
        textAlign: 'center',
        lineHeight: vs(18),
    },
    errorLabel: {
        color: '#FF8080',
        fontSize: ms(13),
        marginTop: vs(14),
        textAlign: 'center',
        lineHeight: vs(18),
    },
    footer: {
        alignItems: 'center',
        paddingBottom: vs(40),
    },
    endBtn: {
        width: ms(64),
        height: ms(64),
        borderRadius: ms(32),
        backgroundColor: '#D9534F',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
