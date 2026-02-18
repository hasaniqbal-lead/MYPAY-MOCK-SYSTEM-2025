# DarPay VPS Deployment Guide

## 🚀 Pre-Deployment Checklist

### Local Machine (Build Images)
- [ ] Docker installed and running
- [ ] pnpm installed
- [ ] All code changes committed
- [ ] Environment variables configured

### VPS Server
- [ ] Ubuntu 20.04+ or similar
- [ ] Docker & Docker Compose installed
- [ ] Nginx installed
- [ ] Domain DNS configured with wildcard (*.vstore.cloud)
- [ ] Ports available: 4101, 4102, 4110, 4111, 4112, 3307

---

## 📦 Step 1: Build Docker Images Locally

### On Windows (PowerShell):
```powershell
cd C:\Users\hasan\OneDrive\Desktop\MYPAY-MOCK-SYSTEM

# Build all images
.\build-images.ps1

# Or with custom tag
.\build-images.ps1 -Tag v1.0.0
```

### Verify Images:
```powershell
docker images | Select-String "darpay"
```

You should see:
- darpay-payout-api:latest
- darpay-payment-api:latest
- darpay-merchant-portal:latest
- darpay-admin-portal:latest
- darpay-payment-page:latest

---

## 💾 Step 2: Save Images for Transfer

```powershell
# Create a directory for images
mkdir docker-images

# Save each image
docker save darpay-payout-api:latest | gzip > docker-images/darpay-payout-api.tar.gz
docker save darpay-payment-api:latest | gzip > docker-images/darpay-payment-api.tar.gz
docker save darpay-merchant-portal:latest | gzip > docker-images/darpay-merchant-portal.tar.gz
docker save darpay-admin-portal:latest | gzip > docker-images/darpay-admin-portal.tar.gz
docker save darpay-payment-page:latest | gzip > docker-images/darpay-payment-page.tar.gz
```

---

## 📤 Step 3: Transfer to VPS

### Option A: Using SCP
```powershell
scp -i vps_key docker-images/*.tar.gz root@YOUR_VPS_IP:/root/darpay-images/
scp -i vps_key docker-compose.vps.yml root@YOUR_VPS_IP:/root/darpay/docker-compose.yml
scp -i vps_key .env.production root@YOUR_VPS_IP:/root/darpay/.env
scp -i vps_key nginx/darpay-vps.conf root@YOUR_VPS_IP:/root/darpay/nginx.conf
```

### Option B: Using Docker Registry (Recommended for production)
```powershell
# Tag images with your registry
.\build-images.ps1 -Tag v1.0.0 -Registry your-registry.com

# Push to registry
docker push your-registry.com/darpay-payout-api:v1.0.0
docker push your-registry.com/darpay-payment-api:v1.0.0
docker push your-registry.com/darpay-merchant-portal:v1.0.0
docker push your-registry.com/darpay-admin-portal:v1.0.0
docker push your-registry.com/darpay-payment-page:v1.0.0
```

---

## 🖥️ Step 4: VPS Setup

### SSH into VPS:
```bash
ssh -i vps_key root@YOUR_VPS_IP
```

### Load Docker Images (if using SCP):
```bash
cd /root/darpay-images

# Load each image
docker load < darpay-payout-api.tar.gz
docker load < darpay-payment-api.tar.gz
docker load < darpay-merchant-portal.tar.gz
docker load < darpay-admin-portal.tar.gz
docker load < darpay-payment-page.tar.gz

# Verify
docker images | grep darpay
```

### Configure Environment:
```bash
cd /root/darpay

# Edit .env file with production secrets
nano .env
```

**Update these values:**
```env
DB_PASSWORD=YOUR_STRONG_PASSWORD_HERE
WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET_HERE
JWT_SECRET=YOUR_JWT_SECRET_HERE
API_KEY_SECRET=YOUR_API_KEY_SECRET_HERE
```

**Generate secrets:**
```bash
# Generate strong secrets
openssl rand -hex 32  # Use for DB_PASSWORD
openssl rand -hex 32  # Use for WEBHOOK_SECRET
openssl rand -hex 32  # Use for JWT_SECRET
openssl rand -hex 32  # Use for API_KEY_SECRET
```

---

## 🔧 Step 5: Configure Nginx

### Copy nginx configuration:
```bash
# Copy to sites-available
cp /root/darpay/nginx.conf /etc/nginx/sites-available/darpay.conf

# Create symlink
ln -s /etc/nginx/sites-available/darpay.conf /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Don't reload yet - need SSL first
```

---

## 🔐 Step 6: Setup SSL Certificates

### Install Certbot:
```bash
apt update
apt install certbot python3-certbot-nginx -y
```

### Generate certificates for all domains:
```bash
# Stop nginx temporarily
systemctl stop nginx

# Get certificates (one command for all domains)
certbot certonly --standalone -d darpay.vstore.cloud \
  -d api-darpay.vstore.cloud \
  -d sbx-darpay.vstore.cloud \
  -d merchant-darpay.vstore.cloud \
  -d admin-darpay.vstore.cloud \
  -d payment-darpay.vstore.cloud \
  -d payout-darpay.vstore.cloud \
  --email your@email.com \
  --agree-tos \
  --non-interactive

# Start nginx
systemctl start nginx
systemctl reload nginx
```

---

## 🐳 Step 7: Start DarPay Services

```bash
cd /root/darpay

# Start all services
docker-compose up -d

# Verify all containers are running
docker-compose ps

# Check logs
docker-compose logs -f

# Check specific service
docker-compose logs darpay-payment-api
```

### Expected containers:
- darpay-mysql
- darpay-payout-api
- darpay-payout-worker
- darpay-payment-api
- darpay-merchant-portal
- darpay-admin-portal
- darpay-payment-page

---

## 🗄️ Step 8: Initialize Database

### Run migrations:
```bash
# Access payment-api container
docker exec -it darpay-payment-api bash

# Inside container:
npx prisma migrate deploy
npx prisma db seed  # If you have seed data

# Exit container
exit
```

---

## ✅ Step 9: Verification

### Test each endpoint:

```bash
# Main site
curl https://darpay.vstore.cloud

# API Health
curl https://api-darpay.vstore.cloud/health

# Merchant Portal
curl -I https://merchant-darpay.vstore.cloud

# Admin Portal
curl -I https://admin-darpay.vstore.cloud

# Payment Page
curl -I https://payment-darpay.vstore.cloud
```

### Check container status:
```bash
docker ps | grep darpay
docker stats --no-stream | grep darpay
```

### Check nginx access logs:
```bash
tail -f /var/log/nginx/darpay-api.access.log
tail -f /var/log/nginx/darpay-merchant.access.log
tail -f /var/log/nginx/darpay-admin.access.log
```

---

## 🔍 Troubleshooting

### Container not starting:
```bash
docker-compose logs CONTAINER_NAME
docker inspect CONTAINER_NAME
```

### Port conflicts:
```bash
# Check what's using the port
netstat -tulpn | grep 4101

# Stop conflicting service or change port in docker-compose.vps.yml
```

### Nginx errors:
```bash
# Check nginx error log
tail -f /var/log/nginx/error.log

# Test configuration
nginx -t

# Reload nginx
systemctl reload nginx
```

### Database connection issues:
```bash
# Check MySQL is running
docker exec -it darpay-mysql mysql -u root -p

# Inside MySQL:
SHOW DATABASES;
USE darpay_mock_db;
SHOW TABLES;
```

---

## 🔄 Updates & Maintenance

### Update DarPay services:
```bash
# Build new images locally
.\build-images.ps1 -Tag v1.0.1

# Save and transfer to VPS
# ... (repeat transfer steps)

# On VPS:
cd /root/darpay
docker-compose down
# Load new images
docker-compose up -d
```

### Backup database:
```bash
# Backup
docker exec darpay-mysql mysqldump -u root -p darpay_mock_db > backup-$(date +%Y%m%d).sql

# Restore
docker exec -i darpay-mysql mysql -u root -p darpay_mock_db < backup-20260218.sql
```

### View logs:
```bash
docker-compose logs -f --tail=100
```

### Restart specific service:
```bash
docker-compose restart darpay-payment-api
```

---

## 📊 Monitoring

### Resource usage:
```bash
docker stats
```

### Nginx access:
```bash
tail -f /var/log/nginx/darpay-*.access.log
```

### Application logs:
```bash
docker-compose logs -f darpay-payment-api
docker-compose logs -f darpay-payout-api
```

---

## 🛡️ Security Checklist

- [ ] All secrets generated and unique
- [ ] .env file has restricted permissions (chmod 600)
- [ ] SSL certificates installed and auto-renewing
- [ ] Firewall configured (UFW)
- [ ] Only necessary ports exposed
- [ ] Regular backups scheduled
- [ ] Monitoring in place

---

## 📞 Support

- Documentation: Check README.md and other docs
- Logs: Always check docker-compose logs first
- Health checks: Monitor /health endpoints

---

## 🎉 Success!

If all tests pass, your DarPay system is live at:

- 🌐 Website: https://darpay.vstore.cloud
- 🔌 API: https://api-darpay.vstore.cloud
- 🧪 Sandbox: https://sbx-darpay.vstore.cloud
- 👤 Merchant: https://merchant-darpay.vstore.cloud
- 🛠️ Admin: https://admin-darpay.vstore.cloud
- 💳 Payment: https://payment-darpay.vstore.cloud
