# SOC RSS Feed Backend

## Starting the Service

```bash
cd backend
npm start
```

The service will start with an interactive menu showing:
- Number of configured feeds
- Cached articles count
- Cached images count  
- Total cache size
- Last update timestamp

## Accessing the Application

Open your browser and navigate to:
```
http://localhost:3003
```

Both the frontend UI and API are served from the same port.

## Interactive Menu Commands

- **[R]** - Refresh Feeds Now (manually fetch all feeds)
- **[S]** - Show Feed Status (detailed status of each feed)
- **[C]** - Clear Cache (delete all cached files)
- **[A]** - Toggle Auto-refresh (enable/disable 10-minute auto-refresh)
- **[Q]** - Quit (shutdown the service)

## API Endpoints

- `GET /api/feeds` - Get all cached feed items
- `GET /api/status` - Get server status and statistics
- `POST /api/refresh` - Trigger manual refresh
- `DELETE /api/cache` - Clear cache

## Features

✅ **Integrated Frontend**: Web UI served from same port  
✅ **Caching**: All feeds and images are cached locally  
✅ **Article Extraction**: Full article text extracted using @extractus/article-extractor  
✅ **Auto-refresh**: Optional 10-minute auto-refresh  
✅ **Statistics**: Real-time cache statistics  
✅ **No CORS Issues**: Backend handles all external requests  

## Port

Default: `http://localhost:3003`
