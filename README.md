# SOC-FeedViz

A real-time cybersecurity RSS feed visualization dashboard with automatic scrolling, intelligent image fallbacks, and configurable monitoring capabilities.

## Features

### 🚀 Real-time Feed Processing
- **Multi-source aggregation**: Pulls from major cybersecurity feeds (ACSC, Krebs, Unit 42, etc.)
- **Automatic refresh**: Configurable intervals with live updates
- **Backend caching**: Optimized performance with intelligent caching
- **Connection monitoring**: Tracks feed availability and performance

### 🎨 Smart Visualization
- **Auto-scrolling**: Continuous and spotlight modes with adjustable speed
- **Image fallbacks**: Domain-specific branded images with intelligent fallback chain
- **Responsive design**: Adapts to different screen sizes and orientations
- **Dark/Light themes**: Customizable color schemes

### 🔧 Advanced Configuration
- **Backend-configured**: Centralized configuration via API
- **Domain overrides**: Custom fallback images for specific domains
- **Feed management**: Easy addition/removal of RSS sources
- **Debug capabilities**: Comprehensive monitoring and statistics

### 🌐 Deployment Ready
- **Nginx support**: Load balancer configuration included
- **Environment configs**: Separate development and production settings
- **Docker compatible**: Containerized deployment options
- **Health monitoring**: Built-in status endpoints

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SOC-FeedViz
   ```

2. **Install dependencies**
   ```bash
   # Install both frontend and backend dependencies
   npm install
   cd backend && npm install && cd ..
   ```

3. **Start the application**
   ```bash
   # Start both frontend and backend
   npm run start:all
   
   # Or start individually
   npm run start:frontend  # Frontend on port 3005
   npm run start:backend   # Backend on port 3003
   ```

4. **Access the dashboard**
   - Main application: http://localhost:3005
   - Backend API: http://localhost:3003/api/feeds
   - Debug menu: Press 'D' key to toggle

## Configuration

### Feed Sources
Edit `config.json` to customize RSS feeds:

```json
{
  "feeds": [
    {
      "name": "ACSC Advisories",
      "url": "https://www.cyber.gov.au/rss/advisories",
      "icon": "https://www.cyber.gov.au/themes/custom/cyber/favicon.ico"
    }
  ]
}
```

### Image Fallbacks
Configure domain-specific fallback images:

```json
{
  "imageFallbacks": {
    "cyber.gov.au": "https://pbs.twimg.com/profile_images/1728904475790995456/nKGMT8Q4_400x400.jpg"
  }
}
```

### Display Settings
Adjust scrolling and refresh behavior:

```json
{
  "refreshInterval": 900000,
  "scrollSpeed": 30,
  "showDebugFooter": true
}
```

## Architecture

### Frontend (React + Vite)
- **React 18**: Modern component-based UI
- **GSAP**: Smooth scrolling animations
- **Tailwind CSS**: Responsive styling
- **Vite**: Fast development and building

### Backend (Node.js + Express)
- **Express.js**: RESTful API server
- **Feed Extractor**: RSS parsing and processing
- **File System**: Local caching and storage
- **CORS**: Cross-origin resource sharing

### Shared API
- **Centralized endpoints**: Consistent API definitions
- **Type safety**: Structured request/response handling
- **Error handling**: Comprehensive error management

## Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Nginx Load Balancer
```bash
# Copy nginx configuration
sudo cp nginx.example.conf /etc/nginx/sites-available/soc-feedviz

# Enable and restart
sudo ln -s /etc/nginx/sites-available/soc-feedviz /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

### Environment Variables
Create `.env.production`:
```
VITE_BACKEND_URL=/api
VITE_ENV=production
```

## Monitoring

### Debug Menu
Press 'D' to access real-time monitoring:
- **Feed status**: Connection health and item counts
- **Performance**: Memory usage and processing stats
- **Image fallbacks**: Domain mapping usage and statistics
- **Auto-scroll controls**: Speed and mode adjustments

### API Endpoints
- `GET /api/feeds` - Fetch current feed items
- `GET /api/status` - System health and statistics
- `POST /api/refresh` - Trigger manual feed refresh

## Customization

### Adding New Feeds
1. Update `config.json` with feed details
2. Restart backend to load new configuration
3. Frontend will automatically pick up changes

### Custom Domain Images
1. Add domain mapping to `config.json`
2. Backend serves configuration to frontend
3. Images automatically used as overrides

### Theme Customization
Modify CSS variables in `styles.css`:
```css
:root {
  --primary-color: #4fc3f7;
  --background-color: #0a0a0a;
  --text-color: #ffffff;
}
```

## Troubleshooting

### Common Issues

**Feeds not loading**
- Check backend logs for connection errors
- Verify RSS URLs are accessible
- Check network connectivity and firewalls

**Images not displaying**
- Verify image URLs are accessible
- Check CORS headers on backend
- Review image fallback statistics in debug menu

**Scrolling not working**
- Ensure GSAP library loaded properly
- Check for JavaScript errors in console
- Verify auto-scroll is enabled in debug menu

### Performance Optimization
- Enable backend caching for large feed sets
- Adjust refresh intervals based on needs
- Use nginx for production deployments
- Monitor memory usage in debug menu

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For technical support and questions:
- Create an issue in the repository
- Check the debug menu for real-time diagnostics
- Review logs for backend and frontend errors

---

**SOC-FeedViz** - Real-time cybersecurity intelligence visualization
