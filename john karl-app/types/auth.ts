/**
 * Representation of a User profile in the application.
 */
export interface User {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isEmailVerified?: boolean;
  avatarUrl?: string;
  phoneNumber?: string;
  address?: string;
  profilePicture?: {
    key: string;
    url: string;
    originalName: string;
    mimeType: string;
    size: number;
  };
  familyMembers?: {
    userId: string;
    name: string;
    email: string;
    relation: string;
    role: string;
    status: string;
  }[];
  preferences?: {
    notifications: boolean;
    aiInsight: boolean;
    darkMode: boolean;
    anonymousAnalytics: boolean;
  };
  legacyAccessEnabled?: boolean;
  lastActiveAt?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Representation of a user session token set.
 */
export interface Session {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number; // Epoch timestamp
}

/**
 * Authentication state of the application.
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
}
