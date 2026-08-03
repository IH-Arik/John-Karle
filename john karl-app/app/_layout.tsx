import 'react-native-gesture-handler';
import {
  Inter_400Regular,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_600SemiBold,
  useFonts,
} from '@expo-google-fonts/playfair-display';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useAuthStore } from '@/store/auth-store';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AnimatedSplashScreen } from '@/components/AnimatedSplashScreen';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const initializeAuth = useAuthStore(state => state.initialize);
  const [isSplashAnimationComplete, setIsSplashAnimationComplete] = useState(false);

  const [loaded, error] = useFonts({
    'PlayfairDisplay': PlayfairDisplay_400Regular,
    'PlayfairDisplay-SemiBold': PlayfairDisplay_600SemiBold,
    'Inter': Inter_400Regular,
    'Inter-SemiBold': Inter_600SemiBold,
  });

  // Initialize session management early
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      // Hide the native splash screen to reveal our custom AnimatedSplashScreen
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
        
        {!isSplashAnimationComplete && (
          <AnimatedSplashScreen 
            isAppReady={loaded} 
            onComplete={() => setIsSplashAnimationComplete(true)} 
          />
        )}
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
