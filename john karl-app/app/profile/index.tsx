import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView,
    useColorScheme,
    Image,
    Switch,
    ActivityIndicator,
    Platform,
    Appearance,
    Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { ms, vs } from 'react-native-size-matters';
import { FONTS } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { SignOutModal } from '@/components/SignOutModal';
import { DeleteAccountModal } from '@/components/DeleteAccountModal';
import { useAuth } from '@/hooks/use-auth';
import { getAvatarSource } from '@/utils/image';
import { PasswordModal } from '@/components/PasswordModal';
import { api } from '@/services/api';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, signOut, fetchProfile, updateUser, isProfilePictureLoading, setProfilePictureLoading } = useAuth();
    const isDarkMode = useColorScheme() === 'dark';
    
    // Log user state whenever it changes
    useEffect(() => {
        console.log('[Profile Screen] Current user state:', JSON.stringify(user, null, 2));
    }, [user]);

    // Fetch user profile on component mount
    useEffect(() => {
        console.log('[Profile Screen] Fetching user profile from API...');
        fetchProfile().catch((err) => {
            console.error('[Profile Screen] Failed to fetch user profile:', err);
        });
    }, [fetchProfile]);

    // Local State For Interactive Preference Switches
    const [notifications, setNotifications] = useState(true);
    const [aiInsights, setAiInsights] = useState(true);
    const [darkMode, setDarkMode] = useState(isDarkMode);
    const [analytics, setAnalytics] = useState(false);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        setImageError(false);
    }, [user?.profilePicture?.url]);

    const hasImage = !!(user?.profilePicture?.url || user?.avatarUrl) && !imageError;

    // Sync local preference states when user object updates
    useEffect(() => {
        if (user?.preferences) {
            setNotifications(user.preferences.notifications);
            setAiInsights(user.preferences.aiInsight);
            setDarkMode(user.preferences.darkMode);
            setAnalytics(user.preferences.anonymousAnalytics);
        }
    }, [user?.preferences]);

    // Helper to persist preference updates to auth store
    const updatePreference = (key: 'notifications' | 'aiInsight' | 'darkMode' | 'anonymousAnalytics', val: boolean) => {
        if (!user) return;
        const updatedPrefs = {
            notifications: user.preferences?.notifications ?? true,
            aiInsight: user.preferences?.aiInsight ?? true,
            darkMode: user.preferences?.darkMode ?? true,
            anonymousAnalytics: user.preferences?.anonymousAnalytics ?? false,
            ...user.preferences,
            [key]: val
        };
        updateUser({ preferences: updatedPrefs }).catch((err) => {
            console.error('[Profile Screen] Failed to update user preferences:', err);
        });
    };

    // Modal Interaction States
    const [showSignOut, setShowSignOut] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [pendingLegacyAccessValue, setPendingLegacyAccessValue] = useState(false);
    const [legacyAccessVal, setLegacyAccessVal] = useState(!!user?.legacyAccessEnabled);

    useEffect(() => {
        setLegacyAccessVal(!!user?.legacyAccessEnabled);
    }, [user?.legacyAccessEnabled]);

    const handleLegacyAccessToggle = (val: boolean) => {
        setPendingLegacyAccessValue(val);
        setPasswordModalVisible(true);
    };

    const handlePasswordConfirm = async (password: string) => {
        console.log(`[Profile Settings] Patching legacy-access/settings to: ${pendingLegacyAccessValue}`);
        const response = await api.patch('/legacy-access/settings', {
            legacyAccessEnabled: pendingLegacyAccessValue,
            currentPassword: password
        });

        if (response.success) {
            console.log('[Profile Settings] Legacy mode settings updated successfully.');
            // Sync status to global auth store
            await updateUser({ legacyAccessEnabled: pendingLegacyAccessValue });
            setPasswordModalVisible(false);
            Alert.alert(
                'Success', 
                `Legacy mode has been ${pendingLegacyAccessValue ? 'enabled' : 'disabled'} successfully.`
            );
        } else {
            console.warn('[Profile Settings] Patch failed:', response.message);
            throw new Error(response.message || 'Verification failed. Please check your password.');
        }
    };

    // Synchronize local UI state with Native App Appearance engine immediately
    const toggleDarkMode = (val: boolean) => {
        setDarkMode(val);
        Appearance.setColorScheme(val ? 'dark' : 'light');
    };

    // Standard Haptic Trigger for actions
    const triggerHaptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const palette = {
        bg: isDarkMode ? '#121212' : '#F9F8F6',
        textDark: isDarkMode ? '#FFFFFF' : '#2D2C39',
        textMuted: isDarkMode ? '#A0A0A0' : '#78849B',
        sectionHeader: isDarkMode ? '#FFFFFF' : '#5B5B5B',
        
        // Color Block Theme Extracted from mockup (Light Mode Fallbacks)
        accountBg: isDarkMode ? '#2A302A' : '#E2E8E1',
        privacyBg: isDarkMode ? '#2C2B32' : '#E8E7ED',
        prefBg: isDarkMode ? '#2A2E33' : '#E8EEF2',
        dataBg: isDarkMode ? '#2A2A2A' : '#FFFFFF',

        // Row Icons Internal Boxes
        iconBoxAccount: isDarkMode ? '#445244' : '#92A38D',
        iconBoxPrivacy: isDarkMode ? '#4A4857' : '#9FA3B7',
        iconBoxPref: isDarkMode ? '#465058' : '#A0B4C1',
        iconBoxData: isDarkMode ? '#444444' : '#F2F2F2',

        // Danger zone anchor
        signOutBg: isDarkMode ? '#3C2929' : '#F7DFDE',
        signOutText: '#D35D5A'
    };

    // Row Builder Helper for clean mapping
    const SettingsRow = ({ icon, label, subtext, groupType, showArrow = true, showSwitch = false, switchVal = false, setSwitchVal = null, isRed = false, onPress = null, isBlurred = false }: any) => {
        
        let iconBg = palette.iconBoxAccount;
        let iconColor = '#FFFFFF';
        let featherIcon = true;

        if (groupType === 'account') { iconBg = isDarkMode ? '#40523C' : '#92A38D'; }
        if (groupType === 'privacy') { iconBg = isDarkMode ? '#4C4856' : '#A6ABB9'; }
        if (groupType === 'pref') { iconBg = isDarkMode ? '#455059' : '#A2B3C1'; }
        if (groupType === 'data') { 
            iconBg = isRed ? '#FFF0F0' : '#A6ABB9'; 
            iconColor = isRed ? '#EF4444' : '#FFFFFF';
        }

        const blurText = isBlurred ? {
            color: 'transparent',
            textShadowColor: isDarkMode ? 'rgba(255, 255, 255, 0.55)' : 'rgba(45, 44, 57, 0.55)',
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: ms(4),
        } : {};

        const content = (
            <View style={styles.rowContent}>
                <View style={[styles.rowIconBox, { backgroundColor: iconBg }, isBlurred && { opacity: 0.3 }]}>
                    <Feather name={icon} size={ms(18)} color={iconColor} />
                </View>
                
                <View style={styles.rowTextContainer}>
                    <Text style={[styles.rowLabel, { color: isRed ? '#EE6B65' : palette.textDark }, blurText]}>{label}</Text>
                    {subtext && <Text style={[styles.rowSubtext, { color: palette.textMuted }, blurText]}>{subtext}</Text>}
                </View>

                {showArrow && !showSwitch && (
                    <Feather name="chevron-right" size={ms(18)} color={palette.textMuted} style={isBlurred && { opacity: 0.3 }} />
                )}
                
                {showSwitch && (
                    <Switch
                        trackColor={{ false: isDarkMode ? '#444' : '#D1D1D1', true: '#8EA281' }}
                        thumbColor={'#FFFFFF'}
                        ios_backgroundColor="#D1D1D1"
                        onValueChange={(val) => {
                            triggerHaptic();
                            setSwitchVal && setSwitchVal(val);
                        }}
                        value={switchVal}
                        style={{ transform: Platform.OS === 'ios' ? [{ scaleX: .8 }, { scaleY: .8 }] : [] }}
                    />
                )}
            </View>
        );

        if (showSwitch) {
            return <View style={styles.settingsRow}>{content}</View>;
        }

        return (
            <TouchableOpacity 
                style={styles.settingsRow} 
                activeOpacity={0.6}
                disabled={isBlurred}
                onPress={() => {
                    if (onPress) {
                        onPress();
                    } else {
                        triggerHaptic();
                    }
                }}
            >
                {content}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]} edges={['top']}>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* Header Vector: Avatar & Name Composite */}
                <View style={styles.avatarHeader}>
                    <TouchableOpacity 
                        onPress={() => {
                            triggerHaptic();
                            router.back();
                        }}
                        style={styles.backButton}
                    >
                        <Feather name="arrow-left" size={ms(24)} color={palette.textDark} />
                    </TouchableOpacity>
                    <View style={styles.avatarComposite}>
                        {hasImage ? (
                            <Image 
                                source={getAvatarSource(user)} 
                                style={styles.profileImg}
                                onLoadStart={() => setProfilePictureLoading(true)}
                                onLoadEnd={() => setProfilePictureLoading(false)}
                                onError={() => {
                                    setProfilePictureLoading(false);
                                    setImageError(true);
                                }}
                            />
                        ) : (
                            <View style={[styles.profileImgPlaceholder, { backgroundColor: isDarkMode ? '#1F1E24' : '#EAE6EC' }]}>
                                <Feather name="user" size={ms(28)} color={isDarkMode ? '#A0A0A0' : '#78849B'} />
                            </View>
                        )}
                        {isProfilePictureLoading && (
                            <View style={styles.imageLoadingContainer}>
                                <ActivityIndicator size="small" color="#8EA281" />
                            </View>
                        )}
                        {/* Green Check Mark Badge */}
                        <View style={styles.checkBadge}>
                            <Feather name="check" size={ms(12)} color="#FFFFFF" />
                        </View>
                    </View>
                    <View style={styles.nameStack}>
                        <Text style={[styles.profileName, { color: palette.textDark }]}>
                            {user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Sarah Mitchell'}
                        </Text>
                        <Text style={[styles.profileEmail, { color: palette.textMuted }]}>
                            {user?.email || 'sarah@example.com'}
                        </Text>
                    </View>
                </View>

                {/* ---------------- ACCOUNT ---------------- */}
                <Text style={[styles.sectionTitle, { color: palette.sectionHeader }]}>ACCOUNT</Text>
                <View style={[styles.groupContainer, { backgroundColor: palette.accountBg }]}>
                    <SettingsRow 
                        icon="user" 
                        label="Edit Profile" 
                        groupType="account" 
                        onPress={() => { triggerHaptic(); router.push('/profile/edit' as any); }} 
                    />
                    {user?.phoneNumber && (
                        <>
                            <View style={styles.divider} />
                            <SettingsRow 
                                icon="phone" 
                                label="Phone Number" 
                                subtext={user.phoneNumber} 
                                groupType="account" 
                                showArrow={false} 
                            />
                        </>
                    )}
                    {user?.address && (
                        <>
                            <View style={styles.divider} />
                            <SettingsRow 
                                icon="map-pin" 
                                label="Address" 
                                subtext={user.address} 
                                groupType="account" 
                                showArrow={false} 
                            />
                        </>
                    )}
                    <View style={styles.divider} />
                    <SettingsRow 
                        icon="users" 
                        label="Family Access" 
                        subtext={user?.familyMembers && user.familyMembers.length > 0 
                            ? `${user.familyMembers.length} member${user.familyMembers.length === 1 ? '' : 's'} with access` 
                            : 'Manage family member access'}
                        groupType="account" 
                        onPress={() => { triggerHaptic(); router.push('/family-access'); }} 
                    />
                    <View style={styles.divider} />
                    <SettingsRow 
                        icon="shield" 
                        label="Legacy Mode" 
                        subtext={legacyAccessVal ? 'Legacy mode is active' : 'Enable legacy mode settings'}
                        groupType="account" 
                        showArrow={false}
                        showSwitch={true}
                        switchVal={legacyAccessVal}
                        setSwitchVal={handleLegacyAccessToggle}
                        isBlurred={false}
                    />
                    <View style={styles.divider} />
                    <SettingsRow 
                        icon="key" 
                        label="Legacy Access" 
                        subtext="Manage legacy access rules and settings"
                        groupType="account" 
                        onPress={() => { triggerHaptic(); router.push('/legacy-mode/access'); }} 
                        isBlurred={!legacyAccessVal}
                    />
                    <View style={styles.divider} />
                    <SettingsRow 
                        icon="user-check" 
                        label="Trusted Contacts" 
                        subtext="Manage trusted contacts"
                        groupType="account" 
                        onPress={() => { triggerHaptic(); router.push('/legacy-mode'); }} 
                        isBlurred={!legacyAccessVal}
                    />
                </View>

                {/* ----------- PRIVACY & SECURITY ---------- */}
                <Text style={[styles.sectionTitle, { color: palette.sectionHeader, marginTop: vs(24) }]}>PRIVACY & SECURITY</Text>
                <View style={[styles.groupContainer, { backgroundColor: palette.privacyBg }]}>
                    <SettingsRow icon="lock" label="Privacy Controls" groupType="privacy" />
                    <View style={styles.divider} />
                    <SettingsRow icon="eye" label="Who can see your archive" groupType="privacy" />
                </View>

                {/* --------------- PREFERENCES -------------- */}
                <Text style={[styles.sectionTitle, { color: palette.sectionHeader, marginTop: vs(24) }]}>PREFERENCES</Text>
                <View style={[styles.groupContainer, { backgroundColor: palette.prefBg }]}>
                    <SettingsRow 
                        icon="bell" 
                        label="Notifications" 
                        subtext="Memory reminders and updates"
                        groupType="pref"
                        showSwitch={true}
                        switchVal={notifications}
                        setSwitchVal={(val: boolean) => {
                            setNotifications(val);
                            updatePreference('notifications', val);
                        }}
                    />
                    <View style={styles.divider} />
                    <SettingsRow 
                        icon="zap" 
                        label="AI Insights" 
                        subtext="Weekly archive summaries"
                        groupType="pref"
                        showSwitch={true}
                        switchVal={aiInsights}
                        setSwitchVal={(val: boolean) => {
                            setAiInsights(val);
                            updatePreference('aiInsight', val);
                        }}
                    />
                    <View style={styles.divider} />
                    <SettingsRow 
                        icon="moon" 
                        label="Dark Mode" 
                        groupType="pref"
                        showSwitch={true}
                        switchVal={darkMode}
                        setSwitchVal={(val: boolean) => {
                            toggleDarkMode(val);
                            updatePreference('darkMode', val);
                        }}
                    />
                    <View style={styles.divider} />
                    <SettingsRow 
                        icon="activity" 
                        label="Anonymous Analytics" 
                        subtext="Help us improve the app"
                        groupType="pref"
                        showSwitch={true}
                        switchVal={analytics}
                        setSwitchVal={(val: boolean) => {
                            setAnalytics(val);
                            updatePreference('anonymousAnalytics', val);
                        }}
                    />
                </View>

                {/* ------------------ DATA ------------------ */}
                <Text style={[styles.sectionTitle, { color: palette.sectionHeader, marginTop: vs(24) }]}>DATA</Text>
                <View style={[styles.groupContainer, { backgroundColor: palette.dataBg, shadowOpacity: isDarkMode ? 0 : 0.05 }]}>
                    <SettingsRow 
                        icon="download" 
                        label="Export All Data" 
                        subtext="Download a complete ZIP archive" 
                        groupType="data" 
                    />
                    <View style={styles.divider} />
                    <SettingsRow 
                        icon="trash-2" 
                        label="Delete Account" 
                        subtext="Permanently remove all data" 
                        groupType="data"
                        isRed={true}
                        onPress={() => setShowDelete(true)}
                    />
                </View>

                {/* Final Sign Out Directive */}
                <TouchableOpacity 
                    style={[styles.signOutBtn, { backgroundColor: palette.signOutBg }]}
                    activeOpacity={0.8}
                    onPress={() => {
                        triggerHaptic();
                        setShowSignOut(true);
                    }}
                >
                    <Feather name="log-out" size={ms(18)} color={palette.signOutText} style={{ marginRight: ms(8) }} />
                    <Text style={[styles.signOutText, { color: palette.signOutText }]}>Sign Out</Text>
                </TouchableOpacity>

            </ScrollView>

            {/* ---------------- MODAL INTERCEPT OVERLAYS --------------- */}
            
            <SignOutModal
                visible={showSignOut}
                onClose={() => setShowSignOut(false)}
                onConfirm={async () => {
                    setShowSignOut(false);
                    // Navigate immediately after modal closing transition for instant feedback,
                    // and handle session invalidation/cleanup in the background.
                    setTimeout(() => {
                        router.replace('/auth/signin');
                        signOut();
                    }, 400);
                }}
            />

            <DeleteAccountModal
                visible={showDelete}
                onClose={() => setShowDelete(false)}
                onConfirm={() => {
                    setShowDelete(false);
                    // Give the modal transition time to complete before changing route
                    setTimeout(() => {
                        router.replace('/');
                    }, 400);
                }}
            />

            <PasswordModal
                visible={passwordModalVisible}
                title={pendingLegacyAccessValue ? "Enable Legacy Mode?" : "Disable Legacy Mode?"}
                subtitle={pendingLegacyAccessValue 
                    ? "Please enter your password to authorize enabling legacy mode."
                    : "Please enter your password to authorize disabling legacy mode."
                }
                onClose={() => setPasswordModalVisible(false)}
                onConfirm={handlePasswordConfirm}
            />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: ms(20),
        paddingTop: vs(20),
        paddingBottom: vs(40),
    },
    avatarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: vs(30),
    },
    backButton: {
        marginRight: ms(16),
        padding: ms(4),
        marginLeft: -ms(4),
    },
    avatarComposite: {
        position: 'relative',
    },
    profileImg: {
        width: ms(64),
        height: ms(64),
        borderRadius: ms(18),
    },
    profileImgPlaceholder: {
        width: ms(64),
        height: ms(64),
        borderRadius: ms(18),
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageLoadingContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.15)',
        borderRadius: ms(18),
    },
    checkBadge: {
        position: 'absolute',
        bottom: -ms(4),
        right: -ms(4),
        backgroundColor: '#8EA281',
        width: ms(20),
        height: ms(20),
        borderRadius: ms(10),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#F9F8F6', // match main background color to isolate badge
    },
    nameStack: {
        marginLeft: ms(16),
    },
    profileName: {
        fontFamily: FONTS.serif,
        fontSize: ms(24),
        fontWeight: '500',
    },
    profileEmail: {
        fontFamily: FONTS.sans,
        fontSize: ms(14),
        marginTop: vs(2),
    },
    sectionTitle: {
        fontFamily: FONTS.serif,
        fontSize: ms(14),
        fontWeight: '600',
        letterSpacing: ms(0.5),
        marginBottom: vs(10),
    },
    groupContainer: {
        borderRadius: ms(20),
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 2, // light shadow for visual layer
    },
    settingsRow: {
        width: '100%',
        paddingVertical: vs(16),
        paddingHorizontal: ms(16),
    },
    rowContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowIconBox: {
        width: ms(36),
        height: ms(36),
        borderRadius: ms(10),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: ms(14),
    },
    rowTextContainer: {
        flex: 1,
    },
    rowLabel: {
        fontFamily: FONTS.serif,
        fontSize: ms(16),
        fontWeight: '500',
    },
    rowSubtext: {
        fontFamily: FONTS.sans,
        fontSize: ms(11),
        marginTop: vs(2),
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)', // extremely faint intrinsic line divider
        marginLeft: ms(16),
        marginRight: ms(16),
    },
    signOutBtn: {
        width: '100%',
        height: vs(52),
        borderRadius: ms(14),
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: vs(30),
        marginBottom: vs(20),
    },
    signOutText: {
        fontFamily: FONTS.sans,
        fontSize: ms(16),
        fontWeight: '700',
    }
});
