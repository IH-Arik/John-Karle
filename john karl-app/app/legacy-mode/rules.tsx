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
import { Feather } from '@expo/vector-icons';
import { ms, vs } from 'react-native-size-matters';
import { FONTS } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

const INACTIVITY_OPTIONS = ['30 Days', '60 Days', '90 Days', '120 Days'];

export default function LegacyRulesScreen() {
    const router = useRouter();
    const { name, email, relation } = useLocalSearchParams<{ name: string; email: string; relation: string }>();
    const isDarkMode = useColorScheme() === 'dark';

    // Interactive Selection States
    const [selectedDays, setSelectedDays] = useState('90 Days');

    const triggerHaptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Specific Hue Mapping From Specimen Screenshots
    const palette = {
        bg: isDarkMode ? '#121212' : '#F9F8F6',
        textDark: isDarkMode ? '#D4DEC5' : '#2D2C39',
        textSub: isDarkMode ? '#8E8E93' : '#8A9981',

        backBtnBg: isDarkMode ? '#323239' : '#E3E4E3',
        backBtnIcon: isDarkMode ? '#FFFFFF' : '#5A5B66',

        trackActive: '#92A38D',
        trackInactive: isDarkMode ? '#3A3A3A' : '#E8E8E8',
        trackLabel: isDarkMode ? '#8E8E93' : '#92A38D',

        // Grid Box Active/Inactive
        gridPillBg: isDarkMode ? '#32323A' : '#E0E5DE',
        gridPillActive: isDarkMode ? '#9E9EB8' : '#92A38D',
        gridText: isDarkMode ? '#FFFFFF' : '#5C5C5C',
        gridTextActive: '#FFFFFF',

        // List Selectors
        listBg: isDarkMode ? '#32323A' : '#E4EAEF',
        listActiveBg: isDarkMode ? '#3D3D47' : '#A0B4C2',
        listActiveBorder: isDarkMode ? '#646475' : '#8AA0AF',
        listText: isDarkMode ? '#C0C0C8' : '#6D7D8C',
        listTextActive: '#FFFFFF',

        btnPrimary: '#92A38D'
    };

    const handleSelection = (setter: any, val: string) => {
        triggerHaptic();
        setter(val);
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
                
                <Text style={[styles.pageTitle, { color: isDarkMode ? '#D4DEC5' : '#2D2C39' }]}>Trusted Contacts</Text>
                <Text style={[styles.pageSubtitle, { color: isDarkMode ? '#8E8E93' : '#8A9981' }]}>
                    Set up who has trusted access to your archive after a period of inactivity.
                </Text>

                {/* Step 2 View: First 2 bars active */}
                <View style={styles.stepperBlock}>
                    <View style={styles.stepTracksRow}>
                        <View style={[styles.track, { backgroundColor: palette.trackActive }]} />
                        <View style={[styles.track, { backgroundColor: palette.trackActive }]} />
                        <View style={[styles.track, { backgroundColor: palette.trackInactive }]} />
                    </View>
                    <View style={styles.stepLabelsRow}>
                        <Text style={[styles.stepLabel, { color: palette.trackActive }]}>Trusted Contacts</Text>
                        <Text style={[styles.stepLabel, { color: palette.trackActive }]}>Define Rules</Text>
                        <Text style={[styles.stepLabel, { color: isDarkMode ? '#555' : '#AFAFAF' }]}>Data Transfer</Text>
                    </View>
                </View>

                {/* Inactivity period */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFFFFF' : '#3A3B3C' }]}>Inactivity period</Text>
                    <Text style={[styles.sectionHint, { color: isDarkMode ? '#A0A0A0' : '#8CA087' }]}>
                        After this period of account inactivity, legacy access will begin the handover process.
                    </Text>

                    <View style={styles.gridContainer}>
                        {INACTIVITY_OPTIONS.map((option) => {
                            const isActive = selectedDays === option;
                            return (
                                <TouchableOpacity 
                                    key={option}
                                    style={[
                                        styles.gridPill, 
                                        { backgroundColor: isActive ? palette.gridPillActive : palette.gridPillBg }
                                    ]}
                                    activeOpacity={0.8}
                                    onPress={() => handleSelection(setSelectedDays, option)}
                                >
                                    <Text style={[
                                        styles.gridPillText, 
                                        { color: isActive ? palette.gridTextActive : palette.gridText }
                                    ]}>
                                        {option}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>



            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity 
                    style={[styles.continueBtn, { backgroundColor: palette.btnPrimary }]}
                    activeOpacity={0.9}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        const inactivityDays = parseInt(selectedDays) || 90;
                        router.push({
                            pathname: '/legacy-mode/transfer',
                            params: {
                                name,
                                email,
                                relation,
                                inactivityDays
                            }
                        });
                    }}
                >
                    <Text style={styles.continueBtnText}>Continue</Text>
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
        paddingBottom: vs(100),
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
    section: {
        marginBottom: vs(24),
    },
    sectionTitle: {
        fontFamily: FONTS.serif,
        fontSize: ms(18),
        fontWeight: '500',
        marginBottom: vs(8),
    },
    sectionHint: {
        fontFamily: FONTS.sans,
        fontSize: ms(13),
        lineHeight: vs(18),
        marginBottom: vs(16),
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: ms(12),
    },
    gridPill: {
        width: '48%',
        height: vs(46),
        borderRadius: ms(14),
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridPillText: {
        fontFamily: FONTS.sans,
        fontSize: ms(15),
        fontWeight: '500',
    },
    listContainer: {
        gap: vs(10),
        marginTop: vs(12),
    },
    listItem: {
        height: vs(48),
        borderRadius: ms(14),
        paddingHorizontal: ms(16),
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    listItemText: {
        fontFamily: FONTS.sans,
        fontSize: ms(15),
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
