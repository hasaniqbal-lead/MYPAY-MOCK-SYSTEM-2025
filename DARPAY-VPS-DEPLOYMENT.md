# 🚀 DarPay VPS Deployment Guide

## ✅ Local Build Status

Your Docker images have been built successfully:

- ✅ `darpay-payout-api:latest` (664MB)
- ✅ `darpay-payment-api:latest` (666MB)
- ✅ `darpay-merchant-portal:latest` (1.2GB)
- ✅ `darpay-admin-portal:latest` (1.19GB)
- 🔄 `darpay-payment-page:latest` (check build status)

## 📦 Step 1: Save and Transfer Images to VPS

### Option A: Save as tar files (Recommended for isolated deployment)

```powershell
# Save all images
docker save darpay-payout-api:latest | gzip > darpay-payout-api.tar.gz
docker save darpay-payment-api:latest | gzip > darpay-payment-api.tar.gz
docker save darpay-merchant-portal:latest | gzip > darpay-merchant-portal.tar.gz
docker save darpay-admin-portal:latest | gzip > darpay-admin-portal.tar.gz
docker save darpay-payment-page:latest | gzip > darpay-payment-page.tar.gz
```

### Transfer to VPS

```powershell
# Using SCP (replace with your VPS details)
scp -i vps_key darpay-*.tar.gz root@your-vps-ip:/root/darpay-images/
```

## 🔧 Step 2: VPS Setup

### SSH into VPS

```bash
ssh -i vps_key root@your-vps-ip
```

### Load Docker Images

```bash
cd /root/darpay-images/

# Load all images
docker load < darpay-payout-api.tar.gz
docker load < darpay-payment-api.tar.gz
docker load < darpay-merchant-portal.tar.gz
docker load < darpay-admin-portal.tar.gz
docker load < darpay-payment-page.tar.gz

# Verify images loaded
docker images | grep darpay
```

## 🗄️ Step 3: Create DarPay Directory Structure

```bash
# Create isolated directory for DarPay
mkdir -p /opt/darpay
cd /opt/darpay

# Create subdirectories
mkdir -p nginx logs data
```

## 📝 Step 4: Create Environment File

```bash
nano /opt/darpay/.env
```

Add the following:

```env
# Database
DB_PASSWORD=YOUR_SECURE_DB_PASSWORD_HERE
DB_NAME=darpay_mock_db

# Security
JWT_SECRET=YOUR_JWT_SECRET_HERE
WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET_HERE

# Node Environment
NODE_ENV=production
```

## 📋 Step 5: Upload docker-compose.vps.yml

Transfer the docker-compose file:

```powershell
# From local machine
scp -i vps_key docker-compose.vps.yml root@your-vps-ip:/opt/darpay/docker-compose.yml
```

## 🌐 Step 6: Configure Nginx

### Install Nginx (if not already installed)

```bash
apt update
apt install nginx -y
```

### Setup DarPay Nginx Configuration

```bash
# Transfer nginx config from local
# (On local machine)
scp -i vps_key nginx/darpay-vstore.conf root@your-vps-ip:/etc/nginx/sites-available/
```

On VPS:

```bash
# Enable the site
ln -s /etc/nginx/sites-available/darpay-vstore.conf /etc/nginx/sites-enabled/

# Test nginx configuration
nginx -t

# Reload nginx
systemctl reload nginx
```

### Setup SSL Certificates

```bash
# Install certbot
apt install certbot python3-certbot-nginx -y

# Get wildcard certificate for all subdomains
certbot certonly --manual --preferred-challenges dns \
  -d darpay.vstore.cloud \
  -d *.vstore.cloud

# Or individual certificates
certbot --nginx -d darpay.vstore.cloud \
  -d api-darpay.vstore.cloud \
  -d sbx-darpay.vstore.cloud \
  -d merchant-darpay.vstore.cloud \
  -d admin-darpay.vstore.cloud \
  -d payment-darpay.vstore.cloud \
  -d payout-darpay.vstore.cloud
```

## 🚀 Step 7: Deploy DarPay Containers

```bash
cd /opt/darpay

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# Check logs
docker-compose logs -f
```

## ✅ Step 8: Verify Deployment

### Check Container Status

```bash
docker ps | grep darpay
```

You should see:
- darpay-mysql
- darpay-payout-api
- darpay-payout-worker
- darpay-payment-api
- darpay-merchant-portal
- darpay-admin-portal
- darpay-payment-page

### Test Endpoints

```bash
# Health checks
curl https://api-darpay.vstore.cloud/health
curl https://sbx-darpay.vstore.cloud/health

# Portal checks
curl -I https://merchant-darpay.vstore.cloud
curl -I https://admin-darpay.vstore.cloud
curl -I https://payment-darpay.vstore.cloud
```

## 🔒 Step 9: Database Migration

```bash
# Access payment API container
docker exec -it darpay-payment-api sh

# Run migrations
npx prisma migrate deploy

# Seed database (if needed)
npx prisma db seed

exit
```

## 📊 Step 10: Monitor Services

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f darpay-payment-api

# Resource usage
docker stats
```

## 🔄 Management Commands

### Restart Services

```bash
docker-compose restart
```

### Stop Services

```bash
docker-compose stop
```

### Update Services

```bash
# Pull new images
docker load < new-image.tar.gz

# Recreate containers
docker-compose up -d --force-recreate
```

### Cleanup

```bash
# Remove old images
docker image prune -a

# Remove unused volumes
docker volume prune
```

## 🛡️ Security Checklist

- [ ] Firewall configured (only allow 80, 443, 22)
- [ ] Strong DB password set
- [ ] JWT secret configured
- [ ] SSL certificates installed
- [ ] Nginx security headers enabled
- [ ] Docker containers isolated in darpay-network
- [ ] Logs rotation configured
- [ ] Backup strategy implemented

## 📝 Port Mapping

| Service | Container Port | Host Port | Domain |
|---------|---------------|-----------|--------|
| MySQL | 3306 | 3307 | Internal only |
| Payout API | 4001 | 4001 | api-darpay.vstore.cloud |
| Payment API | 4002 | 4002 | api-darpay.vstore.cloud |
| Merchant Portal | 3000 | 4010 | merchant-darpay.vstore.cloud |
| Admin Portal | 3000 | 4011 | admin-darpay.vstore.cloud |
| Payment Page | 80 | 4020 | payment-darpay.vstore.cloud |

## 🎯 Access URLs

- **Main Website**: https://darpay.vstore.cloud
- **Production API**: https://api-darpay.vstore.cloud
- **Sandbox API**: https://sbx-darpay.vstore.cloud
- **Merchant Portal**: https://merchant-darpay.vstore.cloud
- **Admin Portal**: https://admin-darpay.vstore.cloud
- **Payment Page**: https://payment-darpay.vstore.cloud
- **Payout Page**: https://payout-darpay.vstore.cloud

## 🆘 Troubleshooting

### Containers won't start

```bash
# Check logs
docker-compose logs

# Check database connection
docker exec -it darpay-mysql mysql -uroot -p

# Verify environment variables
docker-compose config
```

### Nginx issues

```bash
# Check nginx status
systemctl status nginx

# Test configuration
nginx -t

# Check error logs
tail -f /var/log/nginx/error.log
```

### SSL certificate issues

```bash
# Renew certificates
certbot renew

# Check certificate status
certbot certificates
```

## 🎉 Deployment Complete!

Your DarPay system is now running in isolated containers on your VPS, separate from other applications. The nginx configuration ensures proper routing without affecting existing services.
