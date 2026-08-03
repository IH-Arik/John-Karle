import { FONTS } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { NotificationHeader } from '@/components/NotificationHeader';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
    ActivityIndicator,
    RefreshControl,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ms, vs } from 'react-native-size-matters';
import { useNotificationStore, Notification } from '@/store/notification-store';

const CATEGORIES = ['All', 'AI', 'Memory', 'Family'];

const formatRelativeTime = (dateStr: string) => {
    try {
        const now = new Date();
        const date = new Date(dateStr);
        const diffMs = now.getTime() - date.getTime();
        if (diffMs < 0) return 'Just now';
        
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
        return '';
    }
};

const getNotificationMeta = (type: string) => {
    switch (type) {
        case 'family_invitation_received':
            return {
                iconLib: 'Feather',
                iconName: 'users',
                accentColor: '#99A896',
                actionLabel: 'View family access',
                route: '/family-access'
            };
        case 'family_invitation_accepted':
            return {
                iconLib: 'Feather',
                iconName: 'users',
                accentColor: '#8EA281',
                actionLabel: 'View family members',
                route: '/family-access'
            };
        case 'trusted_contact_invitation_received':
            return {
                iconLib: 'Feather',
                iconName: 'mail',
                accentColor: '#9994B3',
                actionLabel: 'View Received Invites',
                route: '/legacy-mode'
            };
        case 'trusted_contact_invitation_accepted':
            return {
                iconLib: 'Feather',
                iconName: 'heart',
                accentColor: '#8EA281',
                actionLabel: 'View Trusted Contacts',
                route: '/legacy-mode'
            };
        case 'legacy_access_request_created':
            return {
                iconLib: 'MaterialCommunityIcons',
                iconName: 'star-four-points-outline',
                accentColor: '#E88B8B',
                actionLabel: 'Review request',
                route: '/legacy-mode'
            };
        case 'legacy_access_request_approved':
            return {
                iconLib: 'MaterialCommunityIcons',
                iconName: 'star-four-points-outline',
                accentColor: '#8EA281',
                actionLabel: 'Access archive',
                route: '/legacy-mode'
            };
        case 'legacy_access_request_rejected':
            return {
                iconLib: 'MaterialCommunityIcons',
                iconName: 'star-four-points',
                accentColor: '#FF453A',
                actionLabel: 'Go to settings',
                route: '/profile'
            };
        case 'memory_shared':
            return {
                iconLib: 'Feather',
                iconName: 'camera',
                accentColor: '#8BA4B4',
                actionLabel: 'View memory',
                route: '/(tabs)/vault'
            };
        default:
            return {
                iconLib: 'Feather',
                iconName: 'bell',
                accentColor: '#9C9BA6',
                actionLabel: 'View details',
                route: null
            };
    }
};

export default function NotificationsScreen() {
    const colors = useAppTheme();
    const isDarkMode = useColorScheme() === 'dark';
    const router = useRouter();
    const [activeCat, setActiveCat] = useState('All');

    const { 
        notifications, 
        isLoading, 
        fetchNotifications, 
        markAllRead, 
        markRead, 
        deleteNotification 
    } = useNotificationStore();

    useEffect(() => {
        fetchNotifications();
    }, []);

    // Filter notifications locally based on Category selection
    const filteredNotifications = notifications.filter(item => {
        if (activeCat === 'All') return true;
        if (activeCat === 'AI') {
            return ['legacy_access_request_created', 'legacy_access_request_approved', 'legacy_access_request_rejected'].includes(item.type);
        }
        if (activeCat === 'Memory') {
            return item.type === 'memory_shared';
        }
        if (activeCat === 'Family') {
            return [
                'family_invitation_received',
                'family_invitation_accepted',
                'trusted_contact_invitation_received',
                'trusted_contact_invitation_accepted'
            ].includes(item.type);
        }
        return true;
    });

    const dynamicStyles = {
        scaffold: isDarkMode ? '#1A1A1A' : '#F9F9F9',
        backCircle: isDarkMode ? '#2E2E33' : '#E2E3E5',
        pillActiveBg: isDarkMode ? '#474554' : '#8EA281',
        pillActiveText: '#FFFFFF',
        pillInactiveBg: isDarkMode ? '#2E2E33' : '#E5EAEF',
        pillInactiveText: isDarkMode ? '#9C9BA6' : '#646E78',
        cardBg: isDarkMode ? '#4A4856' : '#E5E8E1',
        titleText: isDarkMode ? '#8EA281' : '#2D2C39',
        secondaryText: isDarkMode ? '#B0AFC5' : '#6B767F',
        actionText: isDarkMode ? '#A2B498' : '#2D2C39',
        btnTrashBg: isDarkMode ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 59, 48, 0.08)',
        trashIcon: '#FF453A',
    };

    const renderIcon = (meta: ReturnType<typeof getNotificationMeta>) => {
        const size = ms(20);
        const color = '#FFFFFF';

        if (meta.iconLib === 'MaterialCommunityIcons') {
            return <MaterialCommunityIcons name={meta.iconName as any} size={size} color={color} />;
        }
        return <Feather name={meta.iconName as any} size={size} color={color} />;
    };

    const handleNotificationPress = (item: Notification) => {
        if (!item.isRead) {
            markRead(item.id);
        }
        const meta = getNotificationMeta(item.type);
        if (item.type === 'memory_shared' && item.data?.memoryId) {
            router.push(`/memory/${item.data.memoryId}`);
        } else if (meta.route) {
            router.push(meta.route as any);
        }
    };

    const handleClearAll = () => {
        if (filteredNotifications.length === 0) return;
        Alert.alert(
            'Clear Notifications',
            `Are you sure you want to delete all ${activeCat.toLowerCase()} notifications?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Clear All', 
                    style: 'destructive',
                    onPress: async () => {
                        const ids = filteredNotifications.map(n => n.id);
                        for (const id of ids) {
                            await deleteNotification(id);
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: dynamicStyles.scaffold }]}>
            <NotificationHeader 
                onMarkRead={() => markAllRead()}
                onDelete={handleClearAll}
            />

            {/* Category Classification Bar */}
            <View style={styles.catContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catList}>
                    {CATEGORIES.map(cat => {
                        const isActive = activeCat === cat;
                        return (
                            <TouchableOpacity
                                key={cat}
                                onPress={() => setActiveCat(cat)}
                                style={[
                                    styles.catPill,
                                    { backgroundColor: isActive ? dynamicStyles.pillActiveBg : dynamicStyles.pillInactiveBg }
                                ]}
                            >
                                <Text style={[
                                    styles.catText,
                                    { color: isActive ? dynamicStyles.pillActiveText : dynamicStyles.pillInactiveText }
                                ]}>
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Notification Transaction Log */}
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl 
                        refreshing={isLoading && notifications.length > 0} 
                        onRefresh={() => fetchNotifications()} 
                        colors={[colors.primary]} 
                    />
                }
            >
                {isLoading && notifications.length === 0 ? (
                    <View style={styles.centeredState}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={[styles.emptySubtitle, { color: dynamicStyles.secondaryText, marginTop: vs(12) }]}>
                            Loading notifications...
                        </Text>
                    </View>
                ) : filteredNotifications.length === 0 ? (
                    <View style={styles.centeredState}>
                        <Feather name="bell-off" size={ms(48)} color={dynamicStyles.pillInactiveText} />
                        <Text style={[styles.emptyTitle, { color: dynamicStyles.titleText, marginTop: vs(12) }]}>
                            No notifications found
                        </Text>
                        <Text style={[styles.emptySubtitle, { color: dynamicStyles.secondaryText, marginTop: vs(4) }]}>
                            We'll let you know when there's an update.
                        </Text>
                    </View>
                ) : (
                    filteredNotifications.map(item => {
                        const meta = getNotificationMeta(item.type);
                        return (
                            <TouchableOpacity
                                key={item.id}
                                activeOpacity={0.9}
                                onPress={() => handleNotificationPress(item)}
                                style={[
                                    styles.card, 
                                    { backgroundColor: dynamicStyles.cardBg },
                                    !item.isRead && { borderWidth: 1, borderColor: colors.primary }
                                ]}
                            >
                                {/* Top Header Row of Card */}
                                <View style={styles.cardTop}>
                                    <View style={styles.cardLabelBox}>
                                        <View style={[styles.iconBox, { backgroundColor: meta.accentColor }]}>
                                            {renderIcon(meta)}
                                        </View>
                                        <View style={styles.titleCluster}>
                                            <View style={styles.headerFlex}>
                                                <Text style={[styles.cardTitle, { color: dynamicStyles.titleText }]}>{item.title}</Text>
                                                <Text style={[styles.timeText, { color: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }]}>
                                                    {formatRelativeTime(item.createdAt)}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    <TouchableOpacity 
                                        style={[styles.closeBtn, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)' }]}
                                        onPress={() => deleteNotification(item.id)}
                                    >
                                        <Ionicons name="close" size={ms(16)} color={isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)'} />
                                    </TouchableOpacity>
                                </View>

                                {/* Description Body */}
                                <Text style={[styles.cardDesc, { color: dynamicStyles.secondaryText }]}>
                                    {item.message}
                                </Text>

                                {/* Explicit Call to Action Link */}
                                <View style={styles.actionBtn}>
                                    <Text style={[styles.actionLabel, { color: dynamicStyles.actionText }]}>{meta.actionLabel}</Text>
                                    <Feather name="chevron-right" size={ms(14)} color={dynamicStyles.actionText} style={{ marginLeft: 4 }} />
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}

                {/* Guarding spacer for systemic tab bar containment */}
                <View style={{ height: vs(60) }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    catContainer: {
        paddingVertical: vs(12),
    },
    catList: {
        paddingHorizontal: ms(20),
        gap: ms(10),
    },
    catPill: {
        paddingHorizontal: ms(24),
        paddingVertical: vs(8),
        borderRadius: ms(20),
    },
    catText: {
        fontFamily: FONTS.sans,
        fontSize: ms(12),
        fontWeight: '500',
    },
    scroll: {
        flex: 1,
    },
    content: {
        paddingHorizontal: ms(20),
        paddingVertical: vs(10),
        gap: vs(16),
    },
    card: {
        borderRadius: ms(20),
        padding: ms(16),
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardLabelBox: {
        flexDirection: 'row',
        flex: 1,
    },
    iconBox: {
        width: ms(44),
        height: ms(44),
        borderRadius: ms(14),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: ms(12),
    },
    titleCluster: {
        flex: 1,
        paddingTop: vs(2),
    },
    headerFlex: {
        flex: 1,
    },
    cardTitle: {
        fontFamily: FONTS.serif,
        fontSize: ms(14),
        fontWeight: '600',
        marginBottom: vs(2),
    },
    timeText: {
        fontFamily: FONTS.sans,
        fontSize: ms(9),
        marginBottom: vs(4),
    },
    closeBtn: {
        width: ms(24),
        height: ms(24),
        borderRadius: ms(12),
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: ms(8),
    },
    cardDesc: {
        fontFamily: FONTS.sans,
        fontSize: ms(11),
        lineHeight: vs(15),
        marginTop: vs(2),
        marginBottom: vs(10),
        paddingLeft: ms(56),
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: ms(56),
    },
    actionLabel: {
        fontFamily: FONTS.sans,
        fontSize: ms(11),
        fontWeight: '500',
    },
    centeredState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: ms(40),
        paddingVertical: vs(80),
    },
    emptyTitle: {
        fontFamily: FONTS.serif,
        fontSize: ms(18),
        fontWeight: '600',
        textAlign: 'center',
    },
    emptySubtitle: {
        fontFamily: FONTS.sans,
        fontSize: ms(13),
        textAlign: 'center',
        lineHeight: vs(18),
    },
});
