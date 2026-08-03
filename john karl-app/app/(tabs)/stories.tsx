import { FONTS, LightTheme } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import {
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScaledSheet } from 'react-native-size-matters';

export default function StoriesScreen() {
    const colors = useAppTheme();
    const colorScheme = useColorScheme();
    const styles = useMemo(() => getStyles(colors), [colors]);

    const featuredStory = {
        id: 'f1',
        title: 'The Great Migration',
        excerpt: 'Leaving the familiar shores of the old world behind, they embarked on a journey that would change our family line forever...',
        author: 'Margaret Mitchell',
        date: 'Nov 12, 1952',
        image: require('@/assets/images/dashboard/lake.png'),
        readTime: '5 min read',
        category: 'Ancestry'
    };

    const stories = [
        {
            id: 's1',
            title: "Margaret's Wedding Day",
            excerpt: "A day filled with joy, laughter, and an unexpected rainstorm that made for the most beautiful photographs.",
            author: 'Robert Mitchell',
            date: 'June 4, 1967',
            image: require('@/assets/images/dashboard/wedding.png'),
            readTime: '3 min read',
            category: 'Milestone'
        },
        {
            id: 's2',
            title: 'Morning at the Oregon Coast',
            excerpt: "The waves crashed against the rocks as we built our first campfire. The smell of saltwater and burning pine is something I'll never forget.",
            author: 'Margaret Mitchell',
            date: 'July 2, 1983',
            image: require('@/assets/images/dashboard/coast.png'),
            readTime: '4 min read',
            category: 'Travel'
        },
        {
            id: 's3',
            title: 'Building the Family Home',
            excerpt: "It took three years, countless weekends, and help from all the neighbors to finish the house on Elm Street.",
            author: 'Robert Mitchell',
            date: 'Spring 1975',
            image: require('@/assets/images/dashboard/robert.png'),
            readTime: '6 min read',
            category: 'Milestone'
        }
    ];

    return (
        <SafeAreaView edges={['top']} style={styles.container}>
            <StatusBar
                barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
            />
            
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerSubtitle}>YOUR ARCHIVE</Text>
                    <Text style={styles.headerTitle}>Stories</Text>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity 
                        style={styles.iconBtn}
                        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                    >
                        <Feather name="search" size={24} color={colors.textDark} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.iconBtn}
                        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                    >
                        <Feather name="filter" size={24} color={colors.textDark} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Featured Story */}
                <View style={styles.section}>
                    <TouchableOpacity 
                        activeOpacity={0.9} 
                        style={styles.featuredCard}
                        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                    >
                        <Image source={featuredStory.image} style={styles.featuredImage} />
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
                            style={styles.featuredGradient}
                        >
                            <View style={styles.categoryBadge}>
                                <Text style={styles.categoryText}>{featuredStory.category}</Text>
                            </View>
                            <Text style={styles.featuredTitle}>{featuredStory.title}</Text>
                            <Text style={styles.featuredExcerpt} numberOfLines={2}>{featuredStory.excerpt}</Text>
                            <View style={styles.metaRow}>
                                <Text style={styles.metaText}>{featuredStory.author} · {featuredStory.date}</Text>
                                <View style={styles.dotSeparator} />
                                <Feather name="clock" size={12} color="rgba(255,255,255,0.7)" />
                                <Text style={styles.metaText}>{featuredStory.readTime}</Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Filter Tabs / Tags */}
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={styles.filterTabs}
                >
                    {['All', 'Milestones', 'Ancestry', 'Travel', 'Letters'].map((tab, index) => (
                        <TouchableOpacity 
                            key={tab} 
                            style={[styles.filterTab, index === 0 && styles.filterTabActive]}
                            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                        >
                            <Text style={[styles.filterTabText, index === 0 && styles.filterTabTextActive]}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Story List */}
                <View style={styles.storyList}>
                    {stories.map((story) => (
                        <TouchableOpacity 
                            key={story.id} 
                            activeOpacity={0.8}
                            style={styles.storyCard}
                            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                        >
                            <Image source={story.image} style={styles.storyThumb} />
                            <View style={styles.storyContent}>
                                <Text style={styles.storyCategory}>{story.category}</Text>
                                <Text style={styles.storyTitle} numberOfLines={2}>{story.title}</Text>
                                <Text style={styles.storyExcerpt} numberOfLines={2}>{story.excerpt}</Text>
                                <View style={styles.storyMetaRow}>
                                    <Text style={styles.storyMetaText}>{story.date}</Text>
                                    <View style={styles.dotSeparatorDark} />
                                    <Text style={styles.storyMetaText}>{story.readTime}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Call to Action */}
                <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.ctaBanner}
                >
                    <View style={styles.ctaIconWrapper}>
                        <Feather name="edit-3" size={20} color={colors.textMuted} />
                    </View>
                    <View style={styles.ctaContent}>
                        <Text style={styles.ctaTitle}>Draft a New Story</Text>
                        <Text style={styles.ctaSubtitle}>
                            Preserve another piece of your family's history.
                        </Text>
                    </View>
                    <Feather name="chevron-right" size={22} color={colors.textMuted} />
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (colors: typeof LightTheme) => ScaledSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: '24@ms',
        paddingTop: '16@vs',
        marginBottom: '20@vs',
    },
    headerSubtitle: {
        fontFamily: FONTS.sans,
        fontSize: '11@ms',
        color: colors.accentGreen,
        letterSpacing: 1.2,
        marginBottom: '4@vs',
        textTransform: 'uppercase',
    },
    headerTitle: {
        fontFamily: FONTS.serif,
        fontSize: '36@ms',
        fontWeight: '600',
        color: colors.textDark,
    },
    headerRight: {
        flexDirection: 'row',
        gap: '12@ms',
    },
    iconBtn: {
        width: '40@ms',
        height: '40@ms',
        borderRadius: '20@ms',
        backgroundColor: colors.cardBg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: '90@vs',
    },
    section: {
        paddingHorizontal: '24@ms',
        marginBottom: '24@vs',
    },
    featuredCard: {
        width: '100%',
        height: '340@vs',
        borderRadius: '24@ms',
        overflow: 'hidden',
        backgroundColor: colors.cardBg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    featuredImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    featuredGradient: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: '20@ms',
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: '12@ms',
        paddingVertical: '6@vs',
        borderRadius: '16@ms',
        marginBottom: '12@vs',
    },
    categoryText: {
        fontFamily: FONTS.sans,
        fontSize: '11@ms',
        color: '#FFFFFF',
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    featuredTitle: {
        fontFamily: FONTS.serif,
        fontSize: '28@ms',
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: '8@vs',
        lineHeight: '34@vs',
    },
    featuredExcerpt: {
        fontFamily: FONTS.sans,
        fontSize: '13@ms',
        color: 'rgba(255,255,255,0.85)',
        lineHeight: '20@vs',
        marginBottom: '16@vs',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: '6@ms',
    },
    metaText: {
        fontFamily: FONTS.sans,
        fontSize: '11@ms',
        color: 'rgba(255,255,255,0.7)',
    },
    dotSeparator: {
        width: '4@ms',
        height: '4@ms',
        borderRadius: '2@ms',
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    dotSeparatorDark: {
        width: '3@ms',
        height: '3@ms',
        borderRadius: '1.5@ms',
        backgroundColor: colors.textMuted,
        opacity: 0.5,
    },
    filterTabs: {
        paddingHorizontal: '24@ms',
        paddingBottom: '24@vs',
        gap: '8@ms',
    },
    filterTab: {
        paddingHorizontal: '16@ms',
        paddingVertical: '8@vs',
        borderRadius: '20@ms',
        backgroundColor: colors.cardBg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    filterTabActive: {
        backgroundColor: colors.primaryAlt,
        borderColor: colors.primaryAlt,
    },
    filterTabText: {
        fontFamily: FONTS.sans,
        fontSize: '13@ms',
        color: colors.textDark,
    },
    filterTabTextActive: {
        color: '#FFFFFF',
        fontWeight: '500',
    },
    storyList: {
        paddingHorizontal: '24@ms',
        gap: '16@vs',
        marginBottom: '24@vs',
    },
    storyCard: {
        flexDirection: 'row',
        backgroundColor: colors.backgroundAlt,
        borderRadius: '20@ms',
        padding: '12@ms',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    storyThumb: {
        width: '90@ms',
        height: '100@ms',
        borderRadius: '14@ms',
    },
    storyContent: {
        flex: 1,
        marginLeft: '14@ms',
        justifyContent: 'center',
    },
    storyCategory: {
        fontFamily: FONTS.sans,
        fontSize: '10@ms',
        color: colors.accentGreen,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginBottom: '4@vs',
    },
    storyTitle: {
        fontFamily: FONTS.serif,
        fontSize: '16@ms',
        fontWeight: '600',
        color: colors.textDark,
        marginBottom: '6@vs',
        lineHeight: '22@vs',
    },
    storyExcerpt: {
        fontFamily: FONTS.sans,
        fontSize: '12@ms',
        color: colors.textMuted,
        lineHeight: '18@vs',
        marginBottom: '10@vs',
    },
    storyMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: '6@ms',
    },
    storyMetaText: {
        fontFamily: FONTS.sans,
        fontSize: '11@ms',
        color: colors.textMuted,
    },
    ctaBanner: {
        marginHorizontal: '24@ms',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cardBg,
        opacity: 0.85,
        borderRadius: '20@ms',
        padding: '16@ms',
        borderWidth: 1,
        borderColor: colors.border,
    },
    ctaIconWrapper: {
        width: '38@ms',
        height: '38@ms',
        borderRadius: '12@ms',
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ctaContent: {
        flex: 1,
        marginLeft: '14@ms',
        gap: '2@vs',
    },
    ctaTitle: {
        fontFamily: FONTS.serif,
        fontSize: '16@ms',
        fontWeight: '600',
        color: colors.textDark,
    },
    ctaSubtitle: {
        fontFamily: FONTS.sans,
        fontSize: '12@ms',
        color: colors.textMuted,
        lineHeight: '16@vs',
    },
});
