import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface AnimatedSplashScreenProps {
  onComplete: () => void;
  isAppReady: boolean;
}

export function AnimatedSplashScreen({ onComplete, isAppReady }: AnimatedSplashScreenProps) {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isIntroComplete, setIsIntroComplete] = useState(false);

  // Animation values
  const logoScale = useSharedValue(0.4);
  const logoOpacity = useSharedValue(0);
  const containerOpacity = useSharedValue(1);
  const breath = useSharedValue(1);

  // Start sequence on mount
  useEffect(() => {
    // Animate logo in immediately
    logoOpacity.value = withTiming(1, { duration: 350 });
    logoScale.value = withSpring(1, { damping: 12, stiffness: 100, mass: 1 }, (finished) => {
      if (finished) {
        breath.value = withRepeat(
          withSequence(
            withTiming(1.04, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
      }
    });

    // Mark intro complete after 1.5s
    const timer = setTimeout(() => {
      setIsIntroComplete(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Handle app ready -> fade out
  useEffect(() => {
    if (isAppReady && isIntroComplete && !isFadingOut) {
      setIsFadingOut(true);
      containerOpacity.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) }, (finished) => {
        if (finished) {
          runOnJS(onComplete)();
        }
      });
    }
  }, [isAppReady, isIntroComplete, isFadingOut]);

  // Interactive Tap Gesture
  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      if (!isIntroComplete) return;
      logoScale.value = withSpring(0.9, { damping: 10, stiffness: 200 });
    })
    .onFinalize(() => {
      if (!isIntroComplete) return;
      logoScale.value = withSpring(1, { damping: 10, stiffness: 100 });
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: logoOpacity.value,
      transform: [
        { scale: logoScale.value * breath.value },
      ],
    };
  });

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: containerOpacity.value,
      transform: [
        { scale: interpolate(containerOpacity.value, [1, 0], [1, 1.05]) }
      ]
    };
  });

  return (
    <Animated.View style={[styles.container, containerStyle]} pointerEvents={isFadingOut ? 'none' : 'auto'}>
      <GestureDetector gesture={tapGesture}>
        <View style={styles.contentContainer}>
          <Animated.Image
            source={require('@/assets/images/logo.png')}
            style={[styles.image, animatedStyle]}
            resizeMode="contain"
          />
        </View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F0F0F',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: width * 0.65,
    height: width * 0.65,
  },
});
