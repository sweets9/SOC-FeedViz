# SOC RSS Feed Scroller - React Version

A modern React-based RSS feed scroller with smooth, fluid animations. This is a refactored version of the original vanilla JavaScript implementation, maintaining all functionality while leveraging React's component architecture.

## Features

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Smooth Animations** - Web Animations API for fluid transitions
- **Component-Based Architecture** - Reusable, maintainable components
- **Custom Hooks** - `useFeeds` and `useSpotlight` for clean state management
- **All Original Features** - Multi-feed aggregation, auto-scrolling, theme switching, keyboard controls

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will be available at `http://localhost:3000`

### Backend Server

The React frontend works with the existing backend server:

```bash
# In backend directory
cd backend
npm install
npm start
# Backend runs on http://localhost:3001
```

The Vite dev server is configured to proxy `/api` requests to the backend.

## Project Structure

```
src/
├── components/
│   ├── FeedContainer.jsx    # Container for feed items
│   ├── FeedItem.jsx          # Individual feed item component
│   ├── LoadingIndicator.jsx  # Loading overlay
│   ├── ThemeSelector.jsx     # Theme toggle buttons
│   ├── Footer.jsx            # Debug footer
│   └── ControlsHint.jsx       # Keyboard controls hint
├── hooks/
│   ├── useFeeds.js           # Feed loading and management
│   └── useSpotlight.js       # Spotlight animation logic
├── utils/
│   ├── feedUtils.js          # RSS parsing utilities
│   └── animations.js         # Animation helpers (Web Animations API)
├── App.jsx                   # Main application component
└── main.jsx                  # React entry point
```

## Key Improvements

### Smooth Animations

The React version maintains the smooth, fluid animations from the original:

- **Web Animations API** - Hardware-accelerated animations for expansion/shrink
- **RequestAnimationFrame** - Smooth scrolling and transitions
- **Staggered Animations** - Items push up/down with delays for fluid motion
- **No Stuttering** - Proper cleanup and state management prevents animation conflicts

### Component Architecture

- **FeedItem** - Self-contained feed item with all display logic
- **FeedContainer** - Manages feed list and hover interactions
- **Custom Hooks** - Separated concerns for feeds and spotlight logic

### State Management

- React hooks for all state (`useState`, `useEffect`, `useCallback`, `useRef`)
- Custom hooks encapsulate complex logic
- Proper cleanup on unmount

## Configuration

Configuration works the same as the original version. Edit `config.json`:

```json
{
  "feeds": [...],
  "refreshInterval": 900000,
  "showDebugFooter": true,
  "version": "2.2.0",
  "highlightKeywords": [...],
  "maxItemsPerFeed": 5
}
```

## Keyboard Controls

- **SPACE** - Pause/Resume spotlight
- **←/→** or **↑/↓** - Navigate between items
- **R** - Refresh feeds

## Themes

Three themes available (same as original):
- **Blue** (default)
- **Crimson**
- **Black**

Theme preference is saved in localStorage.

## Development

### Adding New Features

1. Components go in `src/components/`
2. Custom hooks go in `src/hooks/`
3. Utilities go in `src/utils/`

### Animation Guidelines

When working with animations:

1. Use Web Animations API for complex animations (see `src/utils/animations.js`)
2. Always clean up animations on unmount
3. Use `requestAnimationFrame` for smooth updates
4. Disable CSS transitions during Web Animations API animations to avoid conflicts

## Migration from Vanilla JS

The React version maintains 100% feature parity with the original:

- ✅ All RSS feeds supported
- ✅ Backend API integration
- ✅ Spotlight animations
- ✅ Theme switching
- ✅ Keyboard controls
- ✅ Auto-refresh
- ✅ Critical item highlighting
- ✅ Image fallbacks
- ✅ Error handling

## Build & Deploy

```bash
# Build for production
npm run build

# Output will be in dist/ directory
# Deploy dist/ to your web server
```

## License

MIT

