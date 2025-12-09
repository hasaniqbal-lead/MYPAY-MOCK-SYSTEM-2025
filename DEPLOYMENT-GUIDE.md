# MyPay Mock Platform - VPS Deployment Guide

## Quick Reference

**VPS Details:**
- IP Address: `72.60.110.249`
- User: `root`
- Password: `-v9(Q158qCwKk4--5/WY`

**Domains (Wildcard DNS Configured):**
- `sandbox.mycodigital.io` - API Gateway (Payout + Payment APIs)
- `devportal.mycodigital.io` - Merchant Portal
- `devadmin.mycodigital.io` - Admin Portal

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Step 1: Connect to VPS](#step-1-connect-to-vps)
3. [Step 2: Audit Current State](#step-2-audit-current-state)
4. [Step 3: Clean Up Existing Services](#step-3-clean-up-existing-services)
5. [Step 4: Transfer Files](#step-4-transfer-files)
6. [Step 5: Configure Environment](#step-5-configure-environment)
7. [Step 6: Deploy Services](#step-6-deploy-services)
8. [Step 7: Test Deployment](#step-7-test-deployment)
9. [Troubleshooting](#troubleshooting)
10. [Post-Deployment](#post-deployment)

---

## Pre-Deployment Checklist

Before starting deployment, ensure:

- [ ] DNS is configured (wildcard DNS for *.mycodigital.io)
- [ ] VPS is accessible via SSH
- [ ] You have root access to the VPS
- [ ] All local files are committed and ready
- [ ] Production secrets are prepared (DB password, JWT secret, etc.)
- [ ] Firewall allows ports 80 (HTTP) and 443 (HTTPS)
- [ ] SSL certificates can be obtained (Let's Encrypt)

---

## Step 1: Connect to VPS

### Option A: Using PowerShell (Windows)

```powershell
# Run the connection helper script
.\vps-connect.ps1
```

### Option B: Using PuTTY (Windows)

1. Download PuTTY from https://www.putty.org/
2. Open PuTTY
3. Enter Host: `72.60.110.249`
4. Port: `22`
5. Connection Type: SSH
6. Click "Open"
7. Login as: `root`
8. Password: `-v9(Q158qCwKk4--5/WY`

### Option C: Using SSH Command

```bash
ssh root@72.60.110.249
# Enter password when prompted: -v9(Q158qCwKk4--5/WY
```

---

## Step 2: Audit Current State

Once connected to the VPS, run the audit script:

```bash
# First, create the audit script
cat > vps-audit.sh << 'EOF'
[Content of vps-audit.sh]
EOF

# Make it executable
chmod +x vps-audit.sh

# Run the audit
./vps-audit.sh
```

**Review the output carefully:**
- Check what Docker containers are running
- Check what ports are in use
- Check disk space available
- Check existing Nginx configurations
- Note any existing SSL certificates

**Save the audit output:**
```bash
./vps-audit.sh > audit-report-$(date +%Y%m%d-%H%M%S).txt
```

---

## Step 3: Clean Up Existing Services

If you have old deployments, clean them up:

### Option A: Manual Cleanup

```bash
# Stop all MyPay containers
docker stop $(docker ps -a | grep mypay | awk '{print $1}')

# Remove containers
docker rm $(docker ps -a | grep mypay | awk '{print $1}')

# Remove images (optional)
docker rmi $(docker images | grep mypay | awk '{print $3}')

# Remove volumes (WARNING: Deletes database)
docker volume rm $(docker volume ls | grep mypay | awk '{print $2}')
```

### Option B: Using Cleanup Script

```bash
# Create cleanup script
cat > vps-cleanup.sh << 'EOF'
[Content of vps-cleanup.sh]
EOF

# Make it executable
chmod +x vps-cleanup.sh

# Run cleanup (will prompt for confirmation)
./vps-cleanup.sh
```

---

## Step 4: Transfer Files

### Option A: Using SCP (Recommended)

From your local machine:

```bash
# Navigate to project directory
cd C:\Users\hasan\OneDrive\Desktop\MYPAY-MOCK-SYSTEM

# Create a deployment package
tar -czf mypay-deployment.tar.gz \
    docker-compose.yml \
    services/ \
    nginx/ \
    prisma/ \
    packages/ \
    .env.production \
    deploy-production.sh \
    test-deployment.sh \
    package.json \
    pnpm-workspace.yaml \
    tsconfig.json

# Transfer to VPS
scp mypay-deployment.tar.gz root@72.60.110.249:/opt/

# SSH into VPS
ssh root@72.60.110.249

# Extract files
cd /opt
mkdir -p mypay-mock
tar -xzf mypay-deployment.tar.gz -C mypay-mock/
cd mypay-mock
```

### Option B: Using Git (Alternative)

```bash
# On VPS
cd /opt
rm -rf mypay-mock  # Remove old if exists
git clone <your-repository-url> mypay-mock
cd mypay-mock
```

### Option C: Using WinSCP (Windows GUI)

1. Download WinSCP from https://winscp.net/
2. Connect to VPS:
   - Protocol: SFTP
   - Host: 72.60.110.249
   - User: root
   - Password: -v9(Q158qCwKk4--5/WY
3. Navigate to `/opt/`
4. Create folder `mypay-mock`
5. Upload all project files

---

## Step 5: Configure Environment

On the VPS:

```bash
cd /opt/mypay-mock

# Copy production environment template
cp .env.production .env

# Edit environment file
nano .env
```

**Update these values in `.env`:**

```bash
# Database Configuration
DB_PASSWORD=YOUR_STRONG_DATABASE_PASSWORD_HERE
DB_NAME=mypay_mock_db

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=YOUR_STRONG_JWT_SECRET_HERE

# API Key Secret
API_KEY_SECRET=YOUR_STRONG_API_KEY_SECRET_HERE

# Webhook Secret
WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET_HERE
```

**Generate strong secrets:**
```bash
# Generate random secrets
openssl rand -base64 32  # Use for JWT_SECRET
openssl rand -base64 32  # Use for API_KEY_SECRET
openssl rand -base64 32  # Use for DB_PASSWORD
openssl rand -base64 32  # Use for WEBHOOK_SECRET
```

**Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`

---

## Step 6: Deploy Services

Run the deployment script:

```bash
cd /opt/mypay-mock

# Make deployment script executable
chmod +x deploy-production.sh

# Run deployment
./deploy-production.sh
```

**The script will:**
1. ✓ Clean up old containers
2. ✓ Install Docker, Docker Compose, Nginx, Certbot
3. ✓ Build Docker images
4. ✓ Start all services
5. ✓ Wait for MySQL to be ready
6. ✓ Run database migrations
7. ✓ Seed database with test data
8. ✓ Configure Nginx
9. ✓ Obtain SSL certificates
10. ✓ Verify services are running

**Expected Duration:** 10-15 minutes

**Watch for errors:** The script will stop if any critical step fails.

---

## Step 7: Test Deployment

### Automated Testing

Run the comprehensive test script:

```bash
cd /opt/mypay-mock

# Make test script executable
chmod +x test-deployment.sh

# Run all tests
./test-deployment.sh
```

The test script will check:
- ✓ All Docker containers are running
- ✓ Payout API endpoints
- ✓ Payment API endpoints
- ✓ Portal authentication
- ✓ SSL certificates
- ✓ Database connectivity
- ✓ Nginx configuration

### Manual Testing

#### 1. Test Payout API

```bash
# Health check
curl https://sandbox.mycodigital.io/api/v1/health

# Expected: {"status":"healthy","timestamp":"..."}
```

#### 2. Test Payment API

```bash
# Health check
curl https://sandbox.mycodigital.io/health

# Expected: {"status":"OK","service":"MyPay Payment API",...}
```

#### 3. Test Payment Checkout Creation

```bash
curl -X POST https://sandbox.mycodigital.io/checkouts \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: test-api-key-123" \
  -d '{
    "reference": "TEST-001",
    "amount": 1000,
    "paymentMethod": "jazzcash",
    "paymentType": "onetime",
    "successUrl": "https://example.com/success",
    "returnUrl": "https://example.com/return"
  }'

# Expected: {"success":true,"checkout_id":"...","checkout_url":"..."}
```

#### 4. Test Portal Login

```bash
curl -X POST https://sandbox.mycodigital.io/api/portal/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@mycodigital.io",
    "password": "test123456"
  }'

# Expected: {"success":true,"token":"...","merchant":{...}}
```

#### 5. Test Portal UIs

Open in browser:
- Merchant Portal: https://devportal.mycodigital.io
- Admin Portal: https://devadmin.mycodigital.io

**Test Credentials:**

Merchant Portal:
- Email: `test@mycodigital.io`
- Password: `test123456`

Admin Portal:
- Email: `admin@mycodigital.io`
- Password: `admin123456`

---

## Troubleshooting

### Issue: Cannot connect to VPS

**Solutions:**
1. Check if VPS is online: `ping 72.60.110.249`
2. Verify SSH port 22 is open
3. Check if firewall is blocking connection
4. Try different network/VPN

### Issue: SSL certificate failed

**Cause:** DNS not propagated or port 80/443 blocked

**Solutions:**
```bash
# Check DNS resolution
dig sandbox.mycodigital.io
dig devportal.mycodigital.io
dig devadmin.mycodigital.io

# Manually obtain certificate
systemctl stop nginx
certbot certonly --standalone -d sandbox.mycodigital.io
certbot certonly --standalone -d devportal.mycodigital.io
certbot certonly --standalone -d devadmin.mycodigital.io
systemctl start nginx
```

### Issue: Docker containers not starting

**Check logs:**
```bash
# View all logs
docker compose logs

# View specific service
docker compose logs payout-api
docker compose logs payment-api
docker compose logs merchant-portal
docker compose logs admin-portal
docker compose logs mysql
```

**Common fixes:**
```bash
# Restart specific service
docker compose restart payout-api

# Restart all services
docker compose restart

# Rebuild and restart
docker compose up -d --build
```

### Issue: Database connection errors

**Check MySQL:**
```bash
# Check if MySQL is running
docker ps | grep mysql

# Test connection
docker exec -it mypay-mysql mysql -u root -p

# Check logs
docker logs mypay-mysql
```

**Fix database:**
```bash
# Recreate database
docker compose down
docker volume rm mypay-mock_mysql_data
docker compose up -d mysql
sleep 15
docker compose exec payout-api npx prisma migrate deploy
docker compose exec payout-api npx prisma db seed
```

### Issue: API returns 502 Bad Gateway

**Cause:** Service not fully started or crashed

**Solutions:**
```bash
# Check container status
docker compose ps

# Check service logs
docker compose logs payout-api
docker compose logs payment-api

# Restart services
docker compose restart payout-api payment-api
```

### Issue: Portal shows blank page

**Cause:** Build failed or environment variables incorrect

**Solutions:**
```bash
# Check portal logs
docker compose logs merchant-portal
docker compose logs admin-portal

# Rebuild portals
docker compose up -d --build merchant-portal admin-portal
```

---

## Post-Deployment

### Monitoring

**Check service status:**
```bash
# View running containers
docker compose ps

# View logs (follow mode)
docker compose logs -f

# View specific service logs
docker compose logs -f payment-api
```

**Monitor system resources:**
```bash
# CPU and Memory
docker stats

# Disk space
df -h

# Docker disk usage
docker system df
```

### Useful Commands

```bash
# Restart all services
docker compose restart

# Stop all services
docker compose stop

# Start all services
docker compose start

# Rebuild specific service
docker compose up -d --build payout-api

# View environment variables
docker compose exec payout-api env

# Access MySQL
docker exec -it mypay-mysql mysql -u root -p

# View Nginx logs
tail -f /var/log/nginx/sandbox.access.log
tail -f /var/log/nginx/sandbox.error.log
```

### Backup Database

```bash
# Create backup
docker exec mypay-mysql mysqldump -u root -p mypay_mock_db > backup-$(date +%Y%m%d).sql

# Restore backup
docker exec -i mypay-mysql mysql -u root -p mypay_mock_db < backup-20241208.sql
```

### Update Deployment

```bash
cd /opt/mypay-mock

# Pull latest changes (if using Git)
git pull origin main

# Rebuild and restart
docker compose up -d --build

# Run migrations if schema changed
docker compose exec payout-api npx prisma migrate deploy
```

### SSL Certificate Renewal

Certificates auto-renew via cron job. Manual renewal:

```bash
# Renew all certificates
certbot renew

# Reload Nginx
systemctl reload nginx
```

---

## Service Architecture

```
INTERNET
    |
    v
NGINX (Port 80/443)
    |
    +-- sandbox.mycodigital.io
    |       |
    |       +-- /api/v1/*        -> Payout API (4001)
    |       +-- /checkouts       -> Payment API (4002)
    |       +-- /payment/*       -> Payment API (4002)
    |       +-- /api/portal/*    -> Payment API (4002)
    |
    +-- devportal.mycodigital.io  -> Merchant Portal (4010)
    |
    +-- devadmin.mycodigital.io   -> Admin Portal (4011)

All services connect to MySQL (3306)
```

---

## Service Ports

| Service | Internal Port | Exposed | Purpose |
|---------|---------------|---------|---------|
| MySQL | 3306 | Yes | Database |
| Payout API | 4001 | Yes | Payout processing |
| Payment API | 4002 | Yes | Payment processing |
| Merchant Portal | 4010 | Yes | Merchant dashboard |
| Admin Portal | 4011 | Yes | Admin dashboard |
| Nginx | 80, 443 | Yes | Reverse proxy |

---

## Security Checklist

- [x] SSL certificates installed
- [x] Strong database passwords
- [x] JWT secrets configured
- [x] API keys hashed
- [x] Nginx security headers
- [ ] Firewall configured (UFW)
- [ ] Regular backups automated
- [ ] Log rotation configured
- [ ] Rate limiting enabled
- [ ] Monitoring alerts set up

---

## Contact & Support

For issues or questions:
1. Check this guide first
2. Review service logs: `docker compose logs`
3. Check Nginx logs: `/var/log/nginx/`
4. Review the main guide: [MYPAY-MOCK-SYSTEM-GUIDE.md](./MYPAY-MOCK-SYSTEM-GUIDE.md)

---

## Quick Command Reference

```bash
# Connect to VPS
ssh root@72.60.110.249

# Go to project
cd /opt/mypay-mock

# View status
docker compose ps

# View logs
docker compose logs -f

# Restart services
docker compose restart

# Test APIs
curl https://sandbox.mycodigital.io/api/v1/health
curl https://sandbox.mycodigital.io/health

# Access database
docker exec -it mypay-mysql mysql -u root -p

# Check Nginx
nginx -t
systemctl status nginx
```

---

**Document Version:** 1.0
**Last Updated:** December 2024
**VPS IP:** 72.60.110.249
**Status:** Ready for Deployment
