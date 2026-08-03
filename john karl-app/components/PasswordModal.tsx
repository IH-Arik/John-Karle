import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    Pressable, 
    TextInput,
    ActivityIndicator,
    useColorScheme,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { ms, vs } from 'react-native-size-matters';
import { FONTS } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface PasswordModalProps {
    visible: boolean;
    title: string;
    subtitle: string;
    onClose: () => void;
    onConfirm: (password: string) => Promise<void>;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
    visible,
    title,
    subtitle,
    onClose,
    onConfirm
}) => {
    const isDarkMode = useColorScheme() === 'dark';
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Reset state on open/close
    useEffect(() => {
        if (visible) {
            setPassword('');
            setShowPassword(false);
            setErrorMsg(null);
            setLoading(false);
        }
    }, [visible]);

    const palette = {
        overlay: 'rgba(0,0,0,0.6)',
        contentBg: isDarkMode ? '#1A1A1A' : '#F9F8F6',
        textTitle: isDarkMode ? '#FFFFFF' : '#2D2C39',
        textSub: isDarkMode ? '#A0A0A0' : '#5A5B66',
        inputBg: isDarkMode ? '#2D2C35' : '#EAE9EF',
        inputText: isDarkMode ? '#FFFFFF' : '#2D2C39',
        placeholder: isDarkMode ? '#8E8E9B' : '#7A7B85',
        cancelBg: isDarkMode ? '#83967A' : '#92A58E',
        confirmBg: '#8EA281', // Brand theme color
        errorText: '#E88B8B'
    };

    const handleCancel = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onClose();
    };

    const handleConfirm = async () => {
        if (!password.trim()) return;
        setLoading(true);
        setErrorMsg(null);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            await onConfirm(password);
        } catch (err: any) {
            setErrorMsg(err?.message || 'Verification failed. Please try again.');
            setLoading(false);
        }
    };

    if (!visible) return null;

    return (
        <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <Pressable style={[styles.overlay, { backgroundColor: palette.overlay }]} onPress={handleCancel}>
                    <Pressable style={[styles.content, { backgroundColor: palette.contentBg }]} onPress={(e) => e.stopPropagation()}>
                        
                        <Text style={[styles.title, { color: palette.textTitle }]}>{title}</Text>
                        
                        <Text style={[styles.subtitle, { color: palette.textSub }]}>{subtitle}</Text>

                        {errorMsg && (
                            <Text style={[styles.errorMsg, { color: palette.errorText }]}>{errorMsg}</Text>
                        )}

                        <View style={[styles.inputContainer, { backgroundColor: palette.inputBg }]}>
                            <TextInput
                                style={[styles.input, { color: palette.inputText }]}
                                placeholder="Enter password"
                                placeholderTextColor={palette.placeholder}
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!loading}
                            />
                            <TouchableOpacity 
                                style={styles.eyeBtn}
                                onPress={() => setShowPassword(!showPassword)}
                                disabled={loading}
                            >
                                <Feather 
                                    name={showPassword ? 'eye-off' : 'eye'} 
                                    size={ms(18)} 
                                    color={palette.placeholder} 
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.btnRow}>
                            <TouchableOpacity 
                                style={[styles.btn, { backgroundColor: palette.cancelBg }]} 
                                onPress={handleCancel}
                                activeOpacity={0.8}
                                disabled={loading}
                            >
                                <Text style={styles.btnText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[
                                    styles.btn, 
                                    { backgroundColor: palette.confirmBg },
                                    (!password.trim() || loading) && { opacity: 0.6 }
                                ]} 
                                onPress={handleConfirm}
                                activeOpacity={0.8}
                                disabled={!password.trim() || loading}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.btnText}>Done</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                    </Pressable>
                </Pressable>
            </KeyboardAvoidingView>
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
        fontSize: ms(24),
        fontWeight: '500',
        marginBottom: vs(8),
    },
    subtitle: {
        fontFamily: FONTS.sans,
        fontSize: ms(14),
        lineHeight: vs(20),
        marginBottom: vs(16),
    },
    errorMsg: {
        fontFamily: FONTS.sans,
        fontSize: ms(13),
        fontWeight: '600',
        marginBottom: vs(12),
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: ms(14),
        paddingRight: ms(12),
        marginBottom: vs(24),
        height: vs(48),
    },
    input: {
        flex: 1,
        height: '100%',
        paddingHorizontal: ms(16),
        fontFamily: FONTS.sans,
        fontSize: ms(14),
    },
    eyeBtn: {
        padding: ms(4),
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
    btnText: {
        color: '#FFFFFF',
        fontFamily: FONTS.sans,
        fontSize: ms(15),
        fontWeight: '600',
    }
});
