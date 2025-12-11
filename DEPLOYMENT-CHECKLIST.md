# MyPay Mock Platform - Production Deployment Checklist

## Overview
This checklist ensures a complete and secure production deployment of the MyPay Mock Platform.

**VPS Details:**
- IP: 72.60.110.249
- User: root
- Password: 02tlw|A6#4qx
- Location: /opt/mypay-mock

**Domains:**
- Sandbox API: sandbox.mycodigital.io
- Merchant Portal: devportal.mycodigital.io
- Admin Portal: devadmin.mycodigital.io

---

## Pre-Deployment Phase

### 1. Environment Preparation
- [ ] SSH access to VPS confirmed
- [ ] VPS has minimum 2GB RAM
- [ ] VPS has minimum 15GB free disk space
- [ ] Root access available
- [ ] All source code committed to GitHub
- [ ] GitHub repository accessible from VPS

### 2. DNS Configuration
- [ ] sandbox.mycodigital.io points to 72.60.110.249
- [ ] devportal.mycodigital.io points to 72.60.110.249
- [ ] devadmin.mycodigital.io points to 72.60.110.249
- [ ] DNS propagation completed (check with `nslookup` or `dig`)

### 3. Files Verification
- [ ] Source code transferred to /opt/mypay-mock
- [ ] docker-compose.yml present
- [ ] nginx/mypay.conf present
- [ ] All service Dockerfiles present
- [ ] prisma/schema.prisma present
- [ ] prisma/seed.ts present
- [ ] All deployment scripts present and executable

---

## Security Phase

### 4. Environment Variables
- [ ] Copy .env.production to .env
- [ ] Generate strong DB_PASSWORD (min 16 characters)
- [ ] Generate WEBHOOK_SECRET: `openssl rand -hex 32`
- [ ] Generate JWT_SECRET: `openssl rand -hex 32`
- [ ] Generate API_KEY_SECRET: `openssl rand -hex 32`
- [ ] Verify all domain names in .env
- [ ] Set file permissions: `chmod 600 /opt/mypay-mock/.env`
- [ ] Verify .env is in .gitignore

### 5. Security Hardening
- [ ] .env file NOT committed to git
- [ ] Strong passwords set for all secrets
- [ ] SSH key authentication configured (optional but recommended)
- [ ] Firewall configured (UFW or iptables)
- [ ] Only necessary ports open: 22, 80, 443
- [ ] Docker ports (4001-4011) NOT exposed publicly

---

## Deployment Phase

### 6. Pre-Deployment Validation
```bash
cd /opt/mypay-mock
chmod +x *.sh
./pre-deploy-check.sh
```

- [ ] All pre-deployment checks passed
- [ ] OR all critical errors resolved
- [ ] Warnings reviewed and acceptable

### 7. System Dependencies
- [ ] Docker installed and running
- [ ] Docker Compose plugin installed
- [ ] Nginx installed
- [ ] Certbot installed
- [ ] All dependencies verified

### 8. Docker Build & Deploy
```bash
cd /opt/mypay-mock
./deploy-production.sh
```

**Monitor for:**
- [ ] Docker images built successfully (15-20 min)
- [ ] All 5 containers started
- [ ] MySQL initialized and ready
- [ ] Database migrations completed
- [ ] Database seeded with test data
- [ ] No errors in container logs

### 9. Service Verification (Local)
Test local endpoints:
```bash
curl http://localhost:4001/api/v1/health  # Payout API
curl http://localhost:4002/health          # Payment API
curl -I http://localhost:4010              # Merchant Portal
curl -I http://localhost:4011              # Admin Portal
```

- [ ] Payout API responds with health status
- [ ] Payment API responds with health status
- [ ] Merchant Portal accessible
- [ ] Admin Portal accessible
- [ ] All containers showing "Up" status

---

## Nginx & SSL Phase

### 10. Nginx Configuration
- [ ] Nginx config copied to /etc/nginx/sites-available/mypay.conf
- [ ] Symlink created in sites-enabled
- [ ] Default site disabled
- [ ] Nginx config test passed: `nginx -t`
- [ ] Nginx service running

### 11. SSL Certificates (Let's Encrypt)
```bash
certbot --nginx -d sandbox.mycodigital.io -d devportal.mycodigital.io -d devadmin.mycodigital.io
```

- [ ] Certificate for sandbox.mycodigital.io obtained
- [ ] Certificate for devportal.mycodigital.io obtained
- [ ] Certificate for devadmin.mycodigital.io obtained
- [ ] Nginx reloaded with SSL config
- [ ] Auto-renewal configured (cron job)
- [ ] Test renewal: `certbot renew --dry-run`

---

## Public Access Verification

### 12. Public Endpoint Testing
Test public HTTPS endpoints:
```bash
curl https://sandbox.mycodigital.io/api/v1/health
curl https://sandbox.mycodigital.io/health
curl -I https://devportal.mycodigital.io
curl -I https://devadmin.mycodigital.io
```

- [ ] Payout API accessible via HTTPS
- [ ] Payment API accessible via HTTPS
- [ ] Merchant Portal loads via HTTPS
- [ ] Admin Portal loads via HTTPS
- [ ] No SSL certificate warnings
- [ ] HTTP redirects to HTTPS properly

### 13. Portal Login Testing

**Merchant Portal (https://devportal.mycodigital.io):**
- [ ] Login page loads
- [ ] Can login with test@mycodigital.io / test123456
- [ ] Dashboard displays correctly
- [ ] No console errors

**Admin Portal (https://devadmin.mycodigital.io):**
- [ ] Login page loads
- [ ] Can login with admin@mycodigital.io / admin123456
- [ ] Dashboard displays correctly
- [ ] No console errors

### 14. API Integration Testing

**Payout API:**
```bash
# Get test credentials from seed output or logs
API_KEY="<from seed output>"

# Test payout creation
curl -X POST https://sandbox.mycodigital.io/api/v1/payouts \
  -H "X-API-KEY: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "beneficiary_name": "Test User",
    "account_number": "123450001",
    "bank_code": "HBL",
    "amount": 1000,
    "purpose": "Test Payout"
  }'
```

- [ ] Payout creation successful
- [ ] Response includes payout ID
- [ ] Webhook sent (if configured)

**Payment API:**
```bash
# Test checkout creation
curl -X POST https://sandbox.mycodigital.io/api/checkout/create \
  -H "X-Api-Key: test-api-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "currency": "PKR",
    "merchant_ref": "TEST-001"
  }'
```

- [ ] Checkout created successfully
- [ ] Response includes checkout URL
- [ ] Checkout page loads

---

## Monitoring & Maintenance

### 15. Health Monitoring Setup
```bash
# Run health check
cd /opt/mypay-mock
./health-check.sh
```

- [ ] Health check script runs successfully
- [ ] All systems report healthy
- [ ] Set up cron for periodic health checks (optional)

### 16. Log Management
- [ ] Container logs accessible: `docker compose logs`
- [ ] Nginx access logs: `/var/log/nginx/sandbox.access.log`
- [ ] Nginx error logs: `/var/log/nginx/sandbox.error.log`
- [ ] Log rotation configured
- [ ] Disk space monitoring set up

### 17. Backup Verification
- [ ] Database backup directory exists: `/opt/mypay-mock/backups`
- [ ] Initial backup created
- [ ] Backup script tested: creates valid backup
- [ ] Restore process tested (optional but recommended)
- [ ] Backup retention policy set (keep last 5-10 backups)

---

## Post-Deployment

### 18. Documentation
- [ ] API credentials saved securely
- [ ] Test credentials documented
- [ ] Deployment details logged
- [ ] Access information shared with team
- [ ] Emergency contacts updated

### 19. Rollback Preparation
```bash
# Test rollback script
./rollback.sh
# Select option 4 to list backups
```

- [ ] Rollback script tested (dry run)
- [ ] Rollback procedure documented
- [ ] Emergency stop tested: `./rollback.sh --emergency`
- [ ] Team trained on rollback process

### 20. Performance Baseline
- [ ] Response time benchmarks recorded
- [ ] Container resource usage noted
- [ ] Database performance baseline
- [ ] Disk usage baseline: `df -h`
- [ ] Docker disk usage: `docker system df`

---

## Final Verification

### 21. Comprehensive System Check
Run the complete health check:
```bash
./health-check.sh
```

Expected output:
- [ ] All 5 Docker containers running
- [ ] All API health checks passing
- [ ] Both portals accessible
- [ ] Database connected and seeded
- [ ] Public domains accessible via HTTPS
- [ ] Nginx running with valid config
- [ ] No recent errors in logs

### 22. Load Testing (Optional)
- [ ] API can handle concurrent requests
- [ ] Portals responsive under load
- [ ] Database queries performant
- [ ] No memory leaks observed

### 23. Security Audit
- [ ] No secrets in git repository
- [ ] .env file has restricted permissions
- [ ] Only necessary ports exposed
- [ ] SSL certificates valid and trusted
- [ ] Security headers configured in Nginx
- [ ] Database not accessible from public internet

---

## Sign-Off

### Deployment Team
- [ ] Technical Lead approval
- [ ] DevOps approval
- [ ] QA verification passed

### Deployment Details
- **Deployment Date:** _______________
- **Deployed By:** _______________
- **Git Commit Hash:** _______________
- **Build Version:** 1.0.0
- **Environment:** Production VPS

### Critical Information

**VPS Access:**
```
ssh root@72.60.110.249
Password: 02tlw|A6#4qx
Project Location: /opt/mypay-mock
```

**API Credentials (from seed):**
```
Payout API Key: <check deployment logs>
Payment API Key: test-api-key-123
```

**Portal Logins:**
```
Merchant: test@mycodigital.io / test123456
Admin: admin@mycodigital.io / admin123456
```

**Useful Commands:**
```bash
# View logs
docker compose logs -f

# Restart services
docker compose restart

# Health check
./health-check.sh

# Emergency stop
./rollback.sh --emergency

# Full status
docker compose ps
systemctl status nginx
```

---

## Troubleshooting Common Issues

### Container won't start
```bash
docker compose logs <container-name>
docker compose down
docker compose up -d
```

### Database migration fails
```bash
docker compose exec payout-api npx prisma migrate reset
docker compose exec payout-api npx prisma migrate deploy
```

### SSL certificate issues
```bash
certbot renew --force-renewal
systemctl reload nginx
```

### Out of disk space
```bash
docker system prune -a
# Clean old backups
cd /opt/mypay-mock/backups
ls -t | tail -n +6 | xargs rm
```

---

## Success Criteria

Deployment is considered successful when:

1. All 5 containers running and healthy
2. All 3 public HTTPS URLs accessible
3. Portal logins working
4. API endpoints responding correctly
5. Database seeded with test data
6. SSL certificates valid
7. No critical errors in logs
8. Health check script passes
9. Rollback procedure tested and ready

---

**Deployment Status:** [ ] COMPLETE  [ ] PENDING  [ ] FAILED

**Notes:**
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________
