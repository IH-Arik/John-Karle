import { FONTS } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ms, vs } from 'react-native-size-matters';
import { useMemoryStore } from '@/store/memory-store';

const STEPS = ['Type', 'Story', 'Tags', 'Save'];

const INITIAL_TAGS = [
    '#Family', '#Summer', '#Childhood', '#Love',
    '#Journey', '#Home', '#Wisdom', '#Celebration',
    '#Nature', '#Work', '#Holiday'
];

export default function TagsStepScreen() {
    const router = useRouter();
    const isDarkMode = useColorScheme() === 'dark';
    const { setDraft } = useMemoryStore();

    // State Matrix for Tags and Custom Inputs
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [customTag, setCustomTag] = useState('');
    const [allTags, setAllTags] = useState(INITIAL_TAGS);

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const addCustomTag = () => {
        if (!customTag.trim()) return;
        let formatted = customTag.trim();
        if (!formatted.startsWith('#')) formatted = `#${formatted}`;

        if (!allTags.includes(formatted)) {
            setAllTags([...allTags, formatted]);
        }
        if (!selectedTags.includes(formatted)) {
            setSelectedTags([...selectedTags, formatted]);
        }
        setCustomTag('');
    };

    // Chromatic Sync
    const palette = {
        bg: isDarkMode ? '#121212' : '#F9F8F6',
        textDark: isDarkMode ? '#FFFFFF' : '#2D2C39',
        backBg: isDarkMode ? '#2E2E33' : '#E2E3E5',
        trackBg: isDarkMode ? '#2C2C2C' : '#EBECE8',
        trackActive: '#8EA281',
        btnPrimary: '#8EA281',

        // Tag specific visuals
        inputBg: isDarkMode ? '#3E4348' : '#E4E3EC',
        placeholder: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(45,44,57,0.4)',

        // Static (unselected) tag palette matching screenshot
        tagBg: isDarkMode ? '#2D2C39' : '#EBF1F5',
        tagBorder: isDarkMode ? '#3F4149' : '#D3DFE8',
        tagText: isDarkMode ? '#A0A7B5' : '#8EA2B5',

        // Active selection overrides
        tagActiveBg: '#8EA281',
        tagActiveText: '#FFFFFF'
    };

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

            {/* Stepper: Now 3 segments fill green */}
            <View style={styles.stepperContainer}>
                <View style={styles.stepperRow}>
                    {STEPS.map((step, index) => {
                        const isFilled = index <= 2; // Type, Story, and Tags active
                        return (
                            <View key={step} style={styles.stepWrapper}>
                                <View style={[
                                    styles.stepTrack,
                                    { backgroundColor: isFilled ? palette.trackActive : palette.trackBg }
                                ]} />
                                <Text style={[
                                    styles.stepLabel,
                                    { color: isFilled ? palette.trackActive : '#BDBDBD' }
                                ]}>
                                    {step}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                <Text style={[styles.sectionHeader, { color: palette.textDark, marginBottom: vs(20) }]}>
                    Tag this memory to help the AI find it more easily.
                </Text>

                {/* Fluid Wrapped Cloud Matrix */}
                <View style={styles.tagsCloud}>
                    {allTags.map((tag) => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                            <TouchableOpacity
                                key={tag}
                                activeOpacity={0.7}
                                onPress={() => toggleTag(tag)}
                                style={[
                                    styles.tagPill,
                                    {
                                        backgroundColor: isSelected ? palette.tagActiveBg : palette.tagBg,
                                        borderColor: isSelected ? palette.tagActiveBg : palette.tagBorder
                                    }
                                ]}
                            >
                                <Text style={[
                                    styles.tagText,
                                    { color: isSelected ? palette.tagActiveText : palette.tagText }
                                ]}>
                                    {tag}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Custom Ingester Node */}
                <View style={styles.customTagRow}>
                    <View style={[styles.inputWrapper, { backgroundColor: palette.inputBg }]}>
                        <TextInput
                            placeholder="Add custom tag..."
                            placeholderTextColor={palette.placeholder}
                            style={[styles.input, { color: palette.textDark }]}
                            value={customTag}
                            onChangeText={setCustomTag}
                            onSubmitEditing={addCustomTag}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: palette.btnPrimary }]}
                        activeOpacity={0.8}
                        onPress={addCustomTag}
                    >
                        <Feather name="plus" size={ms(20)} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

            </ScrollView>

            {/* Bottom Step Advance */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.continueBtn, { backgroundColor: palette.btnPrimary }]}
                    activeOpacity={0.9}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setDraft({
                            tags: selectedTags
                        });
                        router.push('/add-memory/save');
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
        fontFamily: FONTS.sans,
        fontSize: ms(16),
        fontWeight: '400',
        lineHeight: vs(22),
    },
    tagsCloud: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: ms(8),
        marginBottom: vs(30),
    },
    tagPill: {
        paddingHorizontal: ms(14),
        paddingVertical: vs(8),
        borderRadius: ms(20),
        borderWidth: 1,
    },
    tagText: {
        fontFamily: FONTS.sans,
        fontSize: ms(14),
        fontWeight: '500',
    },
    customTagRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ms(12),
        width: '100%',
    },
    inputWrapper: {
        flex: 1,
        height: vs(46),
        borderRadius: ms(14),
        paddingHorizontal: ms(16),
        justifyContent: 'center',
    },
    input: {
        fontFamily: FONTS.sans,
        fontSize: ms(14),
    },
    addButton: {
        width: ms(46),
        height: ms(46),
        borderRadius: ms(14),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
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
