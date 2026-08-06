import { FONTS, LightTheme } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/services/api';
import { useNotificationStore } from '@/store/notification-store';
import { getAvatarSource, resolveMediaUrl } from '@/utils/image';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScaledSheet, ms, vs } from 'react-native-size-matters';

const displayTypeMap: Record<string, string> = {
    'photo': 'Photo',
    'video': 'Video',
    'voice': 'Voice',
    'journal': 'Note'
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

export default function DashboardScreen() {
    const colors = useAppTheme();
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const styles = useMemo(() => getStyles(colors), [colors]);
    const router = useRouter();
    const { user, familyMembers, fetchFamilyMembers, isProfilePictureLoading, setProfilePictureLoading } = useAuth();
    const [imageError, setImageError] = useState(false);
    const { unreadCount, fetchUnreadCount } = useNotificationStore();
    const [recentMemories, setRecentMemories] = useState<any[]>([]);

    const fetchRecentMemories = async () => {
        try {
            const response = await api.get('/memory-vault');
            if (response.success && response.data) {
                let list: any[] = [];
                if (response.data.data && Array.isArray(response.data.data.memories)) {
                    list = response.data.data.memories;
                } else if (Array.isArray(response.data.data)) {
                    list = response.data.data;
                } else if (Array.isArray(response.data.memories)) {
                    list = response.data.memories;
                } else if (Array.isArray(response.data)) {
                    list = response.data;
                }
                setRecentMemories(list.slice(0, 3));
            }
        } catch (e) {
            console.error('Failed to fetch recent memories:', e);
        }
    };

    useEffect(() => {
        setImageError(false);
        fetchUnreadCount();
        fetchFamilyMembers();
        fetchRecentMemories();
    }, [user?.profilePicture?.url]);

    const hasImage = !!(user?.profilePicture?.url || user?.avatarUrl) && !imageError;

    return (
        <SafeAreaView edges={['top']} style={styles.container}>
            <StatusBar
                barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
            />
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header Section */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Good afternoon,</Text>
                        <Text style={styles.userName}>{user?.firstName || user?.name || 'Sarah'}.</Text>
                        <Text style={styles.metrics}>2 profiles · 6 memories preserved</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity
                            style={styles.notificationBtn}
                            onPress={() => router.push('/notifications')}
                        >
                            <MaterialCommunityIcons name="bell-outline" size={26} color={colors.primaryAlt} />
                            {unreadCount > 0 && <View style={styles.notificationDot} />}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.avatarWrapper}
                            activeOpacity={0.8}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push('/profile' as any);
                            }}
                        >
                            {hasImage ? (
                                <Image
                                    source={getAvatarSource(user)}
                                    style={styles.avatar}
                                    onLoadStart={() => setProfilePictureLoading(true)}
                                    onLoadEnd={() => setProfilePictureLoading(false)}
                                    onError={() => {
                                        setProfilePictureLoading(false);
                                        setImageError(true);
                                    }}
                                />
                            ) : (
                                <View style={[styles.avatarPlaceholder, { backgroundColor: colorScheme === 'dark' ? '#1F1E24' : '#EAE6EC' }]}>
                                    <Feather name="user" size={20} color={colorScheme === 'dark' ? '#A0A0A0' : '#78849B'} />
                                </View>
                            )}
                            {isProfilePictureLoading && (
                                <View style={styles.imageLoadingContainer}>
                                    <ActivityIndicator size="small" color="#8EA181" />
                                </View>
                            )}
                            <View style={styles.onlineBadge} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Family Profiles Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Family Profiles</Text>
                        <TouchableOpacity style={styles.iconLabelBtn}>
                            <Feather name="users" size={14} color={colors.textMuted} />
                            <Text style={styles.iconLabel}>Family</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.familyList}
                        decelerationRate="fast"
                    >
                        {/* Add New Member Dotted Box */}
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push('/family-access?openInvite=true');
                            }}
                            style={styles.addMemberCard}
                        >
                            <View style={styles.addIconCircle}>
                                <Feather name="plus" size={24} color={colors.accentGreen} />
                            </View>
                            <Text style={styles.addMemberText}>Add New Member</Text>
                        </TouchableOpacity>

                        {familyMembers.map((member, idx) => {
                            const avatarUrl = member.profilePicture?.url
                                ? resolveMediaUrl(member.profilePicture.url)
                                : (member.avatarUrl ? resolveMediaUrl(member.avatarUrl) : (member.avatar ? resolveMediaUrl(member.avatar) : null));
                            const cleanName = (member.name || '').toLowerCase();
                            const avatarSource = avatarUrl
                                ? { uri: avatarUrl }
                                : (cleanName.includes('robert')
                                    ? require('@/assets/images/dashboard/robert.png')
                                    : cleanName.includes('margaret')
                                    ? require('@/assets/images/dashboard/margaret.png')
                                    : null);

                            const count = member.memories !== undefined ? member.memories : 0;

                            return (
                                <TouchableOpacity
                                    key={member.userId || member.id || String(idx)}
                                    activeOpacity={0.9}
                                    style={styles.memberCard}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        router.push({
                                            pathname: '/chat' as any,
                                            params: {
                                                person: member.name || 'Margaret',
                                                familyMemberUserId: member.userId || member.id
                                            }
                                        });
                                    }}
                                >
                                    {avatarSource ? (
                                        <Image
                                            source={avatarSource}
                                            style={styles.cardBgImage}
                                        />
                                    ) : (
                                        <View style={[styles.cardBgImage, { backgroundColor: colorScheme === 'dark' ? '#23222B' : '#3A3945', justifyContent: 'center', alignItems: 'center' }]}>
                                            <View style={{ width: ms(56), height: ms(56), borderRadius: ms(28), backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: vs(24) }}>
                                                <Feather name="user" size={ms(28)} color="rgba(255,255,255,0.7)" />
                                            </View>
                                        </View>
                                    )}
                                    <LinearGradient
                                        colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
                                        style={styles.cardGradient}
                                    >
                                        <View style={styles.memberCardFooter}>
                                            <Text style={styles.memberName}>{member.name}</Text>
                                            <Text style={styles.memberRelation}>
                                                {member.relation || (member.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1) : 'Member')}
                                            </Text>
                                            <View style={styles.memoriesBadge}>
                                                <View style={styles.smallDot} />
                                                <Text style={styles.memoriesCount}>
                                                    {count} {count === 1 ? 'memory' : 'memories'}
                                                </Text>
                                            </View>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Recent Memories Section */}
                <View style={[styles.section, { marginBottom: 10 }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Memories</Text>
                        <TouchableOpacity
                            style={styles.seeAllBtn}
                            onPress={() => router.push('/vault')}
                        >
                            <Text style={styles.seeAllText}>See all</Text>
                            <Feather name="chevron-right" size={16} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.memoriesList}>
                        {recentMemories.length === 0 ? (
                            <View style={{ alignItems: 'center', paddingVertical: vs(20) }}>
                                <Text style={{ color: colors.textMuted, fontFamily: FONTS.sans, fontSize: ms(13) }}>
                                    No memories preserved yet.
                                </Text>
                            </View>
                        ) : (
                            recentMemories.map((memory) => {
                                const hasHeroImage = (memory.type === 'photo' || memory.type === 'video') && memory.files && memory.files.length > 0;
                                const mediaUrl = hasHeroImage ? resolveMediaUrl(memory.files[0]?.url) : undefined;
                                const isAudio = memory.type === 'voice' || memory.type === 'audio' || memory.type === 'music';
                                const displayType = displayTypeMap[memory.type] || 'Note';

                                return (
                                    <TouchableOpacity
                                        key={memory.id}
                                        activeOpacity={0.8}
                                        style={styles.memoryItem}
                                        onPress={() => router.push({ pathname: '/memory/[id]', params: { id: memory.id } })}
                                    >
                                        {hasHeroImage && mediaUrl ? (
                                            <Image
                                                source={{ uri: mediaUrl }}
                                                style={styles.memoryThumb}
                                            />
                                        ) : isAudio ? (
                                            <View style={[styles.memoryThumb, { backgroundColor: isDarkMode ? '#222B26' : '#E8F2EC', justifyContent: 'center', alignItems: 'center' }]}>
                                                <Ionicons name="musical-notes-outline" size={ms(20)} color={isDarkMode ? '#8EA281' : '#5A754E'} />
                                            </View>
                                        ) : (
                                            <View style={[styles.memoryThumb, { backgroundColor: isDarkMode ? '#282733' : '#EFEBF6', justifyContent: 'center', alignItems: 'center' }]}>
                                                <Feather name="file-text" size={ms(20)} color={isDarkMode ? '#A594D0' : '#6C5896'} />
                                            </View>
                                        )}
                                        <View style={styles.memoryContent}>
                                            <Text style={styles.memoryTitle} numberOfLines={1}>
                                                {memory.title}
                                            </Text>
                                            <Text style={styles.memoryMeta} numberOfLines={1}>
                                                {memory.whoseMemoryIsThis || 'Unknown'} · {formatDate(memory.date)}
                                            </Text>
                                        </View>
                                        <View style={styles.tagBadge}>
                                            <Text style={styles.tagText}>{displayType}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </View>
                </View>

                {/* Call to Action Purple Box */}
                <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.ctaBanner}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push('/add-memory' as any);
                    }}
                >
                    <View style={styles.ctaIconWrapper}>
                        <Ionicons name="chatbubble-outline" size={20} color={colors.textMuted} />
                    </View>
                    <View style={styles.ctaContent}>
                        <Text style={styles.ctaTitle}>A Moment to Remember</Text>
                        <Text style={styles.ctaSubtitle}>
                            Write about something meaningful from your life.
                        </Text>
                    </View>
                    <Feather name="chevron-right" size={22} color={colors.textMuted} />
                </TouchableOpacity>

                {/* Spacer at bottom to lift view above tab bar visibility */}
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (colors: typeof LightTheme) => ScaledSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingBottom: '90@vs', // accommodate virtualized tab bar area
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: '24@ms',
        paddingTop: '16@vs',
        marginBottom: '30@vs',
    },
    greeting: {
        fontFamily: FONTS.sans,
        fontSize: '14@ms',
        color: colors.accentGreen,
        marginBottom: '2@vs',
    },
    userName: {
        fontFamily: FONTS.serif,
        fontSize: '38@ms',
        fontWeight: '600',
        color: colors.textDark,
        letterSpacing: 0.2,
    },
    metrics: {
        fontFamily: FONTS.sans,
        fontSize: '12@ms',
        color: colors.accentGreen,
        marginTop: '4@vs',
        opacity: 0.8,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: '16@ms',
        marginTop: '10@vs',
    },
    notificationBtn: {
        position: 'relative',
    },
    notificationDot: {
        position: 'absolute',
        top: 2,
        right: 3,
        width: '8@ms',
        height: '8@ms',
        borderRadius: '4@ms',
        backgroundColor: '#E88B8B', // visual alert pink/red hint
        borderWidth: 1,
        borderColor: colors.background,
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatar: {
        width: '42@ms',
        height: '42@ms',
        borderRadius: '21@ms',
    },
    avatarPlaceholder: {
        width: '42@ms',
        height: '42@ms',
        borderRadius: '21@ms',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageLoadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.15)',
        borderRadius: '21@ms',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: '12@ms',
        height: '12@ms',
        borderRadius: '6@ms',
        backgroundColor: '#8FA181', // Sage indicator
        borderWidth: 2,
        borderColor: colors.background,
    },
    section: {
        marginBottom: '25@vs',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: '24@ms',
        marginBottom: '16@vs',
    },
    sectionTitle: {
        fontFamily: FONTS.serif,
        fontSize: '17@ms',
        fontWeight: '600',
        color: colors.textDark,
    },
    iconLabelBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: '6@ms',
    },
    iconLabel: {
        fontFamily: FONTS.sans,
        fontSize: '13@ms',
        color: colors.textMuted,
    },
    seeAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: '4@ms',
    },
    seeAllText: {
        fontFamily: FONTS.sans,
        fontSize: '13@ms',
        color: colors.textMuted,
    },
    familyList: {
        paddingLeft: '24@ms',
        paddingRight: '12@ms',
        gap: '12@ms',
    },
    addMemberCard: {
        width: '135@ms',
        height: '175@ms',
        borderRadius: '20@ms',
        borderWidth: 1.5,
        borderColor: colors.accentGreen, // Using brand green
        borderStyle: 'dashed',
        backgroundColor: colors.btnSecondaryBg,
        justifyContent: 'center',
        alignItems: 'center',
        padding: '15@ms',
        opacity: 0.6,
    },
    addIconCircle: {
        width: '38@ms',
        height: '38@ms',
        borderRadius: '19@ms',
        backgroundColor: 'rgba(142, 165, 119, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '12@vs',
    },
    addMemberText: {
        fontFamily: FONTS.serif,
        fontSize: '13@ms',
        textAlign: 'center',
        color: colors.accentGreen,
        lineHeight: '18@ms',
    },
    memberCard: {
        width: '135@ms',
        height: '175@ms',
        borderRadius: '20@ms',
        overflow: 'hidden',
        backgroundColor: colors.cardBg,
    },
    cardBgImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    cardGradient: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: '14@ms',
    },
    memberCardFooter: {
        gap: '2@vs',
    },
    memberName: {
        fontFamily: FONTS.serif,
        fontSize: '16@ms',
        fontWeight: '600',
        color: '#FFFFFF',
    },
    memberRelation: {
        fontFamily: FONTS.sans,
        fontSize: '11@ms',
        color: 'rgba(255,255,255,0.7)',
    },
    memoriesBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: '4@ms',
        marginTop: '4@vs',
    },
    smallDot: {
        width: '4@ms',
        height: '4@ms',
        borderRadius: '2@ms',
        backgroundColor: '#FFFFFF',
    },
    memoriesCount: {
        fontFamily: FONTS.sans,
        fontSize: '10@ms',
        color: '#FFFFFF',
        opacity: 0.85,
    },
    memoriesList: {
        paddingHorizontal: '24@ms',
        gap: '12@vs',
    },
    memoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cardBg, // Using derived subtle dynamic bg
        borderRadius: '20@ms',
        padding: '12@ms',
        height: '75@vs',
    },
    memoryThumb: {
        width: '52@ms',
        height: '52@ms',
        borderRadius: '14@ms',
    },
    memoryContent: {
        flex: 1,
        marginLeft: '14@ms',
        justifyContent: 'center',
        gap: '2@vs',
    },
    memoryTitle: {
        fontFamily: FONTS.serif,
        fontSize: '15@ms',
        fontWeight: '500',
        color: colors.textDark,
    },
    memoryMeta: {
        fontFamily: FONTS.sans,
        fontSize: '11@ms',
        color: colors.textMuted,
    },
    tagBadge: {
        backgroundColor: colors.btnSecondaryBg,
        paddingHorizontal: '10@ms',
        paddingVertical: '6@vs',
        borderRadius: '12@ms',
    },
    tagText: {
        fontFamily: FONTS.sans,
        fontSize: '11@ms',
        color: colors.textMuted,
        fontWeight: '500',
    },
    ctaBanner: {
        marginHorizontal: '24@ms',
        marginTop: '10@vs',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cardBg, // using generalized cardBg 
        opacity: 0.85,
        borderRadius: '20@ms',
        padding: '16@ms',
        borderWidth: 1,
        borderColor: colors.border,
    },
    ctaIconWrapper: {
        width: '38@ms',
        height: '38@ms',
        borderRadius: '12@ms',
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ctaContent: {
        flex: 1,
        marginLeft: '14@ms',
        gap: '2@vs',
    },
    ctaTitle: {
        fontFamily: FONTS.serif,
        fontSize: '16@ms',
        fontWeight: '600',
        color: colors.textDark,
    },
    ctaSubtitle: {
        fontFamily: FONTS.sans,
        fontSize: '12@ms',
        color: colors.textMuted,
        lineHeight: '16@vs',
    },
});
