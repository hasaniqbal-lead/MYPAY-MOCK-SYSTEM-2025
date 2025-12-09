# MyPay Mock System - Production Deployment Implementation Plan

**Date:** December 8, 2024
**VPS:** 72.60.110.249
**Status:** Ready for Implementation

---

## Executive Summary

This document outlines the complete implementation plan for deploying the MyPay Mock System to production VPS. All preparation work has been completed, including scripts, configurations, and documentation.

### What's Been Completed

✅ **Phase 1: Local Development & Testing**
- All APIs tested and working locally
- Payout API: Health, balance, directory, payouts endpoints
- Payment API: Checkout, payment processing, portal authentication
- Merchant Portal: Login, dashboard, transactions
- Admin Portal: Admin authentication and management

✅ **Phase 2: Docker Configuration**
- Dockerfiles created for all 4 services
- docker-compose.yml configured with MySQL
- Production environment template created
- Multi-stage builds optimized

✅ **Phase 3: Nginx Gateway Configuration**
- nginx/mypay.conf created with SSL support
- Route mapping for all services
- Security headers configured
- Wildcard DNS support ready

✅ **Phase 4: Deployment Automation**
- **deploy-production.sh** - Full automated deployment
- **vps-audit.sh** - System state auditing
- **vps-cleanup.sh** - Clean removal of old deployments
- **test-deployment.sh** - Comprehensive testing suite
- **prepare-deployment.ps1** - Windows preparation script

✅ **Phase 5: Documentation**
- **DEPLOYMENT-GUIDE.md** - Complete deployment instructions
- **MYPAY-MOCK-SYSTEM-GUIDE.md** - Full system documentation
- **IMPLEMENTATION-PLAN.md** - This document
- Transfer instructions and checklists

---

## Current System Architecture

### Services Overview

| Service | Technology | Port | Purpose |
|---------|-----------|------|---------|
| **Payout API** | Node.js + Express | 4001 | Bank/wallet payout processing |
| **Payment API** | Node.js + Express | 4002 | Payment checkout & processing |
| **Merchant Portal** | Next.js 14 | 4010 | Merchant self-service dashboard |
| **Admin Portal** | Next.js 14 | 4011 | System administration |
| **MySQL** | MySQL 8.0 | 3306 | Database backend |
| **Nginx** | Nginx | 80/443 | Reverse proxy & SSL termination |

### Domain Mapping (Wildcard DNS Configured)

```
sandbox.mycodigital.io
├── /api/v1/*         → Payout API (Port 4001)
├── /checkouts        → Payment API (Port 4002)
├── /payment/*        → Payment API (Port 4002)
├── /api/portal/*     → Payment API (Port 4002)
└── /health           → Payment API (Port 4002)

devportal.mycodigital.io  → Merchant Portal (Port 4010)
devadmin.mycodigital.io   → Admin Portal (Port 4011)
```

---

## Implementation Plan

### Phase 1: Pre-Deployment Preparation ⏰ 15 minutes

**Status:** ✅ COMPLETED

**Tasks:**
1. ✅ Create deployment scripts
2. ✅ Create testing scripts
3. ✅ Create documentation
4. ✅ Prepare docker configurations
5. ✅ Generate production environment template

**Deliverables:**
- [deploy-production.sh](./deploy-production.sh)
- [test-deployment.sh](./test-deployment.sh)
- [vps-audit.sh](./vps-audit.sh)
- [vps-cleanup.sh](./vps-cleanup.sh)
- [prepare-deployment.ps1](./prepare-deployment.ps1)
- [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)

---

### Phase 2: VPS Connection & Audit ⏰ 10 minutes

**Status:** 🔄 READY TO START

**Prerequisites:**
- VPS credentials available
- SSH client installed
- Internet connectivity

**Steps:**

1. **Connect to VPS**
   ```bash
   ssh root@72.60.110.249
   # Password: -v9(Q158qCwKk4--5/WY
   ```

2. **Run System Audit**
   ```bash
   # Upload vps-audit.sh first, then:
   chmod +x vps-audit.sh
   ./vps-audit.sh | tee audit-report.txt
   ```

3. **Review Audit Results**
   - Check running containers
   - Check disk space (need 20GB+ free)
   - Check memory (need 4GB+ available)
   - Check existing Nginx configs
   - Note any conflicts

**Expected Outputs:**
- System information report
- List of running services
- Resource availability
- Port availability
- Existing configurations

**Decision Point:**
- If old MyPay deployment exists → Proceed to Phase 3 (Cleanup)
- If clean system → Skip to Phase 4 (Transfer)

---

### Phase 3: Cleanup Existing Deployment ⏰ 5 minutes

**Status:** 🔄 CONDITIONAL (Only if needed)

**When to run:** If audit shows existing MyPay containers/services

**Steps:**

1. **Backup Existing Data** (if needed)
   ```bash
   # Backup database
   docker exec mypay-mysql mysqldump -u root -p mypay_mock_db > backup-$(date +%Y%m%d).sql

   # Backup entire deployment
   tar -czf /opt/mypay-backup-$(date +%Y%m%d).tar.gz /opt/mypay-mock
   ```

2. **Run Cleanup Script**
   ```bash
   chmod +x vps-cleanup.sh
   ./vps-cleanup.sh
   # Follow prompts carefully
   ```

3. **Verify Cleanup**
   ```bash
   docker ps -a | grep mypay  # Should be empty
   docker images | grep mypay  # Should be empty
   ls -la /opt/mypay-mock/    # Should not exist or be empty
   ```

**Safety Notes:**
- ⚠️ This will delete all MyPay containers
- ⚠️ This will delete database volumes (if confirmed)
- ✅ Backups are created automatically
- ✅ Can be undone by restoring backups

---

### Phase 4: File Transfer ⏰ 10 minutes

**Status:** 🔄 READY TO START

**Option A: Using PowerShell Script (Recommended for Windows)**

```powershell
# Run on local Windows machine
.\prepare-deployment.ps1

# Follow the on-screen instructions
# This will:
# - Create deployment archive
# - Generate secure secrets
# - Provide transfer commands
```

**Option B: Manual SCP Transfer**

```bash
# From local machine
cd C:\Users\hasan\OneDrive\Desktop\MYPAY-MOCK-SYSTEM

# Create archive (requires tar or git bash)
tar -czf mypay-deployment.tar.gz \
  docker-compose.yml \
  services/ \
  nginx/ \
  prisma/ \
  packages/ \
  .env.production \
  *.sh \
  package.json \
  pnpm-workspace.yaml \
  tsconfig.json

# Transfer to VPS
scp mypay-deployment.tar.gz root@72.60.110.249:/opt/
```

**Option C: Using WinSCP (GUI)**

1. Download WinSCP: https://winscp.net/
2. Connect:
   - Host: `72.60.110.249`
   - User: `root`
   - Password: `-v9(Q158qCwKk4--5/WY`
3. Upload all project files to `/opt/mypay-mock/`

**Verification:**
```bash
# On VPS
cd /opt
ls -lh mypay-deployment.tar.gz  # Should show file

# Extract
mkdir -p mypay-mock
tar -xzf mypay-deployment.tar.gz -C mypay-mock/
cd mypay-mock
ls -la  # Should show all files
```

---

### Phase 5: Environment Configuration ⏰ 5 minutes

**Status:** 🔄 READY TO START

**Steps:**

1. **Copy Environment Template**
   ```bash
   cd /opt/mypay-mock
   cp .env.production .env
   ```

2. **Generate Secure Secrets**
   ```bash
   # Generate random secrets
   openssl rand -base64 32  # For DB_PASSWORD
   openssl rand -base64 32  # For JWT_SECRET
   openssl rand -base64 32  # For API_KEY_SECRET
   openssl rand -base64 32  # For WEBHOOK_SECRET
   ```

   **Alternative:** Use secrets from `.env.production.generated` created by prepare-deployment.ps1

3. **Edit Environment File**
   ```bash
   nano .env
   ```

   **Required Changes:**
   ```bash
   DB_PASSWORD=<paste-generated-secret-1>
   JWT_SECRET=<paste-generated-secret-2>
   API_KEY_SECRET=<paste-generated-secret-3>
   WEBHOOK_SECRET=<paste-generated-secret-4>
   ```

4. **Save and Verify**
   ```bash
   # Save: Ctrl+X, Y, Enter

   # Verify (don't cat to screen - contains secrets!)
   ls -lh .env  # Should show file exists
   grep -c "DB_PASSWORD" .env  # Should return 1
   ```

**Security Checklist:**
- ✅ All secrets are unique and strong (32+ characters)
- ✅ No default values remaining
- ✅ .env file has proper permissions (600)
- ✅ Secrets documented securely offline

---

### Phase 6: Production Deployment ⏰ 15 minutes

**Status:** 🔄 READY TO START

**Steps:**

1. **Make Scripts Executable**
   ```bash
   cd /opt/mypay-mock
   chmod +x *.sh
   ```

2. **Run Deployment Script**
   ```bash
   sudo ./deploy-production.sh
   ```

**The script will automatically:**

```
✓ Step 1: Clean up old containers
✓ Step 2: Install/verify Docker, Docker Compose, Nginx, Certbot
✓ Step 3: Build Docker images (~5 minutes)
✓ Step 4: Start all containers
✓ Step 5: Wait for MySQL to be ready
✓ Step 6: Run Prisma migrations
✓ Step 7: Seed database with test data
✓ Step 8: Configure Nginx
✓ Step 9: Obtain SSL certificates
✓ Step 10: Verify deployment
```

**Expected Duration:** 12-15 minutes

**What to Watch For:**
- ✅ All builds should complete successfully
- ✅ All containers should start (5 containers)
- ✅ MySQL health check should pass
- ✅ Migrations should run without errors
- ✅ SSL certificates should be obtained
- ⚠️ If SSL fails: DNS may not be ready (can retry later)

**Success Indicators:**
```
[OK] Docker images built successfully
[OK] Services started successfully
[OK] MySQL is ready!
[OK] Migrations completed
[OK] Database seeded
[OK] Nginx configuration is valid
[OK] Certificate obtained for all domains
[OK] Nginx started with SSL
```

---

### Phase 7: Verification & Testing ⏰ 10 minutes

**Status:** 🔄 READY TO START

**Automated Testing:**

```bash
cd /opt/mypay-mock
chmod +x test-deployment.sh
./test-deployment.sh
```

**Test Coverage:**
- ✓ All 5 Docker containers running
- ✓ Payout API health endpoint
- ✓ Payment API health endpoint
- ✓ Checkout creation with API key
- ✓ Portal authentication
- ✓ Merchant Portal UI
- ✓ Admin Portal UI
- ✓ SSL certificates valid
- ✓ Database connectivity
- ✓ Nginx configuration

**Manual Verification:**

1. **Test Payout API**
   ```bash
   curl https://sandbox.mycodigital.io/api/v1/health
   # Expected: {"status":"healthy"...}
   ```

2. **Test Payment API**
   ```bash
   curl https://sandbox.mycodigital.io/health
   # Expected: {"status":"OK"...}
   ```

3. **Test Checkout Creation**
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
   # Expected: {"success":true,"checkout_id":"..."...}
   ```

4. **Test Portal Login**
   ```bash
   curl -X POST https://sandbox.mycodigital.io/api/portal/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@mycodigital.io",
       "password": "test123456"
     }'
   # Expected: {"success":true,"token":"..."...}
   ```

5. **Test Portal UIs in Browser**
   - https://devportal.mycodigital.io
     - Login: test@mycodigital.io / test123456
     - Check dashboard loads
     - Check transactions page
     - Check credentials page

   - https://devadmin.mycodigital.io
     - Login: admin@mycodigital.io / admin123456
     - Check dashboard loads
     - Check admin functions

**Expected Results:**
- All tests should PASS
- Success rate should be 95%+ (SSL may take time to propagate)
- All UIs should be accessible and functional

---

### Phase 8: End-to-End Testing ⏰ 15 minutes

**Status:** 🔄 READY TO START

**Test Scenario 1: Complete Payment Flow**

1. **Create Checkout**
   ```bash
   curl -X POST https://sandbox.mycodigital.io/checkouts \
     -H "Content-Type: application/json" \
     -H "X-Api-Key: test-api-key-123" \
     -d '{
       "reference": "E2E-TEST-001",
       "amount": 5000,
       "paymentMethod": "jazzcash",
       "paymentType": "onetime",
       "successUrl": "https://webhook.site/your-unique-id",
       "returnUrl": "https://example.com/return"
     }'
   ```

2. **Open Payment Page**
   - Copy checkout_url from response
   - Open in browser
   - Verify payment form loads

3. **Complete Payment**
   - Enter test mobile: 03030000000 (success scenario)
   - Enter test MPIN: 1234
   - Submit payment
   - Verify success message

4. **Check Webhook Delivery**
   - Check webhook.site for callback
   - Verify webhook contains correct data

5. **Verify in Portal**
   - Login to devportal.mycodigital.io
   - Check transaction appears
   - Verify status is "completed"

**Test Scenario 2: Complete Payout Flow**

1. **Get API Key**
   - Login to merchant portal
   - Go to Credentials page
   - Copy Payout API key

2. **Check Balance**
   ```bash
   curl https://sandbox.mycodigital.io/api/v1/balance \
     -H "X-API-KEY: <your-payout-api-key>"
   ```

3. **Create Payout**
   ```bash
   curl -X POST https://sandbox.mycodigital.io/api/v1/payouts \
     -H "Content-Type: application/json" \
     -H "X-API-KEY: <your-payout-api-key>" \
     -d '{
       "merchantReference": "E2E-PAYOUT-001",
       "amount": 5000,
       "destType": "BANK",
       "bankCode": "HBL",
       "accountNumber": "12345670001",
       "accountTitle": "Test Account"
     }'
   ```

4. **Check Payout Status**
   ```bash
   curl https://sandbox.mycodigital.io/api/v1/payouts/<payout-id> \
     -H "X-API-KEY: <your-payout-api-key>"
   ```

5. **Verify Success**
   - Status should be "SUCCESS" (account ending in 0001)
   - Balance should be deducted
   - Webhook should be delivered

**Test Scenario 3: Portal Full Navigation**

1. **Merchant Portal**
   - ✓ Login/Logout
   - ✓ Dashboard statistics
   - ✓ Transaction listing
   - ✓ Transaction filtering
   - ✓ Credentials page
   - ✓ API key generation
   - ✓ Profile update
   - ✓ Settings page

2. **Admin Portal**
   - ✓ Login/Logout
   - ✓ Dashboard overview
   - ✓ Merchant listing
   - ✓ Transaction monitoring
   - ✓ Payout monitoring
   - ✓ System settings

---

### Phase 9: Documentation & Handover ⏰ 10 minutes

**Status:** 🔄 READY TO START

**Tasks:**

1. **Document Live URLs**
   ```
   Payout API:      https://sandbox.mycodigital.io/api/v1/health
   Payment API:     https://sandbox.mycodigital.io/health
   Merchant Portal: https://devportal.mycodigital.io
   Admin Portal:    https://devadmin.mycodigital.io
   ```

2. **Document Test Credentials**
   ```
   Merchant Portal:
   - Email: test@mycodigital.io
   - Password: test123456

   Admin Portal:
   - Email: admin@mycodigital.io
   - Password: admin123456
   ```

3. **Document API Keys**
   - Login to portal and note API keys
   - Document for testing

4. **Create Quick Reference Card**
   - Common commands
   - URLs
   - Credentials
   - Troubleshooting steps

5. **Update Status**
   - Mark all todos as complete
   - Document any issues encountered
   - Note any deviations from plan

---

## Post-Deployment Checklist

**System Health:**
- [ ] All 5 containers running
- [ ] MySQL accepting connections
- [ ] All APIs responding
- [ ] All portals accessible
- [ ] SSL certificates valid
- [ ] Nginx running without errors

**Functionality:**
- [ ] Can create checkout
- [ ] Can complete payment
- [ ] Can create payout
- [ ] Can login to merchant portal
- [ ] Can login to admin portal
- [ ] Webhooks being delivered

**Security:**
- [ ] All default secrets changed
- [ ] SSL/HTTPS enforced
- [ ] API authentication working
- [ ] Portal authentication working
- [ ] Security headers present

**Monitoring:**
- [ ] Logs accessible: `docker compose logs -f`
- [ ] Resource usage acceptable: `docker stats`
- [ ] Disk space sufficient: `df -h`
- [ ] Database backups configured

---

## Rollback Plan

If deployment fails critically:

```bash
# Stop all services
docker compose down

# Restore from backup (if exists)
cd /opt
tar -xzf mypay-backup-YYYYMMDD.tar.gz
cd mypay-mock

# Restore database
docker compose up -d mysql
sleep 15
docker exec -i mypay-mysql mysql -u root -p mypay_mock_db < backup-YYYYMMDD.sql

# Restart services
docker compose up -d
```

---

## Support & Maintenance

**Daily Checks:**
```bash
# Check service status
docker compose ps

# Check logs for errors
docker compose logs --tail=100 | grep -i error

# Check resource usage
docker stats --no-stream
```

**Weekly Tasks:**
```bash
# Check disk space
df -h

# Check certificate expiry
certbot certificates

# Review logs
tail -n 100 /var/log/nginx/*.log
```

**Monthly Tasks:**
```bash
# Database backup
docker exec mypay-mysql mysqldump -u root -p mypay_mock_db > backup-$(date +%Y%m%d).sql

# Check for updates
docker compose pull
docker compose up -d --build

# Review system logs
journalctl -u docker --since "1 month ago" | grep -i error
```

---

## Success Criteria

Deployment is considered successful when:

✅ All automated tests pass (95%+ success rate)
✅ All manual tests pass
✅ End-to-end payment flow works
✅ End-to-end payout flow works
✅ Both portals fully functional
✅ SSL certificates valid
✅ No critical errors in logs
✅ Performance acceptable (< 2s response time)
✅ Database properly seeded
✅ All documentation complete

---

## Timeline Summary

| Phase | Duration | Status |
|-------|----------|--------|
| 1. Pre-Deployment Prep | 15 min | ✅ COMPLETED |
| 2. VPS Connection & Audit | 10 min | 🔄 READY |
| 3. Cleanup (if needed) | 5 min | 🔄 READY |
| 4. File Transfer | 10 min | 🔄 READY |
| 5. Environment Config | 5 min | 🔄 READY |
| 6. Production Deployment | 15 min | 🔄 READY |
| 7. Verification & Testing | 10 min | 🔄 READY |
| 8. End-to-End Testing | 15 min | 🔄 READY |
| 9. Documentation | 10 min | 🔄 READY |
| **TOTAL** | **~95 min** | **85% Ready** |

---

## Next Steps

**To begin deployment, run:**

```powershell
# On Windows local machine
.\prepare-deployment.ps1
```

Then follow the on-screen instructions, or refer to [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) for detailed steps.

---

**Document Version:** 1.0
**Last Updated:** 2024-12-08
**Prepared By:** Claude Code
**Status:** ✅ READY FOR IMPLEMENTATION
