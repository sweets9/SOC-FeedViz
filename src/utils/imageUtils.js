/**
 * Image URL utilities
 * Handles image URLs from backend (cached images) and external sources
 */

/**
 * Get the backend URL for image requests
 * In development, uses proxy. In production, uses backend URL.
 */
export function getBackendImageUrl(imagePath) {
  if (!imagePath) return null;
  
  // If it's already an absolute URL (http/https), return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it's a relative path starting with /images, it's a cached image
  // The Vite proxy will handle it in dev, or we can construct the full URL
  if (imagePath.startsWith('/images/')) {
    // In dev, the proxy handles this
    // In production, you might want to prepend the backend URL
    const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
    return backendUrl ? `${backendUrl}${imagePath}` : imagePath;
  }
  
  return imagePath;
}

/**
 * Check if an image URL is from the backend cache
 */
export function isCachedImage(url) {
  return url && url.startsWith('/images/');
}

