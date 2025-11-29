/**
 * SOC RSS Feed Backend Server
 * Interactive CLI-based service with caching and statistics
 */

import express from 'express';
import cors from 'cors';
import { extract as extractFeed } from '@extractus/feed-extractor';
import { extract as extractArticle } from '@extractus/article-extractor';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import readline from 'readline';
import { API_ENDPOINTS } from '../shared/api/endpoints.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3003;

// Configuration
const FETCH_INTERVAL = 10 * 60 * 1000; // 10 minutes
const CACHE_DIR = path.join(__dirname, 'cache');
const IMAGES_DIR = path.join(CACHE_DIR, 'images');
const FEED_CACHE_FILE = path.join(CACHE_DIR, 'feeds.json');

// IP Allow List - comma-separated IPs or CIDR ranges, or '*' for all
const ALLOWED_IPS = (process.env.ALLOWED_IPS || '127.0.0.1,::1,localhost').split(',').map(ip => ip.trim());

/**
 * Get client IP address from request
 */
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.ip ||
         'unknown';
}

/**
 * Check if IP is allowed
 */
function isIpAllowed(ip) {
  if (ALLOWED_IPS.includes('*')) return true;
  
  // Check exact match
  if (ALLOWED_IPS.includes(ip)) return true;
  
  // Check localhost variants
  if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
    return ALLOWED_IPS.some(allowed => 
      allowed === '127.0.0.1' || allowed === '::1' || allowed === 'localhost'
    );
  }
  
  // Check CIDR ranges (simple implementation)
  for (const allowed of ALLOWED_IPS) {
    if (allowed.includes('/')) {
      // Simple CIDR check - in production, use a proper CIDR library
      const [network, prefix] = allowed.split('/');
      if (ip.startsWith(network.split('.').slice(0, parseInt(prefix) / 8).join('.'))) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * IP Allow List Middleware
 */
function ipAllowListMiddleware(req, res, next) {
  // Always allow static files and images
  if (req.path.startsWith('/images/') || req.path.endsWith('.html') || req.path.endsWith('.css') || req.path.endsWith('.js')) {
    return next();
  }
  
  const clientIp = getClientIp(req);
  
  if (!isIpAllowed(clientIp)) {
    console.log(`❌ Blocked request from ${clientIp} to ${req.path}`);
    return res.status(403).json({ error: 'Access denied' });
  }
  
  next();
}

// Ensure cache directories exist
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

// IP Allow List Middleware (before other middleware)
app.use(ipAllowListMiddleware);

// Request logging middleware - log all IPs and requests
const requestLog = [];
const MAX_LOG_ENTRIES = 100;

function logRequest(req, res, next) {
  const clientIp = getClientIp(req);
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const userAgent = req.headers['user-agent'] || 'Unknown';
  
  const logEntry = {
    timestamp,
    ip: clientIp,
    method,
    path,
    userAgent: userAgent.substring(0, 50) // Truncate for display
  };
  
  requestLog.unshift(logEntry);
  if (requestLog.length > MAX_LOG_ENTRIES) {
    requestLog.pop();
  }
  
  // Log to console
  console.log(`[${timestamp}] ${method} ${path} from ${clientIp}`);
  
  next();
}

// Request logging middleware (after IP check, before other middleware)
app.use(logRequest);

// Enable CORS for frontend
app.use(cors());
app.use(express.json());

// Serve frontend files from parent directory
app.use(express.static(path.join(__dirname, '..')));

// Serve cached images
app.use('/images', express.static(IMAGES_DIR));

// Load version from config.json
let appVersion = '2.3.0';
try {
  const configPath = path.join(__dirname, '..', 'config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    appVersion = config.version || appVersion;
  }
} catch (error) {
  console.warn('Could not load version from config.json, using default');
}

// Feed configuration
const feedConfig = {
    feeds: [
        {
            name: "ACSC Advisories",
            url: "https://www.cyber.gov.au/rss/advisories",
            icon: "https://www.cyber.gov.au/themes/custom/cyber/favicon.ico"
        },
        {
            name: "ACSC Alerts",
            url: "https://www.cyber.gov.au/rss/alerts",
            icon: "https://www.cyber.gov.au/themes/custom/cyber/favicon.ico"
        },
        {
            name: "Unit 42 Threat Research",
            url: "https://unit42.paloaltonetworks.com/feed/",
            icon: "https://unit42.paloaltonetworks.com/wp-content/uploads/2019/11/cropped-unit42-favicon-32x32.png"
        },
        {
            name: "The Hacker News",
            url: "https://feeds.feedburner.com/TheHackersNews",
            icon: "https://thehackernews.com/images/favicon.ico"
        },
        {
            name: "Krebs on Security",
            url: "https://krebsonsecurity.com/feed/",
            icon: "https://krebsonsecurity.com/favicon.ico"
        },
        {
            name: "Bleeping Computer",
            url: "https://www.bleepingcomputer.com/feed/",
            icon: "https://www.bleepingcomputer.com/favicon.ico"
        },
        {
            name: "Dark Reading",
            url: "https://www.darkreading.com/rss_simple.asp",
            icon: "https://www.darkreading.com/favicon.ico"
        }
    ],
    maxItemsPerFeed: 5
};

// In-memory cache with per-feed timestamps
let cachedFeeds = {
    lastUpdated: null,
    items: [],
    feedStatus: {},
    feedTimestamps: {}
};

let isRefreshing = false;
let autoRefreshTimer = null;

/**
 * Get directory size recursively
 */
function getDirectorySize(dirPath) {
    let totalSize = 0;

    try {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);

            if (stats.isDirectory()) {
                totalSize += getDirectorySize(filePath);
            } else {
                totalSize += stats.size;
            }
        }
    } catch (error) {
        console.error(`Error reading directory ${dirPath}:`, error.message);
    }

    return totalSize;
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get cache statistics
 */
function getCacheStats() {
    const stats = {
        feeds: feedConfig.feeds.length,
        articles: cachedFeeds.items?.length || 0,
        images: 0,
        cacheSize: 0,
        lastUpdated: cachedFeeds.lastUpdated || 'Never'
    };

    // Count images
    try {
        const imageFiles = fs.readdirSync(IMAGES_DIR);
        stats.images = imageFiles.length;
    } catch (error) {
        stats.images = 0;
    }

    // Get cache size
    stats.cacheSize = formatBytes(getDirectorySize(CACHE_DIR));

    return stats;
}

/**
 * Generate a hash for a URL to use as filename
 */
function urlToFilename(url) {
    const hash = crypto.createHash('md5').update(url).digest('hex');
    try {
        const ext = path.extname(new URL(url).pathname) || '.jpg';
        return hash + ext;
    } catch {
        return hash + '.jpg';
    }
}

/**
 * Cache an image from URL
 */
async function cacheImage(imageUrl) {
    try {
        const filename = urlToFilename(imageUrl);
        const filepath = path.join(IMAGES_DIR, filename);

        // Check if already cached
        if (fs.existsSync(filepath)) {
            return `/images/${filename}`;
        }

        const response = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SOCFeedBot/1.0)'
            },
            signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) return null;

        const buffer = Buffer.from(await response.arrayBuffer());
        fs.writeFileSync(filepath, buffer);

        return `/images/${filename}`;
    } catch (error) {
        return null;
    }
}

/**
 * Cache a favicon
 */
async function cacheFavicon(iconUrl, feedName) {
    try {
        const safeName = feedName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        let ext = '.ico';
        try {
            ext = path.extname(new URL(iconUrl).pathname) || '.ico';
        } catch { }
        const filename = `favicon-${safeName}${ext}`;
        const filepath = path.join(IMAGES_DIR, filename);

        // Check if already cached
        if (fs.existsSync(filepath)) {
            return `/images/${filename}`;
        }

        const response = await fetch(iconUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SOCFeedBot/1.0)'
            },
            signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) return null;

        const buffer = Buffer.from(await response.arrayBuffer());
        fs.writeFileSync(filepath, buffer);

        return `/images/${filename}`;
    } catch (error) {
        return null;
    }
}

/**
 * Extract full article content
 */
async function extractArticleContent(articleUrl) {
    try {
        const article = await extractArticle(articleUrl, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!article) {
            return { fullText: null, image: null, author: null };
        }

        let content = article.content || '';
        // Preserve paragraph breaks and line breaks
        content = content
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

        if (content.length > 2000) {
            content = content.substring(0, 2000) + '...';
        }

        return {
            fullText: content || article.description || null,
            image: article.image || null,
            author: article.author || null
        };
    } catch (error) {
        return {
            fullText: null,
            image: null,
            author: null
        };
    }
}

/**
 * Parse RSS feed
 */
async function parseFeed(feedUrl) {
    const feed = await extractFeed(feedUrl, {
        timeout: 15000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SOCFeedBot/1.0)',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        }
    });

    if (!feed || !feed.entries) {
        return [];
    }

    return feed.entries.map(entry => {
        let image = null;

        // Try to extract image from description HTML with multiple patterns
        if (entry.description) {
            // Pattern 1: Standard img tags
            let match = entry.description.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (match && match[1]) {
                image = match[1];
            } else {
                // Pattern 2: Open Graph meta tags (if description contains meta)
                match = entry.description.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
                if (match && match[1]) {
                    image = match[1];
                } else {
                    // Pattern 3: Twitter card image
                    match = entry.description.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
                    if (match && match[1]) {
                        image = match[1];
                    } else {
                        // Pattern 4: WordPress featured images (common in blogs)
                        match = entry.description.match(/<img[^>]+class=["'][^"']*wp-post-image[^"']*["'][^>]+src=["']([^"']+)["']/i);
                        if (match && match[1]) {
                            image = match[1];
                        } else {
                            // Pattern 5: Any img with src containing common image paths
                            match = entry.description.match(/<img[^>]+src=["']([^"']*\.(jpg|jpeg|png|gif|webp))["']/i);
                            if (match && match[1]) {
                                image = match[1];
                            }
                        }
                    }
                }
            }
        }

        // Also try to extract from content field if available
        if (!image && entry.content) {
            const match = entry.content.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (match && match[1]) {
                image = match[1];
            }
        }

        // If still no image found, try to fetch from the article URL directly
        if (!image && entry.link) {
            // For now, we'll skip the heavy lifting of fetching the full article
            // but we could add article extraction here if needed
            console.log(`[Image] No image found in feed for: ${entry.title}`);
        }

        return {
            title: entry.title || 'No title',
            link: entry.link || '#',
            description: entry.description || '',
            pubDate: entry.published || entry.updated || new Date().toISOString(),
            image: image
        };
    });
}

/**
 * Strip HTML tags
 */
function stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Process a single feed
 */
async function processFeed(feed) {
    const items = [];

    try {
        const rawItems = await parseFeed(feed.url);
        const limitedItems = rawItems.slice(0, feedConfig.maxItemsPerFeed);

        const cachedIcon = await cacheFavicon(feed.icon, feed.name);

        for (const rawItem of limitedItems) {
            try {
                const articleContent = await extractArticleContent(rawItem.link);

                let bestImage = articleContent.image || rawItem.image;
                let cachedImageUrl = null;

                if (bestImage) {
                    if (bestImage.startsWith('/')) {
                        try {
                            const baseUrl = new URL(rawItem.link).origin;
                            bestImage = baseUrl + bestImage;
                        } catch { }
                    }
                    cachedImageUrl = await cacheImage(bestImage);
                }

                items.push({
                    id: `${feed.name}-${Date.now()}-${items.length}`,
                    title: rawItem.title,
                    link: rawItem.link,
                    description: stripHtml(rawItem.description).substring(0, 300),
                    fullText: articleContent.fullText || stripHtml(rawItem.description),
                    pubDate: new Date(rawItem.pubDate).toISOString(),
                    source: feed.name,
                    sourceIcon: cachedIcon || feed.icon,
                    image: cachedImageUrl || bestImage,
                    author: articleContent.author || null
                });
            } catch (itemError) {
                // Skip failed items
            }
        }

        return {
            success: true,
            feedName: feed.name,
            itemCount: items.length,
            items
        };
    } catch (error) {
        return {
            success: false,
            feedName: feed.name,
            error: error.message,
            items: []
        };
    }
}

/**
 * Fetch all feeds and update cache
 */
async function fetchAllFeeds() {
    if (isRefreshing) {
        console.log('\n⚠️  Refresh already in progress...\n');
        return cachedFeeds;
    }

    isRefreshing = true;
    console.log('\n📡 Fetching feeds...');

    const allItems = [];
    const feedStatus = {};
    const feedTimestamps = {};

    const results = await Promise.all(
        feedConfig.feeds.map(feed => processFeed(feed))
    );

    for (const result of results) {
        feedStatus[result.feedName] = {
            success: result.success,
            itemCount: result.items?.length || 0,
            error: result.error || null
        };

        feedTimestamps[result.feedName] = new Date().toISOString();

        if (result.items) {
            allItems.push(...result.items);
        }
    }

    allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    cachedFeeds = {
        lastUpdated: new Date().toISOString(),
        items: allItems,
        feedStatus,
        feedTimestamps
    };

    try {
        fs.writeFileSync(FEED_CACHE_FILE, JSON.stringify(cachedFeeds, null, 2));
    } catch (error) {
        console.error('❌ Failed to save cache:', error.message);
    }

    isRefreshing = false;
    console.log(`✅ Fetched ${allItems.length} articles from ${feedConfig.feeds.length} feeds\n`);

    return cachedFeeds;
}

/**
 * Load cache from file
 */
function loadCache() {
    try {
        if (fs.existsSync(FEED_CACHE_FILE)) {
            const data = fs.readFileSync(FEED_CACHE_FILE, 'utf8');
            cachedFeeds = JSON.parse(data);
            console.log(`✅ Loaded ${cachedFeeds.items?.length || 0} cached articles`);
        } else {
            console.log('ℹ️  No cache file found');
        }
    } catch (error) {
        console.error('❌ Failed to load cache:', error.message);
    }
}

// API Routes (using shared endpoints)

app.get(API_ENDPOINTS.FEEDS, (req, res) => {
    // Load config to get image fallbacks
    const configPath = path.join(__dirname, '..', 'config.json');
    let imageFallbacks = {};
    
    if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        imageFallbacks = config.imageFallbacks || {};
    }
    
    res.json({
        ...cachedFeeds,
        imageFallbacks
    });
});

app.get(API_ENDPOINTS.STATUS, (req, res) => {
    const stats = getCacheStats();
    res.json({
        status: 'running',
        ...stats,
        feedStatus: cachedFeeds.feedStatus
    });
});

app.post(API_ENDPOINTS.REFRESH, async (req, res) => {
    if (isRefreshing) {
        return res.status(409).json({ error: 'Refresh already in progress' });
    }

    fetchAllFeeds().then(data => {
        // Don't wait for completion
    });

    res.json({ message: 'Refresh started' });
});

// Clear cache endpoint
app.delete(API_ENDPOINTS.CACHE, (req, res) => {
    try {
        // Clear cache directory
        if (fs.existsSync(IMAGES_DIR)) {
            const files = fs.readdirSync(IMAGES_DIR);
            for (const file of files) {
                fs.unlinkSync(path.join(IMAGES_DIR, file));
            }
        }
        if (fs.existsSync(FEED_CACHE_FILE)) {
            fs.unlinkSync(FEED_CACHE_FILE);
        }

        cachedFeeds = {
            lastUpdated: null,
            items: [],
            feedStatus: {},
            feedTimestamps: {}
        };

        res.json({ message: 'Cache cleared successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Display menu and stats
 */
function displayMenu() {
    const stats = getCacheStats();

    console.clear();
    console.log('SOC RSS Feed Backend - Control Center');
    console.log('Version: ' + appVersion);
    console.log('================================================');
    console.log(`Status: 🟢 Running on http://localhost:${PORT}`);
    console.log('================================================');
    console.log(`Configured Feeds:    ${String(stats.feeds).padEnd(5)} feeds`);
    console.log(`Cached Articles:     ${String(stats.articles).padEnd(5)} articles`);
    console.log(`Cached Images:       ${String(stats.images).padEnd(5)} images`);
    console.log(`Cache Size:          ${String(stats.cacheSize).padEnd(12)}`);
    console.log('================================================');
    console.log(`Last Updated:        ${stats.lastUpdated === 'Never' ? 'Never' : new Date(stats.lastUpdated).toLocaleString()}`);
    console.log('================================================');
    console.log('Commands:');
    console.log('  [R] Refresh Feeds Now');
    console.log('  [S] Show Feed Status');
    console.log('  [C] Clear Cache');
    console.log('  [A] Toggle Auto-refresh (currently: ' + (autoRefreshTimer ? 'ON' : 'OFF') + ')');
    console.log('  [L] View Request Log');
    console.log('  [Q] Quit');
    console.log('');
}

/**
 * Show feed status details
 */
function showFeedStatus() {
    console.log('\nFeed Status');
    console.log('================================================');

    for (const feed of feedConfig.feeds) {
        const status = cachedFeeds.feedStatus[feed.name];
        const timestamp = cachedFeeds.feedTimestamps[feed.name];

        if (status) {
            const icon = status.success ? '✅' : '❌';
            const name = feed.name.padEnd(25).substring(0, 25);
            const count = String(status.itemCount || 0).padStart(2);
            const time = timestamp ? new Date(timestamp).toLocaleTimeString() : 'Never';

            console.log(`${icon} ${name} ${count} items  ${time}`);
            if (status.error) {
                console.log(`   Error: ${status.error.substring(0, 45)}`);
            }
        } else {
            const name = feed.name.padEnd(25).substring(0, 25);
            console.log(`⚪ ${name} Not fetched yet`);
        }
    }

    console.log('================================================');
    console.log('\nPress any key to return to menu...');
}

/**
 * Show request log
 */
function showRequestLog() {
    console.log('\nRequest Log (Last ' + Math.min(requestLog.length, MAX_LOG_ENTRIES) + ' entries)');
    console.log('================================================');
    
    if (requestLog.length === 0) {
        console.log('No requests logged yet.');
    } else {
        console.log('Time                 IP Address         Method Path');
        console.log('------------------------------------------------');
        requestLog.slice(0, 20).forEach(entry => {
            const time = new Date(entry.timestamp).toLocaleTimeString();
            const ip = entry.ip.padEnd(18).substring(0, 18);
            const method = entry.method.padEnd(6).substring(0, 6);
            const path = entry.path.substring(0, 30);
            console.log(`${time}  ${ip}  ${method}  ${path}`);
        });
        
        if (requestLog.length > 20) {
            console.log(`... and ${requestLog.length - 20} more entries`);
        }
    }
    
    console.log('================================================');
    console.log('\nPress any key to return to menu...');
}

/**
 * CLI Interface
 */
function startCLI() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
    }

    displayMenu();

    process.stdin.on('keypress', async (str, key) => {
        if (key.ctrl && key.name === 'c') {
            process.exit();
        }

        const cmd = key.name?.toUpperCase();

        if (cmd === 'R') {
            displayMenu();
            await fetchAllFeeds();
            displayMenu();
        } else if (cmd === 'S') {
            console.clear();
            showFeedStatus();

            // Wait for any key
            const waitForKey = new Promise(resolve => {
                const handler = () => {
                    process.stdin.removeListener('keypress', handler);
                    resolve();
                };
                process.stdin.once('keypress', handler);
            });
            await waitForKey;
            displayMenu();
        } else if (cmd === 'L') {
            console.clear();
            showRequestLog();

            // Wait for any key
            const waitForKey = new Promise(resolve => {
                const handler = () => {
                    process.stdin.removeListener('keypress', handler);
                    resolve();
                };
                process.stdin.once('keypress', handler);
            });
            await waitForKey;
            displayMenu();
        } else if (cmd === 'C') {
            displayMenu();
            console.log('🗑️  Clearing cache...');

            try {
                if (fs.existsSync(IMAGES_DIR)) {
                    const files = fs.readdirSync(IMAGES_DIR);
                    for (const file of files) {
                        fs.unlinkSync(path.join(IMAGES_DIR, file));
                    }
                }
                if (fs.existsSync(FEED_CACHE_FILE)) {
                    fs.unlinkSync(FEED_CACHE_FILE);
                }

                cachedFeeds = {
                    lastUpdated: null,
                    items: [],
                    feedStatus: {},
                    feedTimestamps: {}
                };

                console.log('✅ Cache cleared successfully\n');
            } catch (error) {
                console.log(`❌ Error clearing cache: ${error.message}\n`);
            }

            setTimeout(() => displayMenu(), 2000);
        } else if (cmd === 'A') {
            if (autoRefreshTimer) {
                clearInterval(autoRefreshTimer);
                autoRefreshTimer = null;
            } else {
                autoRefreshTimer = setInterval(fetchAllFeeds, FETCH_INTERVAL);
            }
            displayMenu();
        } else if (cmd === 'Q') {
            console.clear();
            console.log('\n👋 Shutting down...\n');
            process.exit(0);
        }
    });
}

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Backend server started on http://localhost:${PORT}\n`);
    loadCache();

    // Auto-fetch on startup if cache is empty or old
    if (!cachedFeeds.lastUpdated || cachedFeeds.items.length === 0) {
        console.log('📡 Initial feed fetch starting...\n');
        fetchAllFeeds().then(() => {
            startCLI();
        });
    } else {
        const cacheAge = Date.now() - new Date(cachedFeeds.lastUpdated).getTime();
        if (cacheAge > FETCH_INTERVAL) {
            console.log('⚠️  Cache is old, refreshing...\n');
            fetchAllFeeds().then(() => {
                startCLI();
            });
        } else {
            startCLI();
        }
    }
});
