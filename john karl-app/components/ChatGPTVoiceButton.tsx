import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, StyleSheet, TouchableWithoutFeedback, ViewStyle } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

export interface ChatGPTVoiceButtonProps {
    onPress?: () => void;
    size?: number;
    variant?: 'blue' | 'gradient' | 'colorful' | 'dark' | 'light' | 'auto';
    isDarkMode?: boolean;
    isAnimated?: boolean;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
}

const AnimatedRect = Animated.createAnimatedComponent(Rect);

export const ChatGPTVoiceButton: React.FC<ChatGPTVoiceButtonProps> = ({
    onPress,
    size = 40,
    variant = 'blue',
    isDarkMode = true,
    isAnimated = true,
    disabled = false,
    style,
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // Pulse ring scale & opacity for background gradient animation
    const pulseScale = useRef(new Animated.Value(1)).current;
    const pulseOpacity = useRef(new Animated.Value(0.4)).current;

    // Individual soundwave bar animated values
    const bar1Y = useRef(new Animated.Value(7)).current;
    const bar1H = useRef(new Animated.Value(10)).current;

    const bar2Y = useRef(new Animated.Value(3.5)).current;
    const bar2H = useRef(new Animated.Value(17)).current;

    const bar3Y = useRef(new Animated.Value(8)).current;
    const bar3H = useRef(new Animated.Value(8)).current;

    const bar4Y = useRef(new Animated.Value(5)).current;
    const bar4H = useRef(new Animated.Value(14)).current;

    const animLoopRef = useRef<Animated.CompositeAnimation | null>(null);

    useEffect(() => {
        if (isAnimated) {
            // Pulse ring animation
            const pulseAnim = Animated.loop(
                Animated.sequence([
                    Animated.parallel([
                        Animated.timing(pulseScale, { toValue: 1.15, duration: 1200, useNativeDriver: true }),
                        Animated.timing(pulseOpacity, { toValue: 0, duration: 1200, useNativeDriver: true }),
                    ]),
                    Animated.parallel([
                        Animated.timing(pulseScale, { toValue: 1, duration: 0, useNativeDriver: true }),
                        Animated.timing(pulseOpacity, { toValue: 0.4, duration: 0, useNativeDriver: true }),
                    ]),
                ])
            );
            pulseAnim.start();

            // Fluid organic soundwave bar animation
            const createBarLoop = (
                yVal: Animated.Value,
                hVal: Animated.Value,
                ySeq: number[],
                hSeq: number[],
                dur: number
            ) => {
                const steps: Animated.CompositeAnimation[] = [];
                for (let i = 0; i < ySeq.length; i++) {
                    steps.push(
                        Animated.parallel([
                            Animated.timing(yVal, { toValue: ySeq[i], duration: dur, useNativeDriver: false }),
                            Animated.timing(hVal, { toValue: hSeq[i], duration: dur, useNativeDriver: false }),
                        ])
                    );
                }
                return Animated.loop(Animated.sequence(steps));
            };

            const waveAnim = Animated.parallel([
                createBarLoop(bar1Y, bar1H, [4, 8, 3, 7], [16, 8, 18, 10], 350),
                createBarLoop(bar2Y, bar2H, [2, 6, 1, 3.5], [20, 12, 22, 17], 420),
                createBarLoop(bar3Y, bar3H, [5, 9, 3, 8], [14, 6, 18, 8], 310),
                createBarLoop(bar4Y, bar4H, [3, 7, 2, 5], [18, 10, 20, 14], 380),
            ]);

            animLoopRef.current = waveAnim;
            waveAnim.start();

            return () => {
                pulseAnim.stop();
                waveAnim.stop();
            };
        } else {
            animLoopRef.current?.stop();
            Animated.parallel([
                Animated.timing(bar1Y, { toValue: 7, duration: 200, useNativeDriver: false }),
                Animated.timing(bar1H, { toValue: 10, duration: 200, useNativeDriver: false }),
                Animated.timing(bar2Y, { toValue: 3.5, duration: 200, useNativeDriver: false }),
                Animated.timing(bar2H, { toValue: 17, duration: 200, useNativeDriver: false }),
                Animated.timing(bar3Y, { toValue: 8, duration: 200, useNativeDriver: false }),
                Animated.timing(bar3H, { toValue: 8, duration: 200, useNativeDriver: false }),
                Animated.timing(bar4Y, { toValue: 5, duration: 200, useNativeDriver: false }),
                Animated.timing(bar4H, { toValue: 14, duration: 200, useNativeDriver: false }),
            ]).start();
        }
    }, [isAnimated]);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.92,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 40,
            bounciness: 6,
        }).start();
    };

    const handlePress = () => {
        if (disabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress?.();
    };

    // Color palettes inspired by ChatGPT Voice Mode
    let gradientColors: [string, string, ...string[]] = ['#257BF5', '#3B82F6'];
    let borderColor = 'rgba(255, 255, 255, 0.25)';

    // Bar colors
    let bar1Color = '#FFFFFF';
    let bar2Color = '#FFFFFF';
    let bar3Color = '#FFFFFF';
    let bar4Color = '#FFFFFF';

    if (variant === 'gradient' || variant === 'blue' || variant === 'auto') {
        // Vibrant ChatGPT Voice blue-indigo gradient
        gradientColors = ['#257BF5', '#4F46E5'];
        borderColor = 'rgba(255, 255, 255, 0.3)';
    } else if (variant === 'colorful') {
        // Vibrant multicolor gradient background + colorful soundwave bars
        gradientColors = ['#3B82F6', '#8B5CF6', '#EC4899'];
        borderColor = 'rgba(255, 255, 255, 0.4)';
        bar1Color = '#93C5FD';
        bar2Color = '#FFFFFF';
        bar3Color = '#DDD6FE';
        bar4Color = '#FBCFE8';
    } else if (variant === 'dark') {
        gradientColors = ['#3F3F46', '#27272A'];
        borderColor = 'rgba(255, 255, 255, 0.15)';
    } else if (variant === 'light') {
        gradientColors = ['#F4F4F5', '#E4E4E7'];
        borderColor = 'rgba(0, 0, 0, 0.08)';
        bar1Color = '#18181B';
        bar2Color = '#18181B';
        bar3Color = '#18181B';
        bar4Color = '#18181B';
    }

    const iconSize = size * 0.52;

    return (
        <TouchableWithoutFeedback
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            disabled={disabled}
        >
            <Animated.View
                style={[
                    styles.outerContainer,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        transform: [{ scale: scaleAnim }],
                        opacity: disabled ? 0.5 : 1,
                    },
                    style,
                ]}
            >
                {/* Animated pulse ring for gradient background */}
                {isAnimated && (
                    <Animated.View
                        style={[
                            StyleSheet.absoluteFillObject,
                            {
                                borderRadius: size / 2,
                                backgroundColor: '#257BF5',
                                transform: [{ scale: pulseScale }],
                                opacity: pulseOpacity,
                            },
                        ]}
                    />
                )}

                <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                        styles.buttonContainer,
                        {
                            width: size,
                            height: size,
                            borderRadius: size / 2,
                            borderColor: borderColor,
                            borderWidth: 1.2,
                        },
                    ]}
                >
                    <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
                        {/* Bar 1 */}
                        <AnimatedRect
                            x={3.5}
                            y={bar1Y as any}
                            width={2.8}
                            height={bar1H as any}
                            rx={1.4}
                            fill={bar1Color}
                        />
                        {/* Bar 2 */}
                        <AnimatedRect
                            x={8.8}
                            y={bar2Y as any}
                            width={2.8}
                            height={bar2H as any}
                            rx={1.4}
                            fill={bar2Color}
                        />
                        {/* Bar 3 */}
                        <AnimatedRect
                            x={14.1}
                            y={bar3Y as any}
                            width={2.8}
                            height={bar3H as any}
                            rx={1.4}
                            fill={bar3Color}
                        />
                        {/* Bar 4 */}
                        <AnimatedRect
                            x={19.4}
                            y={bar4Y as any}
                            width={2.8}
                            height={bar4H as any}
                            rx={1.4}
                            fill={bar4Color}
                        />
                    </Svg>
                </LinearGradient>
            </Animated.View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    outerContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
});

export default ChatGPTVoiceButton;
