# Shared API Module

This directory contains shared API definitions used by both the backend and frontend to ensure consistency and type safety.

## Structure

```
shared/
├── api/
│   ├── types.js      # JSDoc type definitions
│   ├── endpoints.js  # API endpoint constants
│   ├── client.js     # API client functions
│   └── index.js      # Main export
└── README.md         # This file
```

## Usage

### Frontend (React)

```javascript
import { getFeeds, getStatus, refreshFeeds } from '@shared/api/client.js';
import { API_ENDPOINTS } from '@shared/api/endpoints.js';

// Use API client
const feeds = await getFeeds();
const status = await getStatus();
```

### Backend (Node.js)

```javascript
import { API_ENDPOINTS } from '../shared/api/endpoints.js';

// Use endpoint constants
app.get(API_ENDPOINTS.FEEDS, (req, res) => {
  // ...
});
```

## API Endpoints

- `GET /api/feeds` - Get all cached feed items
- `GET /api/status` - Get server status and statistics
- `POST /api/refresh` - Trigger manual feed refresh
- `DELETE /api/cache` - Clear cache

## Types

All types are documented with JSDoc comments. See `types.js` for:
- `FeedItem` - Individual feed item structure
- `FeedStatus` - Feed fetch status
- `FeedsResponse` - Response from `/api/feeds`
- `StatusResponse` - Response from `/api/status`
- And more...

## Benefits

1. **Type Safety** - Shared type definitions prevent mismatches
2. **Consistency** - Single source of truth for endpoints
3. **Maintainability** - Change endpoints in one place
4. **Documentation** - JSDoc types serve as documentation
5. **Reusability** - API client can be used in tests, scripts, etc.

