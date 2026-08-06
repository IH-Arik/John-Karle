import { PhotoCollector, VideoCollector, VoiceCollector } from '@/components/MediaCollectors';
import { MemoryCalendarModal } from '@/components/MemoryCalendarModal';
import { FONTS } from '@/constants/theme';
import { useMemoryStore } from '@/store/memory-store';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
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

const STEPS = ['Type', 'Story', 'Tags', 'Save'];

export default function StoryStepScreen() {
    const router = useRouter();
    // Retrieve explicit dynamic type vector from the previous screen navigation trigger
    const { type } = useLocalSearchParams<{ type: string }>();
    const isDarkMode = useColorScheme() === 'dark';

    const { setDraft } = useMemoryStore();

    // Logic: Form Inputs
    const [title, setTitle] = useState('');
    const [narrative, setNarrative] = useState('');
    const [location, setLocation] = useState('');
    const [date, setDate] = useState('');
    const [friendlyDate, setFriendlyDate] = useState('');
    const [showCalendar, setShowCalendar] = useState(false);
    const [fileUri, setFileUri] = useState<string | null>(null);

    const isLocationRequired = type === 'photo' || type === 'video';

    const handleDayPress = (day: any) => {
        const dateStr = day.dateString;
        setDate(dateStr);
        const [y, m, d] = dateStr.split('-');
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const formatted = `${months[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
        setFriendlyDate(formatted);
        setShowCalendar(false);
    };

    const palette = {
        bg: isDarkMode ? '#121212' : '#F9F8F6',
        textDark: isDarkMode ? '#FFFFFF' : '#2D2C39',
        backBg: isDarkMode ? '#2E2E33' : '#E2E3E5',
        trackBg: isDarkMode ? '#2C2C2C' : '#EBECE8',
        trackActive: '#8EA281',
        btnPrimary: '#8EA281',

        uploadBg: isDarkMode ? 'transparent' : '#BAC5B6',
        uploadBorder: '#8EA281',
        iconBack: isDarkMode ? '#2E2E33' : '#FFFFFF',
        inputBg: isDarkMode ? '#3E4348' : '#E4E3EC',
        placeholder: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(45,44,57,0.4)',
        browseBtn: isDarkMode ? '#8EA281' : '#97A58E',
        cameraBtn: isDarkMode ? '#9A9ABD' : '#A5B7C6',
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

            {/* Stepper */}
            <View style={styles.stepperContainer}>
                <View style={styles.stepperRow}>
                    {STEPS.map((step, index) => {
                        const isFilled = index <= 1;
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

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.scrollContent}
                >

                    {/* Section 1: Media Collectors Matrix Switch (Conditional) */}
                    {type === 'photo' && <PhotoCollector palette={palette} isDarkMode={isDarkMode} fileUri={fileUri} onSelectFile={setFileUri} />}
                    {type === 'video' && <VideoCollector palette={palette} isDarkMode={isDarkMode} fileUri={fileUri} onSelectFile={setFileUri} />}
                    {type === 'voice' && <VoiceCollector palette={palette} isDarkMode={isDarkMode} fileUri={fileUri} onSelectFile={setFileUri} />}

                    {/* If type === 'journal', nothing renders in this top slot, perfectly advancing straight to narration! */}

                    {/* Section 2: Narrative Form Controls */}
                    <Text style={[
                        styles.sectionHeader,
                        {
                            color: palette.textDark,
                            marginTop: type === 'journal' ? 0 : vs(24),
                            marginBottom: vs(12)
                        }
                    ]}>
                        Tell the story behind this memory.
                    </Text>

                    <Text style={[styles.label, { color: palette.textDark }]}>Title</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: palette.inputBg }]}>
                        <TextInput
                            placeholder="Give this memory a name"
                            placeholderTextColor={palette.placeholder}
                            style={[styles.input, { color: palette.textDark }]}
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>

                    <Text style={[styles.label, { color: palette.textDark, marginTop: vs(16) }]}>Narrative</Text>
                    <View style={[styles.textAreaWrapper, { backgroundColor: palette.inputBg }]}>
                        <TextInput
                            placeholder="What happened? How did it feel? What do you want to remember most?"
                            placeholderTextColor={palette.placeholder}
                            style={[styles.textArea, { color: palette.textDark }]}
                            multiline
                            textAlignVertical="top"
                            value={narrative}
                            onChangeText={setNarrative}
                        />
                    </View>

                    <Text style={[styles.label, { color: palette.textDark, marginTop: vs(16) }]}>
                        Location {isLocationRequired ? '(Required)' : '(Optional)'}
                    </Text>
                    <View style={[styles.inputWrapper, { backgroundColor: palette.inputBg }]}>
                        <TextInput
                            placeholder={isLocationRequired ? "e.g. Paris, France (Required)" : "e.g. Paris, France"}
                            placeholderTextColor={palette.placeholder}
                            style={[styles.input, { color: palette.textDark }]}
                            value={location}
                            onChangeText={setLocation}
                        />
                    </View>

                    <Text style={[styles.label, { color: palette.textDark, marginTop: vs(16) }]}>Date</Text>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setShowCalendar(true)}
                        style={[styles.inputWrapper, { backgroundColor: palette.inputBg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                    >
                        <Text style={[
                            styles.input,
                            { color: friendlyDate ? palette.textDark : palette.placeholder, paddingTop: vs(1) }
                        ]}>
                            {friendlyDate || "e.g. August 14, 1978"}
                        </Text>
                        <Feather name="calendar" size={ms(16)} color={palette.placeholder} />
                    </TouchableOpacity>

                    {/* Bottom Anchor inside ScrollView */}
                    <View style={[styles.footer, { paddingHorizontal: 0, paddingTop: vs(24), paddingBottom: vs(20) }]}>
                        <TouchableOpacity
                            style={[styles.continueBtn, { backgroundColor: palette.btnPrimary }]}
                            activeOpacity={0.9}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                if (!title.trim()) {
                                    Alert.alert('Missing Title', 'Please enter a name for this memory.');
                                    return;
                                }
                                if (!narrative.trim()) {
                                    Alert.alert('Missing Narrative', 'Please tell the story behind this memory.');
                                    return;
                                }
                                if (isLocationRequired && !location.trim()) {
                                    Alert.alert('Missing Location', 'Location is required for photo and video memories.');
                                    return;
                                }
                                if (!date) {
                                    Alert.alert('Missing Date', 'Please select a date.');
                                    return;
                                }
                                if (type !== 'journal' && !fileUri) {
                                    Alert.alert('File Required', `Please upload a ${type} file to continue.`);
                                    return;
                                }

                                setDraft({
                                    title: title.trim(),
                                    narrative: narrative.trim(),
                                    location: location.trim(),
                                    date: new Date(date).toISOString(),
                                    fileUri
                                });
                                router.push('/add-memory/tags');
                            }}
                        >
                            <Text style={styles.continueText}>Continue</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>

            </KeyboardAvoidingView>

            <MemoryCalendarModal
                visible={showCalendar}
                onClose={() => setShowCalendar(false)}
                onSelectDate={handleDayPress}
                selectedDate={date}
            />
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
        paddingBottom: vs(160),
    },
    sectionHeader: {
        fontFamily: FONTS.serif,
        fontSize: ms(16),
        fontWeight: '500',
    },
    uploadContainer: {
        width: '100%',
        padding: ms(20),
        borderRadius: ms(20),
        borderWidth: 1.5,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadInnerIcon: {
        width: ms(56),
        height: ms(56),
        borderRadius: ms(16),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: vs(14),
    },
    uploadTitle: {
        fontFamily: FONTS.serif,
        fontSize: ms(15),
        fontWeight: '600',
        marginBottom: vs(4),
    },
    uploadSub: {
        fontFamily: FONTS.sans,
        fontSize: ms(11),
        opacity: 0.85,
        marginBottom: vs(20),
    },
    uploadBtnRow: {
        flexDirection: 'row',
        gap: ms(12),
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: ms(16),
        paddingVertical: vs(10),
        borderRadius: ms(12),
        flex: 1,
        justifyContent: 'center',
    },
    actionBtnText: {
        fontFamily: FONTS.sans,
        color: '#FFFFFF',
        fontSize: ms(13),
        fontWeight: '600',
    },
    label: {
        fontFamily: FONTS.serif,
        fontSize: ms(15),
        fontWeight: '600',
        marginBottom: vs(8),
    },
    inputWrapper: {
        width: '100%',
        height: vs(44),
        borderRadius: ms(14),
        paddingHorizontal: ms(16),
        justifyContent: 'center',
    },
    textAreaWrapper: {
        width: '100%',
        height: vs(120),
        borderRadius: ms(14),
        paddingHorizontal: ms(16),
        paddingVertical: vs(14),
    },
    input: {
        fontFamily: FONTS.sans,
        fontSize: ms(14),
        padding: 0,
    },
    textArea: {
        fontFamily: FONTS.sans,
        fontSize: ms(14),
        flex: 1,
        padding: 0,
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
