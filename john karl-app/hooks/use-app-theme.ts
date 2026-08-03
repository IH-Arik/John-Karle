import { useColorScheme } from 'react-native';
import { LightTheme, DarkTheme, AppTheme } from '@/constants/theme';

/**
 * Dynamic Hook to determine current Application Color Schema based on OS preference.
 * Usage: const colors = useAppTheme();
 */
export function useAppTheme(): AppTheme {
  const colorScheme = useColorScheme();
  // Explicit Type Cast forces TypeScript language server synchronization
  return (colorScheme === 'dark' ? DarkTheme : LightTheme) as AppTheme;
}

export default useAppTheme;
