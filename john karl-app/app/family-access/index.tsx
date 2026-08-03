import { FONTS } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/services/api';
import { resolveMediaUrl } from '@/utils/image';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ms, vs } from 'react-native-size-matters';

// STANDALONE SUBCOMPONENT IMPORT
import InviteModal from '@/components/InviteModal';



// ── Types ────────────────────────────────────────────────────────────────────
interface FamilyMember {
    userId: string;
    name: string;
    email: string;
    role: string;
    status: string;
    relation?: string;
    profilePicture?: {
        key: string;
        url: string;
        originalName: string;
        mimeType: string;
        size: number;
    };
}

export default function FamilyAccessScreen() {
    const router = useRouter();
    const { openInvite } = useLocalSearchParams<{ openInvite?: string }>();
    const isDarkMode = useColorScheme() === 'dark';
    const { user } = useAuth();

    // ── API State ─────────────────────────────────────────────────────────────
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ── Invitations State ─────────────────────────────────────────────────────
    const [invitations, setInvitations] = useState<any[]>([]);
    const [isInvitationsLoading, setIsInvitationsLoading] = useState(true);
    const [actioningId, setActioningId] = useState<string | null>(null);

    // ── Modal State ───────────────────────────────────────────────────────────
    const [inviteVisible, setInviteVisible] = useState(false);

    useEffect(() => {
        if (openInvite === 'true') {
            setInviteVisible(true);
        }
    }, [openInvite]);

    const fetchFamilyMembers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            console.log('[FamilyAccess] Fetching /users/family-members...');
            const response = await api.get('/users/family-members');
            console.log('[FamilyAccess] Response:', JSON.stringify(response));
            if (response.success && Array.isArray(response.data?.data)) {
                setFamilyMembers(response.data.data);
            } else if (response.success && Array.isArray(response.data)) {
                setFamilyMembers(response.data);
            } else if (response.success) {
                // API returned success with empty/unexpected shape — treat as empty list
                setFamilyMembers([]);
            } else {
                setError(response.message || 'Failed to load family members.');
            }
        } catch (err: any) {
            console.error('[FamilyAccess] Error:', err);
            setError(err?.message || 'A network error occurred.');
        } finally {
            setIsLoading(false);
            // Sync with global auth store to keep timeline and other views updated
            const { useAuthStore } = require('@/store/auth-store');
            useAuthStore.getState().fetchFamilyMembers().catch((err: any) => console.error('[FamilyAccess] Store sync failed:', err));
        }
    }, []);

    const fetchInvitations = useCallback(async () => {
        setIsInvitationsLoading(true);
        try {
            console.log('[FamilyAccess] Fetching /users/invitations...');
            const response = await api.get('/users/invitations');
            console.log('[FamilyAccess] Invitations Response:', JSON.stringify(response));
            if (response.success && Array.isArray(response.data?.data)) {
                setInvitations(response.data.data);
            } else if (response.success && Array.isArray(response.data)) {
                setInvitations(response.data);
            } else {
                setInvitations([]);
            }
        } catch (err) {
            console.error('[FamilyAccess] Fetch invitations error:', err);
        } finally {
            setIsInvitationsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFamilyMembers();
        fetchInvitations();
    }, [fetchFamilyMembers, fetchInvitations]);

    const handleAcceptInvitation = async (id: string) => {
        triggerHaptic();
        setActioningId(id);
        try {
            console.log(`[FamilyAccess] Accepting invitation: ${id}`);
            const response = await api.post(`/users/invitations/${id}/accept`);
            if (response.success) {
                Alert.alert('Success', 'Invitation accepted successfully!');
                await Promise.all([fetchFamilyMembers(), fetchInvitations()]);
            } else {
                Alert.alert('Error', response.message || 'Failed to accept invitation.');
            }
        } catch (err: any) {
            console.error('[FamilyAccess] Accept error:', err);
            Alert.alert('Error', err?.message || 'An error occurred while accepting.');
        } finally {
            setActioningId(null);
        }
    };

    const handleDeclineInvitation = async (id: string) => {
        triggerHaptic();
        setActioningId(id);
        try {
            console.log(`[FamilyAccess] Declining invitation: ${id}`);
            const response = await api.post(`/users/invitations/${id}/decline`);
            if (response.success) {
                Alert.alert('Success', 'Invitation declined successfully!');
                await Promise.all([fetchFamilyMembers(), fetchInvitations()]);
            } else {
                Alert.alert('Error', response.message || 'Failed to decline invitation.');
            }
        } catch (err: any) {
            console.error('[FamilyAccess] Decline error:', err);
            Alert.alert('Error', err?.message || 'An error occurred while declining.');
        } finally {
            setActioningId(null);
        }
    };


    const triggerHaptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const palette = {
        bg: isDarkMode ? '#121212' : '#F9F8F6',
        textDark: isDarkMode ? '#D8DECB' : '#2D2C39',
        textSub: isDarkMode ? '#8F918B' : '#8A9981',
        backBtnBg: isDarkMode ? '#323239' : '#E3E4E3',
        backBtnIcon: isDarkMode ? '#FFFFFF' : '#5A5B66',
        dashedBg: isDarkMode ? '#232A20' : '#E2E6DC',
        dashedBorder: isDarkMode ? '#516249' : '#92A489',
        dashedIconBg: '#8E9E86',
        card1Bg: isDarkMode ? '#2C2B33' : '#E1DFE8',
        badge1Bg: isDarkMode ? '#5A5670' : '#A09DB6',
        card2Bg: isDarkMode ? '#272D33' : '#DDE4E8',
        badge2Bg: isDarkMode ? '#4E5D68' : '#A8B7C1',
        infoPodBg: isDarkMode ? '#1F1E24' : '#E6E4EB',
        infoPodText: isDarkMode ? '#A0A0B0' : '#5F5F6A'
    };

    // ── Member count subtitle ─────────────────────────────────────────────────
    const memberCountText = isLoading
        ? 'Loading members...'
        : error
            ? 'Could not load members'
            : familyMembers.length > 0
                ? `${familyMembers.length} member${familyMembers.length === 1 ? '' : 's'} with access`
                : 'No family members with access';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]} edges={['top']}>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.backBtn, { backgroundColor: palette.backBtnBg }]}
                    onPress={() => router.back()}
                >
                    <Feather name="arrow-left" size={ms(20)} color={palette.backBtnIcon} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                <Text style={[styles.pageTitle, { color: palette.textDark }]}>Family Access</Text>
                <Text style={[styles.pageSubText, { color: palette.textSub }]}>{memberCountText}</Text>

                {/* TOP ACTION POD */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.inviteBox, { backgroundColor: palette.dashedBg, borderColor: palette.dashedBorder }]}
                    onPress={() => { triggerHaptic(); setInviteVisible(true); }}
                >
                    <View style={[styles.inviteIconCont, { backgroundColor: palette.dashedIconBg }]}>
                        <Feather name="user-plus" size={ms(20)} color="#FFFFFF" />
                    </View>
                    <View>
                        <Text style={[styles.inviteTitle, { color: isDarkMode ? '#E0EED5' : '#3A3C39' }]}>Invite a Family Member</Text>
                        <Text style={[styles.inviteSub, { color: isDarkMode ? '#859E75' : '#8CA087' }]}>Share access with loved ones</Text>
                    </View>
                </TouchableOpacity>

                <Text style={[styles.sectionHeader, { color: isDarkMode ? '#AFAFB9' : '#3A3C45' }]}>MEMBERS</Text>

                {/* ── Loading ────────────────────────────────────────────── */}
                {isLoading ? (
                    <View style={styles.centeredState}>
                        <ActivityIndicator size="large" color="#8EA281" />
                        <Text style={[styles.stateText, { color: palette.textSub }]}>Loading members...</Text>
                    </View>

                ) : error ? (
                    /* ── Error ─────────────────────────────────────────── */
                    <View style={styles.centeredState}>
                        <Feather name="alert-circle" size={ms(40)} color="#E88B8B" />
                        <Text style={[styles.stateText, { color: palette.textDark, marginTop: vs(10) }]}>{error}</Text>
                        <TouchableOpacity
                            style={[styles.retryBtn, { backgroundColor: '#8EA281' }]}
                            onPress={fetchFamilyMembers}
                        >
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>

                ) : familyMembers.length === 0 ? (
                    /* ── Empty ─────────────────────────────────────────── */
                    <View style={styles.centeredState}>
                        <Feather name="users" size={ms(44)} color={palette.textSub} />
                        <Text style={[styles.stateText, { color: palette.textDark, marginTop: vs(12) }]}>No members yet</Text>
                        <Text style={[styles.stateSubText, { color: palette.textSub }]}>
                            Invite a family member to share access to your memories.
                        </Text>
                    </View>

                ) : (
                    /* ── Member cards ───────────────────────────────────── */
                    familyMembers.map((member, idx) => {
                        const isOwner = member.role?.toLowerCase() === 'owner';
                        const isPending = member.status?.toLowerCase() === 'pending';
                        const cardBg = idx % 2 === 0 ? palette.card1Bg : palette.card2Bg;
                        const badgeBg = idx % 2 === 0 ? palette.badge1Bg : palette.badge2Bg;

                        // Pick profile picture if available, fallback to default avatar
                        const avatarUrl = member.profilePicture?.url ? resolveMediaUrl(member.profilePicture.url) : null;
                        const avatarSource = avatarUrl ? { uri: avatarUrl } : require('@/assets/images/dashboard/avatar.png');

                        return (
                            <View key={member.userId || String(idx)} style={[styles.memberCard, { backgroundColor: cardBg }]}>
                                <Image source={avatarSource} style={styles.avatar} />
                                <View style={styles.memberText}>
                                    <Text style={[styles.memberName, { color: isDarkMode ? '#FFFFFF' : '#2D2C39' }]}>
                                        {member.name}{member.relation ? ` (${member.relation})` : ''}
                                    </Text>
                                    <Text style={[styles.memberEmail, { color: isDarkMode ? '#8F8F9E' : '#8A8A95' }]}>
                                        {member.email}
                                    </Text>
                                </View>
                                <View style={[styles.roleBadge, { backgroundColor: isPending ? '#E0923C' : badgeBg }]}>
                                    {isOwner ? (
                                        <MaterialCommunityIcons name="crown-outline" size={ms(13)} color="#FFFFFF" style={{ marginRight: ms(4) }} />
                                    ) : (
                                        <Feather name={isPending ? 'clock' : 'edit-2'} size={ms(11)} color="#FFFFFF" style={{ marginRight: ms(4) }} />
                                    )}
                                    <Text style={styles.badgeText}>
                                        {isPending ? 'Pending' : (member.role.charAt(0).toUpperCase() + member.role.slice(1))}
                                    </Text>
                                </View>
                                <TouchableOpacity style={styles.dotsBtn}>
                                    <MaterialCommunityIcons name="dots-vertical" size={ms(20)} color={isDarkMode ? '#8F8F9E' : '#2D2C39'} />
                                </TouchableOpacity>
                            </View>
                        );
                    })
                )}

                {/* INVITATIONS SECTION */}
                <Text style={[styles.sectionHeader, { color: isDarkMode ? '#AFAFB9' : '#3A3C45', marginTop: vs(28) }]}>INVITATIONS</Text>

                {isInvitationsLoading ? (
                    <View style={styles.centeredState}>
                        <ActivityIndicator size="small" color="#8EA281" />
                        <Text style={[styles.stateText, { color: palette.textSub, fontSize: ms(14) }]}>Loading invitations...</Text>
                    </View>
                ) : invitations.length === 0 ? (
                    <View style={[styles.centeredState, { paddingVertical: vs(20) }]}>
                        <Feather name="mail" size={ms(32)} color={palette.textSub} />
                        <Text style={[styles.stateSubText, { color: palette.textSub, marginTop: vs(8) }]}>No invitations at this time.</Text>
                    </View>
                ) : (
                    invitations.map((invite, idx) => {
                        const isPending = invite.status?.toLowerCase() === 'pending';
                        const isReceived = invite.direction?.toLowerCase() === 'received';
                        const cardBg = idx % 2 === 0 ? palette.card2Bg : palette.card1Bg;
                        const isActioning = actioningId === invite.id;

                        // Resolve name, email, and description based on direction
                        const displayName = isReceived
                            ? (invite.inviter?.name || 'Incoming Invite')
                            : (invite.inviteeName || invite.inviteeEmail);

                        const displayEmail = isReceived
                            ? (invite.inviter?.email || '')
                            : invite.inviteeEmail;

                        const directionLabel = isReceived ? 'Received' : 'Sent';

                        return (
                            <View key={invite.id || String(idx)} style={[styles.inviteCard, { backgroundColor: cardBg }]}>
                                <View style={styles.inviteCardHeader}>
                                    <Feather
                                        name={isReceived ? "arrow-down-left" : "arrow-up-right"}
                                        size={ms(18)}
                                        color={isReceived ? "#8EA281" : "#E0923C"}
                                        style={{ marginRight: ms(10) }}
                                    />
                                    <View style={styles.inviteCardContent}>
                                        <Text style={[styles.memberName, { color: isDarkMode ? '#FFFFFF' : '#2D2C39' }]}>
                                            {displayName}
                                        </Text>
                                        {displayEmail ? (
                                            <Text style={[styles.memberEmail, { color: isDarkMode ? '#8F8F9E' : '#8A8A95' }]}>
                                                {displayEmail}
                                            </Text>
                                        ) : null}
                                        <Text style={[styles.memberSubText, { color: isDarkMode ? '#A0A0A0' : '#7F7F8F', marginTop: vs(2) }]}>
                                            Relation: <Text style={{ fontWeight: '600' }}>{invite.relation}</Text> • Role: <Text style={{ fontWeight: '600' }}>{invite.role}</Text>
                                        </Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end', gap: vs(4) }}>
                                        <View style={[styles.roleBadge, { backgroundColor: isReceived ? '#5A5670' : '#4E5D68', paddingVertical: vs(2), paddingHorizontal: ms(6), borderRadius: ms(8) }]}>
                                            <Text style={[styles.badgeText, { fontSize: ms(10) }]}>{directionLabel}</Text>
                                        </View>
                                        <View style={[styles.roleBadge, { backgroundColor: isPending ? '#E0923C' : '#8EA281', paddingVertical: vs(2), paddingHorizontal: ms(6), borderRadius: ms(8) }]}>
                                            <Text style={[styles.badgeText, { fontSize: ms(10) }]}>
                                                {invite.status?.charAt(0).toUpperCase() + invite.status?.slice(1)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {isPending && isReceived && (
                                    <View style={styles.inviteCardActions}>
                                        {isActioning ? (
                                            <ActivityIndicator size="small" color="#8EA281" />
                                        ) : (
                                            <>
                                                <TouchableOpacity
                                                    style={[styles.declineBtn, { borderColor: isDarkMode ? '#FF8B8B' : '#E88B8B' }]}
                                                    onPress={() => handleDeclineInvitation(invite.id)}
                                                >
                                                    <Text style={[styles.btnText, { color: isDarkMode ? '#FF8B8B' : '#E88B8B' }]}>Decline</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.acceptBtn, { backgroundColor: '#8EA281' }]}
                                                    onPress={() => handleAcceptInvitation(invite.id)}
                                                >
                                                    <Text style={[styles.btnText, { color: '#FFFFFF' }]}>Accept</Text>
                                                </TouchableOpacity>
                                            </>
                                        )}
                                    </View>
                                )}
                            </View>
                        );
                    })
                )}

                {/* BOTTOM CAPSULE */}
                <View style={[styles.infoCapsule, { backgroundColor: palette.infoPodBg, marginTop: vs(24) }]}>
                    <Feather name="shield" size={ms(14)} color={palette.infoPodText} style={{ marginRight: ms(10), marginTop: vs(2) }} />
                    <Text style={[styles.infoCapsuleText, { color: palette.infoPodText }]}>
                        All members access the archive based on their role. Owners can revoke access at any time. Sensitive settings are always private.
                    </Text>
                </View>

            </ScrollView>

            {/* CLEAN STANDALONE MODAL */}
            <InviteModal
                visible={inviteVisible}
                onClose={() => setInviteVisible(false)}
                isDarkMode={isDarkMode}
                onInviteSuccess={() => {
                    fetchFamilyMembers();
                    fetchInvitations();
                }}
            />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: ms(20),
        paddingTop: vs(10),
    },
    backBtn: {
        width: ms(36),
        height: ms(36),
        borderRadius: ms(12),
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingHorizontal: ms(20),
        paddingTop: vs(20),
        paddingBottom: vs(40),
    },
    pageTitle: {
        fontFamily: FONTS.serif,
        fontSize: ms(34),
        fontWeight: '500',
        marginBottom: vs(4),
    },
    pageSubText: {
        fontFamily: FONTS.sans,
        fontSize: ms(16),
        marginBottom: vs(28),
    },
    inviteBox: {
        width: '100%',
        borderRadius: ms(20),
        borderWidth: 1,
        borderStyle: 'dashed',
        padding: ms(18),
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: vs(36),
    },
    inviteIconCont: {
        width: ms(44),
        height: ms(44),
        borderRadius: ms(14),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: ms(16),
    },
    inviteTitle: {
        fontFamily: FONTS.serif,
        fontSize: ms(18),
        fontWeight: '500',
        marginBottom: vs(2),
    },
    inviteSub: {
        fontFamily: FONTS.sans,
        fontSize: ms(13),
    },
    sectionHeader: {
        fontFamily: FONTS.serif,
        fontSize: ms(14),
        letterSpacing: 1,
        fontWeight: '600',
        marginBottom: vs(16),
    },
    memberCard: {
        width: '100%',
        height: vs(72),
        borderRadius: ms(20),
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: ms(14),
        marginBottom: vs(12),
    },
    avatar: {
        width: ms(48),
        height: ms(48),
        borderRadius: ms(24),
        marginRight: ms(12),
    },
    memberText: {
        flex: 1,
    },
    memberName: {
        fontFamily: FONTS.serif,
        fontSize: ms(16),
        fontWeight: '500',
        marginBottom: vs(2),
    },
    memberEmail: {
        fontFamily: FONTS.sans,
        fontSize: ms(12),
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: vs(6),
        paddingHorizontal: ms(10),
        borderRadius: ms(14),
        marginRight: ms(4),
    },
    badgeText: {
        fontFamily: FONTS.serif,
        color: '#FFFFFF',
        fontSize: ms(13),
        fontWeight: '500',
    },
    dotsBtn: {
        padding: ms(8),
    },
    infoCapsule: {
        width: '100%',
        borderRadius: ms(18),
        padding: ms(18),
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: vs(12),
    },
    infoCapsuleText: {
        flex: 1,
        fontFamily: FONTS.sans,
        fontSize: ms(13),
        lineHeight: vs(18),
    },
    centeredState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: vs(40),
        paddingHorizontal: ms(20),
    },
    stateText: {
        fontFamily: FONTS.serif,
        fontSize: ms(16),
        fontWeight: '600',
        textAlign: 'center',
        marginTop: vs(12),
    },
    stateSubText: {
        fontFamily: FONTS.sans,
        fontSize: ms(13),
        textAlign: 'center',
        marginTop: vs(6),
        lineHeight: vs(18),
        opacity: 0.8,
    },
    retryBtn: {
        marginTop: vs(16),
        paddingHorizontal: ms(24),
        paddingVertical: vs(10),
        borderRadius: ms(12),
    },
    retryText: {
        color: '#FFFFFF',
        fontFamily: FONTS.sans,
        fontWeight: '600',
        fontSize: ms(14),
    },
    inviteCard: {
        width: '100%',
        borderRadius: ms(20),
        padding: ms(16),
        marginBottom: vs(12),
    },
    inviteCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    inviteCardContent: {
        flex: 1,
    },
    inviteCardActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: ms(12),
        marginTop: vs(14),
        borderTopWidth: 1,
        borderTopColor: 'rgba(128,128,128,0.15)',
        paddingTop: vs(12),
    },
    acceptBtn: {
        paddingHorizontal: ms(16),
        paddingVertical: vs(8),
        borderRadius: ms(10),
        alignItems: 'center',
        justifyContent: 'center',
    },
    declineBtn: {
        paddingHorizontal: ms(16),
        paddingVertical: vs(8),
        borderRadius: ms(10),
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnText: {
        fontFamily: FONTS.sans,
        fontSize: ms(13),
        fontWeight: '600',
    },
    memberSubText: {
        fontFamily: FONTS.sans,
        fontSize: ms(11),
    },
});
