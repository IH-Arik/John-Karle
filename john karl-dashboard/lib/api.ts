"use client";

import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";
import {
  clearStoredTokens,
  clearStoredUser,
  getStoredTokens,
  setStoredTokens,
  setStoredUser,
} from "./auth-storage";
import { clearSession } from "./auth-slice";
import type {
  AdminDashboardMetrics,
  AdminEmailTemplate,
  AdminEmailTemplatesResponse,
  AdminRecentActivity,
  AdminRecentActivitiesResponse,
  ReportFeedback,
  ReportFeedbackListResponse,
  AdminSettings,
  AdminUsersResponse,
  AppNotification,
  ApiErrorShape,
  AuthResponse,
  NotificationsResponse,
  PublicUser,
} from "./types";

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

type ApiPaginatedEnvelope<T> = {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
};

const unwrapEnvelope = <T>(response: ApiEnvelope<T>) => response.data;

const baseUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "https://johnkarle-backend.onrender.com/api/v1";

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  timeout: 8000,
  prepareHeaders: (headers) => {
    const tokens = getStoredTokens();

    if (tokens?.accessToken) {
      headers.set("authorization", `Bearer ${tokens.accessToken}`);
    }

    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status !== 401) {
    return result;
  }

  const tokens = getStoredTokens();

  if (!tokens?.refreshToken) {
    clearStoredTokens();
    clearStoredUser();
    api.dispatch(clearSession());
    return result;
  }

  const refreshResult = await rawBaseQuery(
    {
      url: "/auth/refresh",
      method: "POST",
      body: { refreshToken: tokens.refreshToken },
    },
    api,
    extraOptions,
  );

  if (!refreshResult.data) {
    clearStoredTokens();
    clearStoredUser();
    api.dispatch(clearSession());
    return result;
  }

  const refreshData = (refreshResult.data as ApiEnvelope<AuthResponse>).data;
  setStoredTokens({
    accessToken: refreshData.tokens.accessToken,
    refreshToken: refreshData.tokens.refreshToken,
  });
  setStoredUser(refreshData.user);

  return rawBaseQuery(args, api, extraOptions);
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Auth",
    "AdminMetrics",
    "AdminRecentActivities",
    "AdminUsers",
    "AdminEmailTemplates",
    "AdminProfile",
    "AdminSettings",
    "ReportFeedback",
    "Notifications",
    "NotificationCount",
  ],
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, { email: string; password: string }>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
      transformResponse: unwrapEnvelope,
    }),
    me: builder.query<{ user: PublicUser }, void>({
      query: () => "/auth/me",
      transformResponse: (response: ApiEnvelope<PublicUser>) => ({
        user: response.data,
      }),
      providesTags: ["Auth"],
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["Auth"],
    }),
    requestPasswordResetCode: builder.mutation<{ message: string }, { email: string }>({
      query: (body) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body,
      }),
      transformResponse: unwrapEnvelope,
    }),
    verifyPasswordResetCode: builder.mutation<
      { message: string; resetToken: string },
      { email: string; code: string }
    >({
      query: (body) => ({
        url: "/auth/forgot-password/verify-code",
        method: "POST",
        body,
      }),
      transformResponse: unwrapEnvelope,
    }),
    resetPassword: builder.mutation<
      { message: string },
      { email: string; resetToken: string; password: string; confirmPassword: string }
    >({
      query: (body) => ({
        url: "/auth/forgot-password/reset",
        method: "POST",
        body,
      }),
      transformResponse: unwrapEnvelope,
    }),
    getDashboardMetrics: builder.query<AdminDashboardMetrics, void>({
      query: () => "/admin/dashboard/metrics",
      transformResponse: unwrapEnvelope,
      providesTags: ["AdminMetrics"],
    }),
    getDashboardRecentActivities: builder.query<
      AdminRecentActivitiesResponse,
      {
        page?: number;
        limit?: number;
        type?: string;
        actorId?: string;
        targetType?: string;
        targetId?: string;
        from?: string;
        to?: string;
        search?: string;
      }
    >({
      query: ({ page = 1, limit = 20, type, actorId, targetType, targetId, from, to, search }) => ({
        url: "/admin/dashboard/recent-activities",
        params: {
          page,
          limit,
          ...(type ? { type } : {}),
          ...(actorId ? { actorId } : {}),
          ...(targetType ? { targetType } : {}),
          ...(targetId ? { targetId } : {}),
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
          ...(search ? { search } : {}),
        },
      }),
      transformResponse: (response: ApiPaginatedEnvelope<AdminRecentActivity>) => ({
        activities: response.data,
        pagination: response.meta,
      }),
      providesTags: ["AdminRecentActivities"],
    }),
    getAdminUsers: builder.query<
      AdminUsersResponse,
      { page?: number; limit?: number; search?: string; role?: PublicUser["role"] }
    >({
      query: ({ page = 1, limit = 20, search, role }) => ({
        url: "/admin/users",
        params: {
          page,
          limit,
          ...(search ? { search } : {}),
          ...(role ? { role } : {}),
        },
      }),
      transformResponse: (response: ApiPaginatedEnvelope<PublicUser>) => ({
        users: response.data,
        pagination: response.meta,
      }),
      providesTags: ["AdminUsers"],
    }),
    getAdminUserById: builder.query<{ user: PublicUser }, string>({
      query: (userId) => `/admin/users/${userId}`,
      transformResponse: (response: ApiEnvelope<PublicUser>) => ({
        user: response.data,
      }),
      providesTags: (_result, _error, userId) => [{ type: "AdminUsers", id: userId }],
    }),
    createAdmin: builder.mutation<
      { user: PublicUser },
      {
        name: string;
        email: string;
        password: string;
        phone?: string;
        address?: string;
        profileImage?: string;
      }
    >({
      query: (body) => ({
        url: "/admin/admins",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<PublicUser>) => ({
        user: response.data,
      }),
      invalidatesTags: ["AdminUsers"],
    }),
    createAdminEmailTemplate: builder.mutation<
      { template: AdminEmailTemplate },
      { templateName: string; subjectLine: string; content: string }
    >({
      query: (body) => ({
        url: "/admin/email-templates",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<AdminEmailTemplate>) => ({
        template: response.data,
      }),
      invalidatesTags: ["AdminEmailTemplates"],
    }),
    getAdminEmailTemplates: builder.query<
      AdminEmailTemplatesResponse,
      { page?: number; limit?: number; search?: string }
    >({
      query: ({ page = 1, limit = 20, search }) => ({
        url: "/admin/email-templates",
        params: {
          page,
          limit,
          ...(search ? { search } : {}),
        },
      }),
      transformResponse: (response: ApiPaginatedEnvelope<AdminEmailTemplate>) => ({
        templates: response.data,
        pagination: response.meta,
      }),
      providesTags: (result) => [
        "AdminEmailTemplates",
        ...(result?.templates.map((template) => ({
          type: "AdminEmailTemplates" as const,
          id: template.id,
        })) ?? []),
      ],
    }),
    getAdminEmailTemplateById: builder.query<{ template: AdminEmailTemplate }, string>({
      query: (templateId) => `/admin/email-templates/${templateId}`,
      transformResponse: (response: ApiEnvelope<AdminEmailTemplate>) => ({
        template: response.data,
      }),
      providesTags: (_result, _error, templateId) => [
        { type: "AdminEmailTemplates", id: templateId },
      ],
    }),
    updateAdminEmailTemplate: builder.mutation<
      { template: AdminEmailTemplate },
      {
        templateId: string;
        templateName?: string;
        subjectLine?: string;
        content?: string;
      }
    >({
      query: ({ templateId, ...body }) => ({
        url: `/admin/email-templates/${templateId}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (response: ApiEnvelope<AdminEmailTemplate>) => ({
        template: response.data,
      }),
      invalidatesTags: (_result, _error, { templateId }) => [
        "AdminEmailTemplates",
        { type: "AdminEmailTemplates", id: templateId },
      ],
    }),
    deleteAdminEmailTemplate: builder.mutation<{ message: string }, string>({
      query: (templateId) => ({
        url: `/admin/email-templates/${templateId}`,
        method: "DELETE",
      }),
      transformResponse: (response: { success: boolean; message: string }) => ({
        message: response.message,
      }),
      invalidatesTags: (_result, _error, templateId) => [
        "AdminEmailTemplates",
        { type: "AdminEmailTemplates", id: templateId },
      ],
    }),
    sendBulkEmail: builder.mutation<
      { requestedCount: number; sentCount: number },
      { userIds: string[]; subject: string; message: string }
    >({
      query: (body) => ({
        url: "/admin/bulk-email",
        method: "POST",
        body,
      }),
      transformResponse: unwrapEnvelope,
    }),
    getAdminProfile: builder.query<{ user: PublicUser }, void>({
      query: () => "/admin/profile",
      transformResponse: (response: ApiEnvelope<PublicUser>) => ({
        user: response.data,
      }),
      providesTags: ["AdminProfile"],
    }),
    updateAdminProfile: builder.mutation<{ user: PublicUser }, FormData>({
      query: (body) => ({
        url: "/admin/profile",
        method: "PATCH",
        body,
      }),
      transformResponse: (response: ApiEnvelope<PublicUser>) => ({
        user: response.data,
      }),
      invalidatesTags: ["AdminProfile"],
    }),
    updateAdminPassword: builder.mutation<
      { message: string },
      { currentPassword: string; newPassword: string }
    >({
      query: (body) => ({
        url: "/admin/profile/password",
        method: "PATCH",
        body,
      }),
      transformResponse: unwrapEnvelope,
    }),
    getAdminSettings: builder.query<{ settings: AdminSettings }, void>({
      query: () => "/admin/settings",
      transformResponse: (response: ApiEnvelope<AdminSettings>) => ({
        settings: response.data,
      }),
      providesTags: ["AdminSettings"],
    }),
    updateAdminSettings: builder.mutation<
      { settings: AdminSettings },
      Partial<Pick<AdminSettings, "termsAndConditions" | "privacyPolicy" | "aboutUs">>
    >({
      query: (body) => ({
        url: "/admin/settings",
        method: "PATCH",
        body,
      }),
      transformResponse: (response: ApiEnvelope<AdminSettings>) => ({
        settings: response.data,
      }),
      invalidatesTags: ["AdminSettings"],
    }),
    getAdminReportFeedback: builder.query<
      ReportFeedbackListResponse,
      {
        page?: number;
        limit?: number;
        status?: string;
        type?: string;
        priority?: string;
        userId?: string;
        search?: string;
      }
    >({
      query: ({ page = 1, limit = 20, status, type, priority, userId, search }) => ({
        url: "/admin/report-feedback",
        params: {
          page,
          limit,
          ...(status ? { status } : {}),
          ...(type ? { type } : {}),
          ...(priority ? { priority } : {}),
          ...(userId ? { userId } : {}),
          ...(search ? { search } : {}),
        },
      }),
      transformResponse: (response: ApiPaginatedEnvelope<ReportFeedback>) => ({
        reports: response.data,
        pagination: response.meta,
      }),
      providesTags: ["ReportFeedback"],
    }),
    getAdminReportFeedbackById: builder.query<{ report: ReportFeedback }, string>({
      query: (reportId) => `/admin/report-feedback/${reportId}`,
      transformResponse: (response: ApiEnvelope<ReportFeedback>) => ({
        report: response.data,
      }),
      providesTags: (_result, _error, reportId) => [{ type: "ReportFeedback", id: reportId }],
    }),
    updateAdminReportFeedbackStatus: builder.mutation<
      { report: ReportFeedback },
      { reportId: string; status: string }
    >({
      query: ({ reportId, status }) => ({
        url: `/admin/report-feedback/${reportId}/status`,
        method: "PATCH",
        body: { status },
      }),
      transformResponse: (response: ApiEnvelope<ReportFeedback>) => ({
        report: response.data,
      }),
      invalidatesTags: (_result, _error, { reportId }) => [
        "ReportFeedback",
        { type: "ReportFeedback", id: reportId },
      ],
    }),
    getNotifications: builder.query<
      NotificationsResponse,
      {
        page?: number;
        limit?: number;
        isRead?: boolean;
        type?: string;
        priority?: string;
      }
    >({
      query: ({ page = 1, limit = 20, isRead, type, priority }) => ({
        url: "/notifications",
        params: {
          page,
          limit,
          ...(typeof isRead === "boolean" ? { isRead } : {}),
          ...(type ? { type } : {}),
          ...(priority ? { priority } : {}),
        },
      }),
      transformResponse: (response: ApiPaginatedEnvelope<AppNotification>) => ({
        notifications: response.data,
        pagination: response.meta,
      }),
      providesTags: (result) => [
        "Notifications",
        "NotificationCount",
        ...(result?.notifications.map((notification) => ({
          type: "Notifications" as const,
          id: notification.id,
        })) ?? []),
      ],
    }),
    getUnreadNotificationCount: builder.query<{ count: number }, void>({
      query: () => "/notifications/unread-count",
      transformResponse: unwrapEnvelope,
      providesTags: ["NotificationCount"],
    }),
    markNotificationRead: builder.mutation<AppNotification, string>({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}/read`,
        method: "PATCH",
      }),
      transformResponse: unwrapEnvelope,
      invalidatesTags: (_result, _error, notificationId) => [
        { type: "Notifications", id: notificationId },
        "Notifications",
        "NotificationCount",
      ],
    }),
    markAllNotificationsRead: builder.mutation<{ updatedCount: number }, void>({
      query: () => ({
        url: "/notifications/read-all",
        method: "PATCH",
      }),
      transformResponse: (response: ApiEnvelope<{ modifiedCount?: number; updatedCount?: number }>) => ({
        updatedCount: response.data.updatedCount ?? response.data.modifiedCount ?? 0,
      }),
      invalidatesTags: ["Notifications", "NotificationCount"],
    }),
    deleteNotification: builder.mutation<void, string>({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, notificationId) => [
        { type: "Notifications", id: notificationId },
        "Notifications",
        "NotificationCount",
      ],
    }),
  }),
});

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong.") {
  const apiError = error as { data?: { error?: ApiErrorShape } };

  return apiError?.data?.error?.message ?? fallback;
}

export const {
  useLoginMutation,
  useMeQuery,
  useLogoutMutation,
  useRequestPasswordResetCodeMutation,
  useVerifyPasswordResetCodeMutation,
  useResetPasswordMutation,
  useGetDashboardMetricsQuery,
  useGetDashboardRecentActivitiesQuery,
  useGetAdminUsersQuery,
  useGetAdminUserByIdQuery,
  useCreateAdminMutation,
  useCreateAdminEmailTemplateMutation,
  useGetAdminEmailTemplatesQuery,
  useGetAdminEmailTemplateByIdQuery,
  useUpdateAdminEmailTemplateMutation,
  useDeleteAdminEmailTemplateMutation,
  useSendBulkEmailMutation,
  useGetAdminProfileQuery,
  useUpdateAdminProfileMutation,
  useUpdateAdminPasswordMutation,
  useGetAdminSettingsQuery,
  useUpdateAdminSettingsMutation,
  useGetAdminReportFeedbackQuery,
  useGetAdminReportFeedbackByIdQuery,
  useUpdateAdminReportFeedbackStatusMutation,
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
} = api;
