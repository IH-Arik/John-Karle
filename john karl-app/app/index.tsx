import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';

export default function IndexRedirect() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/onboarding" />;
}
