import React from 'react';

export function LoadingIndicator({ loading, feedLog, progress, stats }) {
  if (!loading) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="spinner"></div>
        <p id="loadingText">Loading RSS feeds...</p>
        {progress && <p id="loadingProgress">{progress}</p>}
        {stats && <p id="loadingStats">{stats}</p>}
        <div className="feed-log-container">
          <div className="feed-log">
            {feedLog.map((entry, index) => (
              <div key={index} className={`feed-log-entry ${entry.type}`}>
                {entry.message}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

