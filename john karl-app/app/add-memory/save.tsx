import { FONTS } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ms, vs } from 'react-native-size-matters';
import { useAuth } from '@/hooks/use-auth';
import { useMemoryStore } from '@/store/memory-store';
import { getAvatarSource, resolveMediaUrl } from '@/utils/image';

const STEPS = ['Type', 'Story', 'Tags', 'Save'];

export default function SaveReviewScreen() {
    const router = useRouter();
    const isDarkMode = useColorScheme() === 'dark';
    const { user, familyMembers } = useAuth();
    const { draft, createMemory, isCreating } = useMemoryStore();

    // Chromatic Sync Engine
    const palette = {
        bg: isDarkMode ? '#121212' : '#F9F8F6',
        textDark: isDarkMode ? '#FFFFFF' : '#2D2C39',
        backBg: isDarkMode ? '#2E2E33' : '#E2E3E5',
        trackActive: '#8EA281',
        btnPrimary: '#8EA281',

        // Preview Card Specifics
        cardBg: isDarkMode ? '#2D2C35' : '#EBF1F5',
        cardIconBg: isDarkMode ? '#E2E3E5' : '#FFFFFF',
        cardTagBg: isDarkMode ? '#393A42' : '#D3DFE8',
        cardTagText: isDarkMode ? '#A0A7B5' : '#78849B',
        divider: isDarkMode ? '#44454D' : '#D0D7DE',

        // Alert Banner Specifics
        bannerBg: isDarkMode ? '#212122' : '#E4E3EC',
        bannerText: isDarkMode ? '#B0B0B0' : '#5D5C6A'
    };

    const typeConfig = useMemo(() => {
        switch (draft.type) {
            case 'photo':
                return { label: 'PHOTO', icon: 'image' as const };
            case 'video':
                return { label: 'VIDEO', icon: 'video' as const };
            case 'voice':
                return { label: 'VOICE', icon: 'mic' as const };
            case 'journal':
                return { label: 'JOURNAL', icon: 'file-text' as const };
            default:
                return { label: 'JOURNAL', icon: 'file-text' as const };
        }
    }, [draft.type]);

    const formattedDate = useMemo(() => {
        if (!draft.date) return '';
        try {
            const d = new Date(draft.date);
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
        } catch (e) {
            return draft.date;
        }
    }, [draft.date]);

    const personaAvatar = useMemo(() => {
        const cleanName = (draft.whoseMemoryIsThis || '').trim().toLowerCase();
        const currentUserName = (user?.name || user?.firstName || '').trim().toLowerCase();
        
        // 1. Check if it's the logged-in user
        if (cleanName === 'self' || cleanName === 'mine' || cleanName === currentUserName) {
            return getAvatarSource(user);
        }
        
        // 2. Look up in familyMembers list from global auth store
        const member = familyMembers?.find(
            (m: any) =>
                m.name?.trim().toLowerCase() === cleanName ||
                m.userId === draft.whoseMemoryIsThis ||
                m.email?.trim().toLowerCase() === cleanName
        );

        if (member) {
            const avatarUrl = member.profilePicture?.url ? resolveMediaUrl(member.profilePicture.url) : null;
            if (avatarUrl) {
                return { uri: avatarUrl };
            }
        }
        
        // 3. Fallbacks for Margaret/Robert or default avatar
        if (cleanName.includes('margaret')) {
            return require('@/assets/images/dashboard/margaret.png');
        }
        if (cleanName.includes('robert')) {
            return require('@/assets/images/dashboard/robert.png');
        }
        
        return require('@/assets/images/dashboard/avatar.png');
    }, [draft.whoseMemoryIsThis, user, familyMembers]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.backBtn, { backgroundColor: palette.backBg }]}
                    onPress={() => router.back()}
                >
                    <Feather name="arrow-left" size={ms(20)} color={isDarkMode ? '#FFFFFF' : '#2D2C39'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: palette.textDark }]}>Add a Memory</Text>
            </View>

            {/* Stepper: Complete lock-step configuration! All 4 active */}
            <View style={styles.stepperContainer}>
                <View style={styles.stepperRow}>
                    {STEPS.map((step) => (
                        <View key={step} style={styles.stepWrapper}>
                            <View style={[
                                styles.stepTrack,
                                { backgroundColor: palette.trackActive }
                            ]} />
                            <Text style={[
                                styles.stepLabel,
                                { color: palette.trackActive }
                            ]}>
                                {step}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                <Text style={[styles.sectionHeader, { color: palette.textDark, marginBottom: vs(20) }]}>
                    Review your memory before saving it to the vault.
                </Text>

                {/* The Cinematic Preview Composite Card */}
                <View style={[styles.reviewCard, { backgroundColor: palette.cardBg }]}>

                    {draft.type === 'photo' && draft.fileUri ? (
                        <Image source={{ uri: draft.fileUri }} style={styles.cardHero} />
                    ) : null}

                    {/* Sub-Header: Type Ident */}
                    <View style={styles.cardTypeRow}>
                        <View style={[styles.iconSquircle, { backgroundColor: palette.cardIconBg }]}>
                            <Feather name={typeConfig.icon} size={ms(20)} color={isDarkMode ? '#8EA281' : '#A8B4A6'} />
                        </View>
                        <Text style={styles.typeLabel}>{typeConfig.label}</Text>
                    </View>

                    {/* Content Stack: Title -> Narrative -> Date */}
                    <Text style={[styles.memTitle, { color: isDarkMode ? '#FFFFFF' : '#2D2C39' }]}>
                        {draft.title || 'Untitled Memory'}
                    </Text>

                    <Text style={[styles.memNarrative, { color: isDarkMode ? '#A0A0A0' : '#78849B' }]}>
                        {draft.narrative || 'No narrative provided.'}
                    </Text>

                    <Text style={[styles.memDate, { color: isDarkMode ? '#A0A0A0' : '#78849B' }]}>
                        {formattedDate}{draft.location ? ` • ${draft.location}` : ''}
                    </Text>

                    {/* Local Tag Array Display */}
                    {draft.tags && draft.tags.length > 0 && (
                        <View style={styles.tagsRow}>
                            {draft.tags.map(tag => (
                                <View key={tag} style={[styles.miniTag, { backgroundColor: palette.cardTagBg }]}>
                                    <Text style={[styles.miniTagText, { color: palette.cardTagText }]}>{tag}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Subtle Geometric Separation */}
                    <View style={[styles.cardDivider, { backgroundColor: palette.divider }]} />

                    {/* Footer Row: Locked Persona Data */}
                    <View style={styles.personaRow}>
                        <Image
                            source={personaAvatar}
                            style={styles.avatar}
                        />
                        <Text style={styles.personaName}>{draft.whoseMemoryIsThis}</Text>
                    </View>

                </View>

                {/* Post-Saving Informational Banner */}
                <View style={[styles.infoBanner, { backgroundColor: palette.bannerBg }]}>
                    <Text style={[styles.infoText, { color: palette.bannerText }]}>
                        <Text style={{ fontWeight: 'bold', color: isDarkMode ? '#FFFFFF' : '#2D2C39' }}>After saving, </Text>
                        this memory will appear in the Vault, Timeline, and will be available for the AI to reference in conversations.
                    </Text>
                </View>

            </ScrollView>

            {/* Final Anchor Directive */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: palette.btnPrimary }]}
                    activeOpacity={0.9}
                    disabled={isCreating}
                    onPress={async () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        const result = await createMemory();
                        if (result.success) {
                            Alert.alert(
                                'Success',
                                'Your memory has been preserved in the vault.',
                                [
                                    {
                                        text: 'OK',
                                        onPress: () => {
                                            router.replace('/(tabs)/vault');
                                        }
                                    }
                                ]
                            );
                        } else {
                            Alert.alert('Error', result.message || 'Failed to save memory.');
                        }
                    }}
                >
                    {isCreating ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Text style={styles.saveBtnText}>Save to Vault</Text>
                    )}
                </TouchableOpacity>
            </View>

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
        paddingHorizontal: ms(20),
        paddingVertical: vs(12),
    },
    backBtn: {
        width: ms(35),
        height: ms(35),
        borderRadius: ms(12),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: ms(16),
    },
    headerTitle: {
        fontFamily: FONTS.serif,
        fontSize: ms(20),
        fontWeight: '500',
    },
    stepperContainer: {
        paddingHorizontal: ms(20),
        marginTop: vs(10),
        marginBottom: vs(10),
    },
    stepperRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: ms(10),
    },
    stepWrapper: {
        flex: 1,
        alignItems: 'center',
    },
    stepTrack: {
        height: vs(4),
        width: '100%',
        borderRadius: ms(2),
        marginBottom: vs(6),
    },
    stepLabel: {
        fontFamily: FONTS.serif,
        fontSize: ms(11),
    },
    scrollContent: {
        paddingHorizontal: ms(20),
        paddingTop: vs(15),
        paddingBottom: vs(120),
    },
    sectionHeader: {
        fontFamily: FONTS.serif,
        fontSize: ms(16),
        fontWeight: '400',
    },
    reviewCard: {
        width: '100%',
        borderRadius: ms(24),
        padding: ms(20),
        marginBottom: vs(20),
    },
    cardTypeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ms(12),
        marginBottom: vs(16),
    },
    iconSquircle: {
        width: ms(40),
        height: ms(40),
        borderRadius: ms(12),
        justifyContent: 'center',
        alignItems: 'center',
    },
    typeLabel: {
        fontFamily: FONTS.sans,
        fontSize: ms(14),
        color: '#8A9A86', // The specialized light green text from screenshot
        fontWeight: '600',
        letterSpacing: ms(1),
    },
    memTitle: {
        fontFamily: FONTS.serif,
        fontSize: ms(24),
        fontWeight: '500',
        marginBottom: vs(8),
    },
    memNarrative: {
        fontFamily: FONTS.sans,
        fontSize: ms(16),
        marginBottom: vs(8),
    },
    memDate: {
        fontFamily: FONTS.sans,
        fontSize: ms(15),
        marginBottom: vs(12),
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: ms(8),
        marginBottom: vs(20),
    },
    miniTag: {
        paddingHorizontal: ms(12),
        paddingVertical: vs(6),
        borderRadius: ms(14),
    },
    miniTagText: {
        fontFamily: FONTS.sans,
        fontSize: ms(12),
        fontWeight: '500',
    },
    cardDivider: {
        height: 1,
        width: '100%',
        marginBottom: vs(16),
    },
    personaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ms(10),
    },
    avatar: {
        width: ms(26),
        height: ms(26),
        borderRadius: ms(13),
    },
    personaName: {
        fontFamily: FONTS.serif,
        fontSize: ms(15),
        color: '#8A9A86',
    },
    infoBanner: {
        width: '100%',
        borderRadius: ms(16),
        padding: ms(20),
    },
    infoText: {
        fontFamily: FONTS.sans,
        fontSize: ms(14),
        lineHeight: vs(20),
    },
    footer: {
        position: 'absolute',
        bottom: vs(30),
        left: ms(20),
        right: ms(20),
    },
    saveBtn: {
        width: '100%',
        paddingVertical: vs(14),
        borderRadius: ms(12),
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    saveBtnText: {
        fontFamily: FONTS.serif,
        color: '#FFFFFF',
        fontSize: ms(16),
        fontWeight: '600',
    },
    cardHero: {
        width: '100%',
        height: vs(160),
        borderRadius: ms(16),
        marginBottom: vs(12),
        resizeMode: 'cover',
    }
});
