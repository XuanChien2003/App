import { apiRequest } from './client';

export function login(username, password) {
  return apiRequest('/auth/login', { method: 'POST', body: { username, password } });
}
