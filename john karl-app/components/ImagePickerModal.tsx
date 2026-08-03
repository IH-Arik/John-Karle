import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Pressable,
    Alert,
    useColorScheme
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ms, vs } from 'react-native-size-matters';
import { FONTS } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

interface ImagePickerModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectImage: (uri: string) => void;
}

export default function ImagePickerModal({ visible, onClose, onSelectImage }: ImagePickerModalProps) {
    const isDarkMode = useColorScheme() === 'dark';

    const palette = {
        overlay: 'rgba(0,0,0,0.5)',
        sheetBg: isDarkMode ? '#1E1E1E' : '#FFFFFF',
        textDark: isDarkMode ? '#FFFFFF' : '#2D2C39',
        textMuted: isDarkMode ? '#A0A0A0' : '#78849B',
        buttonBg: isDarkMode ? '#2D2D2D' : '#F2F2F2',
        buttonIcon: isDarkMode ? '#FFFFFF' : '#2D2C39',
        cancelText: '#D35D5A',
        cancelBg: isDarkMode ? '#3C2929' : '#F7DFDE',
    };

    const handleLaunchCamera = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        try {
            const ImagePicker = require('expo-image-picker');
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Camera permission is required to capture photos.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                onSelectImage(result.assets[0].uri);
                onClose();
            }
        } catch (error) {
            console.error('[ImagePickerModal] Camera launch error:', error);
            Alert.alert('Error', 'Failed to open camera.');
        }
    };

    const handleLaunchLibrary = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        try {
            const ImagePicker = require('expo-image-picker');
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Photo library permission is required to select photos.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                onSelectImage(result.assets[0].uri);
                onClose();
            }
        } catch (error) {
            console.error('[ImagePickerModal] Library launch error:', error);
            Alert.alert('Error', 'Failed to open photo library.');
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <Pressable style={[styles.overlay, { backgroundColor: palette.overlay }]} onPress={onClose}>
                <View style={[styles.sheet, { backgroundColor: palette.sheetBg }]}>
                    
                    <Text style={[styles.title, { color: palette.textDark }]}>Select Profile Picture</Text>
                    <Text style={[styles.subtitle, { color: palette.textMuted }]}>Choose a source for your avatar image</Text>

                    <View style={styles.optionsContainer}>
                        {/* Camera Option */}
                        <TouchableOpacity 
                            style={[styles.optionBtn, { backgroundColor: palette.buttonBg }]} 
                            onPress={handleLaunchCamera}
                            activeOpacity={0.8}
                        >
                            <View style={styles.iconWrapper}>
                                <Feather name="camera" size={ms(24)} color={palette.buttonIcon} />
                            </View>
                            <Text style={[styles.optionText, { color: palette.textDark }]}>Take Photo</Text>
                        </TouchableOpacity>

                        {/* Gallery Option */}
                        <TouchableOpacity 
                            style={[styles.optionBtn, { backgroundColor: palette.buttonBg }]} 
                            onPress={handleLaunchLibrary}
                            activeOpacity={0.8}
                        >
                            <View style={styles.iconWrapper}>
                                <Feather name="image" size={ms(24)} color={palette.buttonIcon} />
                            </View>
                            <Text style={[styles.optionText, { color: palette.textDark }]}>Choose Gallery</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Cancel Button */}
                    <TouchableOpacity 
                        style={[styles.cancelBtn, { backgroundColor: palette.cancelBg }]} 
                        onPress={onClose}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.cancelBtnText, { color: palette.cancelText }]}>Cancel</Text>
                    </TouchableOpacity>

                </View>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    sheet: {
        borderTopLeftRadius: ms(24),
        borderTopRightRadius: ms(24),
        paddingHorizontal: ms(24),
        paddingTop: vs(24),
        paddingBottom: vs(32),
        alignItems: 'center',
    },
    title: {
        fontFamily: FONTS.serif,
        fontSize: ms(20),
        fontWeight: '600',
        marginBottom: vs(4),
    },
    subtitle: {
        fontFamily: FONTS.sans,
        fontSize: ms(13),
        marginBottom: vs(24),
    },
    optionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: ms(16),
        marginBottom: vs(24),
    },
    optionBtn: {
        flex: 1,
        height: vs(100),
        borderRadius: ms(16),
        justifyContent: 'center',
        alignItems: 'center',
        gap: vs(8),
    },
    iconWrapper: {
        width: ms(44),
        height: ms(44),
        borderRadius: ms(22),
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionText: {
        fontFamily: FONTS.serif,
        fontSize: ms(14),
        fontWeight: '500',
    },
    cancelBtn: {
        width: '100%',
        height: vs(50),
        borderRadius: ms(14),
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtnText: {
        fontFamily: FONTS.sans,
        fontSize: ms(16),
        fontWeight: '600',
    }
});
