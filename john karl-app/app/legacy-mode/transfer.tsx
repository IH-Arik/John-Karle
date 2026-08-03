import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView,
    useColorScheme 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { ms, vs } from 'react-native-size-matters';
import { FONTS } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { api } from '@/services/api';
import { PasswordModal } from '@/components/PasswordModal';

interface TransferItem {
    id: string;
    title: string;
    subtitle: string;
}

const ITEMS: TransferItem[] = [
    { id: 'memories', title: 'All memories & photos', subtitle: 'Photos, videos, voice recordings' },
    { id: 'narratives', title: 'Written narratives', subtitle: 'Notes, journals, biographies' },
    { id: 'ai', title: 'AI conversation logs', subtitle: 'All chat history with the AI' },
    { id: 'profile', title: 'Profile data', subtitle: 'Names, dates, relationships' },
];

export default function DataTransferScreen() {
    const router = useRouter();
    const { name, email, relation, inactivityDays } = useLocalSearchParams<{
        name: string;
        email: string;
        relation: string;
        inactivityDays: string;
    }>();
    const isDarkMode = useColorScheme() === 'dark';

    const [passwordModalVisible, setPasswordModalVisible] = useState(false);

    // Pre-select items according to user visual reference (all except AI)
    const [selectedIds, setSelectedIds] = useState<string[]>(['memories', 'narratives', 'profile']);

    const toggleSelection = (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedIds((prev) => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSavePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setPasswordModalVisible(true);
    };

    const handlePasswordConfirm = async (password: string) => {
        console.log('[TrustedContacts] Creating new trusted contact on backend...');
        
        // Map selected IDs to the API's TrustedContactAccessScope shape
        const accessScope = {
            profile: selectedIds.includes('profile'),
            documents: selectedIds.includes('memories'),
            notes: selectedIds.includes('memories') || selectedIds.includes('narratives'),
            messages: selectedIds.includes('ai'),
            paymentInfo: false,
            accountTransfer: false,
        };

        const response = await api.post('/trusted-contacts', {
            name: name || '',
            email: email || '',
            inactivityDays: parseInt(inactivityDays || '90') || 90,
            accessScope,
            currentPassword: password
        });

        if (response.success) {
            console.log('[TrustedContacts] Creation successful.');
            setPasswordModalVisible(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTimeout(() => {
                router.push('/legacy-mode/success');
            }, 400);
        } else {
            console.warn('[TrustedContacts] Creation failed:', response.message);
            throw new Error(response.message || 'Failed to create trusted contact. Please check your password.');
        }
    };

    const palette = {
        bg: isDarkMode ? '#121212' : '#F9F8F6',
        textDark: isDarkMode ? '#D4DEC5' : '#2D2C39',
        textSub: isDarkMode ? '#8E8E93' : '#8A9981',

        backBtnBg: isDarkMode ? '#323239' : '#E3E4E3',
        backBtnIcon: isDarkMode ? '#FFFFFF' : '#5A5B66',

        trackActive: '#92A38D',

        // Distinct Selectors Based on Snapshot
        itemBg: isDarkMode ? '#1E1E1E' : '#DEE5EB',
        itemActiveBg: isDarkMode ? '#2D2C39' : '#CDD8DF',
        itemActiveBorder: isDarkMode ? '#4D4A61' : '#AAB7C0',
        
        circleBg: isDarkMode ? '#3D3C49' : '#FFFFFF',
        circleActiveBg: '#9AAAB9', // Slate blue tint from screenshot
        
        itemTitle: isDarkMode ? '#FFFFFF' : '#3A3C45',
        itemSub: isDarkMode ? '#888888' : '#7C808A',

        // Info Capsule at Bottom
        summaryBg: isDarkMode ? '#1A1C1D' : '#E5E3EA',
        summaryText: isDarkMode ? '#88917B' : '#5E606A',

        btnPrimary: '#92A38D'
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]}>
            
            <View style={styles.header}>
                <TouchableOpacity 
                    style={[styles.backBtn, { backgroundColor: palette.backBtnBg }]}
                    onPress={() => router.back()}
                >
                    <Feather name="arrow-left" size={ms(20)} color={palette.backBtnIcon} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                <Text style={[styles.pageTitle, { color: isDarkMode ? '#C5C9A8' : '#2D2C39' }]}>Trusted Contacts</Text>
                <Text style={[styles.pageSubtitle, { color: isDarkMode ? '#8E8E93' : '#8A9981' }]}>
                    Set up who has trusted access to your archive after a period of inactivity.
                </Text>

                {/* Step 3 View: All 3 bars completely full! */}
                <View style={styles.stepperBlock}>
                    <View style={styles.stepTracksRow}>
                        <View style={[styles.track, { backgroundColor: palette.trackActive }]} />
                        <View style={[styles.track, { backgroundColor: palette.trackActive }]} />
                        <View style={[styles.track, { backgroundColor: palette.trackActive }]} />
                    </View>
                    <View style={styles.stepLabelsRow}>
                        <Text style={[styles.stepLabel, { color: palette.trackActive }]}>Trusted Contacts</Text>
                        <Text style={[styles.stepLabel, { color: palette.trackActive }]}>Define Rules</Text>
                        <Text style={[styles.stepLabel, { color: palette.trackActive }]}>Data Transfer</Text>
                    </View>
                </View>

                <Text style={[styles.listHeading, { color: isDarkMode ? '#D5D2C1' : '#92A38D' }]}>
                    Choose what data will be transferred to your trusted contacts when legacy access activates.
                </Text>

                {/* Composite Selection Tree */}
                <View style={styles.itemsContainer}>
                    {ITEMS.map((item) => {
                        const active = selectedIds.includes(item.id);
                        return (
                            <TouchableOpacity
                                key={item.id}
                                activeOpacity={0.8}
                                onPress={() => toggleSelection(item.id)}
                                style={[
                                    styles.itemPod,
                                    { backgroundColor: active ? palette.itemActiveBg : palette.itemBg },
                                    active && { borderWidth: 1, borderColor: palette.itemActiveBorder }
                                ]}
                            >
                                <View style={[
                                    styles.iconCircle, 
                                    { backgroundColor: active ? palette.circleActiveBg : palette.circleBg }
                                ]}>
                                    {active && <Feather name="check" size={ms(14)} color="#FFFFFF" />}
                                </View>
                                <View style={styles.itemTextWrapper}>
                                    <Text style={[styles.itemTitle, { color: palette.itemTitle }]}>{item.title}</Text>
                                    <Text style={[styles.itemSub, { color: palette.itemSub }]}>{item.subtitle}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Inline Final Summary Capsule */}
                <View style={[styles.summaryPod, { backgroundColor: palette.summaryBg }]}>
                    <Text style={[styles.summaryText, { color: palette.summaryText }]}>
                        <Text style={{ fontWeight: 'bold', color: isDarkMode ? '#FFFFFF' : '#333333' }}>What happens:</Text> After 1 year of inactivity, your trusted contacts receive an email. After email confirmation, they gain access to the selected data above.
                    </Text>
                </View>

            </ScrollView>

            {/* The Ultimate Activation Anchor */}
            <View style={styles.footer}>
                <TouchableOpacity 
                    style={[styles.continueBtn, { backgroundColor: palette.btnPrimary }]}
                    activeOpacity={0.9}
                    onPress={handleSavePress}
                >
                    <Text style={styles.continueBtnText}>Save Trusted Contacts</Text>
                </TouchableOpacity>
            </View>

            <PasswordModal
                visible={passwordModalVisible}
                title="Confirm Password"
                subtitle={`Please enter your current password to authorize adding ${name || 'your trusted contact'}.`}
                onClose={() => setPasswordModalVisible(false)}
                onConfirm={handlePasswordConfirm}
            />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: ms(20),
        paddingTop: vs(10),
        marginBottom: vs(10),
    },
    backBtn: {
        width: ms(36),
        height: ms(36),
        borderRadius: ms(12),
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingHorizontal: ms(20),
        paddingBottom: vs(120),
    },
    pageTitle: {
        fontFamily: FONTS.serif,
        fontSize: ms(32),
        fontWeight: '500',
        marginTop: vs(10),
        marginBottom: vs(8),
    },
    pageSubtitle: {
        fontFamily: FONTS.sans,
        fontSize: ms(15),
        lineHeight: vs(22),
        marginBottom: vs(24),
    },
    stepperBlock: {
        marginBottom: vs(30),
    },
    stepTracksRow: {
        flexDirection: 'row',
        gap: ms(10),
        marginBottom: vs(8),
    },
    track: {
        flex: 1,
        height: vs(5),
        borderRadius: ms(2),
    },
    stepLabelsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    stepLabel: {
        fontFamily: FONTS.sans,
        fontSize: ms(10),
        textAlign: 'center',
        flex: 1,
    },
    listHeading: {
        fontFamily: FONTS.serif,
        fontSize: ms(13),
        lineHeight: vs(18),
        marginBottom: vs(16),
    },
    itemsContainer: {
        gap: vs(10),
        marginBottom: vs(24),
    },
    itemPod: {
        width: '100%',
        minHeight: vs(64),
        borderRadius: ms(20),
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: ms(18),
        paddingVertical: vs(12),
    },
    iconCircle: {
        width: ms(26),
        height: ms(26),
        borderRadius: ms(13),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: ms(16),
    },
    itemTextWrapper: {
        flex: 1,
    },
    itemTitle: {
        fontFamily: FONTS.serif,
        fontSize: ms(16),
        fontWeight: '500',
        marginBottom: vs(2),
    },
    itemSub: {
        fontFamily: FONTS.sans,
        fontSize: ms(12),
    },
    summaryPod: {
        width: '100%',
        borderRadius: ms(18),
        padding: ms(20),
    },
    summaryText: {
        fontFamily: FONTS.sans,
        fontSize: ms(13),
        lineHeight: vs(18),
    },
    footer: {
        position: 'absolute',
        bottom: vs(30),
        left: ms(20),
        right: ms(20),
    },
    continueBtn: {
        width: '100%',
        height: vs(52),
        borderRadius: ms(14),
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    continueBtnText: {
        fontFamily: FONTS.serif,
        color: '#FFFFFF',
        fontSize: ms(16),
        fontWeight: '600',
    }
});
