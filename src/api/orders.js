import { apiRequest } from './client';

export function getOrderDetail(vtpCode) {
  return apiRequest(`/orders/${encodeURIComponent(vtpCode)}`);
}
