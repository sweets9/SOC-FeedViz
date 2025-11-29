# Nginx Load Balancer Deployment Guide

## Port Configuration
- **Frontend**: Port 3005 (Vite dev server)
- **Backend**: Port 3003 (RSS feed server)
- **Nginx**: Port 80/443 (load balancer)

## Setup Instructions

### 1. Install Nginx
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx

# macOS
brew install nginx
```

### 2. Configure Nginx
```bash
# Copy the example configuration
sudo cp nginx.example.conf /etc/nginx/sites-available/rss-feed-scroller

# Enable the site
sudo ln -s /etc/nginx/sites-available/rss-feed-scroller /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### 3. Start Services
```bash
# Start backend (port 3003)
npm run start:backend

# Start frontend (port 3005)
npm run start:frontend

# Or start both together
npm run start:all
```

### 4. Access the Application
- **Main application**: http://localhost
- **Direct frontend**: http://localhost:3005
- **Direct backend API**: http://localhost:3003/api/feeds

## Production Considerations

### Environment Variables
For production, create `.env.production`:
```
VITE_BACKEND_URL=/api
VITE_ENV=production
```

### Build for Production
```bash
# Build frontend
npm run build

# Serve static files with nginx
# Update nginx config to serve dist/ folder instead of proxy
```

### SSL/HTTPS Setup
1. Obtain SSL certificates (Let's Encrypt recommended)
2. Uncomment HTTPS section in `nginx.example.conf`
3. Update certificate paths
4. Restart nginx

### Load Balancing
Add more servers to upstream blocks:
```nginx
upstream rss_frontend {
    server localhost:3005;
    server localhost:3006;
    server localhost:3007;
}
```

### Monitoring
- Monitor nginx logs: `/var/log/nginx/access.log` and `/var/log/nginx/error.log`
- Health check endpoint: `http://localhost/health`
- Application logs in respective service terminals

## Troubleshooting

### Port Conflicts
If ports are in use:
```bash
# Check what's using ports
sudo netstat -tulpn | grep :3005
sudo netstat -tulpn | grep :3003

# Kill processes if needed
sudo kill -9 <PID>
```

### Nginx Issues
```bash
# Check nginx status
sudo systemctl status nginx

# View nginx logs
sudo tail -f /var/log/nginx/error.log

# Reload configuration
sudo nginx -s reload
```

### Proxy Issues
- Ensure backend is running on port 3003
- Check firewall settings
- Verify nginx configuration with `nginx -t`

## Multiple Environments
Create separate configs for:
- Development: `nginx.dev.conf`
- Staging: `nginx.staging.conf`  
- Production: `nginx.prod.conf`

Switch between them:
```bash
sudo cp nginx.prod.conf /etc/nginx/sites-enabled/rss-feed-scroller
sudo nginx -s reload
```
