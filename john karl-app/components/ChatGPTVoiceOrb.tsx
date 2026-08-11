import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

export type VoiceOrbState = 'starting' | 'listening' | 'thinking' | 'speaking' | 'ended';

export interface ChatGPTVoiceOrbProps {
    callState: VoiceOrbState;
    scaleAnim: Animated.Value;
    size?: number;
}

export const ChatGPTVoiceOrb: React.FC<ChatGPTVoiceOrbProps> = ({
    callState,
    scaleAnim,
    size = 200,
}) => {
    // Rotation animation for inner fluid gradient
    const rotateAnim = useRef(new Animated.Value(0)).current;

    // Outer ripple ring animations
    const ring1Scale = useRef(new Animated.Value(1)).current;
    const ring1Opacity = useRef(new Animated.Value(0.5)).current;

    const ring2Scale = useRef(new Animated.Value(1)).current;
    const ring2Opacity = useRef(new Animated.Value(0.3)).current;

    // Spin speed: ultra-dynamic for speaking mode (1800ms) to reflect word frequency!
    useEffect(() => {
        let duration = 8000;
        if (callState === 'speaking') {
            duration = 1800; // Fast dynamic rotation during speech
        } else if (callState === 'thinking') {
            duration = 3500;
        } else if (callState === 'listening') {
            duration = 6000;
        }

        const spin = Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: duration,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        spin.start();

        return () => spin.stop();
    }, [callState]);

    // Ripple wave animation synced with speech frequency / mic listening
    useEffect(() => {
        if (callState === 'listening' || callState === 'speaking') {
            const isSpeaking = callState === 'speaking';
            const ringDuration = isSpeaking ? 800 : 1600; // Rapid frequency pulses when speaking

            const pulse = (scale: Animated.Value, opacity: Animated.Value, delay: number) => {
                return Animated.loop(
                    Animated.sequence([
                        Animated.delay(delay),
                        Animated.parallel([
                            Animated.timing(scale, {
                                toValue: isSpeaking ? 1.45 : 1.35,
                                duration: ringDuration,
                                easing: Easing.out(Easing.cubic),
                                useNativeDriver: true,
                            }),
                            Animated.timing(opacity, {
                                toValue: 0,
                                duration: ringDuration,
                                easing: Easing.out(Easing.quad),
                                useNativeDriver: true,
                            }),
                        ]),
                        Animated.parallel([
                            Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
                            Animated.timing(opacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
                        ]),
                    ])
                );
            };

            const anim1 = pulse(ring1Scale, ring1Opacity, 0);
            const anim2 = pulse(ring2Scale, ring2Opacity, isSpeaking ? 400 : 800);

            anim1.start();
            anim2.start();

            return () => {
                anim1.stop();
                anim2.stop();
            };
        } else {
            Animated.parallel([
                Animated.timing(ring1Scale, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.timing(ring1Opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
                Animated.timing(ring2Scale, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.timing(ring2Opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
            ]).start();
        }
    }, [callState]);

    const spinInterpolate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const reverseSpinInterpolate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['360deg', '0deg'],
    });

    // Theme gradient colors inspired by ChatGPT Voice Mode
    let gradientColors: [string, string, ...string[]] = ['#BFDBFE', '#3B82F6', '#1D4ED8'];
    let ringColor = '#3B82F6';

    if (callState === 'listening') {
        // Sky Blue & Cloud White ChatGPT Voice Listening state
        gradientColors = ['#E0F2FE', '#38BDF8', '#0284C7'];
        ringColor = '#38BDF8';
    } else if (callState === 'thinking') {
        // Deep Indigo / Purple Swirl Thinking state
        gradientColors = ['#E0E7FF', '#6366F1', '#4338CA'];
        ringColor = '#818CF8';
    } else if (callState === 'speaking') {
        // Vibrant Dynamic Speaking state
        gradientColors = ['#DBEAFE', '#2563EB', '#1D4ED8'];
        ringColor = '#60A5FA';
    } else {
        gradientColors = ['#9CA3AF', '#4B5563', '#1F2937'];
        ringColor = '#6B7280';
    }

    const orbRadius = size / 2;

    return (
        <View style={[styles.container, { width: size * 1.5, height: size * 1.5 }]}>
            {/* Outer Animated Wave Ring 1 */}
            <Animated.View
                style={[
                    styles.waveRing,
                    {
                        width: size,
                        height: size,
                        borderRadius: orbRadius,
                        backgroundColor: ringColor,
                        transform: [{ scale: Animated.multiply(scaleAnim, ring1Scale) }],
                        opacity: ring1Opacity,
                    },
                ]}
            />

            {/* Outer Animated Wave Ring 2 */}
            <Animated.View
                style={[
                    styles.waveRing,
                    {
                        width: size,
                        height: size,
                        borderRadius: orbRadius,
                        backgroundColor: ringColor,
                        transform: [{ scale: Animated.multiply(scaleAnim, ring2Scale) }],
                        opacity: ring2Opacity,
                    },
                ]}
            />

            {/* Main Fluid Voice Orb */}
            <Animated.View
                style={[
                    styles.mainOrbWrapper,
                    {
                        width: size,
                        height: size,
                        borderRadius: orbRadius,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                {/* Base Gradient Layer */}
                <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0.1, y: 0.1 }}
                    end={{ x: 0.9, y: 0.9 }}
                    style={[styles.gradientLayer, { borderRadius: orbRadius }]}
                >
                    {/* Rotating Fluid Cloud Texture 1 */}
                    <Animated.View
                        style={[
                            styles.fluidHighlight,
                            {
                                width: size * 0.85,
                                height: size * 0.85,
                                borderRadius: (size * 0.85) / 2,
                                transform: [{ rotate: spinInterpolate }],
                            },
                        ]}
                    >
                        <LinearGradient
                            colors={['rgba(255, 255, 255, 0.75)', 'rgba(255, 255, 255, 0)']}
                            start={{ x: 0.2, y: 0.2 }}
                            end={{ x: 0.8, y: 0.8 }}
                            style={{ flex: 1, borderRadius: (size * 0.85) / 2 }}
                        />
                    </Animated.View>

                    {/* Counter-Rotating Soft Fluid Glow Texture 2 */}
                    <Animated.View
                        style={[
                            styles.fluidHighlightSubtle,
                            {
                                width: size * 0.7,
                                height: size * 0.7,
                                borderRadius: (size * 0.7) / 2,
                                transform: [{ rotate: reverseSpinInterpolate }],
                            },
                        ]}
                    >
                        <LinearGradient
                            colors={['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0)']}
                            start={{ x: 0.8, y: 0.1 }}
                            end={{ x: 0.2, y: 0.9 }}
                            style={{ flex: 1, borderRadius: (size * 0.7) / 2 }}
                        />
                    </Animated.View>
                </LinearGradient>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    waveRing: {
        position: 'absolute',
    },
    mainOrbWrapper: {
        overflow: 'hidden',
        shadowColor: '#38BDF8',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 16,
        elevation: 10,
    },
    gradientLayer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fluidHighlight: {
        position: 'absolute',
        top: 5,
        left: 5,
    },
    fluidHighlightSubtle: {
        position: 'absolute',
        bottom: 10,
        right: 10,
    },
});

export default ChatGPTVoiceOrb;
