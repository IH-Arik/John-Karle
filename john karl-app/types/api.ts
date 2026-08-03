/**
 * Standardized API response format for all backend requests.
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  message?: string;
  status?: number;
  errors?: any;
}

/**
 * Standardized error object for network failure representation.
 */
export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  errors?: Record<string, string[]>; // For validation error maps
}

/**
 * Type definition for common HTTP methods.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Request options extending standard RequestInit.
 */
export interface ApiRequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
  requireAuth?: boolean;
  _retry?: boolean;
}
