import { getStoredToken, clearAuthSession, notifyAuthExpired } from './auth';

export const API_BASE = '/api';

/**
 * Returns standard authentication headers, automatically attaching the auth token if present.
 * @param {boolean} isMultipart
 * @returns {Record<string, string>}
 */
export function authHeaders(isMultipart = false) {
  const token = getStoredToken();
  const headers = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }
  return headers;
}

/**
 * Centralized response handler.
 * Checks for 401 Unauthorized or expired token responses, clears session and redirects/notifies to login.
 * @param {Response} res
 * @returns {Promise<any>}
 */
export async function handleApiResponse(res) {
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    clearAuthSession();
    notifyAuthExpired();
    const msg = data.detail || 'Session expired. Please log in again.';
    throw new Error(msg);
  }

  if (!res.ok) {
    const msg =
      data.detail ||
      (data.non_field_errors && data.non_field_errors[0]) ||
      'An error occurred. Please try again.';
    throw new Error(msg);
  }

  return data;
}

/**
 * Authenticated fetch helper that automatically includes headers and handles 401 token expiry.
 */
export async function apiFetch(endpoint, options = {}) {
  const isMultipart = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers = {
    ...authHeaders(isMultipart),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return handleApiResponse(response);
}
