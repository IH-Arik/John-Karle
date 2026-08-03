import React from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    Pressable, 
    useColorScheme 
} from 'react-native';
import { ms, vs } from 'react-native-size-matters';
import { FONTS } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

interface SignOutModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const SignOutModal: React.FC<SignOutModalProps> = ({
    visible,
    onClose,
    onConfirm
}) => {
    const isDarkMode = useColorScheme() === 'dark';

    const palette = {
        overlay: 'rgba(0,0,0,0.6)',
        contentBg: isDarkMode ? '#1A1A1A' : '#F9F8F6',
        textTitle: isDarkMode ? '#FFFFFF' : '#2D2C39',
        textSub: isDarkMode ? '#A0A0A0' : '#5A5B66',
        cancelBg: isDarkMode ? '#83967A' : '#92A58E',
        confirmBg: '#E34540'
    };

    const handleCancel = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onClose();
    };

    const handleConfirm = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        onConfirm();
    };

    if (!visible) return null;

    return (
        <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
            <Pressable style={[styles.overlay, { backgroundColor: palette.overlay }]} onPress={handleCancel}>
                <Pressable style={[styles.content, { backgroundColor: palette.contentBg }]} onPress={(e) => e.stopPropagation()}>
                    
                    <Text style={[styles.title, { color: palette.textTitle }]}>Sign out?</Text>
                    
                    <Text style={[styles.subtitle, { color: palette.textSub }]}>
                        Your memories will remain safely stored. You can sign back in at any time.
                    </Text>

                    <View style={styles.btnRow}>
                        <TouchableOpacity 
                            style={[styles.btn, styles.cancelBtn, { backgroundColor: palette.cancelBg }]} 
                            onPress={handleCancel}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.btnText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.btn, styles.confirmBtn, { backgroundColor: palette.confirmBg }]} 
                            onPress={handleConfirm}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.btnText}>Sign Out</Text>
                        </TouchableOpacity>
                    </View>

                </Pressable>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: ms(24),
    },
    content: {
        width: '100%',
        borderRadius: ms(28),
        padding: ms(24),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 10,
    },
    title: {
        fontFamily: FONTS.serif,
        fontSize: ms(26),
        fontWeight: '500',
        marginBottom: vs(12),
    },
    subtitle: {
        fontFamily: FONTS.sans,
        fontSize: ms(15),
        lineHeight: vs(22),
        marginBottom: vs(24),
    },
    btnRow: {
        flexDirection: 'row',
        gap: ms(12),
    },
    btn: {
        flex: 1,
        height: vs(48),
        borderRadius: ms(16),
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtn: {
        // Sage/Greenish color already configured via inline palette logic
    },
    confirmBtn: {
        // Red
    },
    btnText: {
        color: '#FFFFFF',
        fontFamily: FONTS.sans,
        fontSize: ms(15),
        fontWeight: '600',
    }
});
