import { apiRequest } from './client';

export function submitScan({ vtpCode, eventType, location, note, eventTime, requestId, lat, lng }) {
  return apiRequest('/scans', {
    method: 'POST',
    body: { vtpCode, eventType, location, note, eventTime, requestId, lat, lng },
  });
}

export function getScanHistory({ page = 1, limit = 20 } = {}) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) }).toString();
  return apiRequest(`/scans/history?${query}`);
}
