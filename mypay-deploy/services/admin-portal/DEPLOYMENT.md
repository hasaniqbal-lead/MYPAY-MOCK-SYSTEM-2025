# Portal Deployment Guide

## Quick Deploy to VPS

### Step 1: Upload Portal to VPS

```bash
# From your local machine
scp -r "C:\Users\hasan\OneDrive\Desktop\myco payments\dummy-sandbox-portal" root@45.80.181.139:/opt/dummy-sandbox-portal
```

### Step 2: On VPS - Build and Deploy

```bash
# SSH into VPS
ssh root@45.80.181.139

# Navigate to portal directory
cd /opt/dummy-sandbox-portal

# Build and start with Docker Compose
docker-compose up -d --build
```

### Step 3: Configure Nginx

```bash
# Copy Nginx config
cp deploy/nginx.conf /etc/nginx/sites-available/devportal.mycodigital.io

# Enable site
ln -s /etc/nginx/sites-available/devportal.mycodigital.io /etc/nginx/sites-enabled/

# Test and reload
nginx -t && systemctl reload nginx
```

### Step 4: Set Up SSL

```bash
certbot --nginx -d devportal.mycodigital.io
```

### Step 5: Verify Deployment

```bash
# Check container
docker ps | grep dummy-portal

# Check logs
docker logs dummy-portal-frontend

# Test endpoint
curl http://localhost:3001
```

## Environment Variables

Create `.env` file on VPS:

```env
NEXT_PUBLIC_API_URL=https://sandbox.mycodigital.io
NEXT_PUBLIC_PORTAL_URL=https://devportal.mycodigital.io
NODE_ENV=production
```

## Important Notes

1. **API Endpoints Required**: The portal needs the Payment API to be extended with portal-specific endpoints. See `API_EXTENSIONS.md` for details.

2. **Database**: The portal uses the same database as the Payment API. Make sure to run the schema migrations from `API_EXTENSIONS.md`.

3. **Port**: Portal runs on port 3001 (Payment API uses 3000).

4. **SSL**: SSL certificate will be automatically configured by Certbot.

## Troubleshooting

### Portal won't start
```bash
docker logs dummy-portal-frontend
```

### Nginx errors
```bash
nginx -t
tail -f /var/log/nginx/error.log
```

### API connection issues
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check if Payment API is running
- Verify CORS settings on Payment API

## Update Portal

```bash
cd /opt/dummy-sandbox-portal
git pull  # or scp new files
docker-compose down
docker-compose up -d --build
```

