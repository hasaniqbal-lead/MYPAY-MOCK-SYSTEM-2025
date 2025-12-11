# MyPay Mock Platform - Quick Deployment Guide

## TL;DR - Deploy in 5 Minutes

```bash
# 1. SSH into VPS
ssh root@72.60.110.249

# 2. Navigate to project
cd /opt/mypay-mock

# 3. Make scripts executable
chmod +x *.sh

# 4. Run pre-deployment check
./pre-deploy-check.sh

# 5. Deploy (15-20 min)
./deploy-production.sh

# 6. Verify deployment
./health-check.sh
```

That's it! If all scripts succeed, you're deployed.

---

## VPS Credentials

**SSH Access:**
```
Host: 72.60.110.249
User: root
Password: 02tlw|A6#4qx
```

**Project Location:** `/opt/mypay-mock`

---

## Public URLs

| Service | URL | Status |
|---------|-----|--------|
| Payout API | https://sandbox.mycodigital.io/api/v1/health | Health endpoint |
| Payment API | https://sandbox.mycodigital.io/health | Health endpoint |
| Merchant Portal | https://devportal.mycodigital.io | Login page |
| Admin Portal | https://devadmin.mycodigital.io | Login page |

---

## Test Credentials

### Merchant Portal
```
URL: https://devportal.mycodigital.io
Email: test@mycodigital.io
Password: test123456
```

### Admin Portal
```
URL: https://devadmin.mycodigital.io
Email: admin@mycodigital.io
Password: admin123456
```

### API Keys
```
Payment API Key: test-api-key-123
Payout API Key: Check seed output in logs
```

---

## Deployment Scripts

### 1. Pre-Deployment Check
Validates environment before deployment.
```bash
./pre-deploy-check.sh
```
**Duration:** 30 seconds
**Purpose:** Ensures VPS is ready

### 2. Main Deployment
Complete automated deployment.
```bash
./deploy-production.sh
```
**Duration:** 15-20 minutes
**What it does:**
- Installs dependencies (Docker, Nginx, Certbot)
- Builds Docker images
- Starts all containers
- Runs database migrations
- Seeds test data
- Configures Nginx
- Sets up SSL certificates

### 3. Health Check
Verifies all services are running.
```bash
./health-check.sh
```
**Duration:** 10 seconds
**Purpose:** System health validation

### 4. Rollback
Restore previous state if needed.
```bash
./rollback.sh
```
**Purpose:** Emergency recovery

---

## Manual Deployment Steps

If you prefer manual control:

### Step 1: SSH and Navigate
```bash
ssh root@72.60.110.249
cd /opt/mypay-mock
```

### Step 2: Verify Files
```bash
ls -la docker-compose.yml .env services/
```

### Step 3: Build Images
```bash
docker compose build --progress=plain
```

### Step 4: Start Containers
```bash
docker compose up -d
```

### Step 5: Wait for MySQL
```bash
sleep 30
```

### Step 6: Run Migrations
```bash
docker compose exec payout-api npx prisma migrate deploy
```

### Step 7: Seed Database
```bash
docker compose exec payout-api npx prisma db seed
```

### Step 8: Check Status
```bash
docker compose ps
```

### Step 9: Configure Nginx
```bash
cp nginx/mypay.conf /etc/nginx/sites-available/mypay.conf
ln -sf /etc/nginx/sites-available/mypay.conf /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### Step 10: Setup SSL
```bash
certbot --nginx -d sandbox.mycodigital.io -d devportal.mycodigital.io -d devadmin.mycodigital.io
```

---

## Common Commands

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f payout-api

# Last 100 lines
docker compose logs --tail=100

# Nginx logs
tail -f /var/log/nginx/sandbox.access.log
tail -f /var/log/nginx/sandbox.error.log
```

### Restart Services
```bash
# All services
docker compose restart

# Specific service
docker compose restart payout-api

# Full restart
docker compose down
docker compose up -d
```

### Check Status
```bash
# Container status
docker compose ps

# Service health
./health-check.sh

# System resources
docker stats

# Disk usage
df -h
docker system df
```

### Database Access
```bash
# Connect to MySQL
docker exec -it mypay-mysql mysql -u root -p

# Run query
docker exec -it mypay-mysql mysql -u root -p mypay_mock_db -e "SELECT * FROM Merchant;"

# Database backup
docker compose exec -T mysql mysqldump -u root -p mypay_mock_db > backup.sql
```

---

## Test API Endpoints

### Payout API Test
```bash
# Health check
curl https://sandbox.mycodigital.io/api/v1/health

# Create payout (use actual API key from seed output)
curl -X POST https://sandbox.mycodigital.io/api/v1/payouts \
  -H "X-API-KEY: <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "beneficiary_name": "Test User",
    "account_number": "123450001",
    "bank_code": "HBL",
    "amount": 1000,
    "purpose": "Test"
  }'
```

### Payment API Test
```bash
# Health check
curl https://sandbox.mycodigital.io/health

# Create checkout
curl -X POST https://sandbox.mycodigital.io/api/checkout/create \
  -H "X-Api-Key: test-api-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "currency": "PKR",
    "merchant_ref": "TEST-001"
  }'
```

---

## Troubleshooting

### Container Won't Start
```bash
# View logs
docker compose logs <container-name>

# Force recreate
docker compose down
docker compose up -d --force-recreate
```

### Port Already in Use
```bash
# Find process using port
lsof -i :4001

# Kill process
kill -9 <PID>
```

### Database Connection Failed
```bash
# Check MySQL status
docker compose exec mysql mysqladmin ping

# Restart MySQL
docker compose restart mysql
sleep 10
```

### SSL Certificate Failed
```bash
# Check DNS
nslookup sandbox.mycodigital.io

# Retry certificate
certbot --nginx -d sandbox.mycodigital.io --force-renewal
```

### Out of Disk Space
```bash
# Clean Docker
docker system prune -a -f

# Clean old backups
cd /opt/mypay-mock/backups
ls -t | tail -n +6 | xargs rm
```

### Migration Failed
```bash
# Reset database (WARNING: Deletes data)
docker compose exec payout-api npx prisma migrate reset

# Redeploy migrations
docker compose exec payout-api npx prisma migrate deploy
```

---

## Emergency Procedures

### Quick Restart
```bash
cd /opt/mypay-mock
docker compose restart
```

### Full Restart
```bash
cd /opt/mypay-mock
docker compose down
docker compose up -d
sleep 30
./health-check.sh
```

### Emergency Stop
```bash
cd /opt/mypay-mock
./rollback.sh --emergency
```

### Restore from Backup
```bash
cd /opt/mypay-mock
./rollback.sh
# Select option 2 or 3
```

---

## Performance Tuning

### Check Resource Usage
```bash
# Container resources
docker stats

# System resources
htop

# Disk usage
df -h
du -sh /opt/mypay-mock/*
```

### Optimize Docker
```bash
# Remove unused resources
docker system prune -a

# Restart containers
docker compose restart
```

---

## Monitoring Setup (Optional)

### Add Cron Job for Health Checks
```bash
# Edit crontab
crontab -e

# Add line (check every 5 minutes)
*/5 * * * * cd /opt/mypay-mock && ./health-check.sh >> /opt/mypay-mock/logs/health-check.log 2>&1
```

### Log Rotation
```bash
# Create logrotate config
cat > /etc/logrotate.d/mypay << EOF
/var/log/nginx/sandbox.*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    sharedscripts
    postrotate
        systemctl reload nginx
    endscript
}
EOF
```

---

## Success Validation

Run this command to validate everything is working:

```bash
cd /opt/mypay-mock && ./health-check.sh
```

You should see:
- ✓ All 5 containers running
- ✓ All API health checks passing
- ✓ Both portals accessible
- ✓ Database connected
- ✓ Public domains accessible
- ✓ Nginx running

---

## Support

### Logs Location
- Deployment: `/opt/mypay-mock/logs/deployment-*.log`
- Health checks: `/opt/mypay-mock/logs/health-check.log`
- Nginx access: `/var/log/nginx/sandbox.access.log`
- Nginx error: `/var/log/nginx/sandbox.error.log`
- Docker: `docker compose logs`

### Backup Location
- Database backups: `/opt/mypay-mock/backups/mysql-backup-*.sql.gz`

### Configuration Files
- Docker Compose: `/opt/mypay-mock/docker-compose.yml`
- Environment: `/opt/mypay-mock/.env`
- Nginx: `/etc/nginx/sites-available/mypay.conf`
- SSL Certs: `/etc/letsencrypt/live/*/`

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────┐
│         MyPay Mock Platform - Quick Ref             │
├─────────────────────────────────────────────────────┤
│ SSH:     ssh root@72.60.110.249                     │
│ Dir:     cd /opt/mypay-mock                         │
│ Deploy:  ./deploy-production.sh                     │
│ Health:  ./health-check.sh                          │
│ Logs:    docker compose logs -f                     │
│ Restart: docker compose restart                     │
│ Stop:    docker compose down                        │
│ Start:   docker compose up -d                       │
├─────────────────────────────────────────────────────┤
│ Payout API:   https://sandbox.mycodigital.io        │
│ Merchant:     https://devportal.mycodigital.io      │
│ Admin:        https://devadmin.mycodigital.io       │
├─────────────────────────────────────────────────────┤
│ Merchant:  test@mycodigital.io / test123456         │
│ Admin:     admin@mycodigital.io / admin123456       │
└─────────────────────────────────────────────────────┘
```

Print this and keep it handy!
