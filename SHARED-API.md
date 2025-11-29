# Shared API Documentation

This project now uses a **shared API module** that both the backend and frontend use to ensure consistency and type safety.

## Structure

```
shared/
└── api/
    ├── types.js      # JSDoc type definitions for all API data structures
    ├── endpoints.js  # Centralized API endpoint constants
    ├── client.js     # Reusable API client functions
    └── index.js      # Main export file
```

## Benefits

1. **Single Source of Truth** - API endpoints defined once, used everywhere
2. **Type Safety** - Shared type definitions prevent mismatches
3. **Consistency** - Backend and frontend always use the same endpoints
4. **Maintainability** - Change endpoints in one place
5. **Reusability** - API client can be used in tests, scripts, etc.

## API Endpoints

All endpoints are defined in `shared/api/endpoints.js`:

- `GET /api/feeds` - Get all cached feed items
- `GET /api/status` - Get server status and statistics  
- `POST /api/refresh` - Trigger manual feed refresh
- `DELETE /api/cache` - Clear cache

## Usage Examples

### Frontend (React)

```javascript
import { getFeeds, getStatus, refreshFeeds } from '@shared/api/client.js';
import { API_ENDPOINTS } from '@shared/api/endpoints.js';

// In a React component or hook
const feeds = await getFeeds();
const status = await getStatus();
await refreshFeeds();
```

### Backend (Node.js/Express)

```javascript
import { API_ENDPOINTS } from '../shared/api/endpoints.js';

// Use endpoint constants in route definitions
app.get(API_ENDPOINTS.FEEDS, (req, res) => {
  res.json(cachedFeeds);
});

app.get(API_ENDPOINTS.STATUS, (req, res) => {
  // ...
});
```

### API Client Class

For more complex scenarios, use the `ApiClient` class:

```javascript
import { ApiClient } from '@shared/api/client.js';

const api = new ApiClient('http://localhost:3003');
const feeds = await api.getFeeds();
const status = await api.getStatus();
```

## Type Definitions

All types are documented with JSDoc in `shared/api/types.js`:

- **FeedItem** - Individual feed item structure
- **FeedStatus** - Feed fetch status information
- **FeedsResponse** - Response from `/api/feeds`
- **StatusResponse** - Response from `/api/status`
- **CacheStats** - Cache statistics
- And more...

## Configuration

### Frontend (Vite)

The Vite config includes an alias for easy imports:

```javascript
// vite.config.js
resolve: {
  alias: {
    '@shared': path.resolve(__dirname, '../shared')
  }
}
```

This allows imports like:
```javascript
import { getFeeds } from '@shared/api/client.js';
```

### Backend

The backend uses relative imports:

```javascript
import { API_ENDPOINTS } from '../shared/api/endpoints.js';
```

## Adding New Endpoints

1. Add endpoint constant to `shared/api/endpoints.js`:
   ```javascript
   export const API_ENDPOINTS = {
     // ... existing endpoints
     NEW_ENDPOINT: '/api/new-endpoint'
   };
   ```

2. Add client function to `shared/api/client.js`:
   ```javascript
   export async function getNewData(baseUrl = '') {
     const response = await apiRequest(API_ENDPOINTS.NEW_ENDPOINT, {
       method: API_METHODS.GET
     }, baseUrl);
     return response.json();
   }
   ```

3. Add type definitions to `shared/api/types.js` if needed

4. Use in backend routes:
   ```javascript
   app.get(API_ENDPOINTS.NEW_ENDPOINT, (req, res) => {
     // ...
   });
   ```

5. Use in frontend:
   ```javascript
   import { getNewData } from '@shared/api/client.js';
   const data = await getNewData();
   ```

## Migration Notes

- Frontend `useFeeds` hook now uses `getFeeds()` from shared API client
- Backend routes now use `API_ENDPOINTS` constants instead of hardcoded strings
- All API calls are centralized and consistent

## Future Enhancements

Potential improvements:
- Add TypeScript for compile-time type checking
- Add API request/response validation
- Add API versioning support
- Add request interceptors for auth, logging, etc.
- Generate API documentation from types

