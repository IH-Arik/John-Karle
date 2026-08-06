import { FONTS } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    ActivityIndicator,
    Image,
    PanResponder,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ms, vs } from 'react-native-size-matters';
import { api } from '@/services/api';
import { getAvatarSource, resolveMediaUrl } from '@/utils/image';
import { ApiMemory } from '../(tabs)/vault';
import { useAuth } from '@/hooks/use-auth';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useMemoryStore, OpenedMemory } from '@/store/memory-store';
import Svg, { Path, Circle } from 'react-native-svg';
import { MacPersonasModal } from '@/components/MacPersonasModal';
import * as Haptics from 'expo-haptics';

const WAVE_HEIGHT = 20; // Height of the SVG canvas
const WAVE_AMPLITUDE = 3.5; // Amplitude of squiggles
const WAVE_LENGTH = 20; // Period of squiggles in pixels

const generateWavePath = (activeWidth: number, phase: number): string => {
    const centerY = WAVE_HEIGHT / 2;
    if (activeWidth <= 0) return `M 0 ${centerY}`;
    
    let d = `M 0 ${centerY}`;
    const step = 3; // Evaluate every 3 pixels for smooth rendering
    for (let x = 0; x <= activeWidth; x += step) {
        const y = centerY + WAVE_AMPLITUDE * Math.sin((2 * Math.PI * x) / WAVE_LENGTH - phase);
        d += ` L ${x} ${y}`;
    }
    // Cap at activeWidth exactly
    const yEnd = centerY + WAVE_AMPLITUDE * Math.sin((2 * Math.PI * activeWidth) / WAVE_LENGTH - phase);
    d += ` L ${activeWidth} ${yEnd}`;
    return d;
};

const displayTypeMap: Record<string, string> = {
    'photo': 'Photo',
    'video': 'Video',
    'voice': 'Voice Note',
    'journal': 'Journal Note'
};

const getCardBg = (type: string, isDarkMode: boolean) => {
    switch (type) {
        case 'photo':
            return isDarkMode ? '#1C1C19' : '#E6E7DF';
        case 'video':
            return isDarkMode ? '#3E3D47' : '#E5E2EE';
        case 'voice':
            return isDarkMode ? '#242729' : '#E4E8EB';
        case 'journal':
            return isDarkMode ? '#222220' : '#EAE8E4';
        default:
            return isDarkMode ? '#222220' : '#EAE8E4';
    }
};

const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
};

const formatTag = (tag: string) => {
    const clean = tag.trim();
    if (!clean) return '';
    const formatted = clean.startsWith('#') ? clean : `#${clean}`;
    return formatted.charAt(0) + formatted.charAt(1).toUpperCase() + formatted.slice(2);
};

const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function MemoryDetailScreen() {
    const { id, fromStories, showAiQuote } = useLocalSearchParams<{ id: string; fromStories?: string; showAiQuote?: string }>();
    const shouldShowAiQuote = fromStories === 'true' || showAiQuote === 'true';
    const router = useRouter();
    const colors = useAppTheme();
    const isDarkMode = useColorScheme() === 'dark';
    const { user, familyMembers } = useAuth();

    const [memory, setMemory] = useState<ApiMemory | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showMenu, setShowMenu] = useState(false);

    // AI Pull quote state
    const [quoteData, setQuoteData] = useState<{ pullQuote: string | null; commentary: string | null } | null>(null);
    const [isQuoteLoading, setIsQuoteLoading] = useState(false);
    const retryTimeoutRef = useRef<any>(null);

    // Store — opened memory cache
    const { openedMemory, setOpenedMemory, patchOpenedMemory, clearOpenedMemory } = useMemoryStore();

    const fetchQuote = useCallback(async (memoryId: string, currentRetry = 0) => {
        if (!memoryId) return;
        if (currentRetry === 0) {
            setIsQuoteLoading(true);
        }
        try {
            const res = await api.get(`/memory-vault/${memoryId}/quote`);
            if (res.success && res.data) {
                const data = res.data.data || res.data;
                const pullQuote = data?.pullQuote || null;
                const commentary = data?.commentary || null;
                
                setQuoteData({ pullQuote, commentary });

                // Retries a couple of times a few seconds apart if both fields are null
                if (!pullQuote && !commentary && currentRetry < 2) {
                    retryTimeoutRef.current = setTimeout(() => {
                        fetchQuote(memoryId, currentRetry + 1);
                    }, 3500);
                }
            }
        } catch (e) {
            console.log('[MemoryDetail] Fetch quote error:', e);
        } finally {
            setIsQuoteLoading(false);
        }
    }, []);

    // Keep local state in sync when the store is patched from the edit screen
    useEffect(() => {
        if (openedMemory && openedMemory.id === id) {
            setMemory(openedMemory as ApiMemory);
            if (shouldShowAiQuote) {
                fetchQuote(id, 0);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openedMemory, shouldShowAiQuote]);

    // Audio player — source is set after memory loads
    const audioPlayer = useAudioPlayer('');
    const audioStatus = useAudioPlayerStatus(audioPlayer);
    const isPlayingAudio = audioStatus.playing;

    // Seek bar state
    const seekBarRef = useRef<View>(null);
    const seekBarWidth = useRef(0);
    const seekBarPageX = useRef(0);
    const [isSeeking, setIsSeeking] = useState(false);
    const [seekPosition, setSeekPosition] = useState(0); // 0–1 fraction
    const [phase, setPhase] = useState(0);
    const [trackWidth, setTrackWidth] = useState(0);
    const [showPersonsModal, setShowPersonsModal] = useState(false);

    // Traveling wave animation loop when audio is playing
    useEffect(() => {
        if (!isPlayingAudio) return;
        let animationFrameId: number;
        let lastTime = Date.now();

        const tick = () => {
            const now = Date.now();
            const delta = now - lastTime;
            lastTime = now;
            // 0.008 radians per millisecond speed
            setPhase((prev) => (prev + 0.008 * delta) % (2 * Math.PI));
            animationFrameId = requestAnimationFrame(tick);
        };

        animationFrameId = requestAnimationFrame(tick);
        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [isPlayingAudio]);

    const currentTime = isSeeking ? seekPosition * (audioStatus.duration || 0) : (audioStatus.currentTime ?? 0);
    const duration = audioStatus.duration || 0;
    const progress = duration > 0 ? currentTime / duration : 0;

    // Live refs so PanResponder callbacks (created once) always see fresh values
    const durationRef = useRef(0);
    const audioPlayerRef = useRef(audioPlayer);
    useEffect(() => { durationRef.current = duration; }, [duration]);
    useEffect(() => { audioPlayerRef.current = audioPlayer; }, [audioPlayer]);
    const panResponder = useRef(
        PanResponder.create({
            // Capture-phase flags so ScrollView never steals the gesture
            onStartShouldSetPanResponder: () => true,
            onStartShouldSetPanResponderCapture: () => true,
            onMoveShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponderCapture: () => true,
            onPanResponderGrant: (evt) => {
                setIsSeeking(true);
                const x = evt.nativeEvent.pageX - seekBarPageX.current;
                const fraction = Math.min(Math.max(x / (seekBarWidth.current || 1), 0), 1);
                setSeekPosition(fraction);
            },
            onPanResponderMove: (evt) => {
                // Use pageX minus bar's absolute X for reliable position during drag
                const x = evt.nativeEvent.pageX - seekBarPageX.current;
                const fraction = Math.min(Math.max(x / (seekBarWidth.current || 1), 0), 1);
                setSeekPosition(fraction);
            },
            onPanResponderRelease: (evt) => {
                const x = evt.nativeEvent.pageX - seekBarPageX.current;
                const fraction = Math.min(Math.max(x / (seekBarWidth.current || 1), 0), 1);
                setSeekPosition(fraction);
                setIsSeeking(false);
                // Read from refs — not stale closure values
                const dur = durationRef.current;
                if (dur > 0) {
                    audioPlayerRef.current.seekTo(fraction * dur);
                }
            },
            onPanResponderTerminate: () => {
                setIsSeeking(false);
            },
        })
    ).current;

    const handleEdit = () => {
        setShowMenu(false);
        router.push({ pathname: '/memory/edit' as any, params: { id } });
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Memory',
            'Are you sure you want to delete this memory forever?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive', 
                    onPress: async () => {
                        try {
                            setIsLoading(true);
                            const response = await api.delete(`/memory-vault/${id}`);
                            if (response.success) {
                                Alert.alert('Success', 'Memory deleted successfully.');
                                router.back();
                            } else {
                                Alert.alert('Error', response.message || 'Failed to delete memory.');
                            }
                        } catch (err: any) {
                            Alert.alert('Error', err?.message || 'A network error occurred.');
                        } finally {
                            setIsLoading(false);
                        }
                    } 
                }
            ]
        );
    };

    const isMyMemory = useMemo(() => {
        if (!memory || !user) return false;
        const cleanName = (memory.whoseMemoryIsThis || '').trim().toLowerCase();
        const currentUserName = (user.name || user.firstName || '').trim().toLowerCase();
        return cleanName === 'self' || cleanName === 'mine' || cleanName === currentUserName;
    }, [memory, user]);

    const resolveAvatarForPerson = useCallback((rawName: string) => {
        const cleanName = rawName.trim().toLowerCase();
        const currentUserName = (user?.name || user?.firstName || '').trim().toLowerCase();
        
        // 1. Logged in user check
        if (cleanName === 'self' || cleanName === 'mine' || cleanName === 'me' || cleanName === currentUserName) {
            return { type: 'uri', source: getAvatarSource(user) };
        }
        
        // 2. Family member check
        const member = familyMembers?.find(
            (m: any) =>
                m.name?.trim().toLowerCase() === cleanName ||
                m.userId === rawName.trim() ||
                m.email?.trim().toLowerCase() === cleanName
        );

        if (member) {
            const avatarUrl = member.profilePicture?.url
                ? resolveMediaUrl(member.profilePicture.url)
                : (member.avatarUrl ? resolveMediaUrl(member.avatarUrl) : null);
            if (avatarUrl) {
                return { type: 'uri', source: { uri: avatarUrl } };
            }
        }

        // 3. Known sample names check
        if (cleanName.includes('margaret')) {
            return { type: 'uri', source: require('@/assets/images/dashboard/margaret.png') };
        }
        if (cleanName.includes('robert')) {
            return { type: 'uri', source: require('@/assets/images/dashboard/robert.png') };
        }

        return { type: 'placeholder', source: null };
    }, [user, familyMembers]);

    const taggedPersons = useMemo(() => {
        if (!memory || !memory.whoseMemoryIsThis) return [];
        const names = memory.whoseMemoryIsThis.split(',').map((n: string) => n.trim()).filter(Boolean);
        return names.map((name: string) => ({
            name,
            avatarInfo: resolveAvatarForPerson(name)
        }));
    }, [memory, resolveAvatarForPerson]);

    const fetchMemoryDetail = useCallback(async () => {
        if (!id) return;

        // If we already have this memory in the store, use it immediately (no spinner)
        const cached = useMemoryStore.getState().openedMemory;
        if (cached && cached.id === id) {
            setMemory(cached as ApiMemory);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            console.log(`[MemoryDetail] Fetching detail for memory ${id}...`);
            const response = await api.get(`/memory-vault/${id}`);
            console.log('[MemoryDetail] Response success:', response.success, 'status:', response.status);
            console.log('[MemoryDetail] Raw API Response:', JSON.stringify(response));
            
            if (response.success && response.data) {
                const apiData = response.data;
                const isInnerSuccess = apiData.success !== false;
                
                let memoryObj = null;
                if (apiData.data?.id) {
                    memoryObj = apiData.data;
                } else if (apiData.data?.memory) {
                    memoryObj = apiData.data.memory;
                } else if (apiData.memory) {
                    memoryObj = apiData.memory;
                }
                
                if (isInnerSuccess && memoryObj) {
                    setMemory(memoryObj);
                    // Cache in store for instant updates from edit screen
                    setOpenedMemory(memoryObj as OpenedMemory);
                } else {
                    const errorMsg = apiData.error?.message || apiData.message || 'Failed to retrieve memory details.';
                    console.warn('[MemoryDetail] Response indicates failure or missing memory:', response);
                    setError(errorMsg);
                }
            } else {
                console.warn('[MemoryDetail] Request failed:', response);
                setError(response.message || 'Failed to retrieve memory details.');
            }
        } catch (err: any) {
            console.error('[MemoryDetail] Fetch error:', err);
            setError(err?.message || 'A network error occurred while loading memory.');
        } finally {
            setIsLoading(false);
        }
    }, [id, setOpenedMemory]);

    useEffect(() => {
        if (id) {
            fetchMemoryDetail();
            if (shouldShowAiQuote) {
                fetchQuote(id, 0);
            }
        }
        // Clear the cache when leaving this screen
        return () => {
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
            clearOpenedMemory();
        };
    }, [id, fetchMemoryDetail, fetchQuote, clearOpenedMemory, shouldShowAiQuote]);

    const mediaUrl = useMemo(() => {
        if (!memory || !memory.files || memory.files.length === 0) return undefined;
        return resolveMediaUrl(memory.files[0]?.url);
    }, [memory]);

    const displayType = useMemo(() => {
        if (!memory) return '';
        return displayTypeMap[memory.type] || 'Note';
    }, [memory]);

    // Load audio source once we know it's a voice note and we have a URL
    useEffect(() => {
        if (memory?.type === 'voice' && mediaUrl) {
            audioPlayer.replace({ uri: mediaUrl });
        }
    }, [memory?.type, mediaUrl]);

    const handleToggleAudio = useCallback(() => {
        if (isPlayingAudio) {
            audioPlayer.pause();
        } else {
            audioPlayer.play();
        }
    }, [audioPlayer, isPlayingAudio]);

    const videoSource = useMemo(() => {
        if (!mediaUrl) return '';
        return {
            uri: mediaUrl,
            // Cache video segments to disk so backward seeks reuse
            // already-downloaded data instead of re-fetching from the server.
            useCaching: true,
        };
    }, [mediaUrl]);

    const player = useVideoPlayer(videoSource, playerInstance => {
        playerInstance.loop = false;
        // Buffer aggressively ahead so the user can scrub without stalling
        playerInstance.bufferOptions = {
            preferredForwardBufferDuration: 60,
            waitsToMinimizeStalling: true,
            minBufferForPlayback: 2,
            prioritizeTimeOverSizeThreshold: true,
        };
    });

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primaryAlt || '#8EA281'} />
                <Text style={{ marginTop: vs(12), color: colors.textMuted, fontFamily: FONTS.sans, fontSize: ms(14) }}>
                    Loading memory details...
                </Text>
            </SafeAreaView>
        );
    }

    if (error || !memory) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', paddingHorizontal: ms(20) }]}>
                <Feather name="alert-circle" size={ms(48)} color="#E88B8B" />
                <Text style={[styles.errorText, { color: colors.textDark, marginTop: vs(16) }]}>{error || 'Memory not found'}</Text>
                <TouchableOpacity 
                    style={[styles.retryBtn, { backgroundColor: colors.primaryAlt }]} 
                    onPress={fetchMemoryDetail}
                >
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.backBtnTextOnly, { marginTop: vs(16) }]} 
                    onPress={() => router.back()}
                >
                    <Text style={{ color: colors.primaryAlt, fontFamily: FONTS.sans, fontWeight: '600' }}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.backBtn, { backgroundColor: isDarkMode ? '#2E2E33' : '#E2E3E5' }]}
                    onPress={() => router.back()}
                >
                    <Feather name="arrow-left" size={ms(20)} color={isDarkMode ? '#FFFFFF' : '#2D2C39'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textDark }]}>{displayType}</Text>
                <TouchableOpacity
                    style={[styles.backBtn, { backgroundColor: isDarkMode ? '#2E2E33' : '#E2E3E5' }]}
                    onPress={() => setShowMenu(true)}
                >
                    <Feather name="more-horizontal" size={ms(20)} color={isDarkMode ? '#FFFFFF' : '#2D2C39'} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* Hero Media Preview */}
                {mediaUrl && memory.type === 'video' ? (
                    <View style={styles.mediaContainer}>
                        <VideoView
                            player={player}
                            style={styles.heroImage}
                            nativeControls={true}
                        />
                    </View>
                ) : (mediaUrl && memory.type === 'photo' ? (
                    <View style={styles.mediaContainer}>
                        <Image source={{ uri: mediaUrl }} style={styles.heroImage} />
                    </View>
                ) : null)}

                {/* Voice Note waveform / player block */}
                {memory.type === 'voice' ? (
                    <View style={[styles.voicePlayer, { backgroundColor: getCardBg('voice', isDarkMode) }]}>
                        <View style={styles.playerTop}>
                            <TouchableOpacity 
                                style={[styles.playButton, { backgroundColor: colors.primaryAlt }]}
                                onPress={handleToggleAudio}
                            >
                                <Feather name={isPlayingAudio ? "pause" : "play"} size={ms(24)} color="#FFF" style={!isPlayingAudio ? { marginLeft: ms(2) } : undefined} />
                            </TouchableOpacity>
                            <View style={{ flex: 1, marginLeft: ms(16) }}>
                                <Text style={[styles.voiceTitle, { color: isDarkMode ? '#8EA281' : colors.textDark }]}>Voice Recording</Text>
                                <Text style={[styles.voiceSub, { color: colors.textMuted }]}>
                                    {memory.files?.[0]?.originalName || 'voice-note.mp3'}
                                </Text>
                            </View>
                        </View>
                        {/* Seek bar */}
                        <View
                            ref={seekBarRef}
                            style={styles.seekTrackWrapper}
                            onLayout={() => {
                                seekBarRef.current?.measure((_x, _y, w, _h, pageX) => {
                                    seekBarWidth.current = w;
                                    seekBarPageX.current = pageX;
                                    setTrackWidth(w);
                                });
                            }}
                            {...panResponder.panHandlers}
                        >
                            {/* Wavy seekbar track */}
                            <View style={styles.waveformContainer}>
                                <Svg width="100%" height={WAVE_HEIGHT} style={{ overflow: 'visible' }}>
                                    {/* Inactive Track - Thick straight line */}
                                    <Path
                                        d={`M ${progress * trackWidth} ${WAVE_HEIGHT / 2} L ${trackWidth} ${WAVE_HEIGHT / 2}`}
                                        fill="none"
                                        stroke={isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}
                                        strokeWidth={4}
                                        strokeLinecap="round"
                                    />
                                    {/* Active Track - Squiggly sine wave */}
                                    <Path
                                        d={generateWavePath(progress * trackWidth, phase)}
                                        fill="none"
                                        stroke={colors.primaryAlt}
                                        strokeWidth={3}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    {/* Seek Thumb - circle centered on progress edge */}
                                    {progress * trackWidth > 0 && (
                                        <Circle
                                            cx={progress * trackWidth}
                                            cy={WAVE_HEIGHT / 2}
                                            r={6}
                                            fill={colors.primaryAlt}
                                        />
                                    )}
                                </Svg>
                            </View>
                        </View>

                        {/* Time labels */}
                        <View style={styles.timeRow}>
                            <Text style={[styles.timeText, { color: colors.textMuted }]}>
                                {formatTime(currentTime)}
                            </Text>
                            <Text style={[styles.timeText, { color: colors.textMuted }]}>
                                {formatTime(duration)}
                            </Text>
                        </View>
                    </View>
                ) : null}

                {/* Text / narrative Details Card */}
                <View style={[styles.contentCard, { backgroundColor: getCardBg(memory.type, isDarkMode) }]}>
                    <View style={styles.topRow}>
                        <Text style={[styles.title, { color: isDarkMode ? '#8EA281' : colors.textDark }]}>{memory.title}</Text>
                        <Text style={[styles.metaText, { color: colors.textMuted }]}>
                            {isMyMemory ? 'Mine' : memory.whoseMemoryIsThis} · {formatDate(memory.date)}
                        </Text>
                        {memory.location ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: vs(4) }}>
                                <Feather name="map-pin" size={ms(12)} color={isDarkMode ? '#8EA281' : colors.textMuted} style={{ marginRight: ms(4) }} />
                                <Text style={[styles.metaText, { color: colors.textMuted }]}>{memory.location}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* AI Pull-Quote & Commentary Block — Only shown when opened from Stories */}
                    {shouldShowAiQuote && (
                        isQuoteLoading && !quoteData ? (
                            <View style={[styles.quoteCard, { backgroundColor: isDarkMode ? 'rgba(142,162,129,0.1)' : '#F2F6F0' }]}>
                                <ActivityIndicator size="small" color="#8EA281" />
                                <Text style={[styles.quotePlaceholderText, { color: isDarkMode ? '#A0A0A0' : '#666' }]}>Preparing AI quote...</Text>
                            </View>
                        ) : (quoteData && (quoteData.pullQuote || quoteData.commentary) ? (
                            <View style={[styles.quoteCard, { backgroundColor: isDarkMode ? 'rgba(142,162,129,0.12)' : '#F2F6F0', borderColor: 'rgba(142,162,129,0.3)', borderWidth: 1 }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: vs(6) }}>
                                    <Feather name="book-open" size={ms(14)} color="#8EA281" style={{ marginRight: ms(6) }} />
                                    <Text style={{ fontSize: ms(11), fontFamily: FONTS.serif, color: '#8EA281', letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: '600' }}>
                                        AI Insight
                                    </Text>
                                </View>
                                {quoteData.pullQuote ? (
                                    <Text style={[styles.pullQuoteText, { color: isDarkMode ? '#E0E7DC' : '#2D3E2B' }]}>
                                        "{quoteData.pullQuote}"
                                    </Text>
                                ) : null}
                                {quoteData.commentary ? (
                                    <Text style={[styles.commentaryText, { color: isDarkMode ? '#B0C2A8' : '#4E6347' }]}>
                                        {quoteData.commentary}
                                    </Text>
                                ) : null}
                            </View>
                        ) : null)
                    )}

                    <Text style={[styles.narrative, { color: isDarkMode ? '#D0D0D0' : '#444' }]}>
                        {memory.narrative}
                    </Text>

                    {memory.tags && memory.tags.length > 0 && (
                        <View style={styles.tagRow}>
                            {memory.tags.map((t: string) => (
                                <View
                                    key={t}
                                    style={[
                                        styles.tag,
                                        {
                                            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#E2E7EA',
                                            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : '#B7C5CE',
                                        }
                                    ]}
                                >
                                    <Text style={[styles.tagText, { color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#8398A9' }]}>
                                        {formatTag(t)}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <View style={[styles.divider, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' }]} />

                    <TouchableOpacity
                        style={styles.authorRow}
                        activeOpacity={0.8}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setShowPersonsModal(true);
                        }}
                    >
                        <Text style={[styles.authorText, { color: colors.textMuted }]}>Whose Memory:</Text>
                        <View style={styles.avatarStackContainer}>
                            {taggedPersons.slice(0, 3).map((item, idx) => {
                                const isFirst = idx === 0;
                                return (
                                    <View
                                        key={`${item.name}-${idx}`}
                                        style={[
                                            styles.avatarStackCircle,
                                            {
                                                marginLeft: isFirst ? ms(8) : -ms(12),
                                                borderColor: isDarkMode ? '#222220' : '#EAE8E4',
                                                zIndex: 10 - idx,
                                                backgroundColor: isDarkMode ? '#323239' : '#DDE0D8',
                                            }
                                        ]}
                                    >
                                        {item.avatarInfo.type === 'uri' && item.avatarInfo.source ? (
                                            <Image source={item.avatarInfo.source} style={styles.avatarStackImg} />
                                        ) : (
                                            <Feather name="user" size={ms(16)} color={isDarkMode ? '#AAA' : '#666'} />
                                        )}
                                    </View>
                                );
                            })}
                            {taggedPersons.length > 3 && (
                                <View
                                    style={[
                                        styles.avatarStackCircle,
                                        styles.moreBadgeCircle,
                                        {
                                            marginLeft: -ms(12),
                                            borderColor: isDarkMode ? '#222220' : '#EAE8E4',
                                            zIndex: 0,
                                        }
                                    ]}
                                >
                                    <Text style={styles.moreBadgeText}>+{taggedPersons.length - 3}</Text>
                                </View>
                            )}
                        </View>
                        <Feather name="chevron-right" size={ms(14)} color={colors.textMuted} style={{ marginLeft: ms(6) }} />
                    </TouchableOpacity>
                </View>

                {/* macOS Animated Personas Modal */}
                <MacPersonasModal
                    visible={showPersonsModal}
                    onClose={() => setShowPersonsModal(false)}
                    persons={taggedPersons}
                    isDarkMode={isDarkMode}
                />

                {/* Bottom Spacer */}
                <View style={{ height: vs(40) }} />

            </ScrollView>

            {/* Absolute overlay dropdown menu */}
            {showMenu && (
                <View style={StyleSheet.absoluteFillObject}>
                    <TouchableOpacity 
                        style={{ flex: 1 }} 
                        activeOpacity={1} 
                        onPress={() => setShowMenu(false)}
                    >
                        <View style={[
                            styles.menuDropdown, 
                            { 
                                backgroundColor: isDarkMode ? '#2E2E33' : '#FFFFFF',
                                borderColor: isDarkMode ? '#4A4A4A' : '#E2E3E5',
                            }
                        ]}>
                            <TouchableOpacity 
                                style={styles.menuItem} 
                                onPress={() => {
                                    setShowMenu(false);
                                    handleEdit();
                                }}
                            >
                                <Feather name="edit-2" size={ms(16)} color={colors.textDark} style={{ marginRight: ms(10) }} />
                                <Text style={[styles.menuItemText, { color: colors.textDark }]}>Edit</Text>
                            </TouchableOpacity>
                            
                            <View style={[styles.menuDivider, { backgroundColor: isDarkMode ? '#4A4A4A' : '#E2E3E5' }]} />
                            
                            <TouchableOpacity 
                                style={styles.menuItem} 
                                onPress={() => {
                                    setShowMenu(false);
                                    handleDelete();
                                }}
                            >
                                <Feather name="trash-2" size={ms(16)} color="#E88B8B" style={{ marginRight: ms(10) }} />
                                <Text style={[styles.menuItemText, { color: '#E88B8B' }]}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: ms(20),
        paddingVertical: vs(12),
    },
    backBtn: {
        width: ms(35),
        height: ms(35),
        borderRadius: ms(12),
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontFamily: FONTS.serif,
        fontSize: ms(20),
        fontWeight: '500',
    },
    scrollContent: {
        paddingHorizontal: ms(20),
        paddingTop: vs(10),
    },
    mediaContainer: {
        width: '100%',
        height: vs(240),
        borderRadius: ms(24),
        overflow: 'hidden',
        position: 'relative',
        marginBottom: vs(20),
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    heroImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    videoPlayOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playIconBg: {
        width: ms(60),
        height: ms(60),
        borderRadius: ms(30),
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    voicePlayer: {
        width: '100%',
        borderRadius: ms(24),
        padding: ms(20),
        marginBottom: vs(20),
    },
    playerTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    playButton: {
        width: ms(48),
        height: ms(48),
        borderRadius: ms(24),
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    voiceTitle: {
        fontFamily: FONTS.serif,
        fontSize: ms(16),
        fontWeight: '600',
    },
    voiceSub: {
        fontFamily: FONTS.sans,
        fontSize: ms(12),
        marginTop: vs(2),
    },
    seekTrackWrapper: {
        marginTop: vs(20),
        paddingVertical: vs(10), // Expand hit area vertically
        justifyContent: 'center',
    },
    waveformContainer: {
        height: vs(WAVE_HEIGHT),
        width: '100%',
        justifyContent: 'center',
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: vs(6),
    },
    timeText: {
        fontFamily: FONTS.sans,
        fontSize: ms(11),
    },
    contentCard: {
        width: '100%',
        borderRadius: ms(24),
        padding: ms(20),
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
    },
    topRow: {
        marginBottom: vs(16),
    },
    title: {
        fontFamily: FONTS.serif,
        fontSize: ms(22),
        fontWeight: '600',
        lineHeight: vs(28),
    },
    metaText: {
        fontFamily: FONTS.sans,
        fontSize: ms(12),
        marginTop: vs(4),
    },
    narrative: {
        fontFamily: FONTS.sans,
        fontSize: ms(15),
        lineHeight: vs(22),
        marginBottom: vs(20),
    },
    quoteCard: {
        borderRadius: ms(16),
        padding: ms(14),
        marginBottom: vs(16),
        flexDirection: 'column',
    },
    quotePlaceholderText: {
        fontFamily: FONTS.sans,
        fontSize: ms(12),
        fontStyle: 'italic',
        marginTop: vs(6),
    },
    pullQuoteText: {
        fontFamily: FONTS.serif,
        fontSize: ms(15),
        fontStyle: 'italic',
        lineHeight: vs(21),
        marginBottom: vs(6),
        fontWeight: '500',
    },
    commentaryText: {
        fontFamily: FONTS.sans,
        fontSize: ms(13),
        lineHeight: vs(18),
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: ms(8),
    },
    tag: {
        paddingHorizontal: ms(12),
        paddingVertical: vs(6),
        borderRadius: ms(20),
        borderWidth: 1,
    },
    tagText: {
        fontSize: ms(12),
        fontWeight: '500',
        fontFamily: FONTS.sans,
    },
    errorText: {
        fontFamily: FONTS.serif,
        fontSize: ms(16),
        textAlign: 'center',
        lineHeight: vs(22),
    },
    retryBtn: {
        paddingHorizontal: ms(20),
        paddingVertical: vs(10),
        borderRadius: ms(10),
        marginTop: vs(12),
    },
    retryText: {
        color: '#FFFFFF',
        fontFamily: FONTS.sans,
        fontWeight: '600',
        fontSize: ms(14),
    },
    backBtnTextOnly: {
        padding: ms(8),
    },
    divider: {
        height: 1,
        marginVertical: vs(16),
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    authorText: {
        fontFamily: FONTS.sans,
        fontSize: ms(13),
    },
    avatarStackContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarStackCircle: {
        width: ms(34),
        height: ms(34),
        borderRadius: ms(17),
        borderWidth: 2,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarStackImg: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    moreBadgeCircle: {
        backgroundColor: '#D2EAD8',
    },
    moreBadgeText: {
        fontFamily: FONTS.sans,
        fontSize: ms(12),
        fontWeight: '600',
        color: '#2A5A35',
    },
    menuDropdown: {
        position: 'absolute',
        top: vs(55),
        right: ms(20),
        borderRadius: ms(12),
        borderWidth: 1,
        paddingVertical: vs(4),
        width: ms(130),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        zIndex: 1000,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: vs(12),
        paddingHorizontal: ms(16),
    },
    menuItemText: {
        fontFamily: FONTS.sans,
        fontSize: ms(14),
        fontWeight: '500',
    },
    menuDivider: {
        height: 1,
        width: '100%',
    },
});
