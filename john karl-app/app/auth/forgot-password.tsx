import { FONTS, LightTheme } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme,
    Alert,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScaledSheet } from 'react-native-size-matters';
import { api } from '@/services/api';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const colors = useAppTheme();
    const colorScheme = useColorScheme();

    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const styles = useMemo(() => getStyles(colors), [colors]);

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    const handleSendCode = async () => {
        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
            Alert.alert('Validation Error', 'Please enter your email address.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            Alert.alert('Validation Error', 'Please enter a valid email address.');
            return;
        }

        setIsLoading(true);
                try {
            const response = await api.post('/auth/forgot-password', { email: trimmedEmail });
            console.log('[Forgot Password Response]', response);
            if (response.success && response.data) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.push({
                    pathname: '/auth/verify-code',
                    params: { email: trimmedEmail }
                });
            } else {
                Alert.alert('Error', response.message || 'Failed to send reset code. Please try again.');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'A network error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar
                barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
            />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Back Button */}
                    <TouchableOpacity onPress={handleBack} style={styles.backBtn} disabled={isLoading}>
                        <Feather name="arrow-left" size={22} color={colors.textDark} />
                    </TouchableOpacity>

                    {/* Progress Indicator */}
                    <View style={styles.progressWrapper}>
                        <View style={styles.progressItem}>
                            <View style={[styles.progressBar, styles.progressBarActive]} />
                            <Text style={[styles.progressText, styles.progressTextActive]}>Email</Text>
                        </View>
                        <View style={styles.progressItem}>
                            <View style={[styles.progressBar, styles.progressBarInactive]} />
                            <Text style={[styles.progressText, styles.progressTextInactive]}>Verify</Text>
                        </View>
                        <View style={styles.progressItem}>
                            <View style={[styles.progressBar, styles.progressBarInactive]} />
                            <Text style={[styles.progressText, styles.progressTextInactive]}>Password</Text>
                        </View>
                    </View>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Forgot your password?</Text>
                        <Text style={styles.subtitle}>No worries — enter your email and we'll send you a reset code.</Text>
                    </View>

                    {/* Input Field */}
                    <View style={styles.formContainer}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email address</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    placeholder="you@example.com"
                                    placeholderTextColor={colors.textMuted}
                                    style={styles.input}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    value={email}
                                    onChangeText={setEmail}
                                    editable={!isLoading}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Primary Button */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={[styles.primaryBtn, isLoading && { opacity: 0.7 }]}
                            onPress={handleSendCode}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.primaryBtnText}>Send Reset Code</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const getStyles = (colors: typeof LightTheme) => ScaledSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContainer: {
        paddingHorizontal: '24@ms',
        paddingTop: '20@vs',
        paddingBottom: '40@vs',
    },
    backBtn: {
        width: '40@ms',
        height: '40@ms',
        borderRadius: '20@ms',
        backgroundColor: colors.btnSecondaryBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '20@vs',
    },
    progressWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: '40@vs',
        gap: '10@s',
    },
    progressItem: {
        flex: 1,
        alignItems: 'center',
        gap: '6@vs',
    },
    progressBar: {
        height: '4@vs',
        width: '100%',
        borderRadius: '2@vs',
    },
    progressBarActive: {
        backgroundColor: colors.primaryAlt, // From screen design tint
    },
    progressBarInactive: {
        backgroundColor: colors.tabBgInactive,
    },
    progressText: {
        fontFamily: FONTS.sans,
        fontSize: '11@ms',
        letterSpacing: 0.5,
    },
    progressTextActive: {
        color: colors.accentGreen,
    },
    progressTextInactive: {
        color: colors.textMuted,
    },
    header: {
        marginBottom: '35@vs',
    },
    title: {
        fontFamily: FONTS.serif,
        fontSize: '38@ms',
        lineHeight: '42@ms',
        fontWeight: '600',
        color: colors.textDark,
        marginBottom: '12@vs',
    },
    subtitle: {
        fontFamily: FONTS.sans,
        fontSize: '15@ms',
        lineHeight: '22@ms',
        color: colors.accentGreen,
        letterSpacing: 0.2,
    },
    formContainer: {
        marginBottom: '40@vs',
    },
    inputGroup: {
        gap: '8@vs',
    },
    label: {
        fontFamily: FONTS.serif,
        fontSize: '15@ms',
        color: colors.textDark,
        fontWeight: '500',
        marginLeft: '2@ms',
    },
    inputWrapper: {
        position: 'relative',
        justifyContent: 'center',
    },
    input: {
        backgroundColor: colors.inputBg,
        height: '52@vs',
        borderRadius: '12@ms',
        paddingHorizontal: '16@ms',
        fontSize: '15@ms',
        fontFamily: FONTS.sans,
        color: colors.textDark,
    },
    footer: {
        marginTop: '10@vs',
    },
    primaryBtn: {
        backgroundColor: colors.primaryAlt,
        height: '56@vs',
        width: '100%',
        borderRadius: '14@ms',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    primaryBtnText: {
        fontFamily: FONTS.serif,
        color: '#FFFFFF',
        fontSize: '18@ms',
        fontWeight: '700',
    },
});
