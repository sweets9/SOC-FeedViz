# IP Allow List Configuration

The backend server includes an IP allow list to restrict access to API endpoints.

## Configuration

Set the `ALLOWED_IPS` environment variable with a comma-separated list of allowed IP addresses or CIDR ranges.

### Examples

**Allow localhost only (default):**
```bash
ALLOWED_IPS=127.0.0.1,::1,localhost
```

**Allow specific IPs:**
```bash
ALLOWED_IPS=192.168.1.100,10.0.0.50
```

**Allow IP ranges (CIDR):**
```bash
ALLOWED_IPS=192.168.1.0/24,10.0.0.0/8
```

**Allow all IPs (not recommended for production):**
```bash
ALLOWED_IPS=*
```

## How It Works

- Static files (HTML, CSS, JS, images) are always allowed
- API endpoints (`/api/*`) are protected by IP allow list
- Requests from non-allowed IPs receive a 403 Forbidden response
- The client IP is detected from headers (`x-forwarded-for`, `x-real-ip`) or connection

## Setting Environment Variable

**Windows (PowerShell):**
```powershell
$env:ALLOWED_IPS="127.0.0.1,::1,localhost,10.10.1.0/24"
npm start
```

**Windows (CMD):**
```cmd
set ALLOWED_IPS=127.0.0.1,::1,localhost,10.10.1.0/24
npm start
```

**Linux/Mac:**
```bash
export ALLOWED_IPS="127.0.0.1,::1,localhost,10.10.1.0/24"
npm start
```

**Or create a `.env` file in the backend directory:**
```
ALLOWED_IPS=127.0.0.1,::1,localhost,10.10.1.0/24
```

## Default Behavior

If `ALLOWED_IPS` is not set, the default is:
```
127.0.0.1,::1,localhost
```

This allows only localhost connections.

