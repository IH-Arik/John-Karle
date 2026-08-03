import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  type TextInputProps,
} from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  description?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
}

export function Input({
  label,
  error,
  description,
  containerStyle,
  labelStyle,
  inputStyle,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const isDark = useThemeColor({ light: 'no', dark: 'yes' }, 'background') === '#151718';

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  // Theme-specific colors
  const activeBorderColor = error ? '#EF4444' : tintColor;
  const inactiveBorderColor = error
    ? '#EF4444'
    : isDark
    ? '#3F3F46'
    : '#D1D5DB';
  const inputBgColor = isDark ? '#1F1F23' : '#F9FAFB';

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: textColor }, labelStyle]}>{label}</Text>
      )}
      
      <View
        style={[
          styles.inputWrapper,
          {
            borderColor: isFocused ? activeBorderColor : inactiveBorderColor,
            backgroundColor: inputBgColor,
            borderWidth: isFocused ? 1.5 : 1,
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: textColor }, inputStyle]}
          placeholderTextColor={isDark ? '#71717A' : '#9CA3AF'}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />
      </View>

      {description && !error && (
        <Text style={styles.description}>{description}</Text>
      )}

      {error && (
        <Text style={styles.error}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  inputWrapper: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  description: {
    fontSize: 12,
    color: '#71717A',
    marginTop: 4,
  },
  error: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    fontWeight: '500',
  },
});
export default Input;
