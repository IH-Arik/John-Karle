import { FONTS } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/services/api';
import { resolveMediaUrl } from '@/utils/image';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ms, vs } from 'react-native-size-matters';
import { useVideoPlayer, VideoView } from 'expo-video';

export interface ApiMemory {
    id: string;
    type: 'photo' | 'video' | 'voice' | 'journal';
    whoseMemoryIsThis: string;
    files: {
        key: string;
        url: string;
        originalName: string;
        mimeType: string;
        size: number;
    }[];
    title: string;
    narrative: string;
    location?: string;
    date: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
}

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

const getPillBg = (type: string, isDarkMode: boolean) => {
    if (isDarkMode) return '#8EA281';
    return (type === 'voice' || type === 'journal' ? '#A2B5C1' : 'rgba(0,0,0,0.15)');
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

const displayTypeMap: Record<string, string> = {
    'photo': 'Photo',
    'video': 'Video',
    'voice': 'Voice',
    'journal': 'Journal'
};

const VideoPreview = ({ url, style }: { url: string; style: any }) => {
    const player = useVideoPlayer({ uri: url, useCaching: true }, player => {
        player.muted = true;
        player.loop = false;
        player.bufferOptions = {
            preferredForwardBufferDuration: 60,
            waitsToMinimizeStalling: true,
            minBufferForPlayback: 2,
            prioritizeTimeOverSizeThreshold: true,
        };
    });
    return (
        <VideoView
            player={player}
            style={style}
            nativeControls={false}
        />
    );
};

export default function MemoryVaultScreen() {
    const colors = useAppTheme();
    const isDarkMode = useColorScheme() === 'dark';
    const router = useRouter();
    const { user } = useAuth();
    const currentUserName = user?.name || user?.firstName || 'Tanvir Hasan';
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    // API State
    const [memories, setMemories] = useState<ApiMemory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const categories = ['All', 'Photos', 'Videos', 'Notes', 'Voice'];
    const quickTags = ['#Family', '#Summer', '#Lake', '#Wedding', '#Love'];

    const fetchMemories = useCallback(async (showIndicator = true) => {
        if (showIndicator) {
            setIsLoading(true);
        }
        setError(null);
        try {
            console.log('[MemoryVault] Fetching memories from API /memory-vault...');
            const response = await api.get('/memory-vault');
            console.log('[MemoryVault] API Response success:', response.success);
            let memoriesList: ApiMemory[] | null = null;
            if (response.success && response.data) {
                if (response.data.data && Array.isArray(response.data.data.memories)) {
                    memoriesList = response.data.data.memories;
                } else if (Array.isArray(response.data.data)) {
                    memoriesList = response.data.data;
                } else if (Array.isArray(response.data.memories)) {
                    memoriesList = response.data.memories;
                } else if (Array.isArray(response.data)) {
                    memoriesList = response.data;
                }
            }

            if (memoriesList !== null) {
                console.log(`[MemoryVault] Loaded ${memoriesList.length} memories.`);
                setMemories(memoriesList);
            } else {
                console.warn('[MemoryVault] Unexpected API response format:', response);
                setError(response.message || 'Failed to retrieve memories.');
            }
        } catch (err: any) {
            console.error('[MemoryVault] Fetch error:', err);
            setError(err?.message || 'A network error occurred while loading memories.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchMemories(false);
        }, [fetchMemories])
    );

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchMemories(false);
    }, [fetchMemories]);

    const filteredMemories = useMemo(() => {
        return memories.filter((item: ApiMemory) => {
            // 1. Category filter
            if (activeCategory !== 'All') {
                const categoryTypeMap: Record<string, string> = {
                    'Photos': 'photo',
                    'Videos': 'video',
                    'Notes': 'journal',
                    'Voice': 'voice'
                };
                const mappedType = categoryTypeMap[activeCategory];
                if (item.type !== mappedType) return false;
            }

            // 2. Search query filter
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase().trim();
                const titleMatch = item.title?.toLowerCase().includes(query);
                const narrativeMatch = item.narrative?.toLowerCase().includes(query);
                const tagMatch = item.tags?.some(tag => tag.toLowerCase().includes(query));
                return titleMatch || narrativeMatch || tagMatch;
            }

            return true;
        });
    }, [memories, activeCategory, searchQuery]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: vs(100) }}>
                    <ActivityIndicator size="large" color={colors.primaryAlt || '#8EA281'} />
                    <Text style={{ marginTop: vs(12), color: colors.textMuted, fontFamily: FONTS.sans, fontSize: ms(14) }}>
                        Loading memories...
                    </Text>
                </View>
            );
        }

        if (error) {
            return (
                <View style={styles.errorContainer}>
                    <Feather name="alert-circle" size={ms(48)} color="#E88B8B" />
                    <Text style={[styles.errorText, { color: colors.textDark }]}>{error}</Text>
                    <TouchableOpacity
                        style={[styles.retryBtn, { backgroundColor: colors.primaryAlt }]}
                        onPress={() => fetchMemories()}
                    >
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (filteredMemories.length === 0) {
            return (
                <View style={styles.emptyContainer}>
                    <Feather name="folder-minus" size={ms(48)} color={colors.textMuted} />
                    <Text style={[styles.emptyText, { color: colors.textDark }]}>No memories found</Text>
                    <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                        {searchQuery ? 'Try adjusting your search filters' : 'Start preserving your family legacy by adding a memory'}
                    </Text>
                </View>
            );
        }

        return filteredMemories.map(item => {
            const hasHeroImage = (item.type === 'photo' || item.type === 'video') && item.files && item.files.length > 0;
            const mediaUrl = hasHeroImage ? resolveMediaUrl(item.files[0]?.url) : undefined;
            const displayType = displayTypeMap[item.type] || 'Note';

            return (
                <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.9}
                    onPress={() => router.push({ pathname: '/memory/[id]', params: { id: item.id } })}
                    style={[styles.memoryCard, { backgroundColor: getCardBg(item.type, isDarkMode) }]}
                >
                    {item.type === 'video' && mediaUrl ? (
                        <View style={styles.heroContainer}>
                            <VideoPreview url={mediaUrl} style={styles.cardHero} />
                            <View style={styles.playOverlay}>
                                <View style={styles.playIconCircle}>
                                    <Feather name="play" size={ms(20)} color="#FFF" style={{ marginLeft: ms(2) }} />
                                </View>
                            </View>
                        </View>
                    ) : (item.type === 'photo' && mediaUrl ? (
                        <Image source={{ uri: mediaUrl }} style={styles.cardHero} />
                    ) : null)}
                    <View style={styles.cardContent}>
                        <View style={styles.topRow}>
                            {!mediaUrl && (
                                <View style={[
                                    styles.iconCircle,
                                    {
                                        backgroundColor: isDarkMode ? '#4A5560' : '#A6B4BD',
                                        borderRadius: ms(16),
                                        width: ms(48),
                                        height: ms(48)
                                    }
                                ]}>
                                    <Feather
                                        name={item.type === 'voice' ? 'mic' : 'file-text'}
                                        size={ms(24)}
                                        color="#FFF"
                                    />
                                </View>
                            )}
                            <View style={{ flex: 1, marginLeft: !mediaUrl ? ms(12) : 0 }}>
                                <Text style={[styles.cardTitle, { color: isDarkMode ? '#8EA281' : colors.textDark }]}>{item.title}</Text>
                                <Text style={[styles.cardMeta, { color: colors.textMuted }]}>
                                    {item.whoseMemoryIsThis} · {formatDate(item.date)}{item.location ? ` · ${item.location}` : ''}
                                </Text>
                            </View>
                            <View style={[
                                styles.typePill,
                                {
                                    backgroundColor: getPillBg(item.type, isDarkMode),
                                    borderRadius: ms(12)
                                }
                            ]}>
                                <Text style={styles.typeText}>{displayType}</Text>
                            </View>
                        </View>

                        <Text style={[styles.cardDesc, { color: isDarkMode ? '#A1A1A1' : '#5B605B', marginTop: vs(8) }]} numberOfLines={3}>
                            {item.narrative}
                        </Text>

                        {item.tags && item.tags.length > 0 && (
                            <View style={[styles.tagRow, { marginTop: vs(8) }]}>
                                {item.tags.map((t: string) => (
                                    <View
                                        key={t}
                                        style={[
                                            styles.cardTag,
                                            {
                                                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#E2E7EA',
                                                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : '#B7C5CE',
                                                borderWidth: 1,
                                                borderRadius: ms(20)
                                            }
                                        ]}
                                    >
                                        <Text style={[styles.cardTagText, { color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#8398A9' }]}>
                                            {formatTag(t)}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            );
        });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.title, { color: colors.textDark }]}>Memory Vault</Text>
                    <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                        {isLoading ? 'Loading memories...' : `${memories.length} ${memories.length === 1 ? 'memory' : 'memories'} preserved`}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: ms(8) }}>
                    <TouchableOpacity
                        style={[styles.iconBtn, { borderColor: colors.border }]}
                        onPress={() => router.push('/chat')}
                    >
                        <Feather name="message-square" size={ms(20)} color={colors.primaryAlt || '#8EA281'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.iconBtn, { borderColor: colors.border }]}
                        onPress={() => router.push('/notifications')}
                    >
                        <Feather name="bell" size={ms(20)} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Scrollable Content Region */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        colors={[colors.primaryAlt || '#8EA281']}
                    />
                }
            >
                {/* Moved Search Bar inside Scroll */}
                <View style={styles.searchSection}>
                    <View style={[styles.searchBox, { backgroundColor: isDarkMode ? '#2C2C2E' : '#EBEAE3' }]}>
                        <Feather name="search" size={ms(18)} color="#8A8D84" style={{ marginRight: ms(10) }} />
                        <TextInput
                            style={[styles.searchInput, { color: isDarkMode ? '#FFFFFF' : '#333' }]}
                            placeholder="Search memories..."
                            placeholderTextColor="#8A8D84"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                {/* Ask AI Prominent Banner Card */}
                <View style={{ paddingHorizontal: ms(20), marginBottom: vs(4) }}>
                    <TouchableOpacity
                        activeOpacity={0.85}
                        style={[
                            styles.aiBanner,
                            {
                                backgroundColor: isDarkMode ? 'rgba(142,162,129,0.14)' : '#EFF4EC',
                                borderColor: isDarkMode ? 'rgba(142,162,129,0.35)' : '#C4D5BF',
                            }
                        ]}
                        onPress={() => router.push('/chat')}
                    >
                        <View style={[styles.aiBannerIconCircle, { backgroundColor: isDarkMode ? '#283325' : '#FFFFFF' }]}>
                            <Feather name="message-square" size={ms(16)} color="#8EA281" />
                        </View>
                        <View style={{ flex: 1, marginLeft: ms(10) }}>
                            <Text style={[styles.aiBannerTitle, { color: isDarkMode ? '#FFFFFF' : '#2D2C39' }]}>
                                Ask AI about memories
                            </Text>
                            <Text style={[styles.aiBannerSub, { color: isDarkMode ? '#A0A0A0' : '#6A7568' }]}>
                                Query family stories, events & details
                            </Text>
                        </View>
                        <Feather name="chevron-right" size={ms(18)} color="#8EA281" />
                    </TouchableOpacity>
                </View>

                {/* Moved Filters Group inside Scroll */}
                <View style={styles.filterArea}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollGap}>
                        {categories.map(cat => {
                            const isAct = activeCategory === cat;
                            return (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => setActiveCategory(cat)}
                                    style={[
                                        styles.catBadge,
                                        { backgroundColor: isAct ? colors.primaryAlt : '#E4E5DE' }
                                    ]}
                                >
                                    <Text style={[styles.catText, { color: isAct ? '#FFF' : '#8A8D84' }]}>{cat}</Text>
                                </TouchableOpacity>
                            )
                        })}
                    </ScrollView>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.scrollGap, { marginTop: vs(12) }]}>
                        {quickTags.map(tag => {
                            const isTagAct = searchQuery === tag;
                            return (
                                <TouchableOpacity
                                    key={tag}
                                    style={[
                                        styles.tagOutline,
                                        isTagAct && { backgroundColor: '#7A9BA7' }
                                    ]}
                                    onPress={() => setSearchQuery(isTagAct ? '' : tag)}
                                >
                                    <Text style={[styles.tagOutlineText, { color: isTagAct ? '#FFF' : '#7A9BA7' }]}>{tag}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {renderContent()}

                {/* Inline Submit Action integrated at the bottom of the feed */}
                <View style={styles.fabContainer}>
                    <TouchableOpacity
                        style={[styles.fab, { backgroundColor: '#9FA0BA' }]}
                        activeOpacity={0.8}
                        onPress={() => router.push('/add-memory')}
                    >
                        <Feather name="plus" size={ms(20)} color="#FFFFFF" style={{ marginRight: ms(6) }} />
                        <Text style={styles.fabText}>Add Memory</Text>
                    </TouchableOpacity>
                </View>

                {/* Space buffer for bottom navigation */}
                <View style={{ height: vs(120) }} />
            </ScrollView>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
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
    searchSection: {
        paddingHorizontal: ms(20),
        marginBottom: vs(12),
    },
    aiBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: ms(12),
        borderRadius: ms(16),
        borderWidth: 1,
    },
    aiBannerIconCircle: {
        width: ms(36),
        height: ms(36),
        borderRadius: ms(18),
        justifyContent: 'center',
        alignItems: 'center',
    },
    aiBannerTitle: {
        fontFamily: FONTS.serif,
        fontSize: ms(14),
        fontWeight: '600',
    },
    aiBannerSub: {
        fontFamily: FONTS.sans,
        fontSize: ms(11),
        marginTop: vs(1),
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        height: vs(44),
        borderRadius: ms(10),
        paddingHorizontal: ms(12),
    },
    searchInput: {
        flex: 1,
        fontFamily: FONTS.sans,
        fontSize: ms(14),
        color: '#333',
    },
    filterArea: {
        marginBottom: vs(20),
    },
    scrollGap: {
        paddingHorizontal: ms(20),
        gap: ms(10),
    },
    catBadge: {
        paddingHorizontal: ms(20),
        paddingVertical: vs(8),
        borderRadius: ms(8),
    },
    catText: {
        fontFamily: FONTS.sans,
        fontWeight: '600',
        fontSize: ms(13),
    },
    tagOutline: {
        paddingHorizontal: ms(14),
        paddingVertical: vs(6),
        borderRadius: ms(20),
        backgroundColor: '#E4EFF5',
    },
    tagOutlineText: {
        fontFamily: FONTS.sans,
        fontSize: ms(12),
        fontWeight: '600',
    },
    listContent: {
        gap: vs(14),
    },
    memoryCard: {
        marginHorizontal: ms(16),
        borderRadius: ms(16),
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    cardHero: {
        width: '100%',
        height: vs(160),
        resizeMode: 'cover',
    },
    heroContainer: {
        position: 'relative',
        width: '100%',
        height: vs(160),
    },
    playOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playIconCircle: {
        width: ms(40),
        height: ms(40),
        borderRadius: ms(20),
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: {
        padding: ms(12),
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: vs(6),
    },
    cardTitle: {
        fontFamily: FONTS.serif,
        fontSize: ms(15),
        fontWeight: '600',
    },
    cardMeta: {
        fontFamily: FONTS.sans,
        fontSize: ms(10),
        marginTop: vs(2),
    },
    typePill: {
        backgroundColor: 'rgba(0,0,0,0.15)',
        paddingHorizontal: ms(8),
        paddingVertical: vs(2),
        borderRadius: ms(4),
    },
    typeText: {
        color: '#F5F5F5',
        fontSize: ms(10),
        fontWeight: '600',
    },
    cardDesc: {
        fontFamily: FONTS.sans,
        fontSize: ms(12),
        lineHeight: vs(16),
        marginBottom: vs(12),
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: ms(8),
    },
    cardTag: {
        paddingHorizontal: ms(10),
        paddingVertical: vs(4),
    },
    cardTagText: {
        fontSize: ms(10),
        fontWeight: '500',
    },
    iconCircle: {
        width: ms(36),
        height: ms(36),
        borderRadius: ms(18),
        backgroundColor: 'rgba(0,0,0,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fabContainer: {
        width: '100%',
        alignItems: 'flex-end',
        paddingHorizontal: ms(20),
        marginTop: vs(8),
    },
    fab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: vs(12),
        paddingHorizontal: ms(20),
        borderRadius: ms(25),
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    fabText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: ms(14),
        fontFamily: FONTS.sans,
    },
    errorContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: vs(40),
        paddingHorizontal: ms(20),
        gap: vs(12),
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
        marginTop: vs(8),
    },
    retryText: {
        color: '#FFFFFF',
        fontFamily: FONTS.sans,
        fontWeight: '600',
        fontSize: ms(14),
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: vs(60),
        paddingHorizontal: ms(30),
        gap: vs(8),
    },
    emptyText: {
        fontFamily: FONTS.serif,
        fontSize: ms(18),
        fontWeight: '600',
        marginTop: vs(12),
    },
    emptySubtext: {
        fontFamily: FONTS.sans,
        fontSize: ms(13),
        textAlign: 'center',
        lineHeight: vs(18),
        opacity: 0.8,
    },
});
