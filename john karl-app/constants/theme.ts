import { Dimensions } from 'react-native';
import { ms, mvs, s, ScaledSheet, vs } from 'react-native-size-matters';

const { width, height } = Dimensions.get('window');

export const LightTheme = {
  // Brand Colors
  primary: '#97a98b', // Sage green base
  primaryLight: '#b8c6a7',
  primaryAlt: '#8FA181', // Alternative theme derived green
  accentGreen: '#8EA577',

  // Layout Colors
  background: '#F9F8F6',
  backgroundAlt: '#FFFFFF',

  // Text Colors
  textPrimary: '#FFFFFF',
  textDark: '#2D2C39',
  textAccent: '#8EA577',
  textMuted: '#7F7D8D',
  textDescription: '#7F7D8D',

  // Functional Colors
  inputBg: '#E3E1E9',
  tabBgInactive: '#E3E1E9',
  tabBgActive: '#9994B3', // Soft purple

  // UI Extras
  border: '#D4D2DC',
  cardBg: '#EFF2EA',
  btnSecondaryBg: '#EFEFF0',

  // Overlays / Statics
  darkOverlay: 'rgba(0, 0, 0, 0.6)',
  lightOverlay: 'rgba(255, 255, 255, 0.12)',
  white: '#FFFFFF',
  black: '#000000',
};

export const DarkTheme = {
  // Brand Colors (Preserve brand recognition)
  primary: '#97a98b',
  primaryLight: '#b8c6a7',
  primaryAlt: '#97a98b',
  accentGreen: '#b8c6a7',

  // Layout Colors
  background: '#121212', // Deep slate black
  backgroundAlt: '#1C1C1E',

  // Text Colors
  textPrimary: '#FFFFFF',
  textDark: '#ECECF1', // High contrast white/grey
  textAccent: '#b8c6a7',
  textMuted: '#8E8E93',
  textDescription: '#A1A1AA',

  // Functional Colors
  inputBg: '#242426',
  tabBgInactive: '#242426',
  tabBgActive: '#8FA181', // Transition to active brand color in dark mode

  // UI Extras
  border: '#38383A',
  cardBg: '#1C1C1E',
  btnSecondaryBg: '#2C2C2E',

  // Overlays / Statics
  darkOverlay: 'rgba(0, 0, 0, 0.85)',
  lightOverlay: 'rgba(255, 255, 255, 0.08)',
  white: '#FFFFFF',
  black: '#000000',
};

export type AppTheme = typeof LightTheme;

// Temporary back-compatibility mapping so imports don't immediately crash
export const COLORS = LightTheme;

export const FONTS = {
  serif: 'PlayfairDisplay',
  serifSemiBold: 'PlayfairDisplay-SemiBold',
  sans: 'Inter',
  sansSemiBold: 'Inter-SemiBold',
};

export const SIZES = {
  width,
  height,
  radiusSmall: ms(8),
  radiusMedium: ms(12),
  radiusLarge: ms(16),
  radiusXLarge: ms(30),
  padding: ms(24),
};

export const Scaling = {
  s,   // scale
  vs,  // verticalScale
  ms,  // moderateScale
  mvs, // moderateVerticalScale
};

export { ScaledSheet };

// --- Compatibility Exports for Expo Template Boilerplate ---
const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

const theme = {
  COLORS,
  FONTS,
  SIZES,
  Scaling,
  ScaledSheet,
  Colors,
};

export default theme;
