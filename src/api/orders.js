import { apiRequest } from './client';

export function getOrderDetail(internalCode) {
  return apiRequest(`/orders/${encodeURIComponent(internalCode)}`);
}
