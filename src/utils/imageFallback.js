/**
 * Image fallback utility with domain mapping and favicon caching
 */

// Domain to image mapping
const DOMAIN_IMAGE_MAP = {
  'acsc.gov.au': 'https://pbs.twimg.com/profile_images/1728904475790995456/nKGMT8Q4_400x400.jpg',
  'www.acsc.gov.au': 'https://pbs.twimg.com/profile_images/1728904475790995456/nKGMT8Q4_400x400.jpg',
  'cyber.gov.au': 'https://pbs.twimg.com/profile_images/1728904475790995456/nKGMT8Q4_400x400.jpg',
  'www.cyber.gov.au': 'https://pbs.twimg.com/profile_images/1728904475790995456/nKGMT8Q4_400x400.jpg',
  // Add more domain mappings as needed
};

// Cache for favicon URLs
const faviconCache = new Map();

// Statistics tracking
const fallbackStats = {
  totalProcessed: 0,
  primaryFailed: 0,
  domainFallbackUsed: 0,
  faviconFallbackUsed: 0, // Keep for backward compatibility but won't be used
  genericFallbackUsed: 0,
  domainsNeedingFallback: new Set(),
  failedDomains: new Set()
};

/**
 * Extract domain from URL
 */
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    console.warn('[ImageFallback] Invalid URL:', url);
    return null;
  }
}

/**
 * Get favicon URL for a domain
 */
async function getFaviconUrl(domain) {
  if (!domain) return null;
  
  // Check cache first
  if (faviconCache.has(domain)) {
    const cached = faviconCache.get(domain);
    if (cached === 'FAILED') return null;
    return cached;
  }
  
  // Mark as checking to prevent duplicate requests
  faviconCache.set(domain, 'CHECKING');
  
  try {
    // Try multiple favicon sources
    const faviconSources = [
      `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      `https://${domain}/favicon.ico`,
      `https://${domain}/favicon.png`,
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    ];
    
    for (const faviconUrl of faviconSources) {
      if (await testImageLoad(faviconUrl)) {
        faviconCache.set(domain, faviconUrl);
        return faviconUrl;
      }
    }
    
    // All sources failed
    faviconCache.set(domain, 'FAILED');
    return null;
  } catch (error) {
    console.warn('[ImageFallback] Error fetching favicon:', error);
    faviconCache.set(domain, 'FAILED');
    return null;
  }
}

/**
 * Test if an image URL loads successfully
 */
function testImageLoad(url) {
  return new Promise((resolve) => {
    const img = new Image();
    const timeout = setTimeout(() => {
      resolve(false);
    }, 3000); // 3 second timeout
    
    img.onload = () => {
      clearTimeout(timeout);
      resolve(true);
    };
    
    img.onerror = () => {
      clearTimeout(timeout);
      resolve(false);
    };
    
    img.src = url;
  });
}

/**
 * Get fallback image for an article
 */
export async function getFallbackImage(article, customDomainMap = null) {
  const { link, guid } = article || {};
  const articleUrl = link || guid;
  
  fallbackStats.totalProcessed++;
  
  if (!articleUrl) {
    console.warn('[ImageFallback] No URL found in article');
    fallbackStats.genericFallbackUsed++;
    return null;
  }
  
  const domain = extractDomain(articleUrl);
  if (!domain) {
    fallbackStats.genericFallbackUsed++;
    return null;
  }
  
  fallbackStats.primaryFailed++;
  fallbackStats.domainsNeedingFallback.add(domain);
  
  // Use custom domain map if provided, otherwise use default
  const domainMap = customDomainMap || DOMAIN_IMAGE_MAP;
  
  // Check if we have a domain-specific image (override)
  const domainImage = domainMap[domain];
  if (domainImage) {
    console.log(`[ImageFallback] Using domain override image for ${domain}: ${domainImage}`);
    
    // Test if the domain image loads
    if (await testImageLoad(domainImage)) {
      fallbackStats.domainFallbackUsed++;
      return domainImage;
    } else {
      console.warn(`[ImageFallback] Domain override image failed to load: ${domainImage}`);
      fallbackStats.failedDomains.add(domain);
    }
  }
  
  // Skip favicon fallback for main article images - go directly to generic
  console.log(`[ImageFallback] No domain override, using generic fallback for ${domain}`);
  fallbackStats.genericFallbackUsed++;
  fallbackStats.failedDomains.add(domain);
  return null; // Return null to trigger generic SVG fallback
}

/**
 * Get fallback image synchronously (returns cached or domain image)
 */
export function getFallbackImageSync(article, customDomainMap = null) {
  const { link, guid } = article || {};
  const articleUrl = link || guid;
  
  if (!articleUrl) return null;
  
  const domain = extractDomain(articleUrl);
  if (!domain) return null;
  
  // Use custom domain map if provided, otherwise use default
  const domainMap = customDomainMap || DOMAIN_IMAGE_MAP;
  
  // Check domain override mapping first
  const domainImage = domainMap[domain];
  if (domainImage) {
    console.log(`[ImageFallback] Sync domain override found for ${domain}: ${domainImage}`);
    return domainImage;
  }
  
  // Skip favicon fallback for main article images
  console.log(`[ImageFallback] No sync domain override available for ${domain}`);
  return null; // Return null to trigger generic SVG fallback
}

/**
 * Preload fallback images for common domains
 */
export function preloadCommonFallbacks() {
  const commonDomains = Object.keys(DOMAIN_IMAGE_MAP);
  commonDomains.forEach(domain => {
    const imageUrl = DOMAIN_IMAGE_MAP[domain];
    if (imageUrl) {
      const img = new Image();
      img.src = imageUrl;
    }
  });
}

/**
 * Add new domain mapping
 */
export function addDomainMapping(domain, imageUrl) {
  DOMAIN_IMAGE_MAP[domain] = imageUrl;
  console.log(`[ImageFallback] Added domain mapping: ${domain} -> ${imageUrl}`);
}

/**
 * Clear favicon cache
 */
export function clearFaviconCache() {
  faviconCache.clear();
  console.log('[ImageFallback] Favicon cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const stats = {
    totalCached: faviconCache.size,
    successful: 0,
    failed: 0,
    checking: 0
  };
  
  faviconCache.forEach(value => {
    if (value === 'FAILED') stats.failed++;
    else if (value === 'CHECKING') stats.checking++;
    else stats.successful++;
  });
  
  return stats;
}

/**
 * Get fallback statistics
 */
export function getFallbackStats() {
  return {
    totalProcessed: fallbackStats.totalProcessed,
    primaryFailed: fallbackStats.primaryFailed,
    domainFallbackUsed: fallbackStats.domainFallbackUsed,
    faviconFallbackUsed: fallbackStats.faviconFallbackUsed,
    genericFallbackUsed: fallbackStats.genericFallbackUsed,
    domainsNeedingFallback: Array.from(fallbackStats.domainsNeedingFallback),
    failedDomains: Array.from(fallbackStats.failedDomains),
    failureRate: fallbackStats.totalProcessed > 0 
      ? Math.round((fallbackStats.primaryFailed / fallbackStats.totalProcessed) * 100)
      : 0
  };
}

/**
 * Reset fallback statistics
 */
export function resetFallbackStats() {
  fallbackStats.totalProcessed = 0;
  fallbackStats.primaryFailed = 0;
  fallbackStats.domainFallbackUsed = 0;
  fallbackStats.faviconFallbackUsed = 0;
  fallbackStats.genericFallbackUsed = 0;
  fallbackStats.domainsNeedingFallback.clear();
  fallbackStats.failedDomains.clear();
  console.log('[ImageFallback] Statistics reset');
}
