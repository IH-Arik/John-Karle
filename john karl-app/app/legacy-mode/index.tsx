import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView,
    useColorScheme,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Image
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ms, vs } from 'react-native-size-matters';
import { FONTS } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { api } from '@/services/api';
import { PasswordModal } from '@/components/PasswordModal';
import { getAvatarSource } from '@/utils/image';

interface TrustedContact {
    id: string;
    name: string;
    email: string;
    phone?: string;
    status: 'pending' | 'accepted' | 'declined' | 'removed';
    inactivityDays: number;
    accessScope: {
        profile: boolean;
        documents: boolean;
        notes: boolean;
        messages: boolean;
        paymentInfo: boolean;
        accountTransfer: boolean;
    };
    createdAt: string;
    avatarUrl?: string;
    profilePicture?: { url: string };
}

export default function TrustedContactsListScreen() {
    const router = useRouter();
    const isDarkMode = useColorScheme() === 'dark';

    const [contacts, setContacts] = useState<TrustedContact[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Delete contact states
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [contactToDelete, setContactToDelete] = useState<TrustedContact | null>(null);

    // Segment & Invite flow states
    const [activeTab, setActiveTab] = useState<'contacts' | 'invites'>('contacts');
    const [invitations, setInvitations] = useState<any[]>([]);
    const [invitationsLoading, setInvitationsLoading] = useState(false);
    const [invitationsError, setInvitationsError] = useState<string | null>(null);
    const [actioningId, setActioningId] = useState<string | null>(null);

    const fetchInvitations = useCallback(async (showIndicator = true) => {
        if (showIndicator) setInvitationsLoading(true);
        setInvitationsError(null);
        try {
            console.log('[TrustedContacts] Fetching received invitations...');
            const response = await api.get('/trusted-contacts/invitations');
            console.log('[TrustedContacts] Invitations Response:', JSON.stringify(response));

            if (response.success && response.data) {
                const list = response.data?.data || response.data || [];
                setInvitations(Array.isArray(list) ? list : []);
            } else {
                setInvitationsError(response.message || 'Failed to retrieve received invitations.');
            }
        } catch (err: any) {
            console.error('[TrustedContacts] Fetch invitations error:', err);
            setInvitationsError(err?.message || 'A network error occurred.');
        } finally {
            setInvitationsLoading(false);
            setRefreshing(false);
        }
    }, []);

    const handleAcceptInvite = async (id: string, inviterName: string) => {
        triggerHaptic();
        setActioningId(id);

        try {
            console.log(`[Invitation] Accepting in-app invitation id: ${id}...`);
            const response = await api.post(`/trusted-contacts/invitations/${id}/accept`);
            if (response.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert(
                    'Success',
                    `You have accepted the invitation! You are now a trusted contact for ${inviterName}.`
                );
                fetchInvitations(false);
                fetchContacts(false);
            } else {
                Alert.alert('Accept Failed', response.message || 'Failed to accept invitation.');
            }
        } catch (err: any) {
            console.error('[Invitation] Accept error:', err);
            Alert.alert('Error', err?.message || 'A network error occurred.');
        } finally {
            setActioningId(null);
        }
    };

    const handleDeclineInvite = async (id: string) => {
        triggerHaptic();
        setActioningId(id);

        try {
            console.log(`[Invitation] Declining in-app invitation id: ${id}...`);
            const response = await api.post(`/trusted-contacts/invitations/${id}/decline`);
            if (response.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                Alert.alert('Invitation Declined', 'You have declined the invitation.');
                fetchInvitations(false);
            } else {
                Alert.alert('Decline Failed', response.message || 'Failed to decline invitation.');
            }
        } catch (err: any) {
            console.error('[Invitation] Decline error:', err);
            Alert.alert('Error', err?.message || 'A network error occurred.');
        } finally {
            setActioningId(null);
        }
    };

    const fetchContacts = useCallback(async (showIndicator = true) => {
        if (showIndicator) setLoading(true);
        setError(null);
        try {
            console.log('[TrustedContacts] Fetching list...');
            const response = await api.get('/trusted-contacts');
            console.log('[TrustedContacts] List Response:', JSON.stringify(response));
            
            if (response.success && response.data) {
                const list = response.data?.data || response.data || [];
                setContacts(Array.isArray(list) ? list : []);
            } else {
                setError(response.message || 'Failed to retrieve trusted contacts.');
            }
        } catch (err: any) {
            console.error('[TrustedContacts] Fetch error:', err);
            setError(err?.message || 'A network error occurred.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Refresh list on screen focus (e.g. returning from success screen)
    useFocusEffect(
        useCallback(() => {
            fetchContacts(true);
            fetchInvitations(true);
        }, [fetchContacts, fetchInvitations])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchContacts(false);
    }, [fetchContacts]);

    const triggerHaptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const handleDeletePress = (contact: TrustedContact) => {
        triggerHaptic();
        setContactToDelete(contact);
        setDeleteModalVisible(true);
    };

    const handleDeleteConfirm = async (password: string) => {
        if (!contactToDelete) return;

        console.log(`[TrustedContacts] Deleting contact id: ${contactToDelete.id}...`);
        const response = await api.delete(`/trusted-contacts/${contactToDelete.id}`, {
            body: JSON.stringify({ currentPassword: password }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.success) {
            console.log('[TrustedContacts] Delete successful.');
            setDeleteModalVisible(false);
            setContactToDelete(null);
            Alert.alert('Success', 'Trusted contact removed successfully.');
            fetchContacts(false);
        } else {
            console.warn('[TrustedContacts] Delete failed:', response.message);
            throw new Error(response.message || 'Failed to remove trusted contact. Please check your password.');
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'accepted':
                return { bg: isDarkMode ? '#233226' : '#E8F5E9', text: isDarkMode ? '#81C784' : '#2E7D32' };
            case 'declined':
                return { bg: isDarkMode ? '#3C2929' : '#FFEBEE', text: isDarkMode ? '#E57373' : '#C62828' };
            case 'pending':
            default:
                return { bg: isDarkMode ? '#3E3424' : '#FFF3E0', text: isDarkMode ? '#FFB74D' : '#EF6C00' };
        }
    };

    const palette = {
        bg: isDarkMode ? '#121212' : '#F9F8F6',
        textDark: isDarkMode ? '#D4DEC5' : '#2D2C39',
        textSub: isDarkMode ? '#8E8E93' : '#8A9981',

        backBtnBg: isDarkMode ? '#323239' : '#E3E4E3',
        backBtnIcon: isDarkMode ? '#FFFFFF' : '#5A5B66',

        // List item styling
        itemBg: isDarkMode ? '#1E1E24' : '#EAE9EF',
        itemBorder: isDarkMode ? '#3D3D49' : '#CDD8DF',
        divider: isDarkMode ? '#2D2D35' : '#D6D5DB',

        btnPrimary: '#92A38D'
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]}>
            
            <View style={styles.header}>
                <TouchableOpacity 
                    style={[styles.backBtn, { backgroundColor: palette.backBtnBg }]}
                    onPress={() => router.replace('/profile')}
                >
                    <Feather name="arrow-left" size={ms(20)} color={palette.backBtnIcon} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: palette.textDark }]}>Trusted Contacts</Text>
                <View style={{ width: ms(36) }} />
            </View>

            {/* Custom Segmented Control */}
            <View style={[styles.segmentContainer, { backgroundColor: isDarkMode ? '#1E1E24' : '#EAE9EF' }]}>
                <TouchableOpacity 
                    style={[styles.segmentButton, activeTab === 'contacts' && [styles.segmentButtonActive, { backgroundColor: isDarkMode ? '#2D2C39' : '#FFFFFF' }]]}
                    onPress={() => { triggerHaptic(); setActiveTab('contacts'); }}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.segmentText, activeTab === 'contacts' ? { color: palette.textDark, fontWeight: '600' } : { color: palette.textSub }]}>My Contacts</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.segmentButton, activeTab === 'invites' && [styles.segmentButtonActive, { backgroundColor: isDarkMode ? '#2D2C39' : '#FFFFFF' }]]}
                    onPress={() => { triggerHaptic(); setActiveTab('invites'); }}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.segmentText, activeTab === 'invites' ? { color: palette.textDark, fontWeight: '600' } : { color: palette.textSub }]}>Received Invites</Text>
                </TouchableOpacity>
            </View>

            <Animated.View 
                key={activeTab}
                entering={FadeIn.duration(300)}
                style={{ flex: 1 }}
            >
                {activeTab === 'contacts' ? (
                    <>
                        {loading ? (
                            <View style={styles.center}>
                                <ActivityIndicator size="large" color={palette.btnPrimary} />
                                <Text style={[styles.loadingText, { color: palette.textSub }]}>Loading trusted contacts...</Text>
                            </View>
                        ) : error ? (
                            <View style={styles.center}>
                                <Feather name="alert-circle" size={ms(48)} color="#E57373" />
                                <Text style={[styles.errorText, { color: palette.textDark }]}>{error}</Text>
                                <TouchableOpacity 
                                    style={[styles.retryBtn, { backgroundColor: palette.btnPrimary }]}
                                    onPress={() => fetchContacts(true)}
                                >
                                    <Text style={styles.retryText}>Retry</Text>
                                </TouchableOpacity>
                            </View>
                        ) : contacts.length === 0 ? (
                            <View style={styles.center}>
                                <View style={[styles.emptyIconCirc, { backgroundColor: isDarkMode ? '#2A2E2A' : '#EBF0EA' }]}>
                                    <Feather name="users" size={ms(48)} color={palette.btnPrimary} />
                                </View>
                                <Text style={[styles.emptyTitle, { color: palette.textDark }]}>No Trusted Contacts</Text>
                                <Text style={[styles.emptySubtitle, { color: palette.textSub }]}>
                                    Add trusted contacts who will be notified and granted access to your memories after a period of inactivity.
                                </Text>
                            </View>
                        ) : (
                            <ScrollView 
                                showsVerticalScrollIndicator={false} 
                                contentContainerStyle={styles.scrollContent}
                                refreshControl={
                                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[palette.btnPrimary]} />
                                }
                            >
                                <View style={styles.listContainer}>
                                    {contacts.map((contact) => {
                                        const badge = getStatusStyles(contact.status);
                                        return (
                                            <View key={contact.id} style={[styles.contactCard, { backgroundColor: palette.itemBg }]}>
                                                <View style={styles.cardHeader}>
                                                    <Image 
                                                        source={getAvatarSource(contact as any)} 
                                                        style={styles.inviterAvatar}
                                                    />
                                                    <View style={styles.nameStack}>
                                                        <Text style={[styles.contactName, { color: palette.textDark }]}>{contact.name}</Text>
                                                        <Text style={[styles.contactEmail, { color: palette.textSub }]}>{contact.email}</Text>
                                                    </View>
                                                    <TouchableOpacity 
                                                        style={styles.deleteBtn}
                                                        onPress={() => handleDeletePress(contact)}
                                                    >
                                                        <Feather name="trash-2" size={ms(18)} color="#E57373" />
                                                    </TouchableOpacity>
                                                </View>

                                                <View style={[styles.cardDivider, { backgroundColor: palette.divider }]} />

                                                <View style={styles.cardDetails}>
                                                    <View style={styles.detailRow}>
                                                        <Text style={[styles.detailLabel, { color: palette.textSub }]}>Inactivity Limit:</Text>
                                                        <Text style={[styles.detailValue, { color: palette.textDark }]}>{contact.inactivityDays} Days</Text>
                                                    </View>
                                                    <View style={styles.detailRow}>
                                                        <Text style={[styles.detailLabel, { color: palette.textSub }]}>Status:</Text>
                                                        <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                                                            <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                                                                {contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            </ScrollView>
                        )}

                        {/* Bottom Add Contact Button */}
                        {!loading && (
                            <View style={styles.footer}>
                                <TouchableOpacity 
                                    style={[styles.addBtn, { backgroundColor: palette.btnPrimary }]}
                                    activeOpacity={0.9}
                                    onPress={() => {
                                        triggerHaptic();
                                        router.push('/legacy-mode/add');
                                    }}
                                >
                                    <Text style={styles.addBtnText}>+ Add Trusted Contact</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </>
                ) : (
                    <>
                        {invitationsLoading ? (
                            <View style={styles.center}>
                                <ActivityIndicator size="large" color={palette.btnPrimary} />
                                <Text style={[styles.loadingText, { color: palette.textSub }]}>Loading invitations...</Text>
                            </View>
                        ) : invitationsError ? (
                            <View style={styles.center}>
                                <Feather name="alert-circle" size={ms(48)} color="#E57373" />
                                <Text style={[styles.errorText, { color: palette.textDark }]}>{invitationsError}</Text>
                                <TouchableOpacity 
                                    style={[styles.retryBtn, { backgroundColor: palette.btnPrimary }]}
                                    onPress={() => fetchInvitations(true)}
                                >
                                    <Text style={styles.retryText}>Retry</Text>
                                </TouchableOpacity>
                            </View>
                        ) : invitations.length === 0 ? (
                            <View style={styles.center}>
                                <View style={[styles.emptyIconCirc, { backgroundColor: isDarkMode ? '#2A2E2A' : '#EBF0EA' }]}>
                                    <Feather name="mail" size={ms(48)} color={palette.btnPrimary} />
                                </View>
                                <Text style={[styles.emptyTitle, { color: palette.textDark }]}>No Pending Invitations</Text>
                                <Text style={[styles.emptySubtitle, { color: palette.textSub }]}>
                                    Any invitations sent to you by others will appear here.
                                </Text>
                            </View>
                        ) : (
                            <ScrollView 
                                showsVerticalScrollIndicator={false} 
                                contentContainerStyle={styles.scrollContent}
                                refreshControl={
                                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchInvitations(false); }} colors={[palette.btnPrimary]} />
                                }
                            >
                                <View style={styles.listContainer}>
                                    {invitations.map((invite) => {
                                        const ownerObj = invite.owner || invite.inviter || invite;
                                        const inviterName = ownerObj?.name || invite.inviterName || 'Owner Name';
                                        const inviterEmail = ownerObj?.email || invite.inviterEmail || 'Owner Email';
                                        const isActioning = actioningId === invite.id;
                                        
                                        return (
                                            <View key={invite.id} style={[styles.validatedCard, { backgroundColor: palette.itemBg }]}>
                                                <View style={styles.cardHeader}>
                                                    <Image 
                                                        source={getAvatarSource(ownerObj as any)} 
                                                        style={styles.inviterAvatar}
                                                    />
                                                    <View style={styles.nameStack}>
                                                        <Text style={[styles.contactName, { color: palette.textDark }]}>
                                                            {inviterName}
                                                        </Text>
                                                        <Text style={[styles.contactEmail, { color: palette.textSub }]}>
                                                            {inviterEmail}
                                                        </Text>
                                                    </View>
                                                    <View style={[styles.inviteBadge, { backgroundColor: isDarkMode ? '#3E3424' : '#FFF3E0' }]}>
                                                        <Text style={[styles.inviteBadgeText, { color: isDarkMode ? '#FFB74D' : '#EF6C00' }]}>Pending</Text>
                                                    </View>
                                                </View>

                                                <View style={[styles.cardDivider, { backgroundColor: palette.divider }]} />

                                                <View style={styles.cardDetails}>
                                                    <View style={styles.detailRow}>
                                                        <Text style={[styles.detailLabel, { color: palette.textSub }]}>Inactivity Period:</Text>
                                                        <Text style={[styles.detailValue, { color: palette.textDark }]}>
                                                            {invite.inactivityDays || 90} Days
                                                        </Text>
                                                    </View>
                                                    
                                                    <Text style={[styles.scopesLabel, { color: palette.textDark }]}>Access Scopes Granted:</Text>
                                                    <View style={styles.scopesList}>
                                                        {Object.entries(invite.accessScope || {
                                                            profile: true,
                                                            documents: true,
                                                            notes: true,
                                                            messages: true
                                                        }).map(([scopeKey, hasAccess]) => {
                                                            if (!hasAccess) return null;
                                                            let label = scopeKey.charAt(0).toUpperCase() + scopeKey.slice(1);
                                                            if (scopeKey === 'documents') label = 'Memories';
                                                            if (scopeKey === 'notes') label = 'Narratives';
                                                            if (scopeKey === 'messages') label = 'AI Insights';
                                                            return (
                                                                <View key={scopeKey} style={styles.scopeBadge}>
                                                                    <Feather name="check" size={ms(12)} color={palette.btnPrimary} style={{ marginRight: ms(4) }} />
                                                                    <Text style={[styles.scopeBadgeText, { color: palette.textDark }]}>{label}</Text>
                                                                </View>
                                                            );
                                                        })}
                                                    </View>
                                                </View>

                                                <View style={[styles.cardDivider, { backgroundColor: palette.divider }]} />

                                                <View style={styles.cardActions}>
                                                    <TouchableOpacity
                                                        style={[styles.actionBtn, styles.declineActionBtn, { borderColor: palette.itemBorder }]}
                                                        onPress={() => handleDeclineInvite(invite.id)}
                                                        disabled={isActioning}
                                                        activeOpacity={0.8}
                                                    >
                                                        <Text style={[styles.actionBtnText, { color: '#E57373' }]}>Decline</Text>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        style={[styles.actionBtn, styles.acceptActionBtn, { backgroundColor: palette.btnPrimary }]}
                                                        onPress={() => handleAcceptInvite(invite.id, inviterName)}
                                                        disabled={isActioning}
                                                        activeOpacity={0.8}
                                                    >
                                                        {isActioning ? (
                                                            <ActivityIndicator size="small" color="#FFFFFF" />
                                                        ) : (
                                                            <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Accept</Text>
                                                        )}
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            </ScrollView>
                        )}
                    </>
                )}
            </Animated.View>

            <PasswordModal
                visible={deleteModalVisible}
                title="Remove Trusted Contact?"
                subtitle={`Please enter your password to authorize removing ${contactToDelete?.name || 'this contact'} from your list.`}
                onClose={() => {
                    setDeleteModalVisible(false);
                    setContactToDelete(null);
                }}
                onConfirm={handleDeleteConfirm}
            />

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
        paddingTop: vs(10),
        marginBottom: vs(10),
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
        paddingBottom: vs(120),
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: ms(40),
    },
    loadingText: {
        fontFamily: FONTS.sans,
        fontSize: ms(14),
        marginTop: vs(12),
    },
    errorText: {
        fontFamily: FONTS.sans,
        fontSize: ms(15),
        textAlign: 'center',
        marginTop: vs(16),
        marginBottom: vs(16),
    },
    retryBtn: {
        paddingHorizontal: ms(20),
        paddingVertical: vs(10),
        borderRadius: ms(12),
    },
    retryText: {
        color: '#FFFFFF',
        fontFamily: FONTS.sans,
        fontSize: ms(14),
        fontWeight: '600',
    },
    emptyIconCirc: {
        width: ms(100),
        height: ms(100),
        borderRadius: ms(50),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: vs(24),
    },
    emptyTitle: {
        fontFamily: FONTS.serif,
        fontSize: ms(24),
        fontWeight: '500',
        marginBottom: vs(12),
    },
    emptySubtitle: {
        fontFamily: FONTS.sans,
        fontSize: ms(15),
        textAlign: 'center',
        lineHeight: vs(22),
    },
    listContainer: {
        gap: vs(16),
        marginTop: vs(10),
    },
    contactCard: {
        borderRadius: ms(20),
        padding: ms(18),
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    inviterAvatar: {
        width: ms(40),
        height: ms(40),
        borderRadius: ms(20),
        marginRight: ms(12),
    },
    nameStack: {
        flex: 1,
        marginRight: ms(12),
    },
    contactName: {
        fontFamily: FONTS.serif,
        fontSize: ms(18),
        fontWeight: '600',
        marginBottom: vs(2),
    },
    contactEmail: {
        fontFamily: FONTS.sans,
        fontSize: ms(13),
    },
    deleteBtn: {
        padding: ms(6),
        marginLeft: ms(8),
    },
    cardDivider: {
        height: 1,
        marginVertical: vs(14),
    },
    cardDetails: {
        gap: vs(8),
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: {
        fontFamily: FONTS.sans,
        fontSize: ms(13),
    },
    detailValue: {
        fontFamily: FONTS.sans,
        fontSize: ms(14),
        fontWeight: '500',
    },
    statusBadge: {
        paddingHorizontal: ms(10),
        paddingVertical: vs(4),
        borderRadius: ms(10),
    },
    statusBadgeText: {
        fontFamily: FONTS.sans,
        fontSize: ms(11),
        fontWeight: '600',
    },
    footer: {
        position: 'absolute',
        bottom: vs(30),
        left: ms(20),
        right: ms(20),
    },
    addBtn: {
        width: '100%',
        height: vs(52),
        borderRadius: ms(14),
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    addBtnText: {
        fontFamily: FONTS.serif,
        color: '#FFFFFF',
        fontSize: ms(16),
        fontWeight: '600',
    },
    segmentContainer: {
        flexDirection: 'row',
        marginHorizontal: ms(20),
        marginBottom: vs(16),
        borderRadius: ms(12),
        padding: ms(3),
        height: vs(44),
    },
    segmentButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: ms(9),
    },
    segmentButtonActive: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
    },
    segmentText: {
        fontFamily: FONTS.sans,
        fontSize: ms(14),
    },
    inviteSearchCard: {
        borderRadius: ms(20),
        padding: ms(18),
        marginBottom: vs(16),
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    inviteSearchTitle: {
        fontFamily: FONTS.serif,
        fontSize: ms(18),
        fontWeight: '600',
        marginBottom: vs(4),
    },
    inviteSearchSub: {
        fontFamily: FONTS.sans,
        fontSize: ms(13),
        lineHeight: vs(18),
        marginBottom: vs(16),
    },
    inviteInput: {
        height: vs(46),
        borderRadius: ms(12),
        borderWidth: 1,
        paddingHorizontal: ms(14),
        fontFamily: FONTS.sans,
        fontSize: ms(14),
        marginBottom: vs(12),
    },
    inviteErrorText: {
        fontFamily: FONTS.sans,
        color: '#E57373',
        fontSize: ms(13),
        marginBottom: vs(12),
        fontWeight: '600',
    },
    validateBtn: {
        height: vs(46),
        borderRadius: ms(12),
        justifyContent: 'center',
        alignItems: 'center',
    },
    validateBtnText: {
        fontFamily: FONTS.serif,
        color: '#FFFFFF',
        fontSize: ms(15),
        fontWeight: '600',
    },
    validatedCard: {
        borderRadius: ms(20),
        padding: ms(18),
        marginBottom: vs(16),
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    inviteBadge: {
        paddingHorizontal: ms(8),
        paddingVertical: vs(3),
        borderRadius: ms(8),
        justifyContent: 'center',
        alignItems: 'center',
    },
    inviteBadgeText: {
        fontFamily: FONTS.sans,
        fontSize: ms(11),
        fontWeight: '600',
    },
    scopesLabel: {
        fontFamily: FONTS.serif,
        fontSize: ms(15),
        fontWeight: '600',
        marginTop: vs(12),
        marginBottom: vs(8),
    },
    scopesList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: ms(8),
    },
    scopeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: ms(10),
        paddingVertical: vs(5),
        borderRadius: ms(10),
        backgroundColor: 'rgba(146, 163, 141, 0.1)',
    },
    scopeBadgeText: {
        fontFamily: FONTS.sans,
        fontSize: ms(12),
        fontWeight: '500',
    },
    cardActions: {
        flexDirection: 'row',
        gap: ms(12),
        marginTop: vs(14),
    },
    actionBtn: {
        flex: 1,
        height: vs(44),
        borderRadius: ms(12),
        justifyContent: 'center',
        alignItems: 'center',
    },
    declineActionBtn: {
        borderWidth: 1,
    },
    acceptActionBtn: {
        elevation: 1,
    },
    actionBtnText: {
        fontFamily: FONTS.serif,
        fontSize: ms(14),
        fontWeight: '600',
    }
});
