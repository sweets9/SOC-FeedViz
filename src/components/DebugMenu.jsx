import React, { useState } from 'react';
import { getFallbackStats, resetFallbackStats } from '../utils/imageFallback';

export function DebugMenu({ config, feedItems, spotlightIndex, isSpotlighting, isPaused, loadedFeedsCount, connectionStatus, autoFocus, autoScroll, scrollSpeed, continuousScroll, isAutoScrolling, setAutoFocus, setAutoScroll, setScrollSpeed, setContinuousScroll }) {
  const [isOpen, setIsOpen] = useState(false);

  const totalFeeds = config?.feeds?.length || 0;
  const totalItems = feedItems?.length || 0;
  const version = config?.version || '1.0.0';
  
  // Format time helper
  const formatTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleTimeString();
  };

  const fallbackStats = getFallbackStats();

  // Get source label
  const getSourceLabel = (source) => {
    switch (source) {
      case 'backend': return '✅ Backend API';
      case 'direct': return '⚡ Direct Fetch';
      case 'error': return '❌ Error';
      default: return '⏳ Initializing';
    }
  };
  
  // Calculate stats
  const stats = {
    version,
    totalFeeds,
    loadedFeeds: loadedFeedsCount,
    totalItems,
    currentSpotlight: spotlightIndex + 1,
    isSpotlighting,
    isPaused,
    spotlightProgress: totalItems > 0 ? `${spotlightIndex + 1}/${totalItems}` : '0/0'
  };

  return (
    <>
      <button
        className="debug-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Debug Menu"
      >
        ⚙️
      </button>
      
      {isOpen && (
        <>
          <div className="debug-menu-overlay" onClick={() => setIsOpen(false)}></div>
          <div className="debug-menu-bubble" onClick={(e) => e.stopPropagation()}>
            <div className="debug-menu-header">
              <h3>Debug Information</h3>
              <button 
                className="debug-menu-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            
            <div className="debug-menu-content">
              <div className="debug-section">
                <h4>Application</h4>
                <div className="debug-row">
                  <span className="debug-label">Version:</span>
                  <span className="debug-value">{stats.version}</span>
                </div>
              </div>

              <div className="debug-section">
                <h4>Connection</h4>
                <div className="debug-row">
                  <span className="debug-label">Source:</span>
                  <span className="debug-value">{getSourceLabel(connectionStatus?.source)}</span>
                </div>
                <div className="debug-row">
                  <span className="debug-label">Backend URL:</span>
                  <span className="debug-value" style={{ fontSize: '11px', wordBreak: 'break-all' }}>
                    {connectionStatus?.backendUrl || 'N/A'}
                  </span>
                </div>
                <div className="debug-row">
                  <span className="debug-label">Connected:</span>
                  <span className="debug-value">{connectionStatus?.isConnected ? '✅ Yes' : '❌ No'}</span>
                </div>
                <div className="debug-row">
                  <span className="debug-label">Last Fetch:</span>
                  <span className="debug-value">{formatTime(connectionStatus?.lastFetch)}</span>
                </div>
                <div className="debug-row">
                  <span className="debug-label">Data Updated:</span>
                  <span className="debug-value">{formatTime(connectionStatus?.lastUpdated)}</span>
                </div>
              </div>

              <div className="debug-section">
                <h4>Feeds</h4>
                <div className="debug-row">
                  <span className="debug-label">Total Feeds:</span>
                  <span className="debug-value">{stats.totalFeeds}</span>
                </div>
                <div className="debug-row">
                  <span className="debug-label">Loaded Feeds:</span>
                  <span className="debug-value">{stats.loadedFeeds}</span>
                </div>
                <div className="debug-row">
                  <span className="debug-label">Total Items:</span>
                  <span className="debug-value">{stats.totalItems}</span>
                </div>
              </div>

              <div className="debug-section">
                <h4>Spotlight</h4>
                <div className="debug-row">
                  <span className="debug-label">Current Item:</span>
                  <span className="debug-value">{stats.spotlightProgress}</span>
                </div>
                <div className="debug-row">
                  <span className="debug-label">Is Spotlighting:</span>
                  <span className="debug-value">{stats.isSpotlighting ? 'Yes' : 'No'}</span>
                </div>
                <div className="debug-row">
                  <span className="debug-label">Is Paused:</span>
                  <span className="debug-value">{stats.isPaused ? 'Yes' : 'No'}</span>
                </div>
                <div className="debug-row">
                  <span className="debug-label">Is AutoScrolling:</span>
                  <span className="debug-value" style={{ color: isAutoScrolling ? '#4CAF50' : '#f44336', fontWeight: 'bold' }}>
                    {isAutoScrolling ? '🟢 Active' : '🔴 Inactive'}
                  </span>
                </div>
              </div>

              <div className="debug-section">
                <h4>Behavior</h4>
                <div className="debug-row">
                  <span className="debug-label">Auto Focus:</span>
                  <span className="debug-value">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={autoFocus}
                        onChange={(e) => setAutoFocus(e.target.checked)}
                        style={{ margin: 0 }}
                      />
                      {autoFocus ? 'On' : 'Off'}
                    </label>
                  </span>
                </div>
                <div className="debug-row">
                  <span className="debug-label">Auto Scroll:</span>
                  <span className="debug-value">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={autoScroll}
                        onChange={(e) => setAutoScroll(e.target.checked)}
                        style={{ margin: 0 }}
                      />
                      {autoScroll ? 'On' : 'Off'}
                    </label>
                  </span>
                </div>
                <div className="debug-row">
                  <span className="debug-label">Continuous Scroll:</span>
                  <span className="debug-value">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={continuousScroll}
                        onChange={(e) => setContinuousScroll(e.target.checked)}
                        style={{ margin: 0 }}
                      />
                      {continuousScroll ? 'Continuous' : 'One at a time'}
                    </label>
                  </span>
                </div>
                <div className="debug-row">
                  <span className="debug-label">Scroll Speed:</span>
                  <span className="debug-value">
                    <select
                      value={scrollSpeed}
                      onChange={(e) => setScrollSpeed(Number(e.target.value))}
                      style={{ padding: '2px 6px', fontSize: '12px' }}
                    >
                      <option value={3000}>3s (Fast)</option>
                      <option value={6000}>6s (Normal)</option>
                      <option value={10000}>10s (Slow)</option>
                      <option value={15000}>15s (Very Slow)</option>
                    </select>
                  </span>
                </div>
              </div>

              <div className="debug-section">
                <h4>Image Fallbacks</h4>
                <div className="debug-row">
                  <span className="debug-label">Total Processed:</span>
                  <span className="debug-value">{fallbackStats.totalProcessed}</span>
                </div>
                <div className="debug-row">
                  <span className="debug-label">Primary Failed:</span>
                  <span className="debug-value" style={{ color: fallbackStats.primaryFailed > 0 ? '#ff6b6b' : '#51cf66' }}>
                    {fallbackStats.primaryFailed} ({fallbackStats.failureRate}%)
                  </span>
                </div>
                <div className="debug-row">
                  <span className="debug-label">Domain Fallbacks:</span>
                  <span className="debug-value">{fallbackStats.domainFallbackUsed}</span>
                </div>
                <div className="debug-row">
                  <span className="debug-label">Favicon Fallbacks:</span>
                  <span className="debug-value">{fallbackStats.faviconFallbackUsed}</span>
                </div>
                <div className="debug-row">
                  <span className="debug-label">Generic Fallbacks:</span>
                  <span className="debug-value">{fallbackStats.genericFallbackUsed}</span>
                </div>
                {fallbackStats.domainsNeedingFallback.length > 0 && (
                  <div className="debug-row">
                    <span className="debug-label">Domains Needing Fallback:</span>
                    <span className="debug-value" style={{ fontSize: '11px', maxWidth: '200px', wordBreak: 'break-all' }}>
                      {fallbackStats.domainsNeedingFallback.slice(0, 3).join(', ')}
                      {fallbackStats.domainsNeedingFallback.length > 3 && ` (+${fallbackStats.domainsNeedingFallback.length - 3} more)`}
                    </span>
                  </div>
                )}
                <div className="debug-row">
                  <button
                    onClick={() => resetFallbackStats()}
                    style={{
                      padding: '2px 8px',
                      fontSize: '11px',
                      backgroundColor: '#666',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    Reset Stats
                  </button>
                </div>
              </div>

              <div className="debug-section">
                <h4>Performance</h4>
                <div className="debug-row">
                  <span className="debug-label">FPS:</span>
                  <span className="debug-value">~60</span>
                </div>
                <div className="debug-row">
                  <span className="debug-label">Memory:</span>
                  <span className="debug-value">
                    {performance.memory 
                      ? `${Math.round(performance.memory.usedJSHeapSize / 1048576)} MB`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

