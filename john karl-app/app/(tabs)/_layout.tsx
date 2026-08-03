import { FONTS, LightTheme } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
    interpolate,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms, vs } from 'react-native-size-matters';
import Svg, { Path } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_BAR_WIDTH = SCREEN_WIDTH - ms(40); // accounting for left/right 20ms margins
const TAB_HEIGHT = vs(60);

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Configuration for the Bezier Curve Notch - Precision tuned to match visual reference
const NOTCH_WIDTH = ms(75);
const NOTCH_DEPTH = vs(36);
const TAB_PADDING = ms(16); // Centralizes the icons by pushing them from the edges

function CustomTabBar({ state, descriptors, navigation, colors }: BottomTabBarProps & { colors: typeof LightTheme }) {
    const insets = useSafeAreaInsets();
    const usableWidth = TAB_BAR_WIDTH - (TAB_PADDING * 2);
    const tabWidth = usableWidth / state.routes.length;

    // Safe, Reactive Shared Value driven from incoming state prop
    const activeIndex = useSharedValue(state.index);

    useEffect(() => {
        activeIndex.value = withSpring(state.index, {
            damping: 18,
            stiffness: 160,
            mass: 0.8,
        });
    }, [state.index]);

    const animatedProps = useAnimatedProps(() => {
        // Recalculate active center taking explicit horizontal padding into consideration
        const activeX = (activeIndex.value * tabWidth) + (tabWidth / 2) + TAB_PADDING;

        // Construct continuous SVG path dynamically with parametric curve centering on activeX
        const l1 = activeX - NOTCH_WIDTH / 2;
        const r1 = activeX + NOTCH_WIDTH / 2;

        // Finely tuned control points to replicate that smooth, deep "Parabolic Bowl" from the image
        // Increased bottom tangent to make the bottom curves even rounder and softer.
        const d = `
            M 0 0
            L ${l1} 0
            C ${l1 + 15} 0, ${activeX - 40} ${NOTCH_DEPTH}, ${activeX} ${NOTCH_DEPTH}
            C ${activeX + 40} ${NOTCH_DEPTH}, ${r1 - 15} 0, ${r1} 0
            L ${TAB_BAR_WIDTH} 0
            L ${TAB_BAR_WIDTH} ${TAB_HEIGHT}
            L 0 ${TAB_HEIGHT}
            Z
        `;
        return { d };
    });

    return (
        <View style={[styles.tabBarContainer, { bottom: insets.bottom + vs(8), backgroundColor: colors.background }]}>
            {/* Background SVG that slides the cutout */}
            <Svg width={TAB_BAR_WIDTH} height={TAB_HEIGHT} style={StyleSheet.absoluteFill}>
                <AnimatedPath
                    animatedProps={animatedProps}
                    fill={colors.primaryAlt} // Primary Sage color
                />
            </Svg>

            {/* Interactive Items layer */}
            <View style={styles.itemsRow}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;

                    return (
                        <TabItem
                            key={route.key}
                            route={route}
                            isFocused={isFocused}
                            options={options}
                            onPress={() => {
                                const event = navigation.emit({
                                    type: 'tabPress',
                                    target: route.key,
                                    canPreventDefault: true,
                                });

                                if (!isFocused && !event.defaultPrevented) {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    navigation.navigate(route.name);
                                }
                            }}
                            colors={colors}
                        />
                    );
                })}
            </View>
        </View>
    );
}

// 🚨 EXTRACTED INTO COMPONENT TO ALLOW HOOKS 🚨
function TabItem({ route, isFocused, options, onPress, colors }: any) {
    const activeAnim = useSharedValue(isFocused ? 1 : 0);

    useEffect(() => {
        activeAnim.value = withSpring(isFocused ? 1 : 0, { damping: 20, stiffness: 200 });
    }, [isFocused]);

    const liftHeight = vs(-8);

    const animatedIconContainerStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: interpolate(activeAnim.value, [0, 1], [0, liftHeight]) },
                { scale: interpolate(activeAnim.value, [0, 1], [1, 1.15]) }
            ]
        };
    });

    const animatedLabelStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(activeAnim.value, [0, 1], [1, 0]),
            transform: [{ translateY: interpolate(activeAnim.value, [0, 1], [0, 10]) }]
        };
    });

    const Icon = options.tabBarIcon;

    return (
        <Pressable
            onPress={onPress}
            style={styles.tabItem}
        >
            <Animated.View style={[styles.iconBox, animatedIconContainerStyle]}>
                {Icon && Icon({
                    focused: isFocused,
                    color: isFocused ? colors.primaryAlt : '#FFFFFF',
                    size: ms(24)
                })}
            </Animated.View>
            <Animated.Text style={[styles.label, animatedLabelStyle, { color: '#FFFFFF' }]}>
                {options.title}
            </Animated.Text>
        </Pressable>
    );
}

export default function TabLayout() {
    const colors = useAppTheme();

    return (
        <Tabs
            tabBar={(props) => <CustomTabBar {...props} colors={colors} />}
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.primaryAlt,
                tabBarInactiveTintColor: '#FFFFFF',
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <Feather name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="vault"
                options={{
                    title: 'Vault',
                    tabBarIcon: ({ color, size }) => (
                        <Feather name="archive" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="timeline"
                options={{
                    title: 'TimeLine',
                    tabBarIcon: ({ color, size }) => (
                        <Feather name="clock" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="stories"
                options={{
                    title: 'Stories',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="comment-quote-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBarContainer: {
        position: 'absolute',
        left: ms(20),
        right: ms(20),
        height: TAB_HEIGHT,
        borderRadius: ms(20), // visual curve matching user's image corners
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    itemsRow: {
        flexDirection: 'row',
        height: '100%',
        width: '100%',
        position: 'absolute',
        zIndex: 10,
        paddingHorizontal: ms(16), // Matches the TAB_PADDING math
    },
    tabItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        paddingBottom: vs(5),
    },
    iconBox: {
        justifyContent: 'center',
        alignItems: 'center',
        width: ms(44),
        height: ms(44),
        borderRadius: ms(22),
        // Dynamic white background injection if focused
    },
    label: {
        fontFamily: FONTS.sans,
        fontSize: ms(11),
        fontWeight: '600',
        marginTop: vs(2),
    },
});
