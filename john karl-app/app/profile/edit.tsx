import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView, 
    TextInput,
    Image,
    ActivityIndicator,
    Alert,
    useColorScheme,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ms, vs } from 'react-native-size-matters';
import { FONTS } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/hooks/use-auth';
import ImagePickerModal from '@/components/ImagePickerModal';
import { getAvatarSource } from '@/utils/image';

export default function EditProfileScreen() {
    const router = useRouter();
    const isDarkMode = useColorScheme() === 'dark';
    const { user, updateProfile, isProfilePictureLoading, setProfilePictureLoading } = useAuth();
    
    // Form States
    const [name, setName] = useState(user?.name || '');
    const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
    const [address, setAddress] = useState(user?.address || '');
    const [pickedImageUri, setPickedImageUri] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        setImageError(false);
    }, [user?.profilePicture?.url, pickedImageUri]);

    const hasImage = !!pickedImageUri || (!!(user?.profilePicture?.url || user?.avatarUrl) && !imageError);

    const triggerHaptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const palette = {
        bg: isDarkMode ? '#121212' : '#F9F8F6',
        textDark: isDarkMode ? '#FFFFFF' : '#2D2C39',
        textMuted: isDarkMode ? '#A0A0A0' : '#78849B',
        inputBg: isDarkMode ? '#1F1E24' : '#EAE6EC',
        inputText: isDarkMode ? '#FFFFFF' : '#2D2C39',
        cardBg: isDarkMode ? '#1E1E1E' : '#FFFFFF',
        btnPrimary: '#8EA281',
        btnText: '#FFFFFF',
        backBtnBg: isDarkMode ? '#323239' : '#E3E4E3',
        backBtnIcon: isDarkMode ? '#FFFFFF' : '#5A5B66',
        cameraOverlay: 'rgba(0,0,0,0.4)',
    };



    // Construct FormData and call updateProfile
    const handleSave = async () => {
        triggerHaptic();
        if (!name.trim()) {
            Alert.alert('Validation Error', 'Name field cannot be left blank.');
            return;
        }

        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('name', name.trim());
            formData.append('phoneNumber', phoneNumber.trim());
            formData.append('address', address.trim());

            // Append preferences from user object in store
            if (user?.preferences) {
                formData.append('notifications', String(user.preferences.notifications));
                formData.append('aiInsight', String(user.preferences.aiInsight));
                formData.append('darkMode', String(user.preferences.darkMode));
                formData.append('anonymousAnalytics', String(user.preferences.anonymousAnalytics));
            } else {
                formData.append('notifications', 'true');
                formData.append('aiInsight', 'true');
                formData.append('darkMode', String(isDarkMode));
                formData.append('anonymousAnalytics', 'false');
            }

            // Append familyMembers array from user object
            if (user?.familyMembers) {
                formData.append('familyMembers', JSON.stringify(user.familyMembers));
            } else {
                formData.append('familyMembers', JSON.stringify([]));
            }

            // Append profile picture file if one was selected
            if (pickedImageUri) {
                const filename = pickedImageUri.split('/').pop() || 'profile.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image/jpeg`;
                
                // Formulate React Native file attachment
                formData.append('profilePicture', {
                    uri: pickedImageUri,
                    name: filename,
                    type: type,
                } as any);
            }

            console.log('[Edit Profile] Submitting form data updates...');
            const result = await updateProfile(formData);

            if (result.success) {
                Alert.alert('Success', 'Profile updated successfully!', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                Alert.alert('Update Failed', result.message || 'Could not update profile.');
            }
        } catch (error: any) {
            console.error('[Edit Profile] Submit error:', error);
            Alert.alert('Error', error?.message || 'A network error occurred.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]} edges={['top']}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={[styles.backBtn, { backgroundColor: palette.backBtnBg }]}
                        onPress={() => router.back()}
                        disabled={isSaving}
                    >
                        <Feather name="arrow-left" size={ms(20)} color={palette.backBtnIcon} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: palette.textDark }]}>Edit Profile</Text>
                    <View style={{ width: ms(36) }} />
                </View>

                <ScrollView 
                    showsVerticalScrollIndicator={false} 
                    contentContainerStyle={styles.scrollContent}
                >
                    <View style={styles.avatarContainer}>
                        <TouchableOpacity 
                            activeOpacity={0.8} 
                            style={styles.avatarTouchable} 
                            onPress={() => {
                                triggerHaptic();
                                setModalVisible(true);
                            }}
                            disabled={isSaving}
                        >
                            {hasImage ? (
                                <Image 
                                    source={
                                        pickedImageUri 
                                            ? { uri: pickedImageUri } 
                                            : getAvatarSource(user)
                                    } 
                                    style={styles.avatarImage}
                                    onLoadStart={() => setProfilePictureLoading(true)}
                                    onLoadEnd={() => setProfilePictureLoading(false)}
                                    onError={() => {
                                        setProfilePictureLoading(false);
                                        setImageError(true);
                                    }}
                                />
                            ) : (
                                <View style={[styles.avatarPlaceholder, { backgroundColor: isDarkMode ? '#1F1E24' : '#EAE6EC' }]}>
                                    <Feather name="user" size={ms(44)} color={isDarkMode ? '#A0A0A0' : '#78849B'} />
                                </View>
                            )}
                            {isProfilePictureLoading && (
                                <View style={styles.imageLoadingContainer}>
                                    <ActivityIndicator size="small" color="#8EA281" />
                                </View>
                            )}
                            <View style={[styles.avatarCameraOverlay, { backgroundColor: palette.cameraOverlay }]}>
                                <Feather name="camera" size={ms(20)} color="#FFFFFF" />
                            </View>
                        </TouchableOpacity>
                        <Text style={[styles.avatarTipText, { color: palette.textMuted }]}>Tap photo to update</Text>
                    </View>

                    <View style={[styles.card, { backgroundColor: palette.cardBg }]}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: palette.textDark }]}>Name</Text>
                            <TextInput 
                                style={[styles.textInput, { backgroundColor: palette.inputBg, color: palette.inputText }]}
                                value={name}
                                onChangeText={setName}
                                placeholder="Your Full Name"
                                placeholderTextColor={isDarkMode ? '#666' : '#8E8E99'}
                                editable={!isSaving}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: palette.textDark }]}>Phone Number</Text>
                            <TextInput 
                                style={[styles.textInput, { backgroundColor: palette.inputBg, color: palette.inputText }]}
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                placeholder="+1 (555) 123-4567"
                                placeholderTextColor={isDarkMode ? '#666' : '#8E8E99'}
                                keyboardType="phone-pad"
                                editable={!isSaving}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: palette.textDark }]}>Address</Text>
                            <TextInput 
                                style={[styles.textInput, { backgroundColor: palette.inputBg, color: palette.inputText, height: vs(80), textAlignVertical: 'top', paddingTop: vs(12) }]}
                                value={address}
                                onChangeText={setAddress}
                                placeholder="123 Memory Lane, Suite 450"
                                placeholderTextColor={isDarkMode ? '#666' : '#8E8E99'}
                                multiline
                                numberOfLines={3}
                                editable={!isSaving}
                            />
                        </View>
                    </View>

                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={[styles.saveBtn, { backgroundColor: palette.btnPrimary }]}
                        activeOpacity={0.8}
                        onPress={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color={palette.btnText} />
                        ) : (
                            <Text style={[styles.saveBtnText, { color: palette.btnText }]}>Save Changes</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ImagePickerModal 
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    onSelectImage={(uri) => setPickedImageUri(uri)}
                />

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
        justifyContent: 'space-between',
        paddingHorizontal: ms(20),
        paddingVertical: vs(12),
    },
    backBtn: {
        width: ms(36),
        height: ms(36),
        borderRadius: ms(12),
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontFamily: FONTS.serif,
        fontSize: ms(20),
        fontWeight: '600',
    },
    scrollContent: {
        paddingHorizontal: ms(20),
        paddingTop: vs(15),
        paddingBottom: vs(100),
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: vs(30),
    },
    avatarTouchable: {
        width: ms(110),
        height: ms(110),
        borderRadius: ms(32),
        overflow: 'hidden',
        position: 'relative',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageLoadingContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    avatarCameraOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: vs(32),
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarTipText: {
        fontFamily: FONTS.sans,
        fontSize: ms(12),
        marginTop: vs(8),
    },
    card: {
        borderRadius: ms(20),
        padding: ms(20),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        shadowOpacity: 0.05,
        elevation: 2,
    },
    inputGroup: {
        marginBottom: vs(18),
    },
    inputLabel: {
        fontFamily: FONTS.serif,
        fontSize: ms(14),
        fontWeight: '500',
        marginBottom: vs(6),
    },
    textInput: {
        width: '100%',
        height: vs(48),
        borderRadius: ms(12),
        paddingHorizontal: ms(14),
        fontFamily: FONTS.sans,
        fontSize: ms(14),
    },
    footer: {
        position: 'absolute',
        bottom: vs(24),
        left: ms(20),
        right: ms(20),
    },
    saveBtn: {
        width: '100%',
        height: vs(50),
        borderRadius: ms(14),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        shadowOpacity: 0.1,
        elevation: 2,
    },
    saveBtnText: {
        fontFamily: FONTS.serif,
        fontSize: ms(16),
        fontWeight: '600',
    }
});
