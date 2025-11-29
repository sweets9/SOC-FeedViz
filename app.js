// RSS Feed Scroller Application
(function () {
    'use strict';

    // Constants
    const SPOTLIGHT_ANIMATION_DELAY = 300; // ms delay before adding spotlight class after scroll
    const SPOTLIGHT_DURATION = 6000; // ms to display each spotlight item (faster)
    const TRANSITION_DELAY = 400; // ms delay between items for smooth transition
    const DIMMING_DELAY = 150; // ms delay before dimming non-spotlight cards
    const SCROLL_DURATION = 1000; // ms duration for manual smooth scroll
    const FETCH_TIMEOUT = 15000; // ms timeout for feed fetches
    const RETRY_DELAY = 2000; // ms delay before retrying failed feed
    const MAX_RETRIES = 1; // Maximum number of retries per feed

    // Backend API configuration (same origin since served from backend)
    const BACKEND_URL = ''; // Empty string for same-origin requests
    const USE_BACKEND = true; // Always use backend

    // State
    let config = null;
    let feedItems = [];
    let scrollAnimationFrame = null;
    let loadedFeedsCount = 0;
    let nextRefreshTime = null;
    let countdownInterval = null;
    let spotlightIndex = 0;
    let spotlightTimeout = null;
    let isSpotlighting = false;
    let spotlightCycleInterval = null;
    let isPaused = false; // Track if spotlight is paused
    let pausedByHover = false; // Track if pause was caused by hover
    let shrinkAnimation = null; // Track current shrink animation
    let expandAnimation = null; // Track current expand animation
    let hasStartedSpotlight = false;
    let spotlightRunId = 0;
    let dimmingTimeout = null;
    let spotlightApplyTimeout = null;
    let nextSpotlightDelay = null;
    let currentTheme = 'blue';

    // CORS proxy for RSS feeds (fallback when backend not available)
    const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

    // Fallback icons for feeds with loading issues
    const FALLBACK_ICONS = {
        'Bleeping Computer': 'https://pbs.twimg.com/profile_images/1699832227062792192/hqaQ8bMZ_400x400.jpg'
    };

    // DOM Elements
    const feedContainer = document.getElementById('feedContainer');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const loadingProgress = document.getElementById('loadingProgress');
    const loadingStats = document.getElementById('loadingStats');
    const errorIndicator = document.getElementById('errorIndicator');
    const errorDetails = document.getElementById('errorDetails');
    const feedFooter = document.getElementById('feedFooter');
    const debugInfo = document.getElementById('debugInfo');
    const notificationContainer = document.getElementById('notificationContainer');
    const feedLog = document.getElementById('feedLog');
    const loadingToastContainer = document.getElementById('loadingToastContainer');
    const themeSelector = document.getElementById('themeSelector');

    // Track loading toasts by feed name
    const loadingToasts = new Map();

    /**
     * Show a loading toast for a feed
     * @param {string} feedName - Name of the feed
     * @returns {HTMLElement} - The toast element
     */
    function showLoadingToast(feedName) {
        if (!loadingToastContainer) return null;

        const toast = document.createElement('div');
        toast.className = 'loading-toast loading';
        toast.innerHTML = `
            <div class="toast-spinner"></div>
            <span class="toast-text">Loading: <strong>${escapeHtml(feedName)}</strong></span>
        `;

        loadingToastContainer.appendChild(toast);
        loadingToasts.set(feedName, toast);
        return toast;
    }

    /**
     * Update a loading toast to show success
     * @param {string} feedName - Name of the feed
     * @param {number} itemCount - Number of items loaded
     */
    function updateLoadingToastSuccess(feedName, itemCount) {
        const toast = loadingToasts.get(feedName);
        if (!toast) return;

        toast.className = 'loading-toast success';
        toast.innerHTML = `
            <span class="toast-icon">✓</span>
            <span class="toast-text">${escapeHtml(feedName)}</span>
            <span class="toast-count">${itemCount} items</span>
        `;

        // Remove after delay
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
                loadingToasts.delete(feedName);
            }, 300);
        }, 2000);
    }

    /**
     * Update a loading toast to show error
     * @param {string} feedName - Name of the feed
     * @param {string} errorMsg - Error message
     */
    function updateLoadingToastError(feedName, errorMsg) {
        const toast = loadingToasts.get(feedName);
        if (!toast) return;

        toast.className = 'loading-toast error';
        toast.innerHTML = `
            <span class="toast-icon">✗</span>
            <span class="toast-text">${escapeHtml(feedName)}: ${escapeHtml(errorMsg)}</span>
        `;

        // Remove after longer delay for errors
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
                loadingToasts.delete(feedName);
            }, 300);
        }, 4000);
    }

    /**
     * Add entry to feed log console
     * @param {string} message - Log message
     * @param {string} type - Log type: 'success', 'error', 'info'
     */
    function addFeedLogEntry(message, type = 'info') {
        if (!feedLog) return;

        const timestamp = new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const entry = document.createElement('div');
        entry.className = `feed-log-entry ${type}`;
        entry.innerHTML = `<span class="feed-log-timestamp">[${timestamp}]</span>${escapeHtml(message)}`;

        feedLog.appendChild(entry);

        // Auto-scroll to bottom
        feedLog.parentElement.scrollTop = feedLog.parentElement.scrollHeight;
    }

    /**
     * Clear the feed log console
     */
    function clearFeedLog() {
        if (feedLog) {
            feedLog.innerHTML = '';
        }
    }

    /**
     * Initialize the application
     */
    async function init() {
        try {
            await loadConfig();
            await loadFeeds();
            updateDebugFooter();
            setupKeyboardControls();
            setupHoverPause();
            initThemeSelector();
            // Small delay to ensure DOM is rendered before starting spotlight cycle
            setTimeout(() => {
                startSpotlightCycle();
            }, 1000);
            setupAutoRefresh();
        } catch (error) {
            console.error('Initialization error:', error);
            showError(`Initialization failed: ${error.message}`);
        }
    }

    /**
     * Setup keyboard controls for navigation
     */
    function setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case ' ': // Spacebar to pause/resume
                    e.preventDefault();
                    pausedByHover = false; // Manual pause overrides hover
                    if (isPaused) {
                        resumeSpotlight();
                        showNotification('▶️ Spotlight resumed', 2000);
                    } else {
                        pauseSpotlight();
                        showNotification('⏸️ Spotlight paused - Press SPACE to resume', 3000);
                    }
                    break;
                case 'ArrowRight': // Next item
                case 'ArrowDown':
                    e.preventDefault();
                    if (spotlightTimeout) clearTimeout(spotlightTimeout);
                    spotlightIndex = (spotlightIndex + 1) % feedItems.length;
                    pausedByHover = false;
                    isPaused = false;
                    isSpotlighting = false;
                    spotlightNextItem();
                    break;
                case 'ArrowLeft': // Previous item
                case 'ArrowUp':
                    e.preventDefault();
                    if (spotlightTimeout) clearTimeout(spotlightTimeout);
                    spotlightIndex = (spotlightIndex - 1 + feedItems.length) % feedItems.length;
                    pausedByHover = false;
                    isPaused = false;
                    isSpotlighting = false;
                    spotlightNextItem();
                    break;
                case 'r': // Manual refresh
                case 'R':
                    e.preventDefault();
                    showNotification('🔄 Refreshing feeds...', 2000);
                    loadFeeds();
                    break;
            }
        });
    }

    /**
     * Setup hover pause functionality
     */
    function setupHoverPause() {
        feedContainer.addEventListener('mouseenter', () => {
            if (!isPaused && isSpotlighting) {
                pausedByHover = true;
                pauseSpotlight();
            }
        });

        feedContainer.addEventListener('mouseleave', () => {
            // Only resume if it was paused by hover, not manually
            if (isPaused && pausedByHover) {
                pausedByHover = false;
                resumeSpotlight();
            }
        });
    }

    /**
     * Load configuration from config.json
     */
    async function loadConfig() {
        try {
            const response = await fetch('config.json');
            config = await response.json();
            console.log('Config loaded:', config);
        } catch (error) {
            console.error('Error loading config:', error);
            throw new Error('Failed to load configuration');
        }
    }

    /**
     * Load feeds from backend API
     */
    async function loadFeedsFromBackend() {
        showLoading();
        clearFeedLog();

        try {
            addFeedLogEntry('Connecting to backend server...', 'info');
            updateLoadingProgress(0, 1, 'Fetching from backend...');

            const response = await fetch(`${BACKEND_URL}/api/feeds`, {
                timeout: 30000
            });

            if (!response.ok) {
                throw new Error(`Backend returned ${response.status}`);
            }

            const data = await response.json();

            if (!data.items || data.items.length === 0) {
                addFeedLogEntry('Backend has no cached items', 'error');
                // Fall back to direct fetching
                addFeedLogEntry('Falling back to direct fetch...', 'info');
                return loadFeedsDirectly();
            }

            // Process backend items
            feedItems = data.items.map(item => ({
                ...item,
                pubDate: new Date(item.pubDate)
            }));

            // Count successful feeds
            loadedFeedsCount = Object.values(data.feedStatus || {}).filter(s => s.success).length;
            const totalFeeds = Object.keys(data.feedStatus || {}).length || config.feeds.length;

            // Log feed status
            if (data.feedStatus) {
                Object.entries(data.feedStatus).forEach(([name, status]) => {
                    if (status.success) {
                        addFeedLogEntry(`${name}: ${status.itemCount} items (cached)`, 'success');
                        showLoadingToast(name);
                        setTimeout(() => updateLoadingToastSuccess(name, status.itemCount), 500);
                    } else {
                        addFeedLogEntry(`${name}: ${status.error || 'Failed'}`, 'error');
                    }
                });
            }

            addFeedLogEntry(`Backend cache: ${feedItems.length} total items`, 'info');
            addFeedLogEntry(`Last updated: ${new Date(data.lastUpdated).toLocaleString()}`, 'info');

            updateLoadingProgress(totalFeeds, totalFeeds, 'Complete');
            updateLoadingStats(feedItems.length, feedItems.filter(i => i.image).length);

            console.log(`Loaded ${feedItems.length} items from backend cache`);

            renderFeeds();
            hideLoading();

            // Set next refresh time
            nextRefreshTime = Date.now() + config.refreshInterval;
            updateDebugFooter();
            startCountdown();

        } catch (error) {
            console.error('Backend fetch failed:', error);
            addFeedLogEntry(`Backend error: ${error.message}`, 'error');
            addFeedLogEntry('Falling back to direct fetch...', 'info');

            // Fall back to direct fetching
            return loadFeedsDirectly();
        }
    }

    /**
     * Load feeds directly (fallback when backend unavailable)
     */
    async function loadFeedsDirectly() {
        showLoading();
        clearFeedLog();
        loadedFeedsCount = 0;
        const failedFeeds = [];
        let totalItemsLoaded = 0;
        let totalImagesLoaded = 0;

        try {
            const totalFeeds = config.feeds.length;
            updateLoadingProgress(0, totalFeeds, 'Connecting to feeds...');
            updateLoadingStats(0, 0);
            addFeedLogEntry(`Starting parallel feed load (${totalFeeds} feeds)`, 'info');

            // Load ALL feeds in parallel for faster loading
            let completedCount = 0;

            // Show loading toasts for all feeds at once
            config.feeds.forEach(feed => {
                showLoadingToast(feed.name);
            });

            // Create all fetch promises in parallel
            const feedPromises = config.feeds.map(feed =>
                fetchRSSFeed(feed.url, feed.name, feed.icon)
                    .then(items => {
                        completedCount++;
                        updateLoadingProgress(completedCount, totalFeeds, `Loading feeds... (${completedCount}/${totalFeeds})`);

                        if (items.length > 0) {
                            loadedFeedsCount++;
                            totalItemsLoaded += items.length;
                            const imagesInFeed = items.filter(item => item.image).length;
                            totalImagesLoaded += imagesInFeed;
                            updateLoadingStats(totalItemsLoaded, totalImagesLoaded);
                            addFeedLogEntry(`${feed.name}: Loaded ${items.length} items`, 'success');
                            updateLoadingToastSuccess(feed.name, items.length);
                            return { status: 'fulfilled', value: items, feedName: feed.name };
                        } else {
                            failedFeeds.push(feed.name);
                            addFeedLogEntry(`${feed.name}: No items returned`, 'error');
                            updateLoadingToastError(feed.name, 'Feed returned empty');
                            return { status: 'fulfilled', value: [], feedName: feed.name };
                        }
                    })
                    .catch(error => {
                        completedCount++;
                        failedFeeds.push(feed.name);
                        addFeedLogEntry(`${feed.name}: Connection error - ${error.message}`, 'error');
                        updateLoadingToastError(feed.name, error.message || 'Connection failed');
                        updateLoadingProgress(completedCount, totalFeeds, `Loading feeds... (${completedCount}/${totalFeeds})`);
                        return { status: 'rejected', reason: error, feedName: feed.name };
                    })
            );

            // Wait for all feeds to complete in parallel
            const results = await Promise.all(feedPromises);

            feedItems = results
                .filter(result => result.status === 'fulfilled' && result.value.length > 0)
                .flatMap(result => result.value);

            console.log(`Loaded ${loadedFeedsCount}/${totalFeeds} feeds with ${feedItems.length} total items`);
            addFeedLogEntry(`Load complete: ${loadedFeedsCount}/${totalFeeds} feeds, ${feedItems.length} total items`, 'info');
            if (failedFeeds.length > 0) {
                console.warn(`Failed feeds: ${failedFeeds.join(', ')}`);
            }

            if (feedItems.length === 0) {
                showError(`No items loaded. Failed feeds: ${failedFeeds.join(', ')}`);
                return;
            }

            // Sort by date (newest first) to blend all feeds
            feedItems.sort((a, b) => b.pubDate - a.pubDate);

            console.log(`Total ${feedItems.length} items from all feeds, sorted by date`);

            renderFeeds();
            hideLoading();

            // Set next refresh time
            nextRefreshTime = Date.now() + config.refreshInterval;
            updateDebugFooter();
            startCountdown();
        } catch (error) {
            console.error('Error loading feeds:', error);
            showError('Fatal error loading feeds');
        }
    }

    /**
     * Main function to load feeds - uses backend or direct fetch
     */
    async function loadFeeds() {
        if (USE_BACKEND) {
            return loadFeedsFromBackend();
        } else {
            return loadFeedsDirectly();
        }
    }

    /**
     * Fetch with timeout wrapper
     * @param {string} url - URL to fetch
     * @param {object} options - Fetch options
     * @param {number} timeout - Timeout in ms
     * @returns {Promise<Response>}
     */
    async function fetchWithTimeout(url, options, timeout = FETCH_TIMEOUT) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timed out');
            }
            throw error;
        }
    }

    /**
     * Fetch and parse a single RSS feed with retry logic
     */
    async function fetchRSSFeed(url, feedName, feedIcon, retryCount = 0) {
        try {
            console.log(`Fetching feed: ${feedName}${retryCount > 0 ? ` (retry ${retryCount})` : ''}`);

            // Use fallback icon if available
            const actualIcon = FALLBACK_ICONS[feedName] || feedIcon;

            const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
            const response = await fetchWithTimeout(proxyUrl, {
                headers: {
                    'Accept': 'application/rss+xml, application/xml, text/xml'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, 'text/xml');

            // Check for XML parsing errors
            const parseError = xmlDoc.querySelector('parsererror');
            if (parseError) {
                throw new Error('Invalid XML response');
            }

            const items = parseRSSItems(xmlDoc, feedName, actualIcon);
            console.log(`${feedName}: loaded ${items.length} items`);
            return items;
        } catch (error) {
            console.error(`Error fetching feed ${feedName}:`, error);

            // Retry logic
            if (retryCount < MAX_RETRIES) {
                console.log(`Retrying ${feedName} in ${RETRY_DELAY}ms...`);
                addFeedLogEntry(`${feedName}: Retrying...`, 'info');
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                return fetchRSSFeed(url, feedName, feedIcon, retryCount + 1);
            }

            return [];
        }
    }

    /**
     * Parse RSS XML document into items array
     */
    function parseRSSItems(xmlDoc, feedName, feedIcon) {
        const items = [];
        const itemNodes = xmlDoc.querySelectorAll('item, entry');
        const maxItems = config.maxItemsPerFeed || 5;

        itemNodes.forEach((itemNode, index) => {
            // Limit items per feed
            if (index >= maxItems) return;

            const rawDescription = getNodeText(itemNode, 'description') ||
                getNodeText(itemNode, 'summary') ||
                getNodeText(itemNode, 'content') || '';

            const item = {
                id: `${feedName}-${index}-${Date.now()}`,
                title: getNodeText(itemNode, 'title') || 'No title',
                link: getNodeText(itemNode, 'link') || getNodeAttr(itemNode, 'link', 'href') || '#',
                pubDate: parseDate(itemNode),
                source: feedName,
                sourceIcon: feedIcon,
                description: extractFirstParagraph(rawDescription, feedName),
                image: extractImage(itemNode)
            };

            items.push(item);
        });

        return items;
    }

    /**
     * Extract first paragraph from HTML content
     */
    function extractFirstParagraph(html, feedName) {
        if (!html) return '';

        const normalizedHtml = preprocessFeedHtml(html, feedName);

        // Preserve paragraph breaks and line breaks
        let text = normalizedHtml
            .replace(/<\/p>/gi, '\n\n')  // Convert closing </p> to double line break
            .replace(/<p[^>]*>/gi, '')   // Remove opening <p> tags
            .replace(/<br\s*\/?>/gi, '\n')  // Convert <br> to line break
            .replace(/<\/div>/gi, '\n')  // Convert closing </div> to line break
            .replace(/<div[^>]*>/gi, '')  // Remove opening <div> tags
            .replace(/<[^>]+>/g, ' ')    // Remove all other HTML tags
            .replace(/[ \t]+/g, ' ')     // Collapse multiple spaces/tabs to single space
            .replace(/\n[ \t]+/g, '\n')  // Remove leading spaces after line breaks
            .replace(/[ \t]+\n/g, '\n')  // Remove trailing spaces before line breaks
            .replace(/\n{3,}/g, '\n\n')  // Collapse 3+ line breaks to double
            .trim();

        // Get first sentence or up to 200 characters
        const sentences = text.split(/[.!?]+/);
        let paragraph = sentences[0] || text;

        if (paragraph.length > 250) {
            paragraph = paragraph.substring(0, 250) + '...';
        } else if (sentences.length > 1 && paragraph.length < 150) {
            // Add second sentence if first is too short
            paragraph += '. ' + sentences[1];
            if (paragraph.length > 250) {
                paragraph = paragraph.substring(0, 250) + '...';
            }
        }

        return paragraph;
    }

    /**
     * Remove feed-specific metadata noise before parsing text
     */
    function preprocessFeedHtml(html, feedName) {
        if (!feedName || !html) {
            return html;
        }

        const lowerName = feedName.toLowerCase();

        if (lowerName.includes('hacker news')) {
            try {
                const wrapper = document.createElement('div');
                wrapper.innerHTML = html;
                const firstParagraph = wrapper.querySelector('p');
                if (firstParagraph && firstParagraph.textContent.trim().startsWith('')) {
                    firstParagraph.remove();
                }
                return wrapper.innerHTML;
            } catch (error) {
                console.warn('Failed to preprocess Hacker News description', error);
            }
        }

        return html;
    }

    /**
     * Get text content from XML node
     */
    function getNodeText(parent, tagName) {
        const node = parent.querySelector(tagName);
        return node ? node.textContent.trim() : '';
    }

    /**
     * Get attribute from XML node
     */
    function getNodeAttr(parent, tagName, attrName) {
        const node = parent.querySelector(tagName);
        return node ? node.getAttribute(attrName) : '';
    }

    /**
     * Parse publication date from item
     */
    function parseDate(itemNode) {
        const pubDateText = getNodeText(itemNode, 'pubDate') ||
            getNodeText(itemNode, 'published') ||
            getNodeText(itemNode, 'updated') ||
            getNodeText(itemNode, 'dc\\:date');

        if (pubDateText) {
            const date = new Date(pubDateText);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }

        return new Date();
    }

    /**
     * Extract image from RSS item - improved version
     */
    function extractImage(itemNode) {
        // Try media:content with namespace
        let mediaNodes = itemNode.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'content');
        if (mediaNodes.length > 0) {
            const url = mediaNodes[0].getAttribute('url');
            if (url) return url;
        }

        // Try media:thumbnail with namespace
        mediaNodes = itemNode.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'thumbnail');
        if (mediaNodes.length > 0) {
            const url = mediaNodes[0].getAttribute('url');
            if (url) return url;
        }

        // Try without namespace (some feeds don't use proper namespaces)
        const mediaContent = itemNode.querySelector('content[url], media\\:content[url]');
        if (mediaContent) {
            const url = mediaContent.getAttribute('url');
            if (url) return url;
        }

        const mediaThumbnail = itemNode.querySelector('thumbnail[url], media\\:thumbnail[url]');
        if (mediaThumbnail) {
            const url = mediaThumbnail.getAttribute('url');
            if (url) return url;
        }

        // Try enclosure
        const enclosure = itemNode.querySelector('enclosure');
        if (enclosure && enclosure.getAttribute('url')) {
            const type = enclosure.getAttribute('type') || '';
            if (type.startsWith('image/') || !type) {
                return enclosure.getAttribute('url');
            }
        }

        // Try to extract from description/content HTML
        const description = getNodeText(itemNode, 'description') ||
            getNodeText(itemNode, 'content\\:encoded') ||
            getNodeText(itemNode, 'content') ||
            getNodeText(itemNode, 'summary');

        if (description) {
            // Try to extract img src
            const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (imgMatch && imgMatch[1]) {
                // Filter out tracking pixels and small images
                const imgUrl = imgMatch[1];
                if (!imgUrl.includes('feedburner.com') &&
                    !imgUrl.includes('1x1') &&
                    !imgUrl.includes('pixel')) {
                    return imgMatch[1];
                }
            }
        }

        return null;
    }

    /**
     * Check if item matches critical keywords
     */
    function isCritical(item) {
        if (!config.highlightKeywords || config.highlightKeywords.length === 0) {
            return false;
        }

        const searchText = `${item.title} ${item.description}`.toLowerCase();

        return config.highlightKeywords.some(keyword =>
            searchText.includes(keyword.toLowerCase())
        );
    }

    /**
     * Format timestamp for display
     */
    function formatTimestamp(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;

        return date.toLocaleDateString();
    }

    /**
     * Render feed items to the DOM
     */
    function renderFeeds() {
        if (feedItems.length === 0) {
            showError('No feed items to display');
            return;
        }

        feedContainer.innerHTML = '';

        // Count items with images
        const itemsWithImages = feedItems.filter(item => item.image).length;
        console.log(`Rendering ${feedItems.length} items (${itemsWithImages} with images, ${feedItems.length - itemsWithImages} with fallback icons)`);

        // Render items once for spotlight animation
        feedItems.forEach(item => {
            const feedItemEl = createFeedItemElement(item);
            feedContainer.appendChild(feedItemEl);
        });

        if (hasStartedSpotlight) {
            restartSpotlightCycle({ resetIndex: true });
        }
    }

    /**
     * Clear spotlight-related timers
     */
    function clearSpotlightTimers() {
        if (spotlightTimeout) {
            clearTimeout(spotlightTimeout);
            spotlightTimeout = null;
        }
        if (dimmingTimeout) {
            clearTimeout(dimmingTimeout);
            dimmingTimeout = null;
        }
        if (spotlightApplyTimeout) {
            clearTimeout(spotlightApplyTimeout);
            spotlightApplyTimeout = null;
        }
        if (nextSpotlightDelay) {
            clearTimeout(nextSpotlightDelay);
            nextSpotlightDelay = null;
        }
        if (shrinkAnimation) {
            shrinkAnimation.cancel();
            shrinkAnimation = null;
        }
        if (expandAnimation) {
            expandAnimation.cancel();
            expandAnimation = null;
        }
    }

    /**
     * Cancel any in-flight scroll animation
     */
    function cancelScrollAnimation() {
        if (scrollAnimationFrame) {
            cancelAnimationFrame(scrollAnimationFrame);
            scrollAnimationFrame = null;
        }
    }

    /**
     * Reset spotlight bookkeeping
     */
    function resetSpotlightState({ resetIndex = false } = {}) {
        clearSpotlightTimers();
        cancelScrollAnimation();
        isSpotlighting = false;

        const items = feedContainer ? feedContainer.querySelectorAll('.feed-item') : [];
        if (resetIndex || items.length === 0) {
            spotlightIndex = 0;
        } else {
            spotlightIndex = Math.min(Math.max(spotlightIndex, 0), items.length - 1);
        }
    }

    /**
     * Restart spotlight cycle if conditions allow
     */
    function restartSpotlightCycle({ resetIndex = false } = {}) {
        resetSpotlightState({ resetIndex });
        if (!isPaused) {
            requestAnimationFrame(() => spotlightNextItem());
        }
    }

    /**
     * Start spotlight cycle - scroll through items with spotlight animation
     */
    function startSpotlightCycle() {
        if (!feedItems || feedItems.length === 0) {
            console.error('Cannot start spotlight cycle: no items');
            setTimeout(() => {
                if (!hasStartedSpotlight) {
                    startSpotlightCycle();
                }
            }, 500);
            return;
        }

        console.log('Starting spotlight cycle');
        hasStartedSpotlight = true;
        resetSpotlightState({ resetIndex: true });
        spotlightNextItem();
    }

    /**
     * Spotlight the next item in sequence
     */
    function spotlightNextItem() {
        if (isPaused) {
            return;
        }

        const items = feedContainer.querySelectorAll('.feed-item');

        if (items.length === 0) {
            console.error('No items to spotlight');
            return;
        }

        spotlightIndex = ((spotlightIndex % items.length) + items.length) % items.length;
        const currentItem = items[spotlightIndex];

        if (!currentItem) {
            console.error('Item not found at index:', spotlightIndex);
            spotlightIndex = 0;
            spotlightNextItem();
            return;
        }

        const runId = ++spotlightRunId;
        console.log(`Spotlighting item ${spotlightIndex + 1}/${items.length}`);

        clearSpotlightTimers();
        items.forEach(item => {
            item.classList.remove('spotlight', 'dimmed', 'push-up-1', 'push-up-2', 'push-up-3', 'push-down-1', 'push-down-2', 'push-down-3');
            // Reset any inline styles from animations
            item.style.transition = '';
            item.style.paddingTop = '';
            item.style.paddingRight = '';
            item.style.paddingBottom = '';
            item.style.paddingLeft = '';
            item.style.maxHeight = '';
            item.style.marginTop = '';
            item.style.marginBottom = '';
            item.style.transform = '';
        });

        scrollToItem(currentItem).then(() => {
            if (runId !== spotlightRunId || isPaused) return;

            // Use requestAnimationFrame for smoother transitions
            requestAnimationFrame(() => {
                if (runId !== spotlightRunId || isPaused) return;

                dimmingTimeout = setTimeout(() => {
                    if (runId !== spotlightRunId || isPaused) return;
                    requestAnimationFrame(() => {
                        items.forEach(item => {
                            if (item !== currentItem) {
                                item.classList.add('dimmed');
                            }
                        });
                    });
                }, DIMMING_DELAY);

                spotlightApplyTimeout = setTimeout(() => {
                    if (runId !== spotlightRunId || isPaused) return;
                    requestAnimationFrame(() => {
                        // Apply staggered push animations based on position
                        items.forEach((item, index) => {
                            if (item === currentItem) return;
                            
                            const distance = Math.abs(index - spotlightIndex);
                            if (index < spotlightIndex) {
                                // Items above spotlight - push up
                                if (distance === 1) item.classList.add('push-up-1');
                                else if (distance === 2) item.classList.add('push-up-2');
                                else if (distance === 3) item.classList.add('push-up-3');
                            } else {
                                // Items below spotlight - push down
                                if (distance === 1) item.classList.add('push-down-1');
                                else if (distance === 2) item.classList.add('push-down-2');
                                else if (distance === 3) item.classList.add('push-down-3');
                            }
                        });
                        
                        // Use Web Animations API for smooth expansion
                        // Read current computed styles (normal state) BEFORE adding spotlight class
                        const computedStyle = window.getComputedStyle(currentItem);
                        const startPaddingTop = computedStyle.paddingTop;
                        const startPaddingRight = computedStyle.paddingRight;
                        const startPaddingBottom = computedStyle.paddingBottom;
                        const startPaddingLeft = computedStyle.paddingLeft;
                        const startMaxHeight = computedStyle.maxHeight;
                        const startMarginTop = computedStyle.marginTop;
                        const startMarginBottom = computedStyle.marginBottom;
                        const startTransform = computedStyle.transform || 'none';
                        
                        // Temporarily disable CSS transitions to avoid conflicts
                        const originalTransition = currentItem.style.transition;
                        currentItem.style.transition = 'none';
                        
                        // Add spotlight class (for other styles like border, background, box-shadow)
                        currentItem.classList.add('spotlight');
                        
                        // Immediately set inline styles to starting values to prevent CSS from applying spotlight values
                        currentItem.style.paddingTop = startPaddingTop;
                        currentItem.style.paddingRight = startPaddingRight;
                        currentItem.style.paddingBottom = startPaddingBottom;
                        currentItem.style.paddingLeft = startPaddingLeft;
                        currentItem.style.maxHeight = startMaxHeight;
                        currentItem.style.marginTop = startMarginTop;
                        currentItem.style.marginBottom = startMarginBottom;
                        currentItem.style.transform = startTransform;
                        
                        // Force a reflow
                        void currentItem.offsetHeight;
                        
                        // Animate expansion to spotlight size
                        expandAnimation = currentItem.animate([
                            {
                                paddingTop: startPaddingTop,
                                paddingRight: startPaddingRight,
                                paddingBottom: startPaddingBottom,
                                paddingLeft: startPaddingLeft,
                                maxHeight: startMaxHeight,
                                marginTop: startMarginTop,
                                marginBottom: startMarginBottom,
                                transform: startTransform
                            },
                            {
                                paddingTop: '23px',
                                paddingRight: '24px',
                                paddingBottom: '35px',
                                paddingLeft: '14px',
                                maxHeight: '780px',
                                marginTop: '34px',
                                marginBottom: '34px',
                                transform: 'translateY(-6px) scaleX(1) scaleY(1.06)'
                            }
                        ], {
                            duration: 800,
                            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                            fill: 'forwards'
                        });
                        
                        expandAnimation.onfinish = () => {
                            // Re-enable transitions after animation completes
                            currentItem.style.transition = originalTransition;
                            expandAnimation = null;
                        };
                        
                        expandAnimation.oncancel = () => {
                            // Re-enable transitions if animation is cancelled
                            currentItem.style.transition = originalTransition;
                            expandAnimation = null;
                        };
                        
                        expandAnimation.oncancel = () => {
                            expandAnimation = null;
                        };
                        
                        isSpotlighting = true;
                    });
                }, SPOTLIGHT_ANIMATION_DELAY);
            });

            spotlightTimeout = setTimeout(() => {
                if (runId !== spotlightRunId || isPaused) return;

                requestAnimationFrame(() => {
                    // Use Web Animations API for smooth shrink animation
                    // Read current inline styles (from expand animation) as starting point
                    const computedStyle = window.getComputedStyle(currentItem);
                    const startPaddingTop = currentItem.style.paddingTop || computedStyle.paddingTop;
                    const startPaddingRight = currentItem.style.paddingRight || computedStyle.paddingRight;
                    const startPaddingBottom = currentItem.style.paddingBottom || computedStyle.paddingBottom;
                    const startPaddingLeft = currentItem.style.paddingLeft || computedStyle.paddingLeft;
                    const startMaxHeight = currentItem.style.maxHeight || computedStyle.maxHeight;
                    const startMarginTop = currentItem.style.marginTop || computedStyle.marginTop;
                    const startMarginBottom = currentItem.style.marginBottom || computedStyle.marginBottom;
                    const startTransform = currentItem.style.transform || computedStyle.transform || 'translateY(-6px) scaleX(1) scaleY(1.06)';
                    
                    // Temporarily disable CSS transitions to avoid conflicts
                    const originalTransition = currentItem.style.transition;
                    currentItem.style.transition = 'none';
                    
                    // Target values (normal state)
                    const targetPadding = '24px';
                    const targetMaxHeight = '420px';
                    const targetTransform = 'translateY(0) scaleX(1) scaleY(1)';
                    const targetMarginTop = '18px';
                    const targetMarginBottom = '26px';
                    
                    shrinkAnimation = currentItem.animate([
                        {
                            paddingTop: startPaddingTop,
                            paddingRight: startPaddingRight,
                            paddingBottom: startPaddingBottom,
                            paddingLeft: startPaddingLeft,
                            maxHeight: startMaxHeight,
                            marginTop: startMarginTop,
                            marginBottom: startMarginBottom,
                            transform: startTransform
                        },
                        {
                            paddingTop: targetPadding,
                            paddingRight: targetPadding,
                            paddingBottom: targetPadding,
                            paddingLeft: targetPadding,
                            maxHeight: targetMaxHeight,
                            marginTop: targetMarginTop,
                            marginBottom: targetMarginBottom,
                            transform: targetTransform
                        }
                    ], {
                        duration: 700,
                        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                        fill: 'forwards'
                    });

                    shrinkAnimation.onfinish = () => {
                        if (runId !== spotlightRunId || isPaused) {
                            shrinkAnimation = null;
                            return;
                        }
                        
                        // Wait an extra frame to ensure animation is fully complete
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                // Remove spotlight class first
                                currentItem.classList.remove('spotlight');
                                
                                // Re-enable transitions and clear inline styles after class removal
                                setTimeout(() => {
                                    currentItem.style.transition = originalTransition;
                                    currentItem.style.paddingTop = '';
                                    currentItem.style.paddingRight = '';
                                    currentItem.style.paddingBottom = '';
                                    currentItem.style.paddingLeft = '';
                                    currentItem.style.maxHeight = '';
                                    currentItem.style.marginTop = '';
                                    currentItem.style.marginBottom = '';
                                    currentItem.style.transform = '';
                                }, 100);
                                
                                items.forEach(item => {
                                    item.classList.remove('dimmed', 'push-up-1', 'push-up-2', 'push-up-3', 'push-down-1', 'push-down-2', 'push-down-3');
                                });
                                isSpotlighting = false;

                                spotlightIndex = (spotlightIndex + 1) % items.length;

                                nextSpotlightDelay = setTimeout(() => {
                                    if (runId !== spotlightRunId || isPaused) return;
                                    requestAnimationFrame(() => {
                                        spotlightNextItem();
                                    });
                                }, TRANSITION_DELAY);
                                
                                shrinkAnimation = null;
                            });
                        });
                    };
                    
                    shrinkAnimation.oncancel = () => {
                        // Re-enable transitions if animation is cancelled
                        currentItem.style.transition = originalTransition;
                        shrinkAnimation = null;
                    };
                });
            }, SPOTLIGHT_DURATION);
        });
    }

    /**
     * Pause the spotlight cycle
     */
    function pauseSpotlight() {
        if (isPaused) return;
        isPaused = true;
        clearSpotlightTimers();
        cancelScrollAnimation();
        console.log('Spotlight paused');
    }

    /**
     * Resume the spotlight cycle
     */
    function resumeSpotlight() {
        if (!isPaused) return;
        isPaused = false;
        console.log('Spotlight resumed');
        restartSpotlightCycle();
    }

    /**
     * Scroll to a specific item smoothly - positions item at top of screen
     */
    function scrollToItem(item) {
        if (!item) return Promise.resolve();

        const containerPaddingTop = 28; // Match feed-container padding-top
        const containerHeight = feedContainer.clientHeight;
        const maxScroll = Math.max(feedContainer.scrollHeight - containerHeight, 0);
        // Position item at top of visible area (accounting for container padding)
        const targetScroll = Math.min(
            Math.max(item.offsetTop - containerPaddingTop, 0),
            maxScroll
        );

        return smoothScrollTo(targetScroll, SCROLL_DURATION);
    }

    /**
     * Smoothly animate scroll position via requestAnimationFrame
     */
    function smoothScrollTo(target, duration = SCROLL_DURATION) {
        cancelScrollAnimation();

        return new Promise(resolve => {
            const start = feedContainer.scrollTop;
            const distance = target - start;

            if (Math.abs(distance) < 1 || duration <= 0) {
                feedContainer.scrollTop = target;
                resolve();
                return;
            }

            const startTime = performance.now();

            const step = (timestamp) => {
                const elapsed = timestamp - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = easeInOutCubic(progress);

                feedContainer.scrollTop = start + (distance * easedProgress);

                if (progress < 1) {
                    scrollAnimationFrame = requestAnimationFrame(step);
                } else {
                    scrollAnimationFrame = null;
                    resolve();
                }
            };

            scrollAnimationFrame = requestAnimationFrame(step);
        });
    }

    /**
     * Cubic ease-in-out easing curve
     */
    function easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }


    /**
     * Create a feed item DOM element
     */
    function createFeedItemElement(item) {
        const critical = isCritical(item);

        const itemDiv = document.createElement('div');
        itemDiv.className = `feed-item${critical ? ' critical' : ''}`;

        const imageHTML = item.image
            ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
            : '';

        const fallbackDisplay = item.image ? 'none' : 'flex';

        // Use fullText if available from backend, otherwise use description
        const displayText = item.fullText || item.description || '';
        const shortText = displayText.substring(0, 300) + (displayText.length > 300 ? '...' : '');

        const metaContent = `
            <span class="item-source">
                <img src="${escapeHtml(item.sourceIcon)}" alt="" class="source-icon"
                     onerror="this.style.display='none';">
                ${escapeHtml(item.source)}
            </span>
            <span class="item-timestamp">${formatTimestamp(item.pubDate)}</span>
        `;

        itemDiv.innerHTML = `
            <div class="item-header">
                <div class="item-media">
                    <div class="item-image">
                        ${imageHTML}
                        <div class="fallback-icon" style="display: ${fallbackDisplay};">
                            <img src="${escapeHtml(item.sourceIcon)}" alt="${escapeHtml(item.source)}"
                                 onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%234fc3f7%22%3E%3Cpath d=%22M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z%22%3E%3C/path%3E%3C/svg%3E';">
                        </div>
                    </div>
                    <div class="item-meta item-meta-under-image">
                        ${metaContent}
                    </div>
                </div>
                <div class="item-content">
                    <h3 class="item-title">
                        <a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">
                            ${escapeHtml(item.title)}
                        </a>
                    </h3>
                    <p class="item-description">${escapeHtml(shortText)}</p>
                    <div class="item-full-text">${escapeHtml(displayText)}</div>
                    <div class="item-meta item-meta-inline">
                        ${metaContent}
                    </div>
                </div>
            </div>
            ${critical ? '<div class="critical-badge">⚠️ Important</div>' : ''}
        `;

        return itemDiv;
    }

    /**
     * Update debug footer with stats
     */
    function updateDebugFooter() {
        if (!feedFooter || !debugInfo) {
            return;
        }
        feedFooter.style.display = 'flex';

        if (!config || !config.showDebugFooter) {
            debugInfo.textContent = '';
            return;
        }

        const version = config.version || '1.0.0';
        const moduleName = 'SOC RSS Feed Scroller';
        const totalFeeds = config.feeds ? config.feeds.length : 0;
        const totalItems = feedItems.length;

        let footerText = `${moduleName} v${version} | Feeds: ${loadedFeedsCount}/${totalFeeds} | Items: ${totalItems}`;

        // Add countdown if next refresh time is set
        if (nextRefreshTime) {
            const timeRemaining = nextRefreshTime - Date.now();
            if (timeRemaining > 0) {
                footerText += ` | Next update: ${formatCountdown(timeRemaining)}`;
            } else {
                footerText += ` | Updating...`;
            }
        }

        debugInfo.textContent = footerText;
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Initialize theme selector buttons
     */
    function initThemeSelector() {
        if (!themeSelector) return;
        const buttons = themeSelector.querySelectorAll('button[data-theme]');
        if (!buttons.length) return;

        const savedTheme = localStorage.getItem('rssTheme') || currentTheme;
        applyTheme(savedTheme);

        buttons.forEach(button => {
            button.addEventListener('click', () => {
                applyTheme(button.dataset.theme);
            });
        });
    }

    /**
     * Apply theme to body and persist preference
     */
    function applyTheme(theme) {
        const supportedThemes = ['blue', 'crimson', 'black'];
        if (!supportedThemes.includes(theme)) {
            theme = 'blue';
        }

        supportedThemes.forEach(name => {
            document.body.classList.remove(`theme-${name}`);
        });

        document.body.classList.add(`theme-${theme}`);
        currentTheme = theme;
        localStorage.setItem('rssTheme', theme);
        updateThemeButtons(theme);
    }

    /**
     * Update visual state of theme buttons
     */
    function updateThemeButtons(activeTheme) {
        if (!themeSelector) return;
        const buttons = themeSelector.querySelectorAll('button[data-theme]');
        buttons.forEach(button => {
            const isActive = button.dataset.theme === activeTheme;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-pressed', isActive);
        });
    }


    /**
     * Setup auto-refresh interval
     */
    function setupAutoRefresh() {
        if (!config || !config.refreshInterval) return;

        setInterval(() => {
            console.log('Refreshing feeds...');
            loadFeeds();
        }, config.refreshInterval);
    }

    /**
     * Show loading indicator
     */
    function showLoading() {
        loadingIndicator.style.display = 'flex';
        errorIndicator.style.display = 'none';
    }

    /**
     * Hide loading indicator
     */
    function hideLoading() {
        loadingIndicator.style.display = 'none';
    }

    /**
     * Update loading progress
     */
    function updateLoadingProgress(current, total, message) {
        if (loadingProgress) {
            loadingProgress.textContent = `[${current}/${total}] ${message}`;
        }
    }

    /**
     * Update loading stats
     */
    function updateLoadingStats(totalItems, totalImages) {
        if (loadingStats) {
            loadingStats.textContent = `Total: ${totalItems} items (${totalImages} with images)`;
        }
    }

    /**
     * Start countdown timer for next refresh
     */
    function startCountdown() {
        // Clear any existing countdown
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }

        // Update countdown every second
        countdownInterval = setInterval(() => {
            updateDebugFooter();
        }, 1000);
    }

    /**
     * Format milliseconds to minutes:seconds
     */
    function formatCountdown(ms) {
        if (ms <= 0) return '0:00';
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Show error message
     */
    function showError(message) {
        loadingIndicator.style.display = 'none';
        errorIndicator.style.display = 'flex';
        if (message && errorDetails) {
            errorDetails.textContent = message;
        }
    }

    /**
     * Show temporary notification
     * @param {string} message - Notification message
     * @param {number} duration - Duration in milliseconds (default: 15000)
     */
    function showNotification(message, duration = 15000) {
        if (!notificationContainer) return;

        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;

        notificationContainer.appendChild(notification);

        // Auto-remove after duration
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300); // Wait for fade-out animation
        }, duration);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
