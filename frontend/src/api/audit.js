import { apiFetch } from './client';

/**
 * Fetch system audit logs with optional filtering
 * @param {Object} params
 * @param {string} [params.q] - Search query
 * @param {string} [params.action] - Action type filter
 * @param {string} [params.severity] - Severity filter
 * @param {string} [params.entity] - Target entity filter
 * @param {number} [params.limit] - Limit results
 */
export async function fetchAuditLogs(params = {}) {
  const query = new URLSearchParams();
  if (params.q) query.append('q', params.q);
  if (params.action && params.action !== 'ALL') query.append('action', params.action);
  if (params.severity && params.severity !== 'ALL') query.append('severity', params.severity);
  if (params.entity && params.entity !== 'ALL') query.append('entity', params.entity);
  if (params.limit) query.append('limit', params.limit);

  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiFetch(`/audit-logs/${qs}`);
}
