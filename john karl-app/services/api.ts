import { ApiError, ApiRequestOptions, ApiResponse } from '@/types/api';
import { SecureStorageService } from '@/utils/storage';

// Replace with your production base API URL
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || '';

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Helper to build a query string from key-value parameters.
   */
  private buildQueryString(params?: Record<string, string | number | boolean>): string {
    if (!params || Object.keys(params).length === 0) return '';
    const parts = Object.entries(params).map(
      ([key, val]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`
    );
    return `?${parts.join('&')}`;
  }

  /**
   * Primary fetch wrapper that coordinates token injection, headers, and error handling.
   */
  async request<T = any>(path: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    const { params, requireAuth = true, headers: customHeaders, ...fetchOptions } = options;
    const queryString = this.buildQueryString(params);
    const url = `${this.baseUrl}${path}${queryString}`;

    // 1. Set default headers
    const headers = new Headers({
      Accept: 'application/json',
      ...customHeaders,
    });

    if (!(fetchOptions.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    // 2. Inject Authorization header if required
    if (requireAuth) {
      const token = await SecureStorageService.getItem('authToken');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    const config: RequestInit = {
      ...fetchOptions,
      headers,
    };

    // Logging for development mode
    if (__DEV__) {
      console.log(`[API Request] ${config.method || 'GET'} -> ${url}`);
    }

    try {
      const response = await fetch(url, config);

      if (__DEV__) {
        console.log(`[API Response] ${response.status} <- ${url}`);
      }

      // Intercept 401 and refresh token if possible, BEFORE parsing JSON
      if (response.status === 401 && path !== '/auth/refresh' && path !== '/auth/logout' && !options._retry) {
        options._retry = true;
        const success = await this.refreshTokens();
        if (success) {
          // Re-inject the new authorization header
          const newToken = await SecureStorageService.getItem('authToken');
          if (newToken) {
            headers.set('Authorization', `Bearer ${newToken}`);
          }
          const retryConfig = { ...config, headers };

          if (__DEV__) {
            console.log(`[API Retry Request] ${retryConfig.method || 'GET'} -> ${url}`);
          }

          const retryResponse = await fetch(url, retryConfig);
          if (retryResponse.status === 204) {
            return { success: true, data: null, status: 204 };
          }

          let retryJson: any = null;
          try {
            retryJson = await retryResponse.json();
          } catch (e) {
            // Safe fallback if JSON parsing fails on retry response
          }

          if (!retryResponse.ok) {
            const errorMsg = retryJson?.error?.message || retryJson?.message || `Request failed with status ${retryResponse.status}`;
            throw {
              message: errorMsg,
              statusCode: retryResponse.status,
              errors: retryJson?.error?.details || retryJson?.errors,
            } as ApiError;
          }
          return {
            success: true,
            data: retryJson,
            status: retryResponse.status,
          };
        }
      }

      // Check if response has no content
      if (response.status === 204) {
        return { success: true, data: null, status: 204 };
      }

      let json: any = null;
      try {
        json = await response.json();
      } catch (jsonErr) {
        // Safe fallback if response has no JSON body
      }

      if (!response.ok) {
        const errorMsg = json?.error?.message || json?.message || `Request failed with status ${response.status}`;
        throw {
          message: errorMsg,
          statusCode: response.status,
          errors: json?.error?.details || json?.errors,
        } as ApiError;
      }

      return {
        success: true,
        data: json,
        status: response.status,
      };
    } catch (error: any) {
      console.error(`[API Error] Path: ${path} ->`, error);

      // Handle standard API error shapes
      const apiError: ApiError = {
        message: error?.message || 'A network error occurred. Please try again.',
        statusCode: error?.statusCode || 500,
        errors: error?.errors,
      };

      return {
        success: false,
        data: null,
        message: apiError.message,
        status: apiError.statusCode,
        errors: apiError.errors,
      };
    }
  }

  /**
   * Token refresh handler using the persisted refreshToken.
   */
  private async refreshTokens(): Promise<boolean> {
    if (this.isRefreshing) {
      return new Promise<boolean>((resolve) => {
        this.refreshSubscribers.push((token) => {
          resolve(!!token);
        });
      });
    }

    this.isRefreshing = true;

    try {
      const refreshToken = await SecureStorageService.getItem('refreshToken');
      if (!refreshToken) {
        this.handleRefreshFailure();
        return false;
      }

      const refreshUrl = `${this.baseUrl}/auth/refresh`;

      if (__DEV__) {
        console.log(`[API Token Refresh] POST -> ${refreshUrl}`);
      }

      const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (__DEV__) {
        console.log(`[API Token Refresh Response] status: ${response.status}`);
      }

      if (!response.ok) {
        this.handleRefreshFailure();
        return false;
      }

      const json = await response.json();
      if (json.success && json.data && json.data.tokens) {
        const { tokens, user } = json.data;

        // Dynamically require useAuthStore to avoid circular dependencies
        const { useAuthStore } = require('@/store/auth-store');

        const nameParts = (user?.name || '').trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        const mappedUser = {
          ...user,
          firstName,
          lastName,
        };

        await useAuthStore.getState().signIn(tokens.accessToken, tokens.refreshToken || null, mappedUser);

        this.onTokenRefreshed(tokens.accessToken);
        return true;
      } else {
        this.handleRefreshFailure();
        return false;
      }
    } catch (err) {
      console.error('[API Token Refresh Error]', err);
      this.handleRefreshFailure();
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  private handleRefreshFailure() {
    this.onTokenRefreshed('');

    // Dynamically sign out
    const { useAuthStore } = require('@/store/auth-store');
    useAuthStore.getState().signOut();

    // Redirect to sign in page
    const { router } = require('expo-router');
    try {
      router.replace('/auth/signin');
    } catch (e) {
      console.error('Failed to redirect to signin:', e);
    }
  }

  /**
   * GET Request
   */
  async get<T = any>(path: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  /**
   * POST Request
   */
  async post<T = any>(path: string, body?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    });
  }

  /**
   * PUT Request
   */
  async put<T = any>(path: string, body?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    });
  }

  /**
   * PATCH Request
   */
  async patch<T = any>(path: string, body?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    });
  }

  /**
   * DELETE Request
   */
  async delete<T = any>(path: string, options?: Omit<ApiRequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient();
export default api;
