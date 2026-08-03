import { User } from '@/types/auth';

/**
 * Resolves the avatar image source for a user.
 * If the user has a profile picture (either as relative or absolute URL), it will resolve it properly.
 * Otherwise, it falls back to the default asset placeholder image.
 */
export const getAvatarSource = (user: User | null | undefined) => {
  const url = user?.profilePicture?.url || user?.avatarUrl;
  if (!url) {
    return require('@/assets/images/dashboard/avatar.png');
  }

  if (
    url.startsWith('http') ||
    url.startsWith('file') ||
    url.startsWith('content') ||
    url.startsWith('data:')
  ) {
    return { uri: url };
  }

  // Relative path. Resolve against base URL without /api/v1
  const baseUrl = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
  const relativePath = url.startsWith('/') ? url : `/${url}`;
  return { uri: `${baseUrl}${relativePath}` };
};

/**
 * Resolves a relative or absolute media URL from the backend to an absolute URL string.
 */
export const resolveMediaUrl = (url: string | null | undefined): string | undefined => {
  if (!url) return undefined;
  if (
    url.startsWith('http') ||
    url.startsWith('file') ||
    url.startsWith('content') ||
    url.startsWith('data:')
  ) {
    return url;
  }
  const baseUrl = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
  const relativePath = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl}${relativePath}`;
};
