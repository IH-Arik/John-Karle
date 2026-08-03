import { FONTS } from '@/constants/theme';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useMemo } from 'react';
import {
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

// Assets local pointers mapping
const AVATARS = {
    margaret: require('@/assets/images/dashboard/margaret.png'),
    robert: require('@/assets/images/dashboard/robert.png'),
    mine: require('@/assets/images/dashboard/avatar.png'), // Sarah
};

const MEMORY_TYPES = [
    { id: 'photo', label: 'Photo', desc: 'Upload a photograph', icon: 'image', lib: 'Feather', bg: '#BAC5B6', activeBg: '#8FA087' },
    { id: 'video', label: 'Video', desc: 'Add a video clip', icon: 'video', lib: 'Feather', bg: '#A9A9C0', activeBg: '#7F7FA0' },
    { id: 'journal', label: 'Journal', desc: 'Write a memory', icon: 'file-text', lib: 'Feather', bg: '#E2E1DD', activeBg: '#C8C7C1' },
    { id: 'voice', label: 'Voice', desc: 'Record a voice note', icon: 'mic', lib: 'Feather', bg: '#A2B6C2', activeBg: '#7D9CAE' }
];

const STEPS = ['Type', 'Story', 'Tags', 'Save'];

export default function AddMemoryScreen() {
    const router = useRouter();
    const isDarkMode = useColorScheme() === 'dark';
    const { user, familyMembers } = useAuth();
    const { resetDraft, setDraft } = useMemoryStore();

    const personas = useMemo(() => {
        const list = [];
        
        // 1. Add Self
        list.push({
            id: 'mine',
            name: 'Mine',
            displayName: user?.name || user?.firstName || 'Sarah Mitchell',
            img: getAvatarSource(user),
            isSelf: true
        });

        // 2. Add family members
        if (familyMembers && familyMembers.length > 0) {
            familyMembers.forEach((member) => {
                const avatarUrl = member.profilePicture?.url ? resolveMediaUrl(member.profilePicture.url) : null;
                const img = avatarUrl ? { uri: avatarUrl } : (member.name?.toLowerCase().includes('robert') ? AVATARS.robert : AVATARS.margaret);
                
                list.push({
                    id: member.userId || member.email,
                    name: member.name,
                    displayName: member.name,
                    img: img,
                    isSelf: false
                });
            });
        }

        return list;
    }, [user, familyMembers]);

    // State Logic
    const [selectedType, setSelectedType] = useState<'photo' | 'video' | 'voice' | 'journal'>('photo');
    const [selectedPersona, setSelectedPersona] = useState('mine');

    useEffect(() => {
        resetDraft();
    }, [resetDraft]);

    // Semantic theme hooks derived from screenshots
    const palette = {
        bg: isDarkMode ? '#1A1A1A' : '#F9F8F6',
        textDark: isDarkMode ? '#FFFFFF' : '#2D2C39',
        subText: isDarkMode ? '#A0A0A0' : '#767676',
        backBg: isDarkMode ? '#2E2E33' : '#E2E3E5',
        trackBg: isDarkMode ? '#2C2C2C' : '#EBECE8',
        trackActive: '#8EA281',
        btnPrimary: '#8EA281',
        btnText: '#FFFFFF',
        personaBg: isDarkMode ? '#2E2E33' : '#E2E6E0', // Soft background for inactive pills
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]}>
            {/* Header Architecture */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.backBtn, { backgroundColor: palette.backBg }]}
                    onPress={() => router.back()}
                >
                    <Feather name="arrow-left" size={ms(20)} color={isDarkMode ? '#FFFFFF' : '#2D2C39'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: palette.textDark }]}>Add a Memory</Text>
            </View>

            {/* Segmented Progress Tracker */}
            <View style={styles.stepperContainer}>
                <View style={styles.stepperRow}>
                    {STEPS.map((step, index) => {
                        const isActive = index === 0; // Type is active
                        return (
                            <View key={step} style={styles.stepWrapper}>
                                <View style={[
                                    styles.stepTrack,
                                    { backgroundColor: isActive ? palette.trackActive : palette.trackBg }
                                ]} />
                                <Text style={[
                                    styles.stepLabel,
                                    { color: isActive ? palette.trackActive : '#BDBDBD' }
                                ]}>
                                    {step}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Section 1: Type Matrix Grid */}
                <Text style={[styles.sectionHeader, { color: palette.textDark }]}>What kind of memory are you adding?</Text>

                <View style={styles.grid}>
                    {MEMORY_TYPES.map(type => {
                        const isSelected = selectedType === type.id;
                        return (
                            <TouchableOpacity
                                key={type.id}
                                activeOpacity={0.8}
                                onPress={() => setSelectedType(type.id as any)}
                                style={[
                                    styles.typeCard,
                                    { backgroundColor: type.bg },
                                    isSelected && { borderColor: '#8EA281' } // Overriding baseline transparent border to fix jumping
                                ]}
                            >
                                {/* Selection checkmark overlay locked top right */}
                                {isSelected && (
                                    <View style={styles.checkBadge}>
                                        <Ionicons name="checkmark-circle" size={ms(22)} color="#8EA281" />
                                    </View>
                                )}

                                <View style={styles.iconSquircle}>
                                    {type.lib === 'Feather' && <Feather name={type.icon as any} size={ms(24)} color={type.bg} />}
                                </View>

                                <Text style={[styles.cardTitle, { color: '#2D2C39' }]}>{type.label}</Text>
                                <Text style={styles.cardDesc}>{type.desc}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Section 2: Persona Filter Carousel */}
                <Text style={[styles.sectionHeader, { color: palette.textDark, marginTop: vs(24) }]}>Whose memory is this?</Text>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.personaContainer}
                >
                    {personas.map(pers => {
                        const isPersSelected = selectedPersona === pers.id;
                        const source = pers.isSelf && user?.profilePicture?.url ? getAvatarSource(user) : pers.img;
                        return (
                            <TouchableOpacity
                                key={pers.id}
                                onPress={() => setSelectedPersona(pers.id)}
                                activeOpacity={0.9}
                                style={[
                                    styles.personaPill,
                                    { backgroundColor: isPersSelected ? '#8EA281' : palette.personaBg }
                                ]}
                            >
                                <Image source={source} style={styles.personaImg} />
                                <Text style={[
                                    styles.personaName,
                                    { color: isPersSelected ? '#FFFFFF' : (isDarkMode ? '#FFFFFF' : '#2D2C39') }
                                ]}>
                                    {pers.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

            </ScrollView>

            {/* Bottom Call-to-Action Barrier */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.continueBtn, { backgroundColor: palette.btnPrimary }]}
                    activeOpacity={0.9}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        const found = personas.find(p => p.id === selectedPersona);
                        const whose = found ? found.displayName : 'Margaret Mitchell';
                        setDraft({
                            type: selectedType,
                            whoseMemoryIsThis: whose
                        });
                        router.push({
                            pathname: '/add-memory/story',
                            params: { type: selectedType }
                        });
                    }}
                >
                    <Text style={styles.continueText}>Continue</Text>
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
        borderRadius: ms(12), // Squircle matching global aesthetic
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
        paddingBottom: vs(100),
    },
    sectionHeader: {
        fontFamily: FONTS.serif,
        fontSize: ms(16),
        fontWeight: '500',
        marginBottom: vs(16),
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: ms(14),
    },
    typeCard: {
        width: '47.5%', // Fits 2 across with natural gap
        aspectRatio: 1,
        borderRadius: ms(20),
        padding: ms(16),
        justifyContent: 'center',
        position: 'relative',
        borderWidth: 1.5, // Persisted volume lock to prevent visual shifting
        borderColor: 'transparent',
    },
    checkBadge: {
        position: 'absolute',
        top: ms(10),
        right: ms(10),
        backgroundColor: '#FFFFFF', // backplate for the ionic icon
        borderRadius: ms(11),
    },
    iconSquircle: {
        width: ms(42),
        height: ms(42),
        backgroundColor: 'rgba(255, 255, 255, 0.75)', // Semi-translucent white backing
        borderRadius: ms(12),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: vs(14),
    },
    cardTitle: {
        fontFamily: FONTS.sans,
        fontWeight: '700',
        fontSize: ms(15),
        marginBottom: vs(2),
    },
    cardDesc: {
        fontFamily: FONTS.sans,
        fontSize: ms(11),
        color: '#FFFFFF', // Subtext color consistent with specimen image
        opacity: 0.9,
    },
    personaContainer: {
        flexDirection: 'row',
        gap: ms(10),
    },
    personaPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: ms(6),
        paddingRight: ms(14), // Adding elegant breathing room on the textual side
        paddingVertical: vs(8),
        borderRadius: ms(20),
        overflow: 'hidden',
    },
    personaImg: {
        width: ms(28),
        height: ms(28),
        borderRadius: ms(14),
        marginRight: ms(8),
    },
    personaName: {
        fontFamily: FONTS.serif,
        fontSize: ms(13),
        fontWeight: '500',
    },
    footer: {
        position: 'absolute',
        bottom: vs(30),
        left: ms(20),
        right: ms(20),
    },
    continueBtn: {
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
    continueText: {
        fontFamily: FONTS.serif,
        color: '#FFFFFF',
        fontSize: ms(16),
        fontWeight: '600',
    }
});
