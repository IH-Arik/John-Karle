import { useAppTheme } from '@/hooks/use-app-theme';
import { LightTheme, FONTS } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
    StatusBar,
    Text,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScaledSheet } from 'react-native-size-matters';

export default function ResetSuccessScreen() {
    const router = useRouter();
    const colors = useAppTheme();
    const colorScheme = useColorScheme();
    
    const styles = useMemo(() => getStyles(colors), [colors]);

    const handleBackToSignIn = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Clear standard routing history and bring back to signIn
        router.replace('/auth/signin');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar 
              barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} 
              backgroundColor="transparent" 
              translucent 
            />
            
            <View style={styles.content}>
                {/* Big Success Checkmark Circle */}
                <View style={styles.checkCircle}>
                    <Feather name="check" size={48} color={colors.accentGreen} />
                </View>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Password reset successful.</Text>
                    <Text style={styles.subtitle}>
                        Your Lineage AI account is secured. Sign in with your new password to access your archive.
                    </Text>
                </View>

                {/* Security Informative Banner */}
                <View style={styles.infoBanner}>
                    <View style={styles.lockCircle}>
                        <Feather name="lock" size={16} color={colors.accentGreen} />
                    </View>
                    <Text style={styles.infoText}>
                        For your security, all active sessions have been signed out. Please sign in again.
                    </Text>
                </View>
            </View>

            {/* Primary Bottom Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.primaryBtn}
                    onPress={handleBackToSignIn}
                >
                    <Text style={styles.primaryBtnText}>Back to Sign In</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const getStyles = (colors: typeof LightTheme) => ScaledSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: '24@ms',
        justifyContent: 'center',
        marginTop: '-60@vs', // Slightly pull up from absolute center for aesthetic weighting
    },
    checkCircle: {
        width: '100@ms',
        height: '100@ms',
        borderRadius: '50@ms',
        backgroundColor: colors.cardBg, 
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '40@vs',
    },
    header: {
        alignItems: 'center',
        marginBottom: '30@vs',
    },
    title: {
        fontFamily: FONTS.serif,
        fontSize: '34@ms',
        lineHeight: '40@ms',
        fontWeight: '600',
        color: colors.textDark,
        marginBottom: '16@vs',
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: FONTS.sans,
        fontSize: '15@ms',
        lineHeight: '22@ms',
        color: colors.textMuted,
        textAlign: 'center',
        paddingHorizontal: '10@ms',
    },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cardBg,
        padding: '16@ms',
        borderRadius: '16@ms',
        borderWidth: 1,
        borderColor: colors.border,
        width: '100%',
        gap: '14@ms',
    },
    lockCircle: {
        width: '34@ms',
        height: '34@ms',
        borderRadius: '10@ms',
        backgroundColor: colors.btnSecondaryBg, // Highlighting logic match for subtle secondary contrast
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoText: {
        flex: 1,
        fontFamily: FONTS.sans,
        fontSize: '12@ms',
        lineHeight: '17@ms',
        color: colors.textMuted,
    },
    footer: {
        paddingHorizontal: '24@ms',
        paddingBottom: '40@vs',
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
