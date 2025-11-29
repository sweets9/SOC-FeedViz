# SOC-FeedViz Technical Documentation

## System Architecture

### Overview
SOC-FeedViz is a full-stack JavaScript application consisting of a React frontend and Node.js backend, designed for real-time cybersecurity RSS feed visualization and monitoring.

### Component Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │  External APIs  │
│   (React)       │◄──►│   (Express)     │◄──►│   RSS Feeds     │
│                 │    │                 │    │                 │
│ • Feed Display │    │ • Feed Parser   │    │ • ACSC          │
│ • Auto-scroll  │    │ • Cache Mgmt    │    │ • Krebs         │
│ • Image Fallback│   │ • API Endpoints │    │ • Unit 42       │
│ • Debug UI      │    │ • Statistics    │    │ • The Hacker   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Frontend Architecture

### Technology Stack
- **React 18**: Component-based UI with hooks
- **Vite**: Fast build tool and dev server
- **GSAP**: Animation library for smooth scrolling
- **CSS Modules**: Scoped styling with responsive design

### Core Components

#### App.jsx
Main application component managing:
- Configuration loading and state
- Theme management
- Notification system
- Keyboard shortcuts

#### FeedContainer.jsx
Container component for:
- Rendering feed items list
- Managing scroll behavior
- Handling spotlight mode

#### FeedItem.jsx
Individual article component featuring:
- Image fallback logic
- Dynamic content rendering
- Error handling and recovery

#### DebugMenu.jsx
Real-time monitoring interface:
- Feed connection status
- Performance metrics
- Image fallback statistics
- Auto-scroll controls

### State Management

#### useFeeds Hook
```javascript
{
  feedItems: [],           // Parsed RSS articles
  loading: boolean,        // Loading state
  error: string | null,    // Error messages
  loadedFeedsCount: number, // Successful feed count
  feedLog: [],            // Activity log
  imageFallbacks: {},     // Domain mapping config
  connectionStatus: {     // Backend health
    source: 'backend' | 'direct' | 'error',
    isConnected: boolean,
    lastFetch: Date
  }
}
```

#### useSpotlight Hook
```javascript
{
  spotlightIndex: number,     // Current article index
  isSpotlighting: boolean,    // Spotlight mode active
  isPaused: boolean,          // Scroll paused
  autoFocus: boolean,         // Auto-focus on new items
  autoScroll: boolean,        // Auto-scroll enabled
  scrollSpeed: number,        // Scroll interval (ms)
  continuousScroll: boolean,  // Continuous vs one-at-a-time
  isAutoScrolling: boolean    // Currently scrolling
}
```

### Image Fallback System

#### Fallback Chain
1. **Original Article Image** - Extracted from RSS content
2. **Domain Override** - Configured static images per domain
3. **Generic SVG** - Clean bookmark icon fallback

#### Configuration Flow
```
config.json → Backend API → Frontend State → Image Processing
```

#### Utility Functions
```javascript
// Dynamic fallback with domain mapping
getFallbackImage(article, customDomainMap)

// Synchronous fallback for immediate display
getFallbackImageSync(article, customDomainMap)

// Statistics tracking
getFallbackStats() → { domainFallbackUsed, genericFallbackUsed, ... }
```

## Backend Architecture

### Technology Stack
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework and API server
- **Feed Extractor**: RSS parsing library
- **File System**: Local caching and storage

### Server Structure

#### Core Modules
```javascript
├── server.js              // Main application server
├── cache/                 // Local storage directory
│   ├── feeds.json        // Cached RSS data
│   └── images/           // Cached images
└── IP-ALLOW-LIST.md      // Security configuration
```

#### API Endpoints

##### GET /api/feeds
```javascript
Response: {
  items: [
    {
      title: string,
      link: string,
      description: string,
      pubDate: ISO string,
      image: string | null,
      source: string,
      sourceIcon: string
    }
  ],
  feedStatus: {
    [feedName]: {
      success: boolean,
      itemCount: number,
      error: string | null,
      lastUpdated: ISO string
    }
  },
  imageFallbacks: {        // Dynamic configuration
    [domain]: imageUrl
  }
}
```

##### GET /api/status
```javascript
Response: {
  status: 'running',
  feeds: number,
  items: number,
  lastRefresh: ISO string,
  uptime: number,
  memory: {
    used: number,
    total: number
  }
}
```

##### POST /api/refresh
Triggers manual feed refresh with:
- Request validation
- Concurrent feed processing
- Cache updates
- Statistics tracking

### Feed Processing Pipeline

#### Image Extraction
```javascript
// Multi-pattern extraction
1. Standard <img> tags
2. Open Graph meta tags
3. Twitter card images
4. WordPress featured images
5. Content field images
```

#### Caching Strategy
- **Feed Data**: JSON file with timestamp validation
- **Images**: Local filesystem with URL-based caching
- **Configuration**: Runtime loading from config.json
- **Statistics**: In-memory with periodic persistence

### Security Features

#### IP Allow List
```javascript
const ALLOWED_IPS = process.env.ALLOWED_IPS?.split(',') || [
  '127.0.0.1', '::1', 'localhost'
];
```

#### CORS Configuration
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3005',
  credentials: true
}));
```

## Shared API Architecture

### Module Structure
```
shared/
├── api/
│   ├── index.js          // API exports
│   ├── client.js         // HTTP client utilities
│   └── endpoints.js      // Endpoint definitions
└── utils/
    ├── feedUtils.js      // Feed processing utilities
    └── imageUtils.js     // Image handling utilities
```

### Client Abstraction
```javascript
// Centralized API client
export const apiGetFeeds = (baseUrl) => 
  apiRequest(`${baseUrl}/feeds`);

// Error handling wrapper
export const apiRequest = async (url, options = {}) => {
  // Timeout handling
  // Error parsing
  // Retry logic
};
```

## Configuration Management

### Configuration Files

#### config.json (Development)
```json
{
  "apiUrl": "",
  "feeds": [...],
  "imageFallbacks": {...},
  "refreshInterval": 900000,
  "scrollSpeed": 30,
  "version": "0.5.0"
}
```

#### config.production.json (Production)
```json
{
  "apiUrl": "/api",
  "feeds": [...],
  "imageFallbacks": {...},
  "refreshInterval": 300000,
  "scrollSpeed": 25
}
```

### Environment Variables
```bash
# Backend
PORT=3003
ALLOWED_IPS=127.0.0.1,::1,localhost

# Frontend
VITE_BACKEND_URL=/api
VITE_ENV=production
```

## Performance Optimization

### Frontend Optimizations

#### React Performance
- **useCallback**: Memoized event handlers
- **useMemo**: Expensive calculations
- **Refs**: DOM access optimization
- **Lazy Loading**: Component code splitting

#### Image Optimization
- **Preloading**: Critical fallback images
- **Caching**: Browser and server caching
- **Lazy Loading**: Below-fold images
- **Error Fallbacks**: Graceful degradation

### Backend Optimizations

#### Caching Strategy
```javascript
// Multi-level caching
1. Memory cache (runtime)
2. File cache (persistent)
3. HTTP cache (headers)
4. Browser cache (client-side)
```

#### Concurrent Processing
```javascript
// Parallel feed fetching
const feedPromises = feedConfig.feeds.map(feed => 
  processFeed(feed)
);
const results = await Promise.allSettled(feedPromises);
```

## Deployment Architecture

### Development Environment
```
Frontend (Vite) :3005 ←→ Backend (Express) :3003 ←→ External APIs
```

### Production Environment
```
Internet → Nginx (80/443) → Frontend (3005) or Backend (3003)
                            ↳ / → Static files
                            ↳ /api/ → Backend API
                            ↳ /images/ → Backend images
```

### Docker Support
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
# Build frontend and backend
FROM node:18-alpine AS runtime
# Production server
```

## Monitoring and Debugging

### Debug Menu Features
- **Real-time Statistics**: Live performance metrics
- **Feed Health**: Connection status and error tracking
- **Image Analytics**: Fallback usage and domain mapping
- **System Info**: Memory usage and uptime

### Logging Strategy
```javascript
// Structured logging
console.log(`[Component] Action: ${details}`);
console.warn(`[Component] Warning: ${issue}`);
console.error(`[Component] Error: ${error}`);
```

### Error Handling
```javascript
// Global error boundaries
<ErrorBoundary fallback={ErrorComponent}>
  <App />
</ErrorBoundary>

// API error handling
try {
  const data = await apiRequest(url);
} catch (error) {
  setError(error.message);
  logError(error);
}
```

## Testing Strategy

### Frontend Testing
- **Unit Tests**: Component logic and utilities
- **Integration Tests**: API interactions
- **E2E Tests**: User workflows
- **Visual Tests**: UI regression testing

### Backend Testing
- **Unit Tests**: Feed parsing and caching
- **Integration Tests**: API endpoints
- **Load Tests**: Performance under stress
- **Security Tests**: Input validation and CORS

## Future Enhancements

### Planned Features
- **WebSocket Support**: Real-time updates
- **Database Integration**: PostgreSQL/MongoDB
- **Authentication**: User management
- **Analytics**: Usage tracking and reporting
- **Mobile App**: React Native implementation

### Scalability Considerations
- **Horizontal Scaling**: Multiple backend instances
- **CDN Integration**: Static asset delivery
- **Database Clustering**: High availability
- **Load Balancing**: Traffic distribution

---

**SOC-FeedViz Technical Documentation** v0.5.0
