import { TimelineDataPoint, TimelineEntry } from '@/components/TimelineEntry';
import { FONTS } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/services/api';
import { resolveMediaUrl } from '@/utils/image';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ms, vs } from 'react-native-size-matters';

// ── Avatars ───────────────────────────────────────────────────────────────────
const AVATARS = {
    margaret: require('@/assets/images/dashboard/margaret.png'),
    robert:   require('@/assets/images/dashboard/robert.png'),
};

// ── Card colour palette (rotates by index) ────────────────────────────────────
const CARD_PALETTES = [
    { bgColor: '#E6E7DF', darkBgColor: '#1C1C19' },
    { bgColor: '#E5E2EE', darkBgColor: '#3E3D47' },
    { bgColor: '#DFE6EE', darkBgColor: '#252B35' },
    { bgColor: '#E5E4DF', darkBgColor: '#242420' },
];

// ── Map a raw API memory to a TimelineDataPoint ───────────────────────────────
function mapMemory(mem: any, idx: number): TimelineDataPoint {
    const palette = CARD_PALETTES[idx % CARD_PALETTES.length];
    const dateObj  = new Date(mem.date || mem.createdAt || '');
    const year     = isNaN(dateObj.getTime()) ? '—' : String(dateObj.getFullYear());
    const friendly = isNaN(dateObj.getTime())
        ? ''
        : dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    // Determine media type
    let type: TimelineDataPoint['type'] = 'text';
    if (mem.type === 'photo') type = 'image';
    else if (mem.type === 'video') type = 'video';
    else if (mem.type === 'voice') type = 'audio';

    // Resolve image URL for photo/video memories
    const fileUrl = mem.files?.[0]?.url ? resolveMediaUrl(mem.files[0].url) : undefined;

    return {
        id:       mem.id,
        memoryId: mem.id,
        year,
        type,
        title:    mem.title || 'Untitled',
        author:   mem.whoseMemoryIsThis || '',
        date:     friendly,
        content:  mem.narrative || undefined,
        tags:     Array.isArray(mem.tags) && mem.tags.length ? mem.tags : undefined,
        image:    type === 'image' && fileUrl ? { uri: fileUrl } : undefined,
        videoUrl: type === 'video' && fileUrl ? fileUrl : undefined,
        ...palette,
    };
}

// ── Filter chip type ──────────────────────────────────────────────────────────
interface FilterChip {
    id: string;          // 'mine' | userId
    label: string;
    userId?: string;     // undefined = own timeline
    avatar?: any;
}

export default function TimelineScreen() {
    const colors    = useAppTheme();
    const isDarkMode = useColorScheme() === 'dark';
    const router    = useRouter();
    const { user, familyMembers, fetchFamilyMembers } = useAuth();

    // ── Filter chips built from family members ───────────────────────────────
    const filterChips: FilterChip[] = [
        { id: 'mine', label: 'Yours' },
        ...(familyMembers
            ?.filter((m: any) => m.status?.toLowerCase() === 'accepted')
            ?.map((m: any) => {
                const avatarUrl = m.profilePicture?.url ? resolveMediaUrl(m.profilePicture.url) : null;
                return {
                    id:     m.userId,
                    label:  m.name,
                    userId: m.userId,
                    avatar: avatarUrl ? { uri: avatarUrl } : (m.name?.toLowerCase().includes('robert') ? AVATARS.robert : AVATARS.margaret),
                };
            }) ?? []),
    ];

    const [activeChipId, setActiveChipId] = useState('mine');

    // ── API state ─────────────────────────────────────────────────────────────
    const [timelineItems, setTimelineItems] = useState<TimelineDataPoint[]>([]);
    const [isLoading, setIsLoading]         = useState(true);
    const [isRefreshing, setIsRefreshing]   = useState(false);
    const [error, setError]                 = useState<string | null>(null);

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const fetchTimeline = useCallback(async (chipId: string, showSpinner = true) => {
        if (showSpinner) setIsLoading(true);
        setError(null);
        try {
            const activeChip = filterChips.find(c => c.id === chipId);
            const params     = activeChip?.userId ? `?familyMemberUserId=${activeChip.userId}` : '';
            console.log(`[Timeline] GET /memory-vault/timeline${params}`);
            const response = await api.get(`/memory-vault/timeline${params}`);
            console.log('[Timeline] success:', response.success);

            if (response.success) {
                console.log('[Timeline] Raw API Response Data:', JSON.stringify(response.data, null, 2));
                // Shape can be: { data: [{ date, memories }] } or { data: { timeline: [...] } }
                let raw: any[] = [];
                if (Array.isArray(response.data?.data)) {
                    raw = response.data.data;
                } else if (Array.isArray(response.data?.data?.timeline)) {
                    raw = response.data.data.timeline;
                } else if (Array.isArray(response.data?.timeline)) {
                    raw = response.data.timeline;
                } else if (Array.isArray(response.data)) {
                    raw = response.data;
                }

                // Flatten all memories from all date buckets
                const all: any[] = [];
                raw.forEach((bucket: any) => {
                    if (Array.isArray(bucket.memories)) all.push(...bucket.memories);
                });

                // Sort newest first, then map
                all.sort((a, b) =>
                    new Date(b.date || b.createdAt || 0).getTime() -
                    new Date(a.date || a.createdAt || 0).getTime()
                );

                const mapped = all.map(mapMemory);
                console.log('[Timeline] Mapped Timeline Items:', JSON.stringify(mapped, null, 2));
                setTimelineItems(mapped);
            } else {
                console.warn('[Timeline] API response success is false:', response);
                setError(response.message || 'Failed to load timeline.');
            }
        } catch (err: any) {
            console.error('[Timeline] Error:', err);
            setError(err?.message || 'A network error occurred.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, familyMembers]);

    // Refetch whenever the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchTimeline(activeChipId, false);
            fetchFamilyMembers().catch(err => console.error('[Timeline] Failed to sync family members:', err));
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [activeChipId, fetchFamilyMembers])
    );

    const handleChipPress = (chipId: string) => {
        setActiveChipId(chipId);
        fetchTimeline(chipId);
    };

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchTimeline(activeChipId, false);
    };

    // ── Subtitle ──────────────────────────────────────────────────────────────
    const subtitle = isLoading
        ? 'Loading…'
        : error
        ? 'Could not load timeline'
        : timelineItems.length === 0
        ? 'No memories yet'
        : `${timelineItems.length} memor${timelineItems.length === 1 ? 'y' : 'ies'} across time`;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.title, { color: colors.textDark }]}>Life Timeline</Text>
                    <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.iconBtn, { borderColor: colors.border }]}
                    onPress={() => router.push('/notifications')}
                >
                    <Feather name="bell" size={ms(20)} color={colors.textMuted} />
                </TouchableOpacity>
            </View>

            {/* Member filter chips */}
            {filterChips.length > 1 && (
                <View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterScroll}
                    >
                        {filterChips.map(chip => {
                            const isActive = activeChipId === chip.id;
                            return (
                                <TouchableOpacity
                                    key={chip.id}
                                    onPress={() => handleChipPress(chip.id)}
                                    style={[
                                        styles.filterBtn,
                                        {
                                            backgroundColor: isActive ? colors.primaryAlt : colors.cardBg,
                                            borderWidth: isActive ? 0 : 1,
                                            borderColor: colors.border,
                                        }
                                    ]}
                                >
                                    {chip.avatar && (
                                        <Image source={chip.avatar} style={styles.filterAvatar} />
                                    )}
                                    <Text style={[
                                        styles.filterText,
                                        { color: isActive ? '#FFFFFF' : colors.textMuted }
                                    ]}>
                                        {chip.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            )}

            {/* Timeline body */}
            <View style={styles.timelineWrapper}>
                <View style={[styles.timelineAxis, { backgroundColor: isDarkMode ? '#3E403A' : '#C4D0C8' }]} />

                {isLoading ? (
                    <View style={styles.centeredState}>
                        <ActivityIndicator size="large" color={colors.primaryAlt} />
                        <Text style={[styles.stateText, { color: colors.textMuted }]}>Loading timeline…</Text>
                    </View>

                ) : error ? (
                    <View style={styles.centeredState}>
                        <Feather name="alert-circle" size={ms(44)} color="#E88B8B" />
                        <Text style={[styles.stateText, { color: colors.textDark, marginTop: vs(12) }]}>{error}</Text>
                        <TouchableOpacity
                            style={[styles.retryBtn, { backgroundColor: colors.primaryAlt }]}
                            onPress={() => fetchTimeline(activeChipId)}
                        >
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>

                ) : timelineItems.length === 0 ? (
                    <View style={styles.centeredState}>
                        <Feather name="clock" size={ms(44)} color={colors.textMuted} />
                        <Text style={[styles.stateText, { color: colors.textDark, marginTop: vs(12) }]}>No memories yet</Text>
                        <Text style={[styles.stateSubText, { color: colors.textMuted }]}>
                            Add memories to see them appear on your timeline.
                        </Text>
                    </View>

                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.contentPadding}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefreshing}
                                onRefresh={onRefresh}
                                colors={[colors.primaryAlt]}
                            />
                        }
                    >
                        {timelineItems.map((item, index) => (
                            <TimelineEntry
                                key={item.id}
                                item={item}
                                index={index}
                                isDarkMode={isDarkMode}
                                colors={colors}
                                onPress={(id) => {
                                    router.push({ pathname: '/memory/[id]' as any, params: { id } });
                                }}
                            />
                        ))}
                        <View style={{ height: vs(100) }} />
                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: ms(20),
        paddingVertical: vs(16),
    },
    title: {
        fontFamily: FONTS.serif,
        fontSize: ms(28),
        fontWeight: '700',
    },
    subtitle: {
        fontFamily: FONTS.sans,
        fontSize: ms(13),
        marginTop: vs(2),
    },
    iconBtn: {
        width: ms(40),
        height: ms(40),
        borderRadius: ms(20),
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterScroll: {
        paddingHorizontal: ms(20),
        gap: ms(12),
        paddingBottom: vs(16),
    },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: ms(16),
        paddingVertical: vs(6),
        borderRadius: ms(20),
    },
    filterAvatar: {
        width: ms(24),
        height: ms(24),
        borderRadius: ms(12),
        marginRight: ms(8),
    },
    filterText: {
        fontFamily: FONTS.sans,
        fontWeight: '600',
        fontSize: ms(13),
    },
    timelineWrapper: {
        flex: 1,
        position: 'relative',
    },
    timelineAxis: {
        position: 'absolute',
        left: ms(30),
        top: 0,
        bottom: 0,
        width: ms(2),
    },
    contentPadding: {
        paddingLeft: ms(45),
        paddingRight: ms(16),
    },
    centeredState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: ms(32),
        paddingBottom: vs(60),
    },
    stateText: {
        fontFamily: FONTS.serif,
        fontSize: ms(16),
        fontWeight: '600',
        textAlign: 'center',
    },
    stateSubText: {
        fontFamily: FONTS.sans,
        fontSize: ms(13),
        textAlign: 'center',
        marginTop: vs(6),
        lineHeight: vs(18),
        opacity: 0.8,
    },
    retryBtn: {
        marginTop: vs(16),
        paddingHorizontal: ms(24),
        paddingVertical: vs(10),
        borderRadius: ms(12),
    },
    retryText: {
        color: '#FFFFFF',
        fontFamily: FONTS.sans,
        fontWeight: '600',
        fontSize: ms(14),
    },
});
