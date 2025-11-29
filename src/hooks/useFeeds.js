import { useState, useEffect, useCallback } from 'react';
import { getFeeds as apiGetFeeds } from '@shared/api/client.js';

const FETCH_TIMEOUT = 15000;
const MAX_RETRIES = 1;
const RETRY_DELAY = 2000;

export function useFeeds(config) {
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadedFeedsCount, setLoadedFeedsCount] = useState(0);
  const [feedLog, setFeedLog] = useState([]);
  const [imageFallbacks, setImageFallbacks] = useState({});
  const [connectionStatus, setConnectionStatus] = useState({
    source: 'initializing',  // 'backend', 'direct', 'initializing', 'error'
    backendUrl: null,
    lastFetch: null,
    lastUpdated: null,
    isConnected: false
  });

  // Get the API URL from config, default to same origin
  const getApiUrl = useCallback(() => {
    return config?.apiUrl || window.location.origin;
  }, [config]);

  const addFeedLogEntry = useCallback((message, type = 'info') => {
    setFeedLog(prev => [...prev, { message, type, timestamp: Date.now() }]);
  }, []);

  const clearFeedLog = useCallback(() => {
    setFeedLog([]);
  }, []);

  const fetchRSSFeed = useCallback(async (url, feedName, feedIcon, retryCount = 0) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/rss+xml, application/xml, text/xml'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');

      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        throw new Error('Invalid XML response');
      }

      // Import parseRSSItems dynamically to avoid circular dependencies
      const { parseRSSItems } = await import('../utils/feedUtils');
      const items = parseRSSItems(xmlDoc, feedName, feedIcon, config?.maxItemsPerFeed || 5);
      
      return items;
    } catch (error) {
      console.error(`Error fetching feed ${feedName}:`, error);

      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying ${feedName} in ${RETRY_DELAY}ms...`);
        addFeedLogEntry(`${feedName}: Retrying...`, 'info');
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return fetchRSSFeed(url, feedName, feedIcon, retryCount + 1);
      }

      return [];
    }
  }, [config, addFeedLogEntry]);

  const loadFeedsFromBackend = useCallback(async () => {
    setLoading(true);
    clearFeedLog();
    setError(null);

    const apiUrl = getApiUrl();
    
    try {
      addFeedLogEntry(`Connecting to ${apiUrl}...`, 'info');

      const data = await apiGetFeeds(apiUrl);

      if (!data.items || data.items.length === 0) {
        addFeedLogEntry('Backend has no cached items', 'error');
        return false;
      }

      const items = data.items.map(item => ({
        ...item,
        pubDate: new Date(item.pubDate)
      }));

      const successfulFeeds = Object.values(data.feedStatus || {}).filter(s => s.success).length;
      setLoadedFeedsCount(successfulFeeds);
      
      // Set image fallbacks from backend config
      if (data.imageFallbacks) {
        setImageFallbacks(data.imageFallbacks);
        addFeedLogEntry(`Loaded ${Object.keys(data.imageFallbacks).length} image fallback mappings`, 'info');
      }

      if (data.feedStatus) {
        Object.entries(data.feedStatus).forEach(([name, status]) => {
          if (status.success) {
            addFeedLogEntry(`${name}: ${status.itemCount} items (cached)`, 'success');
          } else {
            addFeedLogEntry(`${name}: ${status.error || 'Failed'}`, 'error');
          }
        });
      }

      addFeedLogEntry(`Backend cache: ${items.length} total items`, 'info');
      addFeedLogEntry(`Last updated: ${new Date(data.lastUpdated).toLocaleString()}`, 'info');

      setFeedItems(items);
      setConnectionStatus({
        source: 'backend',
        backendUrl: apiUrl,
        lastFetch: new Date(),
        lastUpdated: new Date(data.lastUpdated),
        isConnected: true
      });
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Backend fetch failed:', error);
      addFeedLogEntry(`Backend error: ${error.message}`, 'error');
      setConnectionStatus(prev => ({
        ...prev,
        backendUrl: apiUrl,
        source: 'error',
        isConnected: false
      }));
      return false;
    }
  }, [addFeedLogEntry, clearFeedLog, getApiUrl]);

  const loadFeedsDirectly = useCallback(async () => {
    if (!config?.feeds) return;

    setLoading(true);
    clearFeedLog();
    setError(null);

    const allItems = [];
    const feedPromises = config.feeds.map(async (feed) => {
      try {
        addFeedLogEntry(`Fetching ${feed.name}...`, 'info');
        const items = await fetchRSSFeed(feed.url, feed.name, feed.icon);
        allItems.push(...items);
        addFeedLogEntry(`${feed.name}: ${items.length} items`, items.length > 0 ? 'success' : 'error');
        return items.length;
      } catch (error) {
        addFeedLogEntry(`${feed.name}: ${error.message}`, 'error');
        return 0;
      }
    });

    const results = await Promise.all(feedPromises);
    const successfulFeeds = results.filter(count => count > 0).length;
    setLoadedFeedsCount(successfulFeeds);
    setFeedItems(allItems);
    setConnectionStatus({
      source: 'direct',
      backendUrl: 'N/A (direct fetch)',
      lastFetch: new Date(),
      lastUpdated: new Date(),
      isConnected: successfulFeeds > 0
    });
    setLoading(false);
  }, [config, fetchRSSFeed, addFeedLogEntry, clearFeedLog]);

  const loadFeeds = useCallback(async () => {
    const backendSuccess = await loadFeedsFromBackend();
    if (!backendSuccess) {
      await loadFeedsDirectly();
    }
  }, [loadFeedsFromBackend, loadFeedsDirectly]);

  useEffect(() => {
    if (config) {
      loadFeeds();
    }
  }, [config]);

  // Auto-refresh
  useEffect(() => {
    if (!config?.refreshInterval) return;

    const interval = setInterval(() => {
      console.log('Refreshing feeds...');
      loadFeeds();
    }, config.refreshInterval);

    return () => clearInterval(interval);
  }, [config, loadFeeds]);

  return {
    feedItems,
    loading,
    error,
    loadedFeedsCount,
    feedLog,
    imageFallbacks,
    loadFeeds,
    addFeedLogEntry,
    clearFeedLog,
    connectionStatus
  };
}

