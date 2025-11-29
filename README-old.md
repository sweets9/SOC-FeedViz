# SOC RSS Feed Scroller

A modern, clean scrolling RSS feed component designed for Security Operations Center (SOC) dashboards. This standalone HTML/CSS/JavaScript application pulls news from multiple cybersecurity RSS feeds and displays them in a sleek, continuously scrolling vertical feed.

## Features

- **Multi-Feed Aggregation**: Combines multiple RSS feeds into a single unified view
- **Auto-Scrolling Animation**: Smooth, continuous vertical scrolling
- **Critical Alert Highlighting**: Automatically highlights items containing critical keywords:
  - Critical vulnerability
  - BAE
  - Australia
  - Remote Code Execution
- **Modern UI**: Dark theme optimized for SOC dashboard environments
- **Responsive Images**: Displays article images or source icons as fallback
- **Real-time Updates**: Configurable auto-refresh interval
- **Clean Design**: No window flourishes - just the panel content
- **No Build Required**: Pure HTML/CSS/JavaScript - runs directly in the browser

## Technology Stack

- **HTML5** - Markup
- **CSS3** - Styling with animations
- **Vanilla JavaScript** - No frameworks or dependencies
- **Native Fetch API** - RSS feed retrieval
- **DOMParser** - RSS/XML parsing

## Pre-configured Feeds

The application comes pre-configured with major cybersecurity news sources:

- **ACSC Advisories** - Australian Cyber Security Centre advisories
- **ACSC Alerts** - Australian Cyber Security Centre alerts
- **Unit 42 Threat Research** - Palo Alto Networks threat intelligence
- **CISA Alerts** - US Cybersecurity and Infrastructure Security Agency
- **The Hacker News** - Cybersecurity news and analysis
- **Krebs on Security** - In-depth security news
- **Bleeping Computer** - Technology news and security
- **Dark Reading** - Cybersecurity news and analysis

## Getting Started

**⚠️ IMPORTANT**: Due to browser CORS restrictions when fetching RSS feeds, you **MUST** run this application through an HTTP server. Opening `index.html` directly in a browser (file://) will not work.

### Option 1: With Backend Server (Recommended)

The backend server fetches, caches, and serves curated feed content with full article text extraction.

```bash
# Start the backend server
cd backend
npm install
npm start
# Backend runs on http://localhost:3001

# In another terminal, start the frontend
cd ..
python -m http.server 8000
# Frontend runs on http://localhost:8000
```

**Backend Features:**
- Fetches feeds every 10 minutes
- Extracts full article text using Cheerio (like BeautifulSoup)
- Caches images locally
- Serves curated content via REST API

### Option 2: Frontend Only (CORS Proxy)

Use any local HTTP server. Here are some options:

```bash
# Python 3
python -m http.server 8000
# Then visit http://localhost:8000

# Python 2
python -m SimpleHTTPServer 8000

# PHP
php -S localhost:8000

# Node.js http-server (install once: npm install -g http-server)
npx http-server -p 8000

# VS Code: Install "Live Server" extension and click "Go Live"
```

### Option 3: Deploy to Web Server

Upload all files to your web server:

```
index.html
styles.css
app.js
config.json
```

Access via `http://your-server/index.html`

### Troubleshooting

If you see "⚠️ Failed to load RSS feeds":
1. Ensure you're accessing via `http://` not `file://`
2. Check browser console (F12) for detailed error messages
3. The CORS proxy may have rate limits - try refreshing after a few seconds
4. Some corporate firewalls may block the CORS proxy

## Configuration

Edit `config.json` to customize feeds and behavior:

```json
{
  "feeds": [
    {
      "name": "Feed Name",
      "url": "https://example.com/feed.xml",
      "icon": "https://example.com/favicon.ico"
    }
  ],
  "refreshInterval": 300000,
  "scrollSpeed": 30,
  "highlightKeywords": ["critical", "severe", "BAE", "Australia"],
  "maxItems": 50
}
```

### Configuration Options

- **feeds**: Array of RSS feed objects
  - `name`: Display name for the source
  - `url`: RSS feed URL
  - `icon`: Icon URL for the source
- **refreshInterval**: Feed refresh interval in milliseconds (default: 300000 = 5 minutes)
- **scrollSpeed**: Scroll speed in pixels per second (default: 30)
- **highlightKeywords**: Array of keywords that trigger critical highlighting
- **maxItems**: Maximum number of items to display

## Integration into SOC Dashboard

This application is designed as a single panel component. To integrate:

### As an Iframe

```html
<iframe src="path/to/index.html" style="width: 100%; height: 600px; border: none;"></iframe>
```

### As Embedded HTML

Copy the contents of `index.html`, `styles.css`, and `app.js` into your dashboard's HTML structure.

## File Structure

```
SOC-RSSFeed/
├── index.html        # Main HTML file
├── styles.css        # All styling and animations
├── app.js           # Application logic
├── config.json      # Feed configuration
└── README.md        # This file
```

## CORS Note

The application uses `api.allorigins.win` as a CORS proxy for fetching RSS feeds. In production environments, you should:

1. Set up your own backend proxy endpoint for better reliability and security
2. Update the `CORS_PROXY` constant in `app.js` (line 11)

Example backend proxy implementation depends on your server stack.

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Any modern browser with ES6 support

## License

MIT
