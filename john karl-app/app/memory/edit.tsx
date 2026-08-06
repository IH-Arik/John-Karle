import { FONTS } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/services/api';
import { getAvatarSource } from '@/utils/image';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useMemoryStore } from '@/store/memory-store';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ms, vs } from 'react-native-size-matters';
import { MemoryCalendarModal } from '@/components/MemoryCalendarModal';

// ── Persona avatars ───────────────────────────────────────────────────────────
const AVATARS = {
    margaret: require('@/assets/images/dashboard/margaret.png'),
    robert: require('@/assets/images/dashboard/robert.png'),
    mine: require('@/assets/images/dashboard/avatar.png'),
};

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const INITIAL_TAGS = [
    '#Family', '#Summer', '#Childhood', '#Love',
    '#Journey', '#Home', '#Wisdom', '#Celebration',
    '#Nature', '#Work', '#Holiday',
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const isoToFriendly = (iso: string) => {
    try {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return '';
        return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    } catch { return ''; }
};

const isoToYMD = (iso: string) => {
    try {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return '';
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    } catch { return ''; }
};

// ── Screen ────────────────────────────────────────────────────────────────────
export default function EditMemoryScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const colors = useAppTheme();
    const isDarkMode = useColorScheme() === 'dark';
    const { user } = useAuth();
    const { patchOpenedMemory } = useMemoryStore();

    // ── Load existing memory ─────────────────────────────────────────────────
    const [isLoadingMemory, setIsLoadingMemory] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // form state
    const [title, setTitle] = useState('');
    const [narrative, setNarrative] = useState('');
    const [location, setLocation] = useState('');
    const [memType, setMemType] = useState('photo');
    const [date, setDate] = useState('');           // yyyy-mm-dd
    const [friendlyDate, setFriendlyDate] = useState('');
    const [selectedPersonas, setSelectedPersonas] = useState<string[]>(['mine']);

    const togglePersona = (id: string) => {
        setSelectedPersonas((prev) => {
            if (prev.includes(id)) {
                if (prev.length === 1) return prev;
                return prev.filter((p) => p !== id);
            }
            return [...prev, id];
        });
    };
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [customTag, setCustomTag] = useState('');
    const [allTags, setAllTags] = useState(INITIAL_TAGS);
    const [showCalendar, setShowCalendar] = useState(false);

    // ── Personas from auth ───────────────────────────────────────────────────
    const personas = useMemo(() => {
        const list: { id: string; name: string; displayName: string; img: any; isSelf: boolean }[] = [];
        list.push({
            id: 'mine',
            name: 'Mine',
            displayName: user?.name || user?.firstName || 'Me',
            img: AVATARS.mine,
            isSelf: true,
        });
        if (user?.familyMembers?.length) {
            user.familyMembers.forEach((m: any) => {
                let img = AVATARS.margaret;
                if (m.name?.toLowerCase().includes('robert')) img = AVATARS.robert;
                list.push({
                    id: m.userId || m.email,
                    name: m.name,
                    displayName: m.name,
                    img,
                    isSelf: false,
                });
            });
        }
        return list;
    }, [user]);

    // ── Fetch the memory on mount ────────────────────────────────────────────
    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const res = await api.get(`/memory-vault/${id}`);
                if (res.success && res.data) {
                    const apiData = res.data;
                    let mem: any = null;
                    if (apiData.data?.id) mem = apiData.data;
                    else if (apiData.data?.memory) mem = apiData.data.memory;
                    else if (apiData.memory) mem = apiData.memory;

                    if (mem) {
                        setTitle(mem.title || '');
                        setNarrative(mem.narrative || '');
                        setLocation(mem.location || '');
                        setMemType(mem.type || 'photo');

                        const ymd = isoToYMD(mem.date || '');
                        setDate(ymd);
                        setFriendlyDate(isoToFriendly(mem.date || ''));

                        // Match whose memory to personas (multi-select format)
                        const whoseList = (mem.whoseMemoryIsThis || '').split(',').map((s: string) => s.trim().toLowerCase());
                        const myName = (user?.name || user?.firstName || '').trim().toLowerCase();
                        const initialSelected: string[] = [];
                        personas.forEach((p) => {
                            const pName = p.displayName.toLowerCase();
                            if (
                                whoseList.some((w: string) => w === pName) ||
                                (p.id === 'mine' && whoseList.some((w: string) => w === 'self' || w === 'mine' || w === myName))
                            ) {
                                initialSelected.push(p.id);
                            }
                        });
                        setSelectedPersonas(initialSelected.length > 0 ? initialSelected : ['mine']);

                        // Merge existing tags into the pool and pre-select them
                        if (Array.isArray(mem.tags) && mem.tags.length > 0) {
                            const normalised = mem.tags.map((t: string) =>
                                t.startsWith('#') ? t : `#${t}`
                            );
                            setSelectedTags(normalised);
                            setAllTags(prev => {
                                const merged = [...prev];
                                normalised.forEach((t: string) => {
                                    if (!merged.includes(t)) merged.push(t);
                                });
                                return merged;
                            });
                        }
                    }
                }
            } catch (e) {
                Alert.alert('Error', 'Failed to load memory for editing.');
            } finally {
                setIsLoadingMemory(false);
            }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // ── Calendar handler ─────────────────────────────────────────────────────
    const handleDayPress = (day: any) => {
        const ds = day.dateString as string;
        setDate(ds);
        const [y, m, d] = ds.split('-');
        setFriendlyDate(`${MONTHS[parseInt(m) - 1]} ${parseInt(d)}, ${y}`);
        setShowCalendar(false);
    };

    // ── Tag helpers ──────────────────────────────────────────────────────────
    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const addCustomTag = () => {
        if (!customTag.trim()) return;
        let formatted = customTag.trim();
        if (!formatted.startsWith('#')) formatted = `#${formatted}`;
        if (!allTags.includes(formatted)) setAllTags(prev => [...prev, formatted]);
        if (!selectedTags.includes(formatted)) setSelectedTags(prev => [...prev, formatted]);
        setCustomTag('');
    };

    // ── Save ─────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Missing Title', 'Please enter a title for this memory.');
            return;
        }
        if (!narrative.trim()) {
            Alert.alert('Missing Narrative', 'Please add a narrative.');
            return;
        }
        const isLocationRequired = memType === 'photo' || memType === 'video';
        if (isLocationRequired && !location.trim()) {
            Alert.alert('Missing Location', 'Location is required for photo and video memories.');
            return;
        }
        if (!date) {
            Alert.alert('Missing Date', 'Please select a date.');
            return;
        }

        const selectedObjs = personas.filter(p => selectedPersonas.includes(p.id));
        const whoseMemoryIsThis = selectedObjs.map(p => p.displayName).join(', ') || 'Mine';

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsSaving(true);
        try {
            const body: any = {
                title: title.trim(),
                narrative: narrative.trim(),
                date: new Date(date).toISOString(),
                whoseMemoryIsThis,
                tags: selectedTags,
            };
            if (location.trim()) {
                body.location = location.trim();
            }
            const res = await api.patch(`/memory-vault/${id}`, body);
            if (res.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                // Instantly update the detail page via the store — no refetch needed
                patchOpenedMemory({
                    title: body.title,
                    narrative: body.narrative,
                    location: body.location,
                    date: body.date,
                    whoseMemoryIsThis: body.whoseMemoryIsThis,
                    tags: body.tags,
                });
                Alert.alert('Saved!', 'Memory updated successfully.', [
                    { text: 'OK', onPress: () => router.back() },
                ]);
            } else {
                Alert.alert('Error', res.message || 'Failed to update memory.');
            }
        } catch (e: any) {
            Alert.alert('Error', e?.message || 'A network error occurred.');
        } finally {
            setIsSaving(false);
        }
    };

    // ── Palette ──────────────────────────────────────────────────────────────
    const palette = {
        bg: isDarkMode ? '#121212' : '#F9F8F6',
        textDark: isDarkMode ? '#FFFFFF' : '#2D2C39',
        subText: isDarkMode ? '#A0A0A0' : '#767676',
        backBg: isDarkMode ? '#2E2E33' : '#E2E3E5',
        inputBg: isDarkMode ? '#2C2C2E' : '#ECEBED',
        placeholder: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(45,44,57,0.4)',
        primary: '#8EA281',
        personaBg: isDarkMode ? '#2E2E33' : '#E2E6E0',
        tagBg: isDarkMode ? '#2D2C39' : '#EBF1F5',
        tagBorder: isDarkMode ? '#3F4149' : '#D3DFE8',
        tagText: isDarkMode ? '#A0A7B5' : '#8EA2B5',
        divider: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    };

    if (isLoadingMemory) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: palette.bg, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={palette.primary} />
                <Text style={{ marginTop: vs(12), color: palette.subText, fontFamily: FONTS.sans, fontSize: ms(14) }}>
                    Loading memory…
                </Text>
            </SafeAreaView>
        );
    }

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
                <Text style={[styles.headerTitle, { color: palette.textDark }]}>Edit Memory</Text>
                <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: palette.primary }]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    {isSaving
                        ? <ActivityIndicator size="small" color="#FFF" />
                        : <Feather name="check" size={ms(18)} color="#FFF" />}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    automaticallyAdjustKeyboardInsets={true}
                >

                    {/* ── Section: Story ─────────────────────────────────── */}
                    <Text style={[styles.sectionTitle, { color: palette.textDark }]}>Story</Text>

                    <Text style={[styles.label, { color: palette.textDark }]}>Title</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: palette.inputBg }]}>
                        <TextInput
                            style={[styles.input, { color: palette.textDark }]}
                            placeholder="Give this memory a name"
                            placeholderTextColor={palette.placeholder}
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>

                    <Text style={[styles.label, { color: palette.textDark, marginTop: vs(16) }]}>Narrative</Text>
                    <View style={[styles.textAreaWrapper, { backgroundColor: palette.inputBg }]}>
                        <TextInput
                            style={[styles.textArea, { color: palette.textDark }]}
                            placeholder="What happened? How did it feel?"
                            placeholderTextColor={palette.placeholder}
                            multiline
                            textAlignVertical="top"
                            value={narrative}
                            onChangeText={setNarrative}
                        />
                    </View>

                    <Text style={[styles.label, { color: palette.textDark, marginTop: vs(16) }]}>
                        Location {(memType === 'photo' || memType === 'video') ? '(Required)' : '(Optional)'}
                    </Text>
                    <View style={[styles.inputWrapper, { backgroundColor: palette.inputBg }]}>
                        <TextInput
                            style={[styles.input, { color: palette.textDark }]}
                            placeholder={(memType === 'photo' || memType === 'video') ? "e.g. Paris, France (Required)" : "e.g. Paris, France"}
                            placeholderTextColor={palette.placeholder}
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
                        <Text style={[styles.input, { color: friendlyDate ? palette.textDark : palette.placeholder }]}>
                            {friendlyDate || 'e.g. August 14, 1978'}
                        </Text>
                        <Feather name="calendar" size={ms(16)} color={palette.placeholder} />
                    </TouchableOpacity>

                    {/* ── Divider ────────────────────────────────────────── */}
                    <View style={[styles.divider, { backgroundColor: palette.divider }]} />

                    {/* ── Section: Whose memory ──────────────────────────── */}
                    <Text style={[styles.sectionTitle, { color: palette.textDark }]}>Whose memory is this?</Text>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.personaRow}
                    >
                        {personas.map(pers => {
                            const isSelected = selectedPersonas.includes(pers.id);
                            const src = pers.isSelf && user?.profilePicture?.url
                                ? getAvatarSource(user)
                                : pers.img;
                            return (
                                <TouchableOpacity
                                    key={pers.id}
                                    onPress={() => togglePersona(pers.id)}
                                    activeOpacity={0.85}
                                    style={[
                                        styles.personaPill,
                                        { backgroundColor: isSelected ? palette.primary : palette.personaBg },
                                    ]}
                                >
                                    <Image source={src} style={styles.personaImg} />
                                    <Text style={[
                                        styles.personaName,
                                        { color: isSelected ? '#FFF' : (isDarkMode ? '#FFF' : '#2D2C39') },
                                    ]}>
                                        {pers.name}
                                    </Text>
                                    {isSelected && (
                                        <View style={{ marginLeft: ms(4) }}>
                                            <Ionicons name="checkmark-circle" size={ms(14)} color="#FFFFFF" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* ── Divider ────────────────────────────────────────── */}
                    <View style={[styles.divider, { backgroundColor: palette.divider }]} />

                    {/* ── Section: Tags ──────────────────────────────────── */}
                    <Text style={[styles.sectionTitle, { color: palette.textDark }]}>Tags</Text>

                    <View style={styles.tagsCloud}>
                        {allTags.map(tag => {
                            const isSelected = selectedTags.includes(tag);
                            return (
                                <TouchableOpacity
                                    key={tag}
                                    activeOpacity={0.7}
                                    onPress={() => toggleTag(tag)}
                                    style={[
                                        styles.tagPill,
                                        {
                                            backgroundColor: isSelected ? palette.primary : palette.tagBg,
                                            borderColor: isSelected ? palette.primary : palette.tagBorder,
                                        },
                                    ]}
                                >
                                    <Text style={[
                                        styles.tagText,
                                        { color: isSelected ? '#FFF' : palette.tagText },
                                    ]}>
                                        {tag}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Custom tag input */}
                    <View style={styles.customTagRow}>
                        <View style={[styles.customTagInput, { backgroundColor: palette.inputBg }]}>
                            <TextInput
                                placeholder="Add custom tag…"
                                placeholderTextColor={palette.placeholder}
                                style={[styles.input, { color: palette.textDark }]}
                                value={customTag}
                                onChangeText={setCustomTag}
                                onSubmitEditing={addCustomTag}
                            />
                        </View>
                        <TouchableOpacity
                            style={[styles.addTagBtn, { backgroundColor: palette.primary }]}
                            onPress={addCustomTag}
                            activeOpacity={0.8}
                        >
                            <Feather name="plus" size={ms(20)} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    {/* Bottom Save Button */}
                    <TouchableOpacity
                        style={[styles.saveFullBtn, { backgroundColor: palette.primary }]}
                        onPress={handleSave}
                        activeOpacity={0.9}
                        disabled={isSaving}
                    >
                        {isSaving
                            ? <ActivityIndicator size="small" color="#FFF" />
                            : <Text style={styles.saveFullBtnText}>Save Changes</Text>}
                    </TouchableOpacity>

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
    container: { flex: 1 },
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
    saveBtn: {
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
        paddingTop: vs(8),
        paddingBottom: vs(60),
    },
    sectionTitle: {
        fontFamily: FONTS.serif,
        fontSize: ms(17),
        fontWeight: '600',
        marginBottom: vs(14),
        marginTop: vs(4),
    },
    label: {
        fontFamily: FONTS.serif,
        fontSize: ms(14),
        fontWeight: '600',
        marginBottom: vs(8),
    },
    inputWrapper: {
        width: '100%',
        height: vs(46),
        borderRadius: ms(14),
        paddingHorizontal: ms(16),
        justifyContent: 'center',
    },
    textAreaWrapper: {
        width: '100%',
        minHeight: vs(120),
        borderRadius: ms(14),
        paddingHorizontal: ms(16),
        paddingVertical: vs(12),
    },
    input: {
        fontFamily: FONTS.sans,
        fontSize: ms(14),
        padding: 0,
    },
    textArea: {
        fontFamily: FONTS.sans,
        fontSize: ms(14),
        padding: 0,
        flex: 1,
    },
    divider: {
        height: 1,
        marginVertical: vs(20),
    },
    personaRow: {
        flexDirection: 'row',
        gap: ms(10),
        paddingBottom: vs(4),
    },
    personaPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: ms(6),
        paddingRight: ms(14),
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
    tagsCloud: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: ms(8),
        marginBottom: vs(16),
    },
    tagPill: {
        paddingHorizontal: ms(14),
        paddingVertical: vs(8),
        borderRadius: ms(20),
        borderWidth: 1,
    },
    tagText: {
        fontFamily: FONTS.sans,
        fontSize: ms(13),
        fontWeight: '500',
    },
    customTagRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ms(12),
        marginBottom: vs(28),
    },
    customTagInput: {
        flex: 1,
        height: vs(46),
        borderRadius: ms(14),
        paddingHorizontal: ms(16),
        justifyContent: 'center',
    },
    addTagBtn: {
        width: ms(46),
        height: ms(46),
        borderRadius: ms(14),
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    saveFullBtn: {
        width: '100%',
        paddingVertical: vs(14),
        borderRadius: ms(14),
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
    },
    saveFullBtnText: {
        fontFamily: FONTS.serif,
        color: '#FFFFFF',
        fontSize: ms(16),
        fontWeight: '600',
    },
});
