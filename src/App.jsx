import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FeedContainer } from './components/FeedContainer';
import { LoadingIndicator } from './components/LoadingIndicator';
import { ThemeSelector } from './components/ThemeSelector';
import { Footer } from './components/Footer';
import { ControlsHint } from './components/ControlsHint';
import { DebugMenu } from './components/DebugMenu';
import { useFeeds } from './hooks/useFeeds';
import { useSpotlight } from './hooks/useSpotlight';
import { preloadCommonFallbacks } from './utils/imageFallback';

function App() {
  const [config, setConfig] = useState(null);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('rssTheme') || 'blue';
  });
  const [nextRefreshTime, setNextRefreshTime] = useState(null);
  const [notification, setNotification] = useState(null);
  const containerRef = useRef(null);

  const { feedItems, loading, error, loadedFeedsCount, feedLog, imageFallbacks, loadFeeds, connectionStatus } = useFeeds(config);
  
  const {
    spotlightIndex,
    isSpotlighting,
    isPaused,
    autoFocus,
    autoScroll,
    scrollSpeed,
    continuousScroll,
    isAutoScrolling,
    setAutoFocus,
    setAutoScroll,
    setScrollSpeed,
    setContinuousScroll,
    pauseSpotlight,
    resumeSpotlight,
    navigateToItem,
    resetSpotlightState
  } = useSpotlight(feedItems, containerRef);

  // Initialize fallback image system and load config on mount
  useEffect(() => {
    // Preload common fallback images
    preloadCommonFallbacks();
    
    fetch('config.json')
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        if (data.refreshInterval) {
          setNextRefreshTime(Date.now() + data.refreshInterval);
        }
      })
      .catch(err => {
        console.error('Error loading config:', err);
      });
  }, []);

  // Apply theme
  useEffect(() => {
    const supportedThemes = ['blue', 'crimson', 'black'];
    supportedThemes.forEach(name => {
      document.body.classList.remove(`theme-${name}`);
    });
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem('rssTheme', theme);
  }, [theme]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case ' ': // Spacebar
          e.preventDefault();
          if (isPaused) {
            resumeSpotlight();
            showNotification('▶️ Spotlight resumed', 2000);
          } else {
            pauseSpotlight();
            showNotification('⏸️ Spotlight paused - Press SPACE to resume', 3000);
          }
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          navigateToItem('next');
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          navigateToItem('prev');
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          showNotification('🔄 Refreshing feeds...', 2000);
          loadFeeds();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, pauseSpotlight, resumeSpotlight, navigateToItem, loadFeeds]);

  // Notification system
  const showNotification = useCallback((message, duration = 3000) => {
    setNotification(message);
    setTimeout(() => setNotification(null), duration);
  }, []);

  // Update next refresh time
  useEffect(() => {
    if (config?.refreshInterval) {
      const interval = setInterval(() => {
        setNextRefreshTime(Date.now() + config.refreshInterval);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [config]);

  // Countdown for next refresh
  useEffect(() => {
    if (!nextRefreshTime) return;
    
    const interval = setInterval(() => {
      const remaining = nextRefreshTime - Date.now();
      if (remaining <= 0 && config?.refreshInterval) {
        setNextRefreshTime(Date.now() + config.refreshInterval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [nextRefreshTime, config]);

  if (!config) {
    return (
      <div className="rss-feed-scroller">
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner"></div>
            <p>Loading configuration...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rss-feed-scroller">
      <FeedContainer
        items={feedItems}
        config={config}
        imageFallbacks={imageFallbacks}
        ref={containerRef}
      />

      {error && (
        <div className="error">
          <p>⚠️ Failed to load RSS feeds</p>
          <p style={{ fontSize: '12px', marginTop: '8px' }}>{error}</p>
        </div>
      )}

      <LoadingIndicator 
        loading={loading} 
        feedLog={feedLog}
      />

      {notification && (
        <div className="notification-container">
          <div className="notification">{notification}</div>
        </div>
      )}

      <ControlsHint />

      <div className="feed-footer">
        <span id="debugInfo">
          {config?.showDebugFooter ? (
            <Footer
              config={config}
              feedItems={feedItems}
              loadedFeedsCount={loadedFeedsCount}
              nextRefreshTime={nextRefreshTime}
            />
          ) : null}
        </span>
        <ThemeSelector
          currentTheme={theme}
          onThemeChange={setTheme}
        />
      </div>
      
      <DebugMenu
        config={config}
        feedItems={feedItems}
        spotlightIndex={spotlightIndex}
        isSpotlighting={isSpotlighting}
        isPaused={isPaused}
        loadedFeedsCount={loadedFeedsCount}
        connectionStatus={connectionStatus}
        autoFocus={autoFocus}
        autoScroll={autoScroll}
        scrollSpeed={scrollSpeed}
        continuousScroll={continuousScroll}
        isAutoScrolling={isAutoScrolling}
        setAutoFocus={setAutoFocus}
        setAutoScroll={setAutoScroll}
        setScrollSpeed={setScrollSpeed}
        setContinuousScroll={setContinuousScroll}
      />
    </div>
  );
}

export default App;

