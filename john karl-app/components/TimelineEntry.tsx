import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { ms, vs } from 'react-native-size-matters';
import { FONTS } from '@/constants/theme';
import { useVideoPlayer, VideoView } from 'expo-video';

// Shared explicit interface to power full application chronology
export type TimelineDataPoint = {
    id: string;
    memoryId?: string;
    year: string;
    type: 'text' | 'image' | 'audio' | 'video';
    title: string;
    author: string;
    date: string;
    content?: string;
    image?: any;
    videoUrl?: string;
    tags?: string[];
    bgColor?: string;
    darkBgColor?: string;
};

interface TimelineEntryProps {
    item: TimelineDataPoint;
    index: number;
    isDarkMode: boolean;
    colors: any; // Standardised theme palette injection
    onPress?: (id: string) => void;
}

const VideoPreview = ({ url, style }: { url: string; style: any }) => {
    const player = useVideoPlayer({ uri: url, useCaching: true }, player => {
        player.muted = true;
        player.loop = false;
        player.bufferOptions = {
            preferredForwardBufferDuration: 60,
            waitsToMinimizeStalling: true,
            minBufferForPlayback: 2,
            prioritizeTimeOverSizeThreshold: true,
        };
    });
    return (
        <VideoView
            player={player}
            style={style}
            nativeControls={false}
        />
    );
};

export const TimelineEntry: React.FC<TimelineEntryProps> = ({ item, index, isDarkMode, colors, onPress }) => {
    return (
        <View style={styles.timelineEntry}>
            {/* The Hollow Ring node on the axis - matching User reference target exactly */}
            <View style={styles.nodeWrapper}>
                <View style={[
                    styles.nodeOuter, 
                    { 
                        backgroundColor: 'transparent', 
                        borderColor: isDarkMode ? '#FFFFFF' : '#C4D0C8',
                        borderWidth: ms(1.5)
                    }
                ]}>
                    <View style={[styles.nodeInner, { backgroundColor: isDarkMode ? '#FFFFFF' : colors.primaryAlt }]} />
                </View>
            </View>

            {/* Card Content Side */}
            <View style={styles.cardSide}>
                {/* Floating Year Badge */}
                <View style={[styles.yearBadge, { backgroundColor: colors.primaryAlt }]}>
                    <Text style={styles.yearText}>{item.year}</Text>
                </View>

                {/* Physical Card Body */}
                <TouchableOpacity 
                    activeOpacity={0.9}
                    onPress={() => onPress?.(item.memoryId || item.id)}
                    style={[styles.cardBody, { backgroundColor: isDarkMode ? item.darkBgColor : item.bgColor }]}
                >
                    {item.type === 'video' && item.videoUrl ? (
                        <View style={styles.imageContainer}>
                            <VideoPreview url={item.videoUrl} style={styles.cardImage} />
                            <View style={styles.playOverlay}>
                                <View style={styles.playIconCircle}>
                                    <Feather name="play" size={ms(18)} color="#FFF" style={{ marginLeft: ms(2) }} />
                                </View>
                            </View>
                        </View>
                    ) : (item.image ? (
                        <View style={styles.imageContainer}>
                            <Image source={item.image} style={styles.cardImage} />
                        </View>
                    ) : null)}
                    
                    <View style={styles.cardContent}>
                        <View style={styles.contentHeader}>
                            {item.type !== 'image' && item.type !== 'video' && (
                                <View style={[styles.iconCircle, { backgroundColor: 'rgba(0,0,0,0.1)' }]}>
                                    {item.type === 'text' ? (
                                        <Feather name="file-text" size={ms(18)} color="#757A75" />
                                    ) : (
                                        <MaterialCommunityIcons name="microphone-outline" size={ms(20)} color="#757A75" />
                                    )}
                                </View>
                            )}
                            <View style={[styles.titleLayout, (item.type === 'image' || item.type === 'video') && { paddingVertical: vs(8) }]}>
                                <Text style={[styles.itemTitle, { color: colors.textDark }]}>{item.title}</Text>
                                <Text style={[styles.itemMeta, { color: colors.textMuted }]}>
                                    {item.author} · {item.date}
                                </Text>
                            </View>
                            <Feather 
                                name={index === 0 ? "chevron-up" : "chevron-down"} 
                                size={ms(18)} 
                                color={colors.textMuted} 
                                style={{ marginTop: vs(4) }} 
                            />
                        </View>

                        {item.content && (
                            <View style={styles.expandedArea}>
                                <Text style={[styles.bodyText, { color: '#5C5F5C' }]}>{item.content}</Text>
                                {item.tags && (
                                    <View style={styles.tagCloud}>
                                        {item.tags.map(tag => (
                                            <View 
                                                key={tag} 
                                                style={[
                                                    styles.tagBadge, 
                                                    { 
                                                        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#E2E7EA',
                                                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : '#B7C5CE',
                                                        borderWidth: 1,
                                                        borderRadius: ms(20)
                                                    }
                                                ]}
                                            >
                                                <Text style={[styles.tagText, { color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#8398A9' }]}>{tag}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    timelineEntry: {
        flexDirection: 'row',
        marginBottom: vs(16),
        position: 'relative',
    },
    nodeWrapper: {
        position: 'absolute',
        left: ms(-22), 
        top: vs(5),
        justifyContent: 'center',
        alignItems: 'center',
    },
    nodeOuter: {
        width: ms(18),
        height: ms(18),
        borderRadius: ms(9),
        justifyContent: 'center',
        alignItems: 'center',
    },
    nodeInner: {
        width: ms(8),
        height: ms(8),
        borderRadius: ms(4),
    },
    cardSide: {
        flex: 1,
        paddingLeft: ms(10),
    },
    yearBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: ms(10),
        paddingVertical: vs(3),
        borderRadius: ms(10),
        marginBottom: vs(6),
    },
    yearText: {
        fontFamily: FONTS.sans,
        fontSize: ms(11),
        color: '#FFFFFF',
        fontWeight: '700',
    },
    cardBody: {
        borderRadius: ms(16),
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    imageContainer: {
        height: vs(140),
        width: '100%',
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    cardContent: {
        padding: ms(12),
    },
    contentHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconCircle: {
        width: ms(36),
        height: ms(36),
        borderRadius: ms(18),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: ms(12),
    },
    titleLayout: {
        flex: 1,
        marginRight: ms(8),
    },
    itemTitle: {
        fontFamily: FONTS.serif,
        fontSize: ms(15),
        fontWeight: '600',
        marginBottom: vs(2),
    },
    itemMeta: {
        fontFamily: FONTS.sans,
        fontSize: ms(10),
    },
    expandedArea: {
        marginTop: vs(8),
        paddingTop: vs(8),
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    bodyText: {
        fontFamily: FONTS.sans,
        fontSize: ms(12),
        lineHeight: vs(16),
        fontStyle: 'italic',
    },
    tagCloud: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: ms(8),
        marginTop: vs(8),
    },
    tagBadge: {
        paddingHorizontal: ms(10),
        paddingVertical: vs(4),
    },
    tagText: {
        fontFamily: FONTS.sans,
        fontSize: ms(10),
        fontWeight: '500',
    },
    playOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playIconCircle: {
        width: ms(36),
        height: ms(36),
        borderRadius: ms(18),
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
