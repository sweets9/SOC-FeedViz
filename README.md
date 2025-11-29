# SOC-FeedViz

A real-time cybersecurity RSS feed visualization dashboard designed for security operations centers. This MVP++ product provides live threat intelligence monitoring with automatic scrolling and intelligent image fallbacks.

## ⚠️ Important Notice

**This software is provided "as is" for demonstration and deployment in environments with appropriate security controls.** While ongoing development continues, the current version is production-ready and actively used in environments with complementary security measures.

## 🚀 Core Features

### Real-time Intelligence
- **Multi-source aggregation**: Pulls from major cybersecurity feeds (ACSC, Krebs, Unit 42, etc.)
- **Automatic refresh**: Configurable intervals with live updates
- **Backend caching**: Optimized performance with intelligent caching
- **Connection monitoring**: Tracks feed availability and performance

### Smart Visualization
- **Auto-scrolling**: Continuous and spotlight modes with adjustable speed
- **Image fallbacks**: Domain-specific branded images with intelligent fallback chain
- **Responsive design**: Adapts to different screen sizes and orientations
- **Dark/Light themes**: Customizable color schemes

### Monitoring & Debug
- **Debug menu**: Accessible via bottom-left corner toggle
- **Real-time statistics**: Feed health, performance metrics, and image fallback tracking
- **Live controls**: Adjust scroll speed, pause, and refresh feeds on demand

## 🎬 Demo Video

See SOC-FeedViz in action with real-time cybersecurity feed visualization:

[![SOC-FeedViz Demo](demo/demo_v0.5.mp4)](demo/demo_v0.5.mp4)

*Click the video above to see the live demonstration of SOC-FeedViz v0.5.0*

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
   - Debug menu: Click the toggle in the bottom-left corner

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

## 🗺️ Planned Features

### Security & Authentication
- **SSO Integration**: Single sign-on compatibility
- **IP Whitelisting**: Network-based access controls
- **Authentication**: User management and login systems
- **API Lockdown**: Token-based API access (post-SSO)

### User Experience
- **Web Admin UI**: Administrative interface for configuration
- **Remote Display**: Detailed news article viewing
- **Highlight System**: Custom keyword highlighting
- **Multiple Layouts**: Different display modes and arrangements

### Security Hardening
- **Package Reduction**: Minimize npm dependencies for attack surface reduction
- **Security Code Review**: Comprehensive security audit and remediation
- **API Tokenization**: Secure API access controls

## 📋 Technical Documentation

For detailed architecture, API documentation, and development guidelines, see **[TECHNICAL.md](TECHNICAL.md)**.

## 🚀 Deployment

### Quick Deployment
```bash
# Development
npm run dev

# Production build
npm run build
npm run preview
```

### Production Setup
```bash
# Nginx configuration
sudo cp nginx.example.conf /etc/nginx/sites-available/soc-feedviz
sudo ln -s /etc/nginx/sites-available/soc-feedviz /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

### Environment Configuration
Create `.env.production`:
```
VITE_BACKEND_URL=/api
VITE_ENV=production
```

## 🔧 Monitoring

### Debug Menu
Access real-time monitoring via the **bottom-left corner toggle**:
- **Feed status**: Connection health and item counts
- **Performance**: Memory usage and processing stats
- **Image fallbacks**: Domain mapping usage and statistics
- **Auto-scroll controls**: Speed and mode adjustments

### API Endpoints
- `GET /api/feeds` - Fetch current feed items
- `GET /api/status` - System health and statistics
- `POST /api/refresh` - Trigger manual feed refresh

## 🤝 Contributing

We appreciate any contributions to SOC-FeedViz! This is an active project with ongoing development.

### How to Contribute
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Areas for Contribution
- **Security**: Code review, vulnerability assessment
- **Features**: UI improvements, new feed sources
- **Documentation**: Guides, examples, API docs
- **Testing**: Unit tests, integration tests

## ⚠️ Security Notice

This software is provided **"as is"** without warranty. It is designed for deployment in environments with appropriate security controls. Users should conduct their own security assessment before deployment in production environments.

## 📄 License

This project is licensed under the **AGPL-3.0 License** - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For technical support and questions:
- Create an issue in the repository
- Check the debug menu for real-time diagnostics
- Review logs for backend and frontend errors

---

**SOC-FeedViz** - Real-time cybersecurity intelligence visualization | MVP++
