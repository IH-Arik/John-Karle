import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  withSequence,
  runOnJS,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');

interface AnimatedSplashScreenProps {
  onComplete: () => void;
  isAppReady: boolean;
}

export function AnimatedSplashScreen({ onComplete, isAppReady }: AnimatedSplashScreenProps) {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isIntroComplete, setIsIntroComplete] = useState(false);
  
  // Animation values
  const logoScale = useSharedValue(0); // Start from 0 for popup effect
  const logoOpacity = useSharedValue(0);
  const nameOpacity = useSharedValue(0);
  const nameTranslateY = useSharedValue(20);
  const containerOpacity = useSharedValue(1);
  const breath = useSharedValue(1);

  // Start sequence on mount
  useEffect(() => {
    // Wait a couple of seconds before showing the logo
    const introTimeout = setTimeout(() => {
      logoOpacity.value = withTiming(1, { duration: 400 });
      // Pulse popup animation
      logoScale.value = withSpring(1, { damping: 12, stiffness: 100, mass: 1 }, (finished) => {
        if (finished) {
          // Animate the app name in after logo pops up
          nameOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) });
          nameTranslateY.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.back(1.5)) });
          
          breath.value = withRepeat(
            withSequence(
              withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
              withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
          );
        }
      });

      // Allow the app to fade out after the sequence has been shown
      setTimeout(() => {
        setIsIntroComplete(true);
      }, 800 + 800 + 1500); // logo pop + name fade + display time

    }, 2000); // 2 second plain background delay

    return () => clearTimeout(introTimeout);
  }, []);

  // Handle app ready -> fade out
  useEffect(() => {
    if (isAppReady && isIntroComplete && !isFadingOut) {
      setIsFadingOut(true);
      containerOpacity.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) }, (finished) => {
        if (finished) {
          runOnJS(onComplete)();
        }
      });
    }
  }, [isAppReady, isIntroComplete, isFadingOut]);

  // Interactive Tap Gesture
  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      if (!isIntroComplete) return; // Don't allow tap during intro
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

  const nameAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: nameOpacity.value,
      transform: [
        { translateY: nameTranslateY.value },
      ],
    };
  });

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: containerOpacity.value,
      // Slightly scale up the entire container as it fades out for a dramatic exit
      transform: [
        { scale: interpolate(containerOpacity.value, [1, 0], [1, 1.1]) }
      ]
    };
  });

  return (
    <Animated.View style={[styles.container, containerStyle]} pointerEvents={isFadingOut ? 'none' : 'auto'}>
      <GestureDetector gesture={tapGesture}>
        <View style={styles.contentContainer}>
          <Animated.Image
            source={require('@/assets/images/splash-logo.png')}
            style={[styles.image, animatedStyle]}
            resizeMode="contain"
          />
          <Animated.Text style={[styles.appName, nameAnimatedStyle]}>
            LineageAI
          </Animated.Text>
        </View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff', // Must match app.json splash backgroundColor
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: width * 0.4,
    height: width * 0.4,
    marginBottom: 24,
  },
  appName: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 32,
    color: '#2A302A',
    letterSpacing: 1.5,
  }
});
