import { FONTS } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ms, vs } from 'react-native-size-matters';

export default function LegacySuccessScreen() {
    const router = useRouter();
    const isDarkMode = useColorScheme() === 'dark';

    const palette = {
        bg: isDarkMode ? '#121212' : '#F9F8F6',

        iconBg: isDarkMode ? '#31373D' : '#E5E4EB',
        iconColor: isDarkMode ? '#8CA0A0' : '#8A93A5',

        title: isDarkMode ? '#C3C9A5' : '#2D2C39',
        sub: isDarkMode ? '#858585' : '#8F9D8A',

        btnBg: '#92A38D',
        btnText: '#FFFFFF'
    };

    const handleFinish = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Replace our location back to profile so the user cannot back-navigate into activation process again.
        router.replace('/profile' as any);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]}>
            <View style={styles.content}>

                {/* Dynamic Central Success Node */}
                <View style={[styles.iconCirc, { backgroundColor: palette.iconBg }]}>
                    <Feather name="shield" size={ms(42)} color={palette.iconColor} />
                </View>

                <Text style={[styles.title, { color: palette.title }]}>
                    Trusted Contacts{'\n'}are configured.
                </Text>

                <Text style={[styles.subtitle, { color: palette.sub }]}>
                    Your trusted contacts are now set up. They will be notified according to your inactivity rules.
                </Text>

                <TouchableOpacity
                    style={[styles.btn, { backgroundColor: palette.btnBg }]}
                    activeOpacity={0.8}
                    onPress={handleFinish}
                >
                    <Text style={styles.btnText}>Return to Settings</Text>
                </TouchableOpacity>

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: ms(40),
    },
    iconCirc: {
        width: ms(100),
        height: ms(100),
        borderRadius: ms(50),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: vs(36),
    },
    title: {
        fontFamily: FONTS.serif,
        fontSize: ms(36),
        lineHeight: vs(42),
        textAlign: 'center',
        fontWeight: '500',
        marginBottom: vs(20),
    },
    subtitle: {
        fontFamily: FONTS.sans,
        fontSize: ms(16),
        lineHeight: vs(22),
        textAlign: 'center',
        marginBottom: vs(40),
    },
    btn: {
        height: vs(52),
        paddingHorizontal: ms(28),
        borderRadius: ms(14),
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    btnText: {
        fontFamily: FONTS.serif,
        fontSize: ms(16),
        color: '#FFFFFF',
        fontWeight: '600',
    }
});
