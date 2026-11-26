import axios from 'axios';
import { clearAuth, getToken } from '../utils/storage';

// In dev, "/api" is proxied to the Express server by Vite.
// In production, Express serves this build, so "/api" is the same origin.
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// 1) Attach the JWT to every request.
client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 2) A 401 means the token is missing, invalid or expired -> log out.
//    Login/register also answer 401/409 for wrong credentials, so those two
//    endpoints are skipped: the form shows the error instead.
const AUTH_FORM_URLS = ['/auth/login', '/auth/register'];

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuthForm = AUTH_FORM_URLS.some((path) => url.endsWith(path));

    if (status === 401 && !isAuthForm) {
      clearAuth();
      if (window.location.pathname !== '/login') {
        // Full reload on purpose: it resets every piece of React state.
        window.location.assign('/login?expired=1');
      }
    }
    return Promise.reject(error);
  },
);

/**
 * Turns an axios error into something the UI can show.
 * The API error envelope is { success: false, message, errors: [{ field, message }] }.
 *
 * @returns {{ message: string, fieldErrors: Record<string, string>, status?: number }}
 */
export function parseApiError(error, fallback = 'Something went wrong. Please try again.') {
  if (!error?.response) {
    return {
      message: 'Cannot reach the server. Check your connection and try again.',
      fieldErrors: {},
    };
  }

  const { status, data } = error.response;
  const fieldErrors = {};
  (data?.errors || []).forEach(({ field, message }) => {
    // keep the first message per field
    if (field && !fieldErrors[field]) fieldErrors[field] = message;
  });

  let message = data?.message || fallback;
  if (!data?.message) {
    if (status === 429) message = 'Too many attempts. Please wait a minute and try again.';
    // e.g. the dev proxy answers 502/504 when the backend is not running
    else if (status >= 500) message = 'The server is not responding right now. Please try again shortly.';
  }

  return { message, fieldErrors, status };
}

export default client;
