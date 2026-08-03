import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  type TouchableOpacityProps,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColor } from '@/hooks/use-theme-color';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  haptic?: boolean;
  textStyle?: TextStyle;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  haptic = true,
  style,
  textStyle,
  onPress,
  ...rest
}: ButtonProps) {
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const isDark = useThemeColor({ light: 'no', dark: 'yes' }, 'background') === '#151718'; // Basic check for standard dark bg

  const handlePress = (e: any) => {
    if (disabled || loading) return;
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (onPress) {
      onPress(e);
    }
  };

  // Establish variant styles dynamic on theme colors
  const variantBgStyleMap: Record<ButtonVariant, ViewStyle> = {
    primary: { backgroundColor: tintColor },
    secondary: { backgroundColor: isDark ? '#333' : '#E2E8F0' },
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: tintColor },
    ghost: { backgroundColor: 'transparent' },
  };

  const variantTextStyleMap: Record<ButtonVariant, TextStyle> = {
    primary: { color: '#FFF' },
    secondary: { color: textColor },
    outline: { color: tintColor },
    ghost: { color: tintColor },
  };

  const buttonStyleList = [
    styles.base,
    styles[size],
    variantBgStyleMap[variant],
    (disabled || loading) && styles.disabled,
    style,
  ];

  const textStyleList = [
    styles.textBase,
    styles[`text_${size}`],
    variantTextStyleMap[variant],
    textStyle,
  ];

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      disabled={disabled || loading}
      style={buttonStyleList}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFF' : tintColor} size="small" />
      ) : (
        <Text style={textStyleList}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  sm: {
    height: 36,
    paddingHorizontal: 12,
  },
  md: {
    height: 46,
    paddingHorizontal: 20,
  },
  lg: {
    height: 56,
    paddingHorizontal: 28,
  },
  textBase: {
    fontWeight: '600',
    textAlign: 'center',
  },
  text_sm: { fontSize: 14 },
  text_md: { fontSize: 16 },
  text_lg: { fontSize: 18 },
});
