import React, { forwardRef } from 'react';
import { FeedItem } from './FeedItem';

export const FeedContainer = forwardRef(function FeedContainer({ items, config, imageFallbacks }, ref) {
  if (items.length === 0) {
    return (
      <div className="feed-container" ref={ref}>
        <div className="error">
          <p>⚠️ No RSS feeds available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="feed-container" ref={ref}>
      {items.map((item, index) => (
        <FeedItem 
          key={item.id} 
          item={item} 
          config={config} 
          imageFallbacks={imageFallbacks}
        />
      ))}
    </div>
  );
});

