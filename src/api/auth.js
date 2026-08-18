import { apiRequest } from './client';

export function login(username, password) {
  return apiRequest('/auth/login', { method: 'POST', body: { username, password } });
}

export function changePassword({ currentPassword, newPassword }) {
  return apiRequest('/auth/change-password', { method: 'POST', body: { currentPassword, newPassword } });
}
