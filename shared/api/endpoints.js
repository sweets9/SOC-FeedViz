/**
 * Shared API Endpoints
 * Centralized endpoint definitions for backend and frontend
 */

export const API_ENDPOINTS = {
  FEEDS: '/api/feeds',
  STATUS: '/api/status',
  REFRESH: '/api/refresh',
  CACHE: '/api/cache'
};

export const API_METHODS = {
  GET: 'GET',
  POST: 'POST',
  DELETE: 'DELETE'
};

/**
 * Get full API URL
 * @param {string} endpoint - API endpoint path
 * @param {string} baseUrl - Base URL (defaults to empty for same-origin)
 * @returns {string} Full URL
 */
export function getApiUrl(endpoint, baseUrl = '') {
  return `${baseUrl}${endpoint}`;
}

