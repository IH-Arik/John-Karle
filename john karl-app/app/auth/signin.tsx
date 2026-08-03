import { FONTS, LightTheme } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Feather, Ionicons } from '@expo/vector-icons';
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
import Animated, { FadeIn, Layout, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScaledSheet } from 'react-native-size-matters';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth-store';

export default function SignInScreen() {
    const router = useRouter();
    const colors = useAppTheme();
    const colorScheme = useColorScheme();
    const [isSignIn, setIsSignIn] = useState(true);
    const [isSecure, setIsSecure] = useState(true);
    const [isTermsAccepted, setIsTermsAccepted] = useState(false);

    // Form inputs state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const styles = useMemo(() => getStyles(colors), [colors]);

    const toggleAuthMode = (mode: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsSignIn(mode);
        // Clear forms on mode switch
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
    };

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/onboarding');
        }
    };

    const handleSubmit = async () => {
        const trimmedEmail = email.trim();
        const trimmedName = name.trim();

        if (!isSignIn) {
            if (!trimmedName) {
                Alert.alert('Validation Error', 'Please enter your name.');
                return;
            }
            if (!trimmedEmail) {
                Alert.alert('Validation Error', 'Please enter your email address.');
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(trimmedEmail)) {
                Alert.alert('Validation Error', 'Please enter a valid email address.');
                return;
            }
            if (password.length < 6) {
                Alert.alert('Validation Error', 'Password must be at least 6 characters.');
                return;
            }
            if (password !== confirmPassword) {
                Alert.alert('Validation Error', 'Passwords do not match.');
                return;
            }
            if (!isTermsAccepted) {
                Alert.alert('Validation Error', 'Please accept the Terms & Privacy Policy.');
                return;
            }

            setIsLoading(true);
            try {
                const response = await api.post('/auth/register', {
                    name: trimmedName,
                    email: trimmedEmail,
                    password: password,
                });

                if (__DEV__) {
                    console.log('[Register API Response]', JSON.stringify(response, null, 2));
                }

                if (response.success && response.data && response.data.data) {
                    const { user, tokens } = response.data.data;
                    if (!user || !tokens) {
                        Alert.alert('Registration Failed', 'Invalid response format from server.');
                        return;
                    }
                    const nameParts = (user.name || trimmedName).trim().split(/\s+/);
                    const firstName = nameParts[0] || '';
                    const lastName = nameParts.slice(1).join(' ') || '';

                    const mappedUser = {
                        ...user,
                        firstName,
                        lastName,
                    };

                    await useAuthStore.getState().signIn(tokens.accessToken, tokens.refreshToken || null, mappedUser);
                    
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    router.replace('/(tabs)');
                } else {
                    Alert.alert('Registration Failed', response.message || 'An error occurred during registration.');
                }
            } catch (err: any) {
                Alert.alert('Error', err?.message || 'A network error occurred. Please try again.');
            } finally {
                setIsLoading(false);
            }
        } else {
            if (!trimmedEmail) {
                Alert.alert('Validation Error', 'Please enter your email address.');
                return;
            }
            if (!password) {
                Alert.alert('Validation Error', 'Please enter your password.');
                return;
            }
            if (!isTermsAccepted) {
                Alert.alert('Validation Error', 'Please accept the Terms & Privacy Policy.');
                return;
            }

            setIsLoading(true);
            try {
                const response = await api.post('/auth/login', {
                    email: trimmedEmail,
                    password: password,
                });

                if (__DEV__) {
                    console.log('[Login API Response]', JSON.stringify(response, null, 2));
                }

                if (response.success && response.data && response.data.data) {
                    const { user, tokens } = response.data.data;
                    if (!user || !tokens) {
                        Alert.alert('Sign In Failed', 'Invalid response format from server.');
                        return;
                    }
                    const nameParts = (user.name || '').trim().split(/\s+/);
                    const firstName = nameParts[0] || '';
                    const lastName = nameParts.slice(1).join(' ') || '';

                    const mappedUser = {
                        ...user,
                        firstName,
                        lastName,
                    };

                    await useAuthStore.getState().signIn(tokens.accessToken, tokens.refreshToken || null, mappedUser);

                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    router.replace('/(tabs)');
                } else {
                    Alert.alert('Sign In Failed', response.message || 'Invalid email or password.');
                }
            } catch (err: any) {
                Alert.alert('Error', err?.message || 'A network error occurred. Please try again.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleForgotPassword = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/auth/forgot-password');
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
                    <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                        <Feather name="arrow-left" size={22} color={colors.textDark} />
                    </TouchableOpacity>

                    {/* Header */}
                    <Animated.View layout={Layout.springify()} style={styles.header}>
                        <Text style={styles.title}>
                            {isSignIn ? "Welcome back." : "Begin your legacy"}
                        </Text>
                        <Text style={styles.subtitle}>
                            {isSignIn
                                ? "Sign in to access your archive."
                                : "start preserving memories."
                            }
                        </Text>
                    </Animated.View>

                    {/* Tab Control */}
                    <View style={styles.tabContainer}>
                        <View style={styles.indicatorWrapper}>
                            {!isSignIn && <View style={{ flex: 1 }} />}
                            <Animated.View layout={LinearTransition} style={[styles.tab, styles.tabActive]} />
                            {isSignIn && <View style={{ flex: 1 }} />}
                        </View>

                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => toggleAuthMode(true)}
                            style={styles.tab}
                        >
                            <Text style={[styles.tabText, isSignIn ? styles.tabTextActive : styles.tabTextInactive]}>
                                Sign In
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => toggleAuthMode(false)}
                            style={styles.tab}
                        >
                            <Text style={[styles.tabText, !isSignIn ? styles.tabTextActive : styles.tabTextInactive]}>
                                Create Account
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Form Inputs */}
                    <Animated.View layout={Layout.springify()} style={styles.formContainer}>
                        {!isSignIn && (
                            <Animated.View entering={FadeIn} style={styles.inputGroup}>
                                <Text style={styles.label}>Your Name</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        placeholder="e.g. Sarah Mitchell"
                                        placeholderTextColor={colors.textMuted}
                                        style={styles.input}
                                        autoCapitalize="words"
                                        value={name}
                                        onChangeText={setName}
                                        editable={!isLoading}
                                    />
                                </View>
                            </Animated.View>
                        )}

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

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    placeholder="At least 6 characters"
                                    placeholderTextColor={colors.textMuted}
                                    style={[styles.input, { paddingRight: 45 }]}
                                    secureTextEntry={isSecure}
                                    autoCapitalize="none"
                                    value={password}
                                    onChangeText={setPassword}
                                    editable={!isLoading}
                                />
                                <TouchableOpacity
                                    onPress={() => setIsSecure(!isSecure)}
                                    style={styles.eyeBtn}
                                    disabled={isLoading}
                                >
                                    <Feather
                                        name={isSecure ? 'eye-off' : 'eye'}
                                        size={18}
                                        color={colors.textMuted}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {!isSignIn && (
                            <Animated.View entering={FadeIn} style={styles.inputGroup}>
                                <Text style={styles.label}>Confirm Password</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        placeholder="Re-enter your password"
                                        placeholderTextColor={colors.textMuted}
                                        style={styles.input}
                                        secureTextEntry={isSecure}
                                        autoCapitalize="none"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        editable={!isLoading}
                                    />
                                </View>
                            </Animated.View>
                        )}

                        {isSignIn && (
                            <Animated.View entering={FadeIn} style={styles.forgotContainer}>
                                <TouchableOpacity onPress={handleForgotPassword} disabled={isLoading}>
                                    <Text style={styles.forgotText}>Forgot password?</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        )}
                    </Animated.View>

                    {/* Primary Actions */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={[styles.primaryBtn, isLoading && { opacity: 0.7 }]}
                            onPress={handleSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.primaryBtnText}>
                                    {isSignIn ? "Sign In" : "Create Account"}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => !isLoading && setIsTermsAccepted(!isTermsAccepted)}
                            style={styles.termsContainer}
                            disabled={isLoading}
                        >
                            <View style={[styles.checkbox, isTermsAccepted && styles.checkboxChecked]}>
                                {isTermsAccepted && <Ionicons name="checkmark" size={12} color="#FFF" />}
                            </View>
                            <Text style={styles.termsText}>
                                By continuing, you agree to our{' '}
                                <Text style={styles.linkText}>Terms</Text> and{' '}
                                <Text style={styles.linkText}>Privacy Policy</Text>.
                            </Text>
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
        marginBottom: '30@vs',
    },
    header: {
        marginBottom: '30@vs',
    },
    title: {
        fontFamily: FONTS.serif,
        fontSize: '38@ms',
        lineHeight: '44@ms',
        fontWeight: '600',
        color: colors.textDark,
        marginBottom: '8@vs',
    },
    subtitle: {
        fontFamily: FONTS.sans,
        fontSize: '15@ms',
        color: colors.accentGreen,
        letterSpacing: 0.2,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: colors.tabBgInactive,
        borderRadius: '12@ms',
        padding: '4@ms',
        height: '45@vs',
        marginBottom: '30@vs',
        overflow: 'hidden',
    },
    indicatorWrapper: {
        position: 'absolute',
        top: '4@ms',
        bottom: '4@ms',
        left: '4@ms',
        right: '4@ms',
        flexDirection: 'row',
    },
    tab: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '9@ms',
    },
    tabActive: {
        backgroundColor: colors.tabBgActive,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabInactive: {
        backgroundColor: 'transparent',
    },
    tabText: {
        fontFamily: FONTS.serif,
        fontSize: '17@ms',
        letterSpacing: 0.3,
    },
    tabTextActive: {
        color: '#FFFFFF',
        fontWeight: '500',
    },
    tabTextInactive: {
        color: colors.textMuted,
    },
    formContainer: {
        gap: '18@vs',
        marginBottom: '35@vs',
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
    eyeBtn: {
        position: 'absolute',
        right: '16@ms',
        padding: '4@ms',
    },
    forgotContainer: {
        alignItems: 'flex-end',
        marginTop: '-8@vs',
    },
    forgotText: {
        fontFamily: FONTS.sans,
        fontSize: '13@ms',
        color: colors.accentGreen,
    },
    footer: {
        gap: '30@vs',
        alignItems: 'center',
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
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: '10@ms',
    },
    checkbox: {
        width: '18@ms',
        height: '18@ms',
        borderRadius: '4@ms',
        borderWidth: 1,
        borderColor: colors.textMuted,
        marginRight: '10@ms',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: colors.primaryAlt,
        borderColor: colors.primaryAlt,
    },
    termsText: {
        fontFamily: FONTS.sans,
        fontSize: '12@ms',
        color: colors.textMuted,
        lineHeight: '18@ms',
    },
    linkText: {
        textDecorationLine: 'underline',
        color: colors.textMuted,
    },
});
