import { styles, COLORS } from '@/constants/onboarding';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { 
  FadeIn, 
  FadeOut, 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming,
  SharedValue
} from 'react-native-reanimated';
import { ms, s } from 'react-native-size-matters';

const SLIDES = [
  {
    id: 0,
    image: require('@/assets/images/onboarding/onboarding_1.png'),
  },
  {
    id: 1,
    image: require('@/assets/images/onboarding/onboarding_2.png'),
  },
  {
    id: 2,
    image: require('@/assets/images/onboarding/onboarding_3.png'),
  },
];

// Specialized Animated Dot Component
const AnimatedDot = ({ index, activeIndex }: { index: number, activeIndex: SharedValue<number> }) => {
  const activeWidth = s(24);
  const inactiveWidth = s(8);

  const animatedStyle = useAnimatedStyle(() => {
    const isActive = activeIndex.value === index;
    return {
      width: withSpring(isActive ? activeWidth : inactiveWidth, { damping: 15 }),
      opacity: withTiming(isActive ? 1 : 0.4, { duration: 300 }),
      backgroundColor: withTiming(isActive ? COLORS.primary : '#FFFFFF', { duration: 300 }),
    };
  });

  return <Animated.View style={[styles.dot, animatedStyle]} />;
};

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const activeIndexValue = useSharedValue(0);

  const handleNext = () => {
    if (currentSlide < 2) {
      const next = currentSlide + 1;
      setCurrentSlide(next);
      activeIndexValue.value = next;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/auth');
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/auth');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Animate current slide context with fading transitions */}
      <Animated.View 
        key={`slide-${currentSlide}`} 
        entering={FadeIn.duration(400)} 
        exiting={FadeOut.duration(300)} 
        style={StyleSheet.absoluteFill}
      >
        <ImageBackground 
          source={SLIDES[currentSlide].image} 
          style={styles.slideImage} 
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)']}
            style={StyleSheet.absoluteFill}
          />
          
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.topControls}>
              {currentSlide > 0 && (
                <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
                  <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.content}>
              {/* Slide 1 Content */}
              {currentSlide === 0 && (
                <>
                  <View>
                    <Image
                      source={require('@/assets/images/onboarding/lineage_container.svg')}
                      style={{ width: ms(110), height: ms(110) }}
                      contentFit="contain"
                    />
                  </View>
                  <Text style={[styles.title, { color: '#FFFFFF' }]}>
                    Every story{"\n"}deserves to{"\n"}live forever.
                  </Text>
                  <Text style={styles.description}>
                    Lineage AI helps you preserve the voices, memories, and wisdom of the people you love — so nothing is ever truly lost.
                  </Text>
                </>
              )}

              {/* Slide 2 Content */}
              {currentSlide === 1 && (
                <>
                  <View style={styles.iconBox}>
                    <Feather name="shield" size={ms(28)} color={COLORS.primary} />
                  </View>
                  <Text style={[styles.title, { color: COLORS.textAccent }]}>
                    Trusted with{"\n"}what matters most.
                  </Text>
                  <Text style={styles.description}>
                    Your memories are encrypted, private by default, and never used to train AI models. You control everything — who sees what, and for how long.
                  </Text>
                  <View style={styles.listContainer}>
                    <View style={styles.listItem}>
                      <Ionicons name="radio-button-on" size={ms(18)} color={COLORS.textAccent} style={styles.listIcon} />
                      <Text style={styles.listText}>End-to-end encrypted storage</Text>
                    </View>
                    <View style={styles.listItem}>
                      <Ionicons name="radio-button-on" size={ms(18)} color={COLORS.textAccent} style={styles.listIcon} />
                      <Text style={styles.listText}>AI trained only on your archive</Text>
                    </View>
                    <View style={styles.listItem}>
                      <Ionicons name="radio-button-on" size={ms(18)} color={COLORS.textAccent} style={styles.listIcon} />
                      <Text style={styles.listText}>Full data export at any time</Text>
                    </View>
                  </View>
                </>
              )}

              {/* Slide 3 Content */}
              {currentSlide === 2 && (
                <>
                  <View style={styles.iconBox}>
                    <Ionicons name="sparkles" size={ms(28)} color={COLORS.primary} />
                  </View>
                  <Text style={[styles.title, { color: COLORS.textAccent }]}>
                    An AI that truly{"\n"}knew them.
                  </Text>
                  <Text style={styles.description}>
                    Our AI responds only from the memories, photos, and life events you've preserved — never guessing, always grounded in truth.
                  </Text>
                  <View style={styles.quoteCard}>
                    <Text style={styles.quoteText}>
                      Every answer the AI gives is sourced directly from your archive — with citations you can trace back to the original memory.
                    </Text>
                  </View>
                </>
              )}
            </View>
          </SafeAreaView>
        </ImageBackground>
      </Animated.View>

      {/* Sticky Footer overlying animated background */}
      <SafeAreaView style={styles.footerArea} pointerEvents="box-none">
        <View style={styles.footerContainer}>
          <View style={styles.pagination}>
            {[0, 1, 2].map((i) => (
              <AnimatedDot key={i} index={i} activeIndex={activeIndexValue} />
            ))}
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleNext} activeOpacity={0.8}>
            <Text style={styles.btnText}>{currentSlide === 2 ? 'Get Started' : 'Next'}</Text>
            <Feather name="arrow-right" size={ms(20)} color="#FFF" style={{ marginLeft: ms(4) }} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
