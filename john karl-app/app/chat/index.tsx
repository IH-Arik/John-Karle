import { FONTS } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { api } from '@/services/api';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
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

import { useAuth } from '@/hooks/use-auth';

interface Citation {
    memoryTitle: string;
    citedText: string;
    memoryId?: string;
}

interface ChatMessage {
    id: string;
    sender: 'user' | 'ai' | 'system';
    text: string;
    citations?: Citation[];
    isError?: boolean;
    isRetryable?: boolean;
    lastQuestion?: string;
}

export default function MemoryChatScreen() {
    const { user } = useAuth();
    const params = useLocalSearchParams<{ person?: string; familyMemberUserId?: string }>();
    
    const currentUserName = user?.firstName || user?.name || 'Tanvir';
    const hasSpecificPerson = !!(params.person && params.person.trim() && params.person !== 'Margaret');
    const personName = hasSpecificPerson ? params.person!.trim() : currentUserName;
    const familyMemberUserId = params.familyMemberUserId || undefined;

    const router = useRouter();
    const colors = useAppTheme();
    const isDarkMode = useColorScheme() === 'dark';

    const headerTitle = hasSpecificPerson ? `Ask about ${personName}` : 'Ask Lineage.AI';
    const inputPlaceholder = hasSpecificPerson ? `Ask about ${personName}…` : 'Ask a question about your memories…';
    const welcomeMessageText = hasSpecificPerson
        ? `Ask me anything about ${personName}'s preserved memories, stories, and history.`
        : `Ask me anything about your preserved memories, family stories, and history.`;

    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'init-1',
            sender: 'ai',
            text: welcomeMessageText,
        },
    ]);
    const [questionText, setQuestionText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    const palette = {
        bg: isDarkMode ? '#121212' : '#F9F8F6',
        headerBg: isDarkMode ? '#1E1E22' : '#FFFFFF',
        textDark: isDarkMode ? '#FFFFFF' : '#2D2C39',
        textSub: isDarkMode ? '#A0A0A0' : '#6E6D7A',
        userBubble: '#8EA281',
        userText: '#FFFFFF',
        aiBubble: isDarkMode ? '#25262B' : '#EAEAEF',
        aiText: isDarkMode ? '#E1E1E6' : '#2D2C39',
        citationBg: isDarkMode ? 'rgba(142, 162, 129, 0.15)' : '#F0F5EE',
        citationBorder: 'rgba(142, 162, 129, 0.35)',
        inputBg: isDarkMode ? '#24252A' : '#ECEBED',
        placeholder: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(45,44,57,0.4)',
        errorBg: isDarkMode ? 'rgba(235, 87, 87, 0.15)' : '#FDF2F2',
        errorText: isDarkMode ? '#FF8080' : '#D32F2F',
    };

    const handleSendQuestion = async (customQuestion?: string) => {
        const textToSubmit = (customQuestion || questionText).trim();
        if (!textToSubmit || isSending) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const userMsgId = `user-${Date.now()}`;
        const userMsg: ChatMessage = {
            id: userMsgId,
            sender: 'user',
            text: textToSubmit,
        };

        setMessages((prev) => [...prev, userMsg]);
        if (!customQuestion) {
            setQuestionText('');
        }
        setIsSending(true);

        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);

        try {
            const body: any = {
                person: personName,
                question: textToSubmit,
            };
            if (familyMemberUserId) {
                body.familyMemberUserId = familyMemberUserId;
            }

            const response = await api.post('/memory-chat', body);

            if (response.success && response.data) {
                const data = response.data.data || response.data;
                const answer = data.answer || 'No answer generated.';
                const citations: Citation[] = data.citations || [];

                const aiMsg: ChatMessage = {
                    id: `ai-${Date.now()}`,
                    sender: 'ai',
                    text: answer,
                    citations,
                };
                setMessages((prev) => [...prev, aiMsg]);
            } else {
                const status = response.status;
                if (status === 403) {
                    const permMsg: ChatMessage = {
                        id: `err-${Date.now()}`,
                        sender: 'system',
                        text: "You do not have permission to ask about this family member's memories.",
                        isError: true,
                    };
                    setMessages((prev) => [...prev, permMsg]);
                } else if (status === 502 || status === 503) {
                    const tempError: ChatMessage = {
                        id: `err-${Date.now()}`,
                        sender: 'system',
                        text: 'The AI memory service is temporarily unavailable. Please try again.',
                        isError: true,
                        isRetryable: true,
                        lastQuestion: textToSubmit,
                    };
                    setMessages((prev) => [...prev, tempError]);
                } else {
                    const genError: ChatMessage = {
                        id: `err-${Date.now()}`,
                        sender: 'system',
                        text: response.message || 'Could not process question. Please try again.',
                        isError: true,
                        isRetryable: true,
                        lastQuestion: textToSubmit,
                    };
                    setMessages((prev) => [...prev, genError]);
                }
            }
        } catch (err: any) {
            const networkError: ChatMessage = {
                id: `err-${Date.now()}`,
                sender: 'system',
                text: err?.message || 'A network error occurred. Tap to retry.',
                isError: true,
                isRetryable: true,
                lastQuestion: textToSubmit,
            };
            setMessages((prev) => [...prev, networkError]);
        } finally {
            setIsSending(false);
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    };

    const handleCitationPress = async (citation: Citation) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (citation.memoryId) {
            router.push({ pathname: '/memory/[id]' as any, params: { id: citation.memoryId } });
        } else {
            // Search or locate memory by title
            try {
                const res = await api.get('/memory-vault');
                if (res.success && res.data) {
                    let list: any[] = [];
                    if (res.data.data && Array.isArray(res.data.data.memories)) list = res.data.data.memories;
                    else if (Array.isArray(res.data.data)) list = res.data.data;
                    else if (Array.isArray(res.data.memories)) list = res.data.memories;
                    
                    const match = list.find((m: any) => 
                        m.title?.toLowerCase() === citation.memoryTitle.toLowerCase() ||
                        m.title?.toLowerCase().includes(citation.memoryTitle.toLowerCase())
                    );
                    if (match?.id) {
                        router.push({ pathname: '/memory/[id]' as any, params: { id: match.id } });
                    } else {
                        router.push('/(tabs)/vault');
                    }
                } else {
                    router.push('/(tabs)/vault');
                }
            } catch {
                router.push('/(tabs)/vault');
            }
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: palette.headerBg }]}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => router.back()}
                >
                    <Feather name="arrow-left" size={ms(22)} color={palette.textDark} />
                </TouchableOpacity>

                <View style={styles.headerTitleWrapper}>
                    <Text style={[styles.headerTitle, { color: palette.textDark }]}>{headerTitle}</Text>
                    <Text style={[styles.headerSub, { color: palette.textSub }]}>AI Memory Insights</Text>
                </View>

                <View style={{ width: ms(36) }} />
            </View>

            {/* Chat Body */}
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? ms(90) : 0}
            >
                <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {messages.map((msg) => {
                        if (msg.sender === 'user') {
                            return (
                                <View key={msg.id} style={styles.userRow}>
                                    <View style={[styles.userBubble, { backgroundColor: palette.userBubble }]}>
                                        <Text style={[styles.userText, { color: palette.userText }]}>{msg.text}</Text>
                                    </View>
                                </View>
                            );
                        }

                        if (msg.sender === 'system') {
                            return (
                                <View key={msg.id} style={[styles.systemBox, { backgroundColor: palette.errorBg }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: vs(4) }}>
                                        <Feather name="alert-triangle" size={ms(16)} color={palette.errorText} style={{ marginRight: ms(6) }} />
                                        <Text style={[styles.systemText, { color: palette.errorText }]}>{msg.text}</Text>
                                    </View>
                                    {msg.isRetryable && msg.lastQuestion ? (
                                        <TouchableOpacity
                                            style={styles.retryChip}
                                            onPress={() => handleSendQuestion(msg.lastQuestion)}
                                        >
                                            <Feather name="refresh-cw" size={ms(12)} color={palette.errorText} style={{ marginRight: ms(4) }} />
                                            <Text style={[styles.retryChipText, { color: palette.errorText }]}>Tap to Retry</Text>
                                        </TouchableOpacity>
                                    ) : null}
                                </View>
                            );
                        }

                        // AI message: styled as AI assistant speaking in third person about [person]
                        return (
                            <View key={msg.id} style={styles.aiRow}>
                                <View style={styles.aiBadge}>
                                    <Ionicons name="sparkles" size={ms(14)} color="#8EA281" />
                                </View>
                                <View style={[styles.aiBubble, { backgroundColor: palette.aiBubble }]}>
                                    <Text style={[styles.aiSenderLabel, { color: palette.textSub }]}>
                                        MEMORY INSIGHT
                                    </Text>
                                    <Text style={[styles.aiText, { color: palette.aiText }]}>{msg.text}</Text>

                                    {/* Render Citations */}
                                    {msg.citations && msg.citations.length > 0 ? (
                                        <View style={styles.citationsContainer}>
                                            <Text style={styles.citationHeaderLabel}>CITATIONS</Text>
                                            {msg.citations.map((cit, idx) => (
                                                <TouchableOpacity
                                                    key={idx}
                                                    activeOpacity={0.8}
                                                    onPress={() => handleCitationPress(cit)}
                                                    style={[
                                                        styles.citationCard,
                                                        { backgroundColor: palette.citationBg, borderColor: palette.citationBorder },
                                                    ]}
                                                >
                                                    <View style={styles.citationTopRow}>
                                                        <Feather name="book-open" size={ms(12)} color="#8EA281" style={{ marginRight: ms(4) }} />
                                                        <Text style={styles.citationTitle}>{cit.memoryTitle}</Text>
                                                        <Feather name="chevron-right" size={ms(12)} color="#8EA281" />
                                                    </View>
                                                    {cit.citedText ? (
                                                        <Text style={styles.citationExcerpt}>"{cit.citedText}"</Text>
                                                    ) : null}
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    ) : null}
                                </View>
                            </View>
                        );
                    })}

                    {isSending ? (
                        <View style={styles.aiRow}>
                            <View style={styles.aiBadge}>
                                <Ionicons name="sparkles" size={ms(14)} color="#8EA281" />
                            </View>
                            <View style={[styles.aiBubble, { backgroundColor: palette.aiBubble }]}>
                                <ActivityIndicator size="small" color="#8EA281" />
                            </View>
                        </View>
                    ) : null}
                </ScrollView>

                {/* Input Bar */}
                <View style={[styles.inputBar, { backgroundColor: palette.headerBg }]}>
                    <View style={[styles.inputContainer, { backgroundColor: palette.inputBg }]}>
                        <TextInput
                            style={[styles.input, { color: palette.textDark }]}
                            placeholder={inputPlaceholder}
                            placeholderTextColor={palette.placeholder}
                            value={questionText}
                            onChangeText={setQuestionText}
                            onSubmitEditing={() => handleSendQuestion()}
                        />
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.sendBtn,
                            { backgroundColor: questionText.trim() ? '#8EA281' : (isDarkMode ? '#3E3F48' : '#DCDCE0') },
                        ]}
                        disabled={!questionText.trim() || isSending}
                        onPress={() => handleSendQuestion()}
                    >
                        <Feather name="arrow-up" size={ms(18)} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
        paddingHorizontal: ms(16),
        paddingVertical: vs(12),
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    backBtn: {
        padding: ms(6),
    },
    headerTitleWrapper: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontFamily: FONTS.serif,
        fontSize: ms(17),
        fontWeight: '600',
    },
    headerSub: {
        fontFamily: FONTS.sans,
        fontSize: ms(11),
        marginTop: vs(1),
    },
    scrollContent: {
        paddingHorizontal: ms(16),
        paddingVertical: vs(16),
        gap: vs(16),
    },
    userRow: {
        alignSelf: 'flex-end',
        maxWidth: '82%',
    },
    userBubble: {
        borderRadius: ms(18),
        borderBottomRightRadius: ms(4),
        paddingHorizontal: ms(16),
        paddingVertical: vs(10),
    },
    userText: {
        fontFamily: FONTS.sans,
        fontSize: ms(15),
        lineHeight: vs(20),
    },
    aiRow: {
        flexDirection: 'row',
        alignSelf: 'flex-start',
        maxWidth: '88%',
    },
    aiBadge: {
        width: ms(28),
        height: ms(28),
        borderRadius: ms(14),
        backgroundColor: 'rgba(142, 162, 129, 0.18)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: ms(8),
        marginTop: vs(2),
    },
    aiBubble: {
        flex: 1,
        borderRadius: ms(18),
        borderTopLeftRadius: ms(4),
        paddingHorizontal: ms(16),
        paddingVertical: vs(12),
    },
    aiSenderLabel: {
        fontFamily: FONTS.sans,
        fontSize: ms(10),
        fontWeight: '700',
        letterSpacing: 0.8,
        marginBottom: vs(4),
    },
    aiText: {
        fontFamily: FONTS.sans,
        fontSize: ms(15),
        lineHeight: vs(21),
    },
    citationsContainer: {
        marginTop: vs(10),
        paddingTop: vs(8),
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.06)',
    },
    citationHeaderLabel: {
        fontFamily: FONTS.sans,
        fontSize: ms(10),
        fontWeight: '700',
        color: '#8EA281',
        letterSpacing: 0.8,
        marginBottom: vs(6),
    },
    citationCard: {
        borderRadius: ms(10),
        borderWidth: 1,
        padding: ms(10),
        marginBottom: vs(6),
    },
    citationTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    citationTitle: {
        flex: 1,
        fontFamily: FONTS.serif,
        fontSize: ms(13),
        fontWeight: '600',
        color: '#8EA281',
    },
    citationExcerpt: {
        fontFamily: FONTS.sans,
        fontSize: ms(12),
        fontStyle: 'italic',
        color: '#666',
        marginTop: vs(4),
    },
    systemBox: {
        borderRadius: ms(12),
        padding: ms(12),
        marginVertical: vs(4),
    },
    systemText: {
        fontFamily: FONTS.sans,
        fontSize: ms(13),
        fontWeight: '500',
        flex: 1,
    },
    retryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: vs(6),
        alignSelf: 'flex-start',
    },
    retryChipText: {
        fontFamily: FONTS.sans,
        fontSize: ms(12),
        fontWeight: '600',
    },
    inputBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: ms(16),
        paddingVertical: vs(10),
        gap: ms(10),
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    inputContainer: {
        flex: 1,
        borderRadius: ms(20),
        paddingHorizontal: ms(16),
        paddingVertical: vs(8),
    },
    input: {
        fontFamily: FONTS.sans,
        fontSize: ms(15),
        padding: 0,
    },
    sendBtn: {
        width: ms(38),
        height: ms(38),
        borderRadius: ms(19),
        justifyContent: 'center',
        alignItems: 'center',
    },
});
