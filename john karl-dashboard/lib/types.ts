export type UserRole = "user" | "admin" | "super_admin";

export type FamilyMemberRole = "viewer" | "editor" | "owner";
export type FamilyMemberStatus = "pending" | "accepted";

export type FamilyMember = {
  userId?: string;
  name: string;
  email: string;
  relation: string;
  role: FamilyMemberRole;
  status: FamilyMemberStatus;
};

export type UserPreferences = {
  notifications: boolean;
  aiInsight: boolean;
  darkMode: boolean;
  anonymousAnalytics: boolean;
};

export type UserProfilePicture = {
  key: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
};

export type PublicUser = {
  id: string;
  name: string;
  phoneNumber?: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  address?: string;
  profilePicture?: UserProfilePicture;
  familyMembers: FamilyMember[];
  preferences: UserPreferences;
  legacyAccessEnabled: boolean;
  lastActiveAt?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: string;
};

export type AuthResponse = {
  user: PublicUser;
  tokens: AuthTokens;
};

export type AdminDashboardMetrics = {
  totalUsers: number;
  totalActiveProfiles: number;
};

export type AdminRecentActivity = {
  id: string;
  type: string;
  message: string;
  actor?: {
    id: string;
    name?: string;
    email?: string;
    role?: UserRole | string;
  };
  target?: {
    type?: string;
    id?: string;
    label?: string;
  };
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type AdminRecentActivitiesResponse = {
  activities: AdminRecentActivity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
};

export type AdminUsersResponse = {
  users: PublicUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AdminEmailTemplate = {
  id: string;
  templateName: string;
  subjectLine: string;
  content: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminEmailTemplatesResponse = {
  templates: AdminEmailTemplate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
};

export type AdminSettings = {
  termsAndConditions?: string;
  privacyPolicy?: string;
  aboutUs?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type TrustedContactStatus = "pending" | "accepted" | "declined" | "removed";

export type TrustedContactAccessScope = {
  profile: boolean;
  documents: boolean;
  notes: boolean;
  messages: boolean;
  paymentInfo: boolean;
  accountTransfer: boolean;
};

export type TrustedContact = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: TrustedContactStatus;
  inactivityDays: number;
  accessScope: TrustedContactAccessScope;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type LegacyAccessRequestStatus =
  | "waiting_period"
  | "approved"
  | "cancelled"
  | "expired";

export type LegacyAccessRequest = {
  id: string;
  userId: string;
  trustedContactId: string;
  trustedContact: Pick<
    TrustedContact,
    "id" | "name" | "email" | "status" | "accessScope"
  >;
  status: LegacyAccessRequestStatus;
  triggeredAt: string;
  unlockAt: string;
  expiresAt: string;
  cancelledAt?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type MemoryVaultType = "photo" | "video" | "journal" | "voice";

export type MemoryVaultFile = {
  key: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
};

export type MemoryVaultItem = {
  id: string;
  type: MemoryVaultType;
  whoseMemoryIsThis: string;
  files: MemoryVaultFile[];
  title: string;
  narrative: string;
  date: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type ApiErrorShape = {
  code?: string;
  message?: string;
  details?: unknown;
};

export type NotificationType = "system" | "admin_broadcast" | string;
export type NotificationPriority = "low" | "normal" | "high" | string;

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  priority: NotificationPriority;
  createdAt: string;
  updatedAt: string;
};

export type NotificationsResponse = {
  notifications: AppNotification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ReportFeedbackType = "problem" | "feedback" | "bug" | string;
export type ReportFeedbackCategory = "technical" | "billing" | "content" | "other" | string;
export type ReportFeedbackPriority = "low" | "medium" | "high" | string;
export type ReportFeedbackStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "closed"
  | string;

export type ReportFeedback = {
  id: string;
  userId: string;
  type: ReportFeedbackType;
  category: ReportFeedbackCategory;
  subject: string;
  message: string;
  priority: ReportFeedbackPriority;
  status: ReportFeedbackStatus;
  attachments?: Array<{
    key?: string;
    url?: string;
    originalName?: string;
    mimeType?: string;
    size?: number;
  }>;
  replies?: Array<{
    id?: string;
    senderRole?: "user" | "admin" | "super_admin" | string;
    message: string;
    createdAt?: string;
  }>;
  user?: Pick<PublicUser, "id" | "name" | "email">;
  createdAt: string;
  updatedAt: string;
};

export type ReportFeedbackListResponse = {
  reports: ReportFeedback[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
