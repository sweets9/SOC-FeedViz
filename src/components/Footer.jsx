import React from 'react';

function formatCountdown(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export function Footer({ config, feedItems, loadedFeedsCount, nextRefreshTime }) {
  const version = config?.version || '1.0.0';
  const moduleName = 'SOC RSS Feed Scroller';
  const totalFeeds = config?.feeds?.length || 0;
  const totalItems = feedItems?.length || 0;

  let footerText = `${moduleName} v${version} | Feeds: ${loadedFeedsCount}/${totalFeeds} | Items: ${totalItems}`;

  if (nextRefreshTime) {
    const timeRemaining = nextRefreshTime - Date.now();
    if (timeRemaining > 0) {
      footerText += ` | Next update: ${formatCountdown(timeRemaining)}`;
    } else {
      footerText += ` | Updating...`;
    }
  }

  return <>{footerText}</>;
}

