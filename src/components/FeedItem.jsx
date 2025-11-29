import React, { useState, useEffect } from 'react';
import { formatTimestamp } from '../utils/feedUtils';
import { getBackendImageUrl } from '../utils/imageUtils';
import { getFallbackImageSync, getFallbackImage } from '../utils/imageFallback';

export function FeedItem({ item, config, imageFallbacks }) {
  const displayText = item.fullText || item.description || '';
  const [fallbackImage, setFallbackImage] = useState(null);
  const [imageFailed, setImageFailed] = useState(false);

  // Check if we should show fallback for ACSC articles even if image exists
  const shouldShowFallback = () => {
    // Check if this is an ACSC article and we want to use fallback override
    const articleUrl = item.link || item.guid;
    if (articleUrl) {
      try {
        const domain = new URL(articleUrl).hostname;
        if (domain.includes('acsc.gov.au') || domain.includes('cyber.gov.au')) {
          return true; // Always show fallback override for ACSC domains
        }
      } catch (e) {
        // Invalid URL, show fallback
        return true;
      }
    }
    
    // For other domains, show fallback only if no image or image failed
    if (!item.image) return true;
    if (imageFailed) return true;
    
    return false;
  };

  // Load fallback image when component mounts or image fails
  useEffect(() => {
    // Always load fallback for ACSC articles or when image fails
    const shouldLoadFallback = imageFailed || shouldShowFallback();
    
    if (shouldLoadFallback && !fallbackImage) {
      console.log('[FeedItem] Loading fallback image for:', item.source);
      getFallbackImage(item, imageFallbacks).then(url => {
        if (url) {
          console.log('[FeedItem] Fallback loaded:', url);
          setFallbackImage(url);
        } else {
          console.log('[FeedItem] No fallback available');
        }
      });
    }
  }, [imageFailed, item, fallbackImage, shouldShowFallback, imageFallbacks]);

  const sourceContent = (
    <span className="item-source">
      <img 
        src={getBackendImageUrl(item.sourceIcon)} 
        alt="" 
        className="source-icon"
        onError={(e) => { e.target.style.display = 'none'; }}
      />
      {item.source}
    </span>
  );

  const timeContent = (
    <span className="item-timestamp">{formatTimestamp(item.pubDate)}</span>
  );

  const handleImageError = (e) => {
    console.log('[FeedItem] Primary image failed to load:', item.image);
    setImageFailed(true);
    
    // Try fallback image first
    const syncFallback = getFallbackImageSync(item, imageFallbacks);
    if (syncFallback) {
      console.log('[FeedItem] Using synchronous fallback:', syncFallback);
      e.target.src = syncFallback;
      return;
    }
    
    // Hide primary image and show fallback div
    e.target.style.display = 'none';
    const fallback = e.target.nextElementSibling;
    if (fallback) fallback.style.display = 'flex';
  };

  const handleFallbackImageError = (e) => {
    console.log('[FeedItem] Fallback image failed to load:', e.target.src);
    // Hide fallback image, show generic SVG
    e.target.style.display = 'none';
    const genericFallback = e.target.nextElementSibling;
    if (genericFallback) genericFallback.style.display = 'block';
  };

  const fallbackDisplay = (item.image && !imageFailed) ? 'none' : 'flex';

  return (
    <div className="feed-item">
      <div className="item-header">
        <div className="item-media">
          <div className="item-image">
            {item.image && !shouldShowFallback() && (
              <img 
                src={getBackendImageUrl(item.image)} 
                alt={item.title} 
                onError={handleImageError}
                style={{ display: imageFailed && fallbackImage ? 'none' : 'block' }}
              />
            )}
            {shouldShowFallback() && (
              <>
                {fallbackImage ? (
                  <img 
                    src={fallbackImage}
                    alt={`${item.source} fallback`}
                    className="fallback-image"
                    onError={handleFallbackImageError}
                    style={{ display: 'block' }}
                  />
                ) : (
                  <div className="fallback-icon" style={{ display: 'flex' }}>
                    <img 
                      src={getBackendImageUrl(item.sourceIcon)} 
                      alt={item.source}
                      onError={(e) => {
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%234fc3f7%22%3E%3Cpath d=%22M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z%22%3E%3C/path%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                )}
              </>
            )}
            {!shouldShowFallback() && (
              <div className="fallback-icon" style={{ display: fallbackDisplay }}>
                <img 
                  src={getBackendImageUrl(item.sourceIcon)} 
                  alt={item.source}
                  onError={(e) => {
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%234fc3f7%22%3E%3Cpath d=%22M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z%22%3E%3C/path%3E%3C/svg%3E";
                  }}
                />
              </div>
            )}
            <svg 
              className="generic-fallback-icon" 
              style={{ display: 'none' }}
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#4fc3f7"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div className="item-meta item-meta-under-image">
            <div className="item-meta-bottom-right">{timeContent}</div>
          </div>
        </div>
        <div className="item-content">
          <h3 className="item-title">
            <a href={item.link} target="_blank" rel="noopener noreferrer">
              {item.title}
            </a>
          </h3>
          <div className="item-source-line">
            {sourceContent}
          </div>
          <div className="item-full-text">{displayText}</div>
          <div className="item-meta item-meta-inline">
            {timeContent}
          </div>
        </div>
      </div>
    </div>
  );
}

