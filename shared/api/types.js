/**
 * Shared API Types
 * Defines data structures used by both backend and frontend
 */

/**
 * @typedef {Object} FeedConfig
 * @property {string} name - Display name of the feed
 * @property {string} url - RSS feed URL
 * @property {string} icon - Icon/favicon URL
 */

/**
 * @typedef {Object} FeedItem
 * @property {string} id - Unique identifier
 * @property {string} title - Article title
 * @property {string} link - Article URL
 * @property {Date|string} pubDate - Publication date
 * @property {string} source - Source feed name
 * @property {string} sourceIcon - Source icon URL
 * @property {string} description - Short description
 * @property {string|null} fullText - Full article text (from backend)
 * @property {string|null} image - Article image URL
 * @property {string|null} author - Article author (from backend)
 */

/**
 * @typedef {Object} FeedStatus
 * @property {boolean} success - Whether feed fetch succeeded
 * @property {number} itemCount - Number of items fetched
 * @property {string|null} error - Error message if failed
 * @property {Date|string} lastFetched - Last fetch timestamp
 */

/**
 * @typedef {Object} FeedsResponse
 * @property {Date|string} lastUpdated - Last update timestamp
 * @property {FeedItem[]} items - Array of feed items
 * @property {Object.<string, FeedStatus>} feedStatus - Status per feed
 * @property {Object.<string, Date|string>} feedTimestamps - Timestamps per feed
 */

/**
 * @typedef {Object} CacheStats
 * @property {number} totalItems - Total cached items
 * @property {number} totalImages - Total cached images
 * @property {number} cacheSize - Cache size in bytes
 * @property {string} cacheSizeFormatted - Formatted cache size
 */

/**
 * @typedef {Object} StatusResponse
 * @property {string} status - Server status ('running')
 * @property {CacheStats} cacheStats - Cache statistics
 * @property {Object.<string, FeedStatus>} feedStatus - Feed statuses
 */

/**
 * @typedef {Object} RefreshResponse
 * @property {string} message - Response message
 */

/**
 * @typedef {Object} ErrorResponse
 * @property {string} error - Error message
 */

// Export types for JSDoc usage
export const API_TYPES = {
  FeedConfig: 'FeedConfig',
  FeedItem: 'FeedItem',
  FeedStatus: 'FeedStatus',
  FeedsResponse: 'FeedsResponse',
  CacheStats: 'CacheStats',
  StatusResponse: 'StatusResponse',
  RefreshResponse: 'RefreshResponse',
  ErrorResponse: 'ErrorResponse'
};

