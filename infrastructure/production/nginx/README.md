# Nginx Production Configuration

## Overview

This directory contains the hardened Nginx configuration for the GoldPC production environment with Blue-Green deployment support.

## Files

- `nginx.conf` - Main Nginx configuration file

## Features

### Blue-Green Deployment

The configuration supports Blue-Green deployment strategy with two backend upstreams:

- **backend_blue** - Active environment (default)
- **backend_green** - Standby/New version environment

Traffic routing is controlled via the `$backend_upstream` variable:
- Default: routes to `backend_blue`
- Set cookie `canary=green` to route to `backend_green`

### Rate Limiting

Two rate limiting zones are configured:

| Zone  | Rate        | Burst | Purpose                          |
|-------|-------------|-------|----------------------------------|
| api   | 10 req/sec  | 20    | General API endpoints            |
| auth  | 5 req/min   | 5     | Authentication endpoints (login) |

### Security Headers

All responses include the following security headers:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=(), interest-cohort=()`

### SSL/TLS Configuration

- **Protocols:** TLSv1.2, TLSv1.3
- **Ciphers:** Modern cipher suite with forward secrecy
- **Session Cache:** 50MB shared cache
- **OCSP Stapling:** Enabled
- **HSTS:** 1 year, includeSubDomains, preload

### Additional Security

- Block known vulnerability scanners (nikto, sqlmap, nmap, etc.)
- Block requests without User-Agent
- Deny access to hidden files (`.git`, `.env`, etc.)
- Deny access to backup/config files
- Block WordPress/PHP vulnerability scans
- Default server rejects unknown hosts

## Usage

### Prerequisites

1. SSL certificates mounted at `/etc/nginx/ssl/`:
   - `goldpc.by.crt` - SSL certificate
   - `goldpc.by.key` - SSL private key
   - `default.crt` / `default.key` - For default server

2. Backend services running:
   - `backend-blue:8080`
   - `backend-green:8080`
   - `frontend:3000`

### Docker Compose

```yaml
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - ./nginx/ssl:/etc/nginx/ssl:ro
    - ./nginx/logs:/var/log/nginx
  depends_on:
    - backend-blue
    - backend-green
    - frontend
```

### Blue-Green Switch

To switch traffic to the green environment:

```bash
# Using cookie
curl -b "canary=green" https://goldpc.by/api/v1/

# Or update the map directive in nginx.conf:
map $cookie_canary $backend_upstream {
    default backend_green;  # Changed from backend_blue
    "green" backend_green;
    "blue"  backend_blue;
}
```

### Testing Configuration

```bash
# Test syntax (requires backend hosts to exist)
docker exec nginx nginx -t

# Reload configuration
docker exec nginx nginx -s reload
```

## Monitoring

- Health check endpoint: `/health`
- Nginx status: `/nginx_status` (internal IPs only)
- JSON access logs for log aggregation

## Generating DH Parameters (Optional)

For additional security, generate DH parameters:

```bash
openssl dhparam -out dhparam.pem 4096
```

Then uncomment the line in nginx.conf:
```nginx
ssl_dhparam /etc/nginx/ssl/dhparam.pem;
```

## SSL Certificate Generation (Development)

For development/testing, generate self-signed certificates:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout goldpc.by.key \
  -out goldpc.by.crt \
  -subj "/CN=goldpc.by"
```

## Security Checklist

- [x] TLS 1.2+ only
- [x] Strong cipher suite
- [x] HSTS enabled
- [x] Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- [x] Rate limiting for API and Auth
- [x] Connection limiting
- [x] Block vulnerability scanners
- [x] Hide Nginx version
- [x] Deny sensitive files
- [x] Default server rejects unknown hosts