/**
 * Shared API Client
 * Client functions for making API requests
 * Can be used by both backend (for internal calls) and frontend
 */

import { API_ENDPOINTS, API_METHODS, getApiUrl } from './endpoints.js';

/**
 * Default fetch options
 */
const DEFAULT_OPTIONS = {
  headers: {
    'Content-Type': 'application/json'
  }
};

/**
 * Make API request
 * @param {string} endpoint - API endpoint
 * @param {RequestInit} options - Fetch options
 * @param {string} baseUrl - Base URL
 * @returns {Promise<Response>}
 */
async function apiRequest(endpoint, options = {}, baseUrl = '') {
  const url = getApiUrl(endpoint, baseUrl);
  const response = await fetch(url, {
    ...DEFAULT_OPTIONS,
    ...options,
    headers: {
      ...DEFAULT_OPTIONS.headers,
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response;
}

/**
 * Get all cached feed items
 * @param {string} baseUrl - Base URL for API
 * @returns {Promise<FeedsResponse>}
 */
export async function getFeeds(baseUrl = '') {
  const response = await apiRequest(API_ENDPOINTS.FEEDS, {
    method: API_METHODS.GET
  }, baseUrl);
  return response.json();
}

/**
 * Get server status and statistics
 * @param {string} baseUrl - Base URL for API
 * @returns {Promise<StatusResponse>}
 */
export async function getStatus(baseUrl = '') {
  const response = await apiRequest(API_ENDPOINTS.STATUS, {
    method: API_METHODS.GET
  }, baseUrl);
  return response.json();
}

/**
 * Trigger manual feed refresh
 * @param {string} baseUrl - Base URL for API
 * @returns {Promise<RefreshResponse>}
 */
export async function refreshFeeds(baseUrl = '') {
  const response = await apiRequest(API_ENDPOINTS.REFRESH, {
    method: API_METHODS.POST
  }, baseUrl);
  return response.json();
}

/**
 * Clear cache
 * @param {string} baseUrl - Base URL for API
 * @returns {Promise<{message: string}>}
 */
export async function clearCache(baseUrl = '') {
  const response = await apiRequest(API_ENDPOINTS.CACHE, {
    method: API_METHODS.DELETE
  }, baseUrl);
  return response.json();
}

/**
 * API Client with base URL
 */
export class ApiClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  async getFeeds() {
    return getFeeds(this.baseUrl);
  }

  async getStatus() {
    return getStatus(this.baseUrl);
  }

  async refreshFeeds() {
    return refreshFeeds(this.baseUrl);
  }

  async clearCache() {
    return clearCache(this.baseUrl);
  }
}

