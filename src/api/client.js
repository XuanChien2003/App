import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// EXPO_PUBLIC_* vars only get inlined at build time from whatever env the *builder* sees (local
// .env for `expo start`/`expo export`, eas.json's build.<profile>.env for EAS Build) - a build
// that doesn't see it at all falls back here, so this must be a real reachable backend, never
// the emulator-only 10.0.2.2, or every such build silently breaks on physical devices.
function resolveApiBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://don-be.onrender.com/api';
  if (Platform.OS === 'web' && configured.includes('10.0.2.2')) {
    return configured.replace('10.0.2.2', 'localhost');
  }
  return configured;
}

const API_BASE_URL = resolveApiBaseUrl();
const TOKEN_KEY = 'nxc_token';

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token) {
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}

let unauthorizedHandler = null;
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

async function parseErrorMessage(res) {
  try {
    const body = await res.json();
    return body.error || `Lỗi ${res.status}`;
  } catch {
    return `Lỗi ${res.status}`;
  }
}

export async function apiRequest(path, options = {}) {
  const { method = 'GET', body } = options;
  const headers = { 'Content-Type': 'application/json' };
  const token = await getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && unauthorizedHandler) {
    unauthorizedHandler();
  }

  if (!res.ok) {
    const message = await parseErrorMessage(res);
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) return null;
  return res.json();
}
