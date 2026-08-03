import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ms, vs } from 'react-native-size-matters';
import { FONTS } from '@/constants/theme';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';

interface CollectorProps {
    palette: any;
    isDarkMode: boolean;
    fileUri: string | null;
    onSelectFile: (uri: string | null) => void;
}

// ====================================================
// PHOTO COLLECTOR (Dual buttons: Browse + Camera)
// ====================================================
export const PhotoCollector: React.FC<CollectorProps> = ({ palette, isDarkMode, fileUri, onSelectFile }) => {
    const handlePickImage = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Media library permission is required to select photos.');
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.8,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                onSelectFile(result.assets[0].uri);
            }
        } catch (error) {
            console.error('[PhotoCollector] Gallery pick error:', error);
        }
    };

    const handleCameraImage = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
                return;
            }
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                quality: 0.8,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                onSelectFile(result.assets[0].uri);
            }
        } catch (error) {
            console.error('[PhotoCollector] Camera capture error:', error);
        }
    };

    if (fileUri) {
        return (
            <View style={styles.previewContainer}>
                <Text style={[styles.sectionHeader, { color: palette.textDark, marginBottom: vs(12) }]}>
                    Selected Photo
                </Text>
                <View style={styles.imageWrapper}>
                    <Image source={{ uri: fileUri }} style={styles.imagePreview} />
                    <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={async () => {
                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            onSelectFile(null);
                        }}
                    >
                        <Feather name="trash-2" size={ms(16)} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <>
            <Text style={[styles.sectionHeader, { color: palette.textDark, marginBottom: vs(12) }]}>
                Choose a photo from your device or take one now.
            </Text>
            <View style={[styles.uploadContainer, { backgroundColor: palette.uploadBg, borderColor: palette.uploadBorder }]}>
                <View style={[styles.uploadInnerIcon, { backgroundColor: palette.iconBack }]}>
                    <Feather name="image" size={ms(28)} color={isDarkMode ? '#8EA281' : '#B6C3B0'} />
                </View>
                <Text style={[styles.uploadTitle, { color: isDarkMode ? '#8EA281' : '#FFFFFF' }]}>Upload a photo</Text>
                <Text style={[styles.uploadSub, { color: isDarkMode ? '#A0A0A0' : '#FFFFFF' }]}>JPG, PNG, HEIC, WebP · Up to 50 MB</Text>
                <View style={styles.uploadBtnRow}>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: palette.browseBtn }]} onPress={handlePickImage}>
                        <Feather name="upload" size={ms(14)} color="#FFFFFF" style={{ marginRight: ms(6) }} />
                        <Text style={styles.actionBtnText}>Browse files</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: palette.cameraBtn }]} onPress={handleCameraImage}>
                        <Feather name="camera" size={ms(14)} color="#FFFFFF" style={{ marginRight: ms(6) }} />
                        <Text style={styles.actionBtnText}>Camera</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </>
    );
};

// ====================================================
// VIDEO COLLECTOR (Single Button)
// ====================================================
export const VideoCollector: React.FC<CollectorProps> = ({ palette, isDarkMode, fileUri, onSelectFile }) => {
    const handlePickVideo = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Media library permission is required to select videos.');
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['videos'],
                quality: 0.8,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                onSelectFile(result.assets[0].uri);
            }
        } catch (error) {
            console.error('[VideoCollector] Video pick error:', error);
        }
    };

    if (fileUri) {
        return (
            <View style={styles.previewContainer}>
                <Text style={[styles.sectionHeader, { color: palette.textDark, marginBottom: vs(12) }]}>
                    Selected Video
                </Text>
                <View style={[styles.mediaCard, { backgroundColor: isDarkMode ? '#222' : '#EAEAEF' }]}>
                    <View style={styles.mediaDetails}>
                        <Feather name="video" size={ms(24)} color="#7F7FA0" style={{ marginRight: ms(12) }} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.mediaTitle, { color: palette.textDark }]}>Video Clip Selected</Text>
                            <Text style={[styles.mediaSub, { color: palette.textMuted }]} numberOfLines={1}>
                                {fileUri.split('/').pop() || 'video.mp4'}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.changeBtn}
                        onPress={async () => {
                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            onSelectFile(null);
                        }}
                    >
                        <Text style={styles.changeBtnText}>Remove</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <>
            <Text style={[styles.sectionHeader, { color: palette.textDark, marginBottom: vs(12) }]}>
                Add a video clip from your library.
            </Text>
            <View style={[
                styles.uploadContainer,
                { backgroundColor: isDarkMode ? 'transparent' : '#A9A9C0', borderColor: '#9A9ABD' }
            ]}>
                <View style={[styles.uploadInnerIcon, { backgroundColor: palette.iconBack }]}>
                    <Feather name="video" size={ms(28)} color="#9A9ABD" />
                </View>
                <Text style={[styles.uploadTitle, { color: isDarkMode ? '#9A9ABD' : '#FFFFFF' }]}>Upload a video</Text>
                <Text style={[styles.uploadSub, { color: isDarkMode ? '#A0A0A0' : '#FFFFFF' }]}>MP4, MOV, HEVC · Up to 100 MB</Text>
                <View style={styles.uploadBtnRow}>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#7F7FA0', width: '100%' }]} onPress={handlePickVideo}>
                        <Feather name="upload" size={ms(14)} color="#FFFFFF" style={{ marginRight: ms(6) }} />
                        <Text style={styles.actionBtnText}>Browse clips</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </>
    );
};

// ====================================================
// VOICE COLLECTOR (Single Button)
// ====================================================
export const VoiceCollector: React.FC<CollectorProps> = ({ palette, isDarkMode, fileUri, onSelectFile }) => {
    const handlePickAudio = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'audio/*',
                copyToCacheDirectory: true,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                onSelectFile(result.assets[0].uri);
            }
        } catch (error) {
            console.error('[VoiceCollector] Audio pick error:', error);
            Alert.alert('Error', 'Failed to pick audio file.');
        }
    };

    if (fileUri) {
        return (
            <View style={styles.previewContainer}>
                <Text style={[styles.sectionHeader, { color: palette.textDark, marginBottom: vs(12) }]}>
                    Selected Voice Note
                </Text>
                <View style={[styles.mediaCard, { backgroundColor: isDarkMode ? '#222' : '#EAEAEF' }]}>
                    <View style={styles.mediaDetails}>
                        <Feather name="mic" size={ms(24)} color="#7D9CAE" style={{ marginRight: ms(12) }} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.mediaTitle, { color: palette.textDark }]}>Voice Note Selected</Text>
                            <Text style={[styles.mediaSub, { color: palette.textMuted }]} numberOfLines={1}>
                                {fileUri.split('/').pop() || 'voice.mp3'}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.changeBtn}
                        onPress={async () => {
                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            onSelectFile(null);
                        }}
                    >
                        <Text style={styles.changeBtnText}>Remove</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <>
            <Text style={[styles.sectionHeader, { color: palette.textDark, marginBottom: vs(12) }]}>
                Load an existing voice memory file.
            </Text>
            <View style={[
                styles.uploadContainer,
                { backgroundColor: isDarkMode ? 'transparent' : '#A2B6C2', borderColor: '#7D9CAE' }
            ]}>
                <View style={[styles.uploadInnerIcon, { backgroundColor: palette.iconBack }]}>
                    <Feather name="mic" size={ms(28)} color="#7D9CAE" />
                </View>
                <Text style={[styles.uploadTitle, { color: isDarkMode ? '#7D9CAE' : '#FFFFFF' }]}>Add a voice note</Text>
                <Text style={[styles.uploadSub, { color: isDarkMode ? '#A0A0A0' : '#FFFFFF' }]}>MP3, WAV, M4A · Max 30 mins</Text>
                <View style={styles.uploadBtnRow}>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#5F7A8B', width: '100%' }]} onPress={handlePickAudio}>
                        <Feather name="upload" size={ms(14)} color="#FFFFFF" style={{ marginRight: ms(6) }} />
                        <Text style={styles.actionBtnText}>Load audio file</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    sectionHeader: {
        fontFamily: FONTS.serif,
        fontSize: ms(16),
        fontWeight: '500',
    },
    uploadContainer: {
        width: '100%',
        padding: ms(20),
        borderRadius: ms(20),
        borderWidth: 1.5,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadInnerIcon: {
        width: ms(56),
        height: ms(56),
        borderRadius: ms(16),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: vs(14),
    },
    uploadTitle: {
        fontFamily: FONTS.serif,
        fontSize: ms(15),
        fontWeight: '600',
        marginBottom: vs(4),
    },
    uploadSub: {
        fontFamily: FONTS.sans,
        fontSize: ms(11),
        opacity: 0.85,
        marginBottom: vs(20),
    },
    uploadBtnRow: {
        flexDirection: 'row',
        gap: ms(12),
        width: '100%',
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: ms(16),
        paddingVertical: vs(10),
        borderRadius: ms(12),
        flex: 1,
        justifyContent: 'center',
    },
    actionBtnText: {
        fontFamily: FONTS.sans,
        color: '#FFFFFF',
        fontSize: ms(13),
        fontWeight: '600',
    },
    previewContainer: {
        width: '100%',
    },
    imageWrapper: {
        position: 'relative',
        width: '100%',
        height: vs(200),
        borderRadius: ms(20),
        overflow: 'hidden',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removeBtn: {
        position: 'absolute',
        top: ms(12),
        right: ms(12),
        backgroundColor: 'rgba(0,0,0,0.6)',
        width: ms(36),
        height: ms(36),
        borderRadius: ms(18),
        justifyContent: 'center',
        alignItems: 'center',
    },
    mediaCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: ms(16),
        borderRadius: ms(16),
        justifyContent: 'space-between',
    },
    mediaDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    mediaTitle: {
        fontFamily: FONTS.serif,
        fontSize: ms(14),
        fontWeight: '600',
    },
    mediaSub: {
        fontFamily: FONTS.sans,
        fontSize: ms(11),
        marginTop: vs(2),
    },
    changeBtn: {
        paddingHorizontal: ms(12),
        paddingVertical: vs(6),
        borderRadius: ms(8),
        backgroundColor: 'rgba(211, 93, 90, 0.15)',
    },
    changeBtnText: {
        color: '#D35D5A',
        fontFamily: FONTS.sans,
        fontSize: ms(12),
        fontWeight: '600',
    }
});
