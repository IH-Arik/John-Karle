import React from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    Pressable, 
    useColorScheme 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ms, vs } from 'react-native-size-matters';
import { FONTS } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

interface DeleteAccountModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
    visible,
    onClose,
    onConfirm
}) => {
    const isDarkMode = useColorScheme() === 'dark';

    const palette = {
        overlay: 'rgba(0,0,0,0.6)',
        contentBg: isDarkMode ? '#121212' : '#F9F8F6',
        textTitle: isDarkMode ? '#FFFFFF' : '#2D2C39',
        textSub: isDarkMode ? '#A0A0A0' : '#5A5B66',
        
        // Top Alert Squircle
        alertBoxBg: isDarkMode ? '#2A1818' : '#F8EAE8',
        alertIcon: '#E54540',
        
        // Close Circle
        closeBtnBg: isDarkMode ? '#2E2E36' : '#E2E2E2',
        closeIcon: isDarkMode ? '#A0A0B0' : '#5A5A5A',

        // Warning Banner Inlay
        warnBannerBg: isDarkMode ? '#1F1414' : '#FCEBEC',
        warnBannerBorder: isDarkMode ? '#351D1D' : '#F7D3D6',
        warnBannerText: '#E04B4A',
        
        confirmBtnBg: '#E34540'
    };

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onClose();
    };

    const handleConfirm = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); // Maximum Alert Haptic
        onConfirm();
    };

    if (!visible) return null;

    return (
        <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
            <Pressable style={[styles.overlay, { backgroundColor: palette.overlay }]} onPress={handleClose}>
                <Pressable style={[styles.content, { backgroundColor: palette.contentBg }]} onPress={(e) => e.stopPropagation()}>
                    
                    {/* Top Utilities Row */}
                    <View style={styles.headerRow}>
                        <View style={[styles.alertSquircle, { backgroundColor: palette.alertBoxBg }]}>
                            <Feather name="alert-triangle" size={ms(22)} color={palette.alertIcon} />
                        </View>
                        <TouchableOpacity style={[styles.closeBtn, { backgroundColor: palette.closeBtnBg }]} onPress={handleClose}>
                            <Feather name="x" size={ms(18)} color={palette.closeIcon} />
                        </TouchableOpacity>
                    </View>

                    {/* Main Header Stack */}
                    <Text style={[styles.title, { color: palette.textTitle }]}>Delete your account?</Text>
                    
                    <Text style={[styles.subtitle, { color: palette.textSub }]}>
                        This will permanently delete all your memories, profiles, and data. <Text style={{ fontWeight: 'bold', color: isDarkMode ? '#FFFFFF' : '#2D2C39' }}>This cannot be undone.</Text> Please type <Text style={{ fontWeight: 'bold', color: isDarkMode ? '#FFFFFF' : '#2D2C39' }}>DELETE</Text> to confirm.
                    </Text>

                    {/* Red Warning Inset Banner Block */}
                    <View style={[
                        styles.warningBanner, 
                        { backgroundColor: palette.warnBannerBg, borderColor: palette.warnBannerBorder }
                    ]}>
                        <Text style={[styles.warnBannerText, { color: palette.warnBannerText }]}>
                            <Feather name="alert-triangle" size={ms(12)} /> All memories, profiles, AI conversations, and family access will be permanently removed. This action is irreversible.
                        </Text>
                    </View>

                    {/* Total Annihilation Button */}
                    <TouchableOpacity 
                        style={[styles.confirmBtn, { backgroundColor: palette.confirmBtnBg }]}
                        activeOpacity={0.9}
                        onPress={handleConfirm}
                    >
                        <Text style={styles.confirmBtnText}>Permanently Delete Account</Text>
                    </TouchableOpacity>

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
        borderRadius: ms(32),
        padding: ms(24),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 10,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: vs(16),
    },
    alertSquircle: {
        width: ms(48),
        height: ms(48),
        borderRadius: ms(16),
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeBtn: {
        width: ms(32),
        height: ms(32),
        borderRadius: ms(16),
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontFamily: FONTS.serif,
        fontSize: ms(28),
        fontWeight: '500',
        marginBottom: vs(16),
    },
    subtitle: {
        fontFamily: FONTS.sans,
        fontSize: ms(15),
        lineHeight: vs(22),
        marginBottom: vs(20),
    },
    warningBanner: {
        width: '100%',
        borderWidth: 1,
        borderRadius: ms(16),
        padding: ms(16),
        marginBottom: vs(24),
    },
    warnBannerText: {
        fontFamily: FONTS.sans,
        fontSize: ms(13),
        lineHeight: vs(18),
    },
    confirmBtn: {
        width: '100%',
        height: vs(56),
        borderRadius: ms(18),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    confirmBtnText: {
        fontFamily: FONTS.serif,
        color: '#FFFFFF',
        fontSize: ms(16),
        fontWeight: '600',
    }
});
