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
    Image,
    Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ms, vs } from 'react-native-size-matters';
import { FONTS } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface AccessScope {
    profile: boolean;
    documents: boolean; // Memories
    notes: boolean;     // Narratives
    messages: boolean;  // AI Insights
}

interface LegacyRequest {
    id: string;
    ownerName: string;
    ownerEmail: string;
    relationship: string;
    inactivityDays: number;
    unlockDate: string;
    status: 'waiting' | 'claimable' | 'active';
    accessScope: AccessScope;
    avatarSource?: any;
    profileDetails: {
        phone: string;
        address: string;
    };
    memories: {
        id: string;
        title: string;
        date: string;
        description: string;
        type: 'photo' | 'video' | 'voice' | 'note';
    }[];
    narratives: {
        id: string;
        title: string;
        content: string;
    }[];
    aiInsights: {
        id: string;
        title: string;
        content: string;
    }[];
}

const INITIAL_MOCK_REQUESTS: LegacyRequest[] = [
    {
        id: 'req_1',
        ownerName: 'Robert Mitchell',
        ownerEmail: 'robert.mitchell@example.com',
        relationship: 'Father',
        inactivityDays: 90,
        unlockDate: '2026-08-15',
        status: 'waiting',
        avatarSource: require('@/assets/images/dashboard/robert.png'),
        accessScope: {
            profile: true,
            documents: true,
            notes: true,
            messages: true
        },
        profileDetails: {
            phone: '+1 (555) 019-2834',
            address: '742 Evergreen Terrace, Springfield, OR'
        },
        memories: [
            { id: 'm1', title: 'Summer trip to the lake', date: '2024-07-12', description: 'Camping by the lakeside. The weather was perfect.', type: 'photo' },
            { id: 'm2', title: 'Graduation Day', date: '2021-06-05', description: 'Sarah graduating from university with honors.', type: 'photo' }
        ],
        narratives: [
            { id: 'n1', title: 'Advice to my daughter', content: 'Always work hard and be true to yourself. Family is the most important thing in life. Never forget where you came from.' }
        ],
        aiInsights: [
            { id: 'a1', title: 'Weekly Archive Summary', content: 'This week Robert spent time reflecting on early childhood memories and family trips.' }
        ]
    },
    {
        id: 'req_2',
        ownerName: 'Margaret Mitchell',
        ownerEmail: 'margaret.mitchell@example.com',
        relationship: 'Mother',
        inactivityDays: 60,
        unlockDate: '2026-06-20',
        status: 'claimable',
        avatarSource: require('@/assets/images/dashboard/margaret.png'),
        accessScope: {
            profile: true,
            documents: true,
            notes: false,
            messages: false
        },
        profileDetails: {
            phone: '+1 (555) 014-9876',
            address: '12 Beacon Hill Road, Boston, MA'
        },
        memories: [
            { id: 'm3', title: 'Family Thanksgiving dinner', date: '2025-11-27', description: 'Everyone gathered at Grandma\'s house for a warm Thanksgiving dinner.', type: 'photo' }
        ],
        narratives: [],
        aiInsights: []
    },
    {
        id: 'req_3',
        ownerName: 'Arthur Mitchell',
        ownerEmail: 'arthur.mitchell@example.com',
        relationship: 'Uncle',
        inactivityDays: 120,
        unlockDate: '2026-05-10',
        status: 'active',
        avatarSource: null, // will fallback to default
        accessScope: {
            profile: true,
            documents: true,
            notes: true,
            messages: false
        },
        profileDetails: {
            phone: '+1 (555) 012-3456',
            address: '45 Tulip Lane, Seattle, WA'
        },
        memories: [
            { id: 'm4', title: 'Arthur\'s retirement party', date: '2023-09-14', description: 'Celebrating 30 years at the school board with colleagues.', type: 'photo' }
        ],
        narratives: [
            { id: 'n2', title: 'The Story of our Ancestors', content: 'Our family originally immigrated in 1912 from Ireland. They settled in Boston and worked in the textile mills.' }
        ],
        aiInsights: []
    }
];

export default function LegacyAccessListScreen() {
    const router = useRouter();
    const isDarkMode = useColorScheme() === 'dark';

    const [requests, setRequests] = useState<LegacyRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Claiming status
    const [claimingId, setClaimingId] = useState<string | null>(null);

    // Detail modal status
    const [selectedRequest, setSelectedRequest] = useState<LegacyRequest | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'memories' | 'narratives' | 'insights'>('profile');

    useEffect(() => {
        // Simulate initial loading
        const timer = setTimeout(() => {
            setRequests(INITIAL_MOCK_REQUESTS);
            setLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    }, []);

    const triggerHaptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const handleClaimAccess = (id: string, name: string) => {
        triggerHaptic();
        Alert.alert(
            'Claim Legacy Access',
            `Are you sure you want to claim legacy access for ${name}'s account? This will activate your view-only access keys.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Claim Access', 
                    style: 'default',
                    onPress: () => performClaim(id, name)
                }
            ]
        );
    };

    const performClaim = (id: string, name: string) => {
        setClaimingId(id);
        // Simulate API call delay
        setTimeout(() => {
            setRequests(prev => 
                prev.map(req => 
                    req.id === id ? { ...req, status: 'active' } : req
                )
            );
            setClaimingId(null);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
                'Access Claimed',
                `You have successfully claimed legacy access to ${name}'s account. You can now browse their shared details.`
            );
        }, 1500);
    };

    const handleOpenData = (req: LegacyRequest) => {
        triggerHaptic();
        setSelectedRequest(req);
        
        // Find first available tab
        if (req.accessScope.profile) {
            setActiveTab('profile');
        } else if (req.accessScope.documents) {
            setActiveTab('memories');
        } else if (req.accessScope.notes) {
            setActiveTab('narratives');
        } else if (req.accessScope.messages) {
            setActiveTab('insights');
        }
        
        setModalVisible(true);
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'active':
                return { 
                    bg: isDarkMode ? '#1E2C2C' : '#E0F2F1', 
                    text: isDarkMode ? '#80CBC4' : '#00796B',
                    label: 'Access Active'
                };
            case 'claimable':
                return { 
                    bg: isDarkMode ? '#233226' : '#E8F5E9', 
                    text: isDarkMode ? '#81C784' : '#2E7D32',
                    label: 'Claim Available'
                };
            case 'waiting':
            default:
                return { 
                    bg: isDarkMode ? '#3E3424' : '#FFF3E0', 
                    text: isDarkMode ? '#FFB74D' : '#EF6C00',
                    label: 'Waiting Period'
                };
        }
    };

    const palette = {
        bg: isDarkMode ? '#121212' : '#F9F8F6',
        textDark: isDarkMode ? '#D4DEC5' : '#2D2C39',
        textSub: isDarkMode ? '#8E8E93' : '#8A9981',

        backBtnBg: isDarkMode ? '#323239' : '#E3E4E3',
        backBtnIcon: isDarkMode ? '#FFFFFF' : '#5A5B66',

        itemBg: isDarkMode ? '#1E1E24' : '#EAE9EF',
        itemBorder: isDarkMode ? '#3D3D49' : '#CDD8DF',
        divider: isDarkMode ? '#2D2D35' : '#D6D5DB',

        btnPrimary: '#92A38D',
        modalBg: isDarkMode ? '#1C1C1E' : '#FFFFFF',
        modalTabActive: isDarkMode ? '#2D2C39' : '#E0E5DE',
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]}>
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={[styles.backBtn, { backgroundColor: palette.backBtnBg }]}
                    onPress={() => router.replace('/profile')}
                >
                    <Feather name="arrow-left" size={ms(20)} color={palette.backBtnIcon} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: palette.textDark }]}>Legacy Access</Text>
                <View style={{ width: ms(36) }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={palette.btnPrimary} />
                    <Text style={[styles.loadingText, { color: palette.textSub }]}>Loading accounts...</Text>
                </View>
            ) : requests.length === 0 ? (
                <View style={styles.center}>
                    <View style={[styles.emptyIconCirc, { backgroundColor: isDarkMode ? '#2A2E2A' : '#EBF0EA' }]}>
                        <Feather name="key" size={ms(48)} color={palette.btnPrimary} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: palette.textDark }]}>No Legacy Access</Text>
                    <Text style={[styles.emptySubtitle, { color: palette.textSub }]}>
                        You haven't been designated as a legacy contact by anyone yet, or their waiting period has not begun.
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
                    <View style={[styles.infoBanner, { backgroundColor: isDarkMode ? '#232B32' : '#E4EAEE' }]}>
                        <Ionicons name="information-circle-outline" size={ms(18)} color={isDarkMode ? '#A0AEBB' : '#677685'} style={{ marginRight: ms(10), marginTop: vs(2) }} />
                        <Text style={[styles.infoText, { color: isDarkMode ? '#A0AEBB' : '#677685' }]}>
                            This screen is running in demonstration mode using mock data.
                        </Text>
                    </View>

                    <View style={styles.listContainer}>
                        {requests.map((req) => {
                            const badge = getStatusConfig(req.status);
                            const avatarSource = req.avatarSource || require('@/assets/images/dashboard/avatar.png');

                            return (
                                <View key={req.id} style={[styles.card, { backgroundColor: palette.itemBg }]}>
                                    <View style={styles.cardHeader}>
                                        <Image 
                                            source={avatarSource} 
                                            style={styles.avatar}
                                        />
                                        <View style={styles.nameStack}>
                                            <View style={styles.titleRow}>
                                                <Text style={[styles.ownerName, { color: palette.textDark }]}>{req.ownerName}</Text>
                                                <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                                                    <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                                                        {badge.label}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text style={[styles.ownerEmail, { color: palette.textSub }]}>
                                                {req.relationship} · {req.ownerEmail}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={[styles.cardDivider, { backgroundColor: palette.divider }]} />

                                    <View style={styles.cardDetails}>
                                        <View style={styles.detailRow}>
                                            <Text style={[styles.detailLabel, { color: palette.textSub }]}>Inactivity Limit:</Text>
                                            <Text style={[styles.detailValue, { color: palette.textDark }]}>{req.inactivityDays} Days</Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={[styles.detailLabel, { color: palette.textSub }]}>Unlock Date:</Text>
                                            <Text style={[styles.detailValue, { color: palette.textDark }]}>{req.unlockDate}</Text>
                                        </View>
                                        
                                        <Text style={[styles.scopesLabel, { color: palette.textDark }]}>Shared Access Scope:</Text>
                                        <View style={styles.scopesList}>
                                            {req.accessScope.profile && (
                                                <View style={styles.scopeBadge}>
                                                    <Feather name="check" size={ms(12)} color={palette.btnPrimary} style={{ marginRight: ms(4) }} />
                                                    <Text style={[styles.scopeBadgeText, { color: palette.textDark }]}>Profile</Text>
                                                </View>
                                            )}
                                            {req.accessScope.documents && (
                                                <View style={styles.scopeBadge}>
                                                    <Feather name="check" size={ms(12)} color={palette.btnPrimary} style={{ marginRight: ms(4) }} />
                                                    <Text style={[styles.scopeBadgeText, { color: palette.textDark }]}>Memories</Text>
                                                </View>
                                            )}
                                            {req.accessScope.notes && (
                                                <View style={styles.scopeBadge}>
                                                    <Feather name="check" size={ms(12)} color={palette.btnPrimary} style={{ marginRight: ms(4) }} />
                                                    <Text style={[styles.scopeBadgeText, { color: palette.textDark }]}>Narratives</Text>
                                                </View>
                                            )}
                                            {req.accessScope.messages && (
                                                <View style={styles.scopeBadge}>
                                                    <Feather name="check" size={ms(12)} color={palette.btnPrimary} style={{ marginRight: ms(4) }} />
                                                    <Text style={[styles.scopeBadgeText, { color: palette.textDark }]}>AI Insights</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    <View style={[styles.cardDivider, { backgroundColor: palette.divider }]} />

                                    {req.status === 'claimable' && (
                                        <TouchableOpacity 
                                            style={[styles.actionBtn, { backgroundColor: palette.btnPrimary }]}
                                            onPress={() => handleClaimAccess(req.id, req.ownerName)}
                                            disabled={claimingId === req.id}
                                            activeOpacity={0.8}
                                        >
                                            {claimingId === req.id ? (
                                                <ActivityIndicator size="small" color="#FFFFFF" />
                                            ) : (
                                                <Text style={styles.actionBtnText}>Claim Account Access</Text>
                                            )}
                                        </TouchableOpacity>
                                    )}

                                    {req.status === 'active' && (
                                        <TouchableOpacity 
                                            style={[styles.actionBtn, { backgroundColor: '#455A64' }]}
                                            onPress={() => handleOpenData(req)}
                                            activeOpacity={0.8}
                                        >
                                            <Text style={styles.actionBtnText}>Browse Scoped Data</Text>
                                        </TouchableOpacity>
                                    )}

                                    {req.status === 'waiting' && (
                                        <View style={[styles.actionBtnDisabled, { borderColor: palette.divider }]}>
                                            <Feather name="lock" size={ms(14)} color={palette.textSub} style={{ marginRight: ms(6) }} />
                                            <Text style={[styles.actionBtnDisabledText, { color: palette.textSub }]}>Locked - Waiting Period</Text>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
            )}

            {/* Scoped Data Browser Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setModalVisible(false)}
            >
                <SafeAreaView style={[styles.modalContainer, { backgroundColor: palette.modalBg }]}>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                        <TouchableOpacity 
                            style={[styles.backBtn, { backgroundColor: palette.backBtnBg }]}
                            onPress={() => { triggerHaptic(); setModalVisible(false); }}
                        >
                            <Feather name="x" size={ms(20)} color={palette.backBtnIcon} />
                        </TouchableOpacity>
                        <View style={styles.modalHeaderTitleBox}>
                            <Text style={[styles.modalHeaderTitle, { color: palette.textDark }]}>
                                {selectedRequest?.ownerName}
                            </Text>
                            <Text style={[styles.modalHeaderSubtitle, { color: palette.textSub }]}>
                                View-Only Legacy Access
                            </Text>
                        </View>
                        <View style={{ width: ms(36) }} />
                    </View>

                    {/* Modal Tab Buttons */}
                    <View style={styles.modalTabs}>
                        {selectedRequest?.accessScope.profile && (
                            <TouchableOpacity 
                                style={[styles.modalTabButton, activeTab === 'profile' && { backgroundColor: palette.modalTabActive }]}
                                onPress={() => { triggerHaptic(); setActiveTab('profile'); }}
                            >
                                <Text style={[styles.modalTabButtonText, { color: palette.textDark }, activeTab === 'profile' && { fontWeight: '700' }]}>
                                    Profile
                                </Text>
                            </TouchableOpacity>
                        )}
                        {selectedRequest?.accessScope.documents && (
                            <TouchableOpacity 
                                style={[styles.modalTabButton, activeTab === 'memories' && { backgroundColor: palette.modalTabActive }]}
                                onPress={() => { triggerHaptic(); setActiveTab('memories'); }}
                            >
                                <Text style={[styles.modalTabButtonText, { color: palette.textDark }, activeTab === 'memories' && { fontWeight: '700' }]}>
                                    Memories
                                </Text>
                            </TouchableOpacity>
                        )}
                        {selectedRequest?.accessScope.notes && (
                            <TouchableOpacity 
                                style={[styles.modalTabButton, activeTab === 'narratives' && { backgroundColor: palette.modalTabActive }]}
                                onPress={() => { triggerHaptic(); setActiveTab('narratives'); }}
                            >
                                <Text style={[styles.modalTabButtonText, { color: palette.textDark }, activeTab === 'narratives' && { fontWeight: '700' }]}>
                                    Narratives
                                </Text>
                            </TouchableOpacity>
                        )}
                        {selectedRequest?.accessScope.messages && (
                            <TouchableOpacity 
                                style={[styles.modalTabButton, activeTab === 'insights' && { backgroundColor: palette.modalTabActive }]}
                                onPress={() => { triggerHaptic(); setActiveTab('insights'); }}
                            >
                                <Text style={[styles.modalTabButtonText, { color: palette.textDark }, activeTab === 'insights' && { fontWeight: '700' }]}>
                                    Insights
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Modal Tab Content */}
                    <ScrollView contentContainerStyle={styles.modalScrollContent}>
                        {activeTab === 'profile' && selectedRequest && (
                            <Animated.View entering={FadeIn.duration(200)} style={styles.tabContentPod}>
                                <Text style={[styles.podHeading, { color: palette.textDark }]}>Personal Details</Text>
                                <View style={styles.podRow}>
                                    <Text style={[styles.podLabel, { color: palette.textSub }]}>Full Name</Text>
                                    <Text style={[styles.podValue, { color: palette.textDark }]}>{selectedRequest.ownerName}</Text>
                                </View>
                                <View style={[styles.podDivider, { backgroundColor: palette.divider }]} />
                                <View style={styles.podRow}>
                                    <Text style={[styles.podLabel, { color: palette.textSub }]}>Email Address</Text>
                                    <Text style={[styles.podValue, { color: palette.textDark }]}>{selectedRequest.ownerEmail}</Text>
                                </View>
                                <View style={[styles.podDivider, { backgroundColor: palette.divider }]} />
                                <View style={styles.podRow}>
                                    <Text style={[styles.podLabel, { color: palette.textSub }]}>Phone Number</Text>
                                    <Text style={[styles.podValue, { color: palette.textDark }]}>{selectedRequest.profileDetails.phone}</Text>
                                </View>
                                <View style={[styles.podDivider, { backgroundColor: palette.divider }]} />
                                <View style={styles.podRow}>
                                    <Text style={[styles.podLabel, { color: palette.textSub }]}>Primary Address</Text>
                                    <Text style={[styles.podValue, { color: palette.textDark, textAlign: 'right' }]}>{selectedRequest.profileDetails.address}</Text>
                                </View>
                            </Animated.View>
                        )}

                        {activeTab === 'memories' && selectedRequest && (
                            <Animated.View entering={FadeIn.duration(200)} style={styles.tabListContainer}>
                                <Text style={[styles.podHeading, { color: palette.textDark, marginBottom: vs(10) }]}>Preserved Memories</Text>
                                {selectedRequest.memories.map((mem) => (
                                    <View key={mem.id} style={[styles.memoryCard, { backgroundColor: isDarkMode ? '#2D2C35' : '#EAE9EF' }]}>
                                        <View style={styles.memoryHeader}>
                                            <MaterialCommunityIcons 
                                                name={mem.type === 'photo' ? 'image-outline' : 'notebook-outline'} 
                                                size={ms(18)} 
                                                color={palette.btnPrimary} 
                                            />
                                            <Text style={[styles.memoryTitle, { color: palette.textDark }]}>{mem.title}</Text>
                                        </View>
                                        <Text style={[styles.memoryDate, { color: palette.textSub }]}>{mem.date}</Text>
                                        <Text style={[styles.memoryDesc, { color: palette.textDark }]}>{mem.description}</Text>
                                    </View>
                                ))}
                            </Animated.View>
                        )}

                        {activeTab === 'narratives' && selectedRequest && (
                            <Animated.View entering={FadeIn.duration(200)} style={styles.tabListContainer}>
                                <Text style={[styles.podHeading, { color: palette.textDark, marginBottom: vs(10) }]}>Life Narratives</Text>
                                {selectedRequest.narratives.length === 0 ? (
                                    <Text style={[styles.noDataText, { color: palette.textSub }]}>No life stories preserved.</Text>
                                ) : (
                                    selectedRequest.narratives.map((nar) => (
                                        <View key={nar.id} style={[styles.narrativeCard, { backgroundColor: isDarkMode ? '#2D2C35' : '#EAE9EF' }]}>
                                            <Text style={[styles.narrativeTitle, { color: palette.textDark }]}>{nar.title}</Text>
                                            <Text style={[styles.narrativeContent, { color: palette.textDark }]}>{nar.content}</Text>
                                        </View>
                                    ))
                                )}
                            </Animated.View>
                        )}

                        {activeTab === 'insights' && selectedRequest && (
                            <Animated.View entering={FadeIn.duration(200)} style={styles.tabListContainer}>
                                <Text style={[styles.podHeading, { color: palette.textDark, marginBottom: vs(10) }]}>AI Insights Summaries</Text>
                                {selectedRequest.aiInsights.length === 0 ? (
                                    <Text style={[styles.noDataText, { color: palette.textSub }]}>No weekly summaries available.</Text>
                                ) : (
                                    selectedRequest.aiInsights.map((ins) => (
                                        <View key={ins.id} style={[styles.insightCard, { backgroundColor: isDarkMode ? '#2D2C35' : '#EAE9EF' }]}>
                                            <Text style={[styles.insightTitle, { color: palette.textDark }]}>{ins.title}</Text>
                                            <Text style={[styles.insightContent, { color: palette.textDark }]}>{ins.content}</Text>
                                        </View>
                                    ))
                                )}
                            </Animated.View>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </Modal>
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
        paddingBottom: vs(40),
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
    card: {
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
        alignItems: 'center',
    },
    avatar: {
        width: ms(44),
        height: ms(44),
        borderRadius: ms(22),
        marginRight: ms(12),
    },
    nameStack: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: vs(2),
    },
    ownerName: {
        fontFamily: FONTS.serif,
        fontSize: ms(17),
        fontWeight: '600',
    },
    ownerEmail: {
        fontFamily: FONTS.sans,
        fontSize: ms(12),
    },
    statusBadge: {
        paddingHorizontal: ms(8),
        paddingVertical: vs(3),
        borderRadius: ms(8),
    },
    statusBadgeText: {
        fontFamily: FONTS.sans,
        fontSize: ms(10),
        fontWeight: '600',
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
    scopesLabel: {
        fontFamily: FONTS.serif,
        fontSize: ms(14),
        fontWeight: '600',
        marginTop: vs(8),
        marginBottom: vs(4),
    },
    scopesList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: ms(8),
    },
    scopeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: ms(8),
        paddingVertical: vs(4),
        borderRadius: ms(8),
        backgroundColor: 'rgba(146, 163, 141, 0.1)',
    },
    scopeBadgeText: {
        fontFamily: FONTS.sans,
        fontSize: ms(11),
        fontWeight: '500',
    },
    actionBtn: {
        width: '100%',
        height: vs(46),
        borderRadius: ms(12),
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 1,
    },
    actionBtnText: {
        fontFamily: FONTS.serif,
        color: '#FFFFFF',
        fontSize: ms(14),
        fontWeight: '600',
    },
    actionBtnDisabled: {
        width: '100%',
        height: vs(46),
        borderRadius: ms(12),
        borderWidth: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionBtnDisabledText: {
        fontFamily: FONTS.sans,
        fontSize: ms(14),
        fontWeight: '500',
    },

    // Modal Specific Styles
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: ms(20),
        paddingTop: vs(10),
        paddingBottom: vs(12),
    },
    modalHeaderTitleBox: {
        alignItems: 'center',
    },
    modalHeaderTitle: {
        fontFamily: FONTS.serif,
        fontSize: ms(18),
        fontWeight: '600',
    },
    modalHeaderSubtitle: {
        fontFamily: FONTS.sans,
        fontSize: ms(12),
        marginTop: vs(1),
    },
    modalTabs: {
        flexDirection: 'row',
        paddingHorizontal: ms(20),
        paddingBottom: vs(10),
        gap: ms(6),
    },
    modalTabButton: {
        flex: 1,
        height: vs(34),
        borderRadius: ms(8),
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    modalTabButtonText: {
        fontFamily: FONTS.sans,
        fontSize: ms(12),
    },
    modalScrollContent: {
        paddingHorizontal: ms(20),
        paddingBottom: vs(30),
    },
    tabContentPod: {
        borderRadius: ms(16),
        padding: ms(16),
        backgroundColor: 'rgba(146, 163, 141, 0.06)',
    },
    podHeading: {
        fontFamily: FONTS.serif,
        fontSize: ms(16),
        fontWeight: '600',
        marginBottom: vs(12),
    },
    podRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: vs(10),
    },
    podLabel: {
        fontFamily: FONTS.sans,
        fontSize: ms(13),
    },
    podValue: {
        fontFamily: FONTS.sans,
        fontSize: ms(14),
        fontWeight: '500',
    },
    podDivider: {
        height: 1,
    },
    tabListContainer: {
        gap: vs(12),
    },
    memoryCard: {
        borderRadius: ms(14),
        padding: ms(14),
        gap: vs(4),
    },
    memoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ms(6),
    },
    memoryTitle: {
        fontFamily: FONTS.serif,
        fontSize: ms(15),
        fontWeight: '600',
    },
    memoryDate: {
        fontFamily: FONTS.sans,
        fontSize: ms(11),
        marginBottom: vs(4),
    },
    memoryDesc: {
        fontFamily: FONTS.sans,
        fontSize: ms(13),
        lineHeight: vs(18),
    },
    narrativeCard: {
        borderRadius: ms(14),
        padding: ms(14),
        gap: vs(8),
    },
    narrativeTitle: {
        fontFamily: FONTS.serif,
        fontSize: ms(15),
        fontWeight: '600',
    },
    narrativeContent: {
        fontFamily: FONTS.sans,
        fontSize: ms(13),
        lineHeight: vs(19),
    },
    insightCard: {
        borderRadius: ms(14),
        padding: ms(14),
        gap: vs(8),
    },
    insightTitle: {
        fontFamily: FONTS.serif,
        fontSize: ms(15),
        fontWeight: '600',
    },
    insightContent: {
        fontFamily: FONTS.sans,
        fontSize: ms(13),
        lineHeight: vs(19),
    },
    noDataText: {
        fontFamily: FONTS.sans,
        fontSize: ms(13),
        textAlign: 'center',
        marginTop: vs(20),
    },
    infoBanner: {
        width: '100%',
        borderRadius: ms(16),
        padding: ms(16),
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: vs(16),
    },
    infoText: {
        flex: 1,
        fontFamily: FONTS.sans,
        fontSize: ms(13),
        lineHeight: vs(18),
    }
});
