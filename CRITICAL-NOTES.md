# CRITICAL DEPLOYMENT NOTES

## 🔴 MUST DO BEFORE DEPLOYMENT

### 1. Generate Production Secrets
**CRITICAL:** Do NOT use default secrets in production!

```bash
# SSH to VPS
ssh root@72.60.110.249

# Navigate to project
cd /opt/mypay-mock

# Generate secrets
echo "WEBHOOK_SECRET=$(openssl rand -hex 32)"
echo "JWT_SECRET=$(openssl rand -hex 32)"
echo "API_KEY_SECRET=$(openssl rand -hex 32)"
```

Copy these values and update `.env` file.

### 2. Update .env File
```bash
nano /opt/mypay-mock/.env
```

**Replace these values:**
- `DB_PASSWORD` - Change from default
- `WEBHOOK_SECRET` - Use generated value
- `JWT_SECRET` - Use generated value
- `API_KEY_SECRET` - Use generated value

**Then set permissions:**
```bash
chmod 600 /opt/mypay-mock/.env
```

### 3. Verify DNS Records
Before deployment, confirm DNS is configured:

```bash
nslookup sandbox.mycodigital.io
nslookup devportal.mycodigital.io
nslookup devadmin.mycodigital.io
```

All should point to: **72.60.110.249**

---

## ⚠️ KNOWN ISSUES & WORKAROUNDS

### Issue 1: SSL Certificate Rate Limit
**Problem:** Let's Encrypt has rate limits (5 certificates per week per domain)

**Workaround:**
- Only run SSL setup once
- If it fails, wait before retrying
- Use staging environment first: `certbot --staging`

### Issue 2: Docker Build Time
**Problem:** First build takes 15-20 minutes

**Workaround:**
- Plan for deployment window
- Can build images separately first:
```bash
docker compose build payout-api &
docker compose build payment-api &
wait
```

### Issue 3: Port 80/443 Already in Use
**Problem:** Another service may be using these ports

**Solution:**
```bash
# Check what's using the port
lsof -i :80
lsof -i :443

# Stop Apache if installed
systemctl stop apache2
systemctl disable apache2
```

### Issue 4: MySQL Initialization Time
**Problem:** First MySQL startup can take 60+ seconds

**Solution:**
- Wait script already handles this
- If issues persist, increase wait time in deploy script
```bash
# Manually wait if needed
sleep 60
docker compose exec mysql mysqladmin ping
```

---

## 🔧 CONFIGURATION REVIEW

### Docker Compose Validated ✅
Located at: [docker-compose.yml](docker-compose.yml)

**Key Points:**
- Uses MySQL 8.0 (not 5.7)
- Health checks configured
- Proper dependency ordering
- Restart policy: unless-stopped
- Internal network isolation

**Verified:**
- Database URL uses `mysql:3306` (container name, not localhost)
- All environment variables properly passed
- Volume persistence configured

### Nginx Configuration Validated ✅
Located at: [nginx/mypay.conf](nginx/mypay.conf)

**Key Points:**
- Reverse proxy for all services
- SSL placeholder paths (filled by Certbot)
- Security headers configured
- Proper proxy headers set
- HTTP→HTTPS redirect

**Potential Issue:**
- SSL certificate paths reference Let's Encrypt locations
- These won't exist until Certbot runs
- **Solution:** Deploy script handles this order correctly

### Database Schema Validated ✅
Located at: [prisma/schema.prisma](prisma/schema.prisma)

**Key Points:**
- Unified schema for all services
- Proper foreign keys
- Optimistic locking for balances
- Audit trail tables

**Migration Status:**
- Migration file exists: `prisma/migrations/20251126091730_init/migration.sql`
- Will be applied during deployment

### Seed Data Validated ✅
Located at: [prisma/seed.ts](prisma/seed.ts)

**Creates:**
- 1 test merchant with PKR 1,000,000
- 12 banks, 4 wallets
- 10 payment test scenarios
- 1 admin user
- API keys for testing

**Credentials Generated:**
- Merchant: test@mycodigital.io
- Admin: admin@mycodigital.io
- API keys: Auto-generated (check logs)

---

## 🚨 SECURITY CHECKLIST

### Before Deployment
- [ ] Generated strong secrets (min 32 characters)
- [ ] Updated .env with production values
- [ ] Set .env permissions to 600
- [ ] Verified .env is in .gitignore
- [ ] Confirmed .env NOT in git repository

### During Deployment
- [ ] SSL certificates obtained successfully
- [ ] HTTPS working on all domains
- [ ] HTTP redirects to HTTPS

### After Deployment
- [ ] Change default test passwords
- [ ] Enable firewall (UFW)
- [ ] Configure SSH key authentication
- [ ] Disable password SSH login (optional)
- [ ] Set up fail2ban
- [ ] Review nginx logs for suspicious activity

### Firewall Configuration (Recommended)
```bash
# Enable UFW
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw enable

# Verify
ufw status
```

---

## 📊 RESOURCE MONITORING

### Expected Resource Usage
```
Container          CPU      Memory
──────────────────────────────────
MySQL              5-10%    200-400MB
Payout API         2-5%     100-200MB
Payment API        2-5%     100-200MB
Merchant Portal    5-10%    150-300MB
Admin Portal       5-10%    150-300MB
──────────────────────────────────
Total              ~20%     ~1GB
```

### Disk Space Tracking
```bash
# Check total usage
df -h /opt/mypay-mock

# Check Docker usage
docker system df

# Clean if needed
docker system prune -a
```

### Memory Monitoring
```bash
# Real-time stats
docker stats

# System memory
free -h
```

---

## 🔄 DEPLOYMENT SEQUENCE

### Correct Order (Automated by deploy-production.sh)
1. Stop existing containers
2. Backup database (if exists)
3. Build Docker images
4. Start MySQL first
5. Wait for MySQL ready
6. Start other containers
7. Run migrations
8. Seed database
9. Configure Nginx
10. Setup SSL
11. Test endpoints

### DO NOT:
- ❌ Run migrations before MySQL is ready
- ❌ Seed database twice
- ❌ Change .env while containers running
- ❌ Delete MySQL volume without backup
- ❌ Force SSL before certificates exist

---

## 🐛 TROUBLESHOOTING QUICK REFERENCE

### Container Won't Start
```bash
# View specific container logs
docker compose logs payout-api

# Check container status
docker compose ps

# Force recreate
docker compose up -d --force-recreate payout-api
```

### Migration Fails
```bash
# Check MySQL is ready
docker compose exec mysql mysqladmin ping

# Check database exists
docker compose exec mysql mysql -u root -p -e "SHOW DATABASES;"

# Reset migrations (WARNING: Deletes data)
docker compose exec payout-api npx prisma migrate reset
```

### Nginx 502 Bad Gateway
```bash
# Check backend services
docker compose ps

# Test API directly
curl http://localhost:4001/api/v1/health

# Check Nginx logs
tail -f /var/log/nginx/sandbox.error.log
```

### SSL Certificate Fails
```bash
# Check DNS
dig sandbox.mycodigital.io

# Check port 80 open
nc -zv 72.60.110.249 80

# Try manual certificate
certbot certonly --standalone -d sandbox.mycodigital.io
```

### Out of Memory
```bash
# Check memory usage
free -h
docker stats

# Restart containers
docker compose restart

# Reduce memory usage
# Edit docker-compose.yml, add:
# deploy:
#   resources:
#     limits:
#       memory: 256M
```

---

## 📝 POST-DEPLOYMENT TASKS

### Immediate (Within 1 hour)
- [ ] Test all public URLs
- [ ] Login to both portals
- [ ] Create test payout
- [ ] Create test checkout
- [ ] Verify webhooks working
- [ ] Check all container logs
- [ ] Take database backup

### Within 24 hours
- [ ] Monitor error logs
- [ ] Check resource usage
- [ ] Test rollback procedure
- [ ] Document any issues
- [ ] Update team on status

### Within 1 week
- [ ] Performance baseline
- [ ] Set up monitoring alerts
- [ ] Configure log rotation
- [ ] Security audit
- [ ] Load testing
- [ ] Disaster recovery test

---

## 🎯 SUCCESS CRITERIA

Deployment is successful when:

1. ✅ All 5 containers running
2. ✅ Health check script passes
3. ✅ All public URLs accessible via HTTPS
4. ✅ Can login to both portals
5. ✅ Can create test payout
6. ✅ Can create test checkout
7. ✅ Database contains seed data
8. ✅ No critical errors in logs
9. ✅ SSL certificates valid
10. ✅ Rollback tested and working

---

## 📞 EMERGENCY PROCEDURES

### Complete System Failure
```bash
# 1. Emergency stop
cd /opt/mypay-mock
./rollback.sh --emergency

# 2. Check logs
docker compose logs > emergency.log

# 3. Restore from backup
./rollback.sh
# Select option 3: Full rollback
```

### Database Corruption
```bash
# 1. Stop services
docker compose down

# 2. Restore database
cd /opt/mypay-mock/backups
gunzip -c mysql-backup-YYYYMMDD-HHMMSS.sql.gz | \
  docker compose exec -T mysql mysql -u root -p

# 3. Restart
docker compose up -d
```

### SSL Expiry
```bash
# Renew certificates
certbot renew --force-renewal

# Reload Nginx
systemctl reload nginx
```

### Disk Full
```bash
# Clean Docker
docker system prune -a -f

# Clean old backups
cd /opt/mypay-mock/backups
ls -t | tail -n +6 | xargs rm

# Clean logs
truncate -s 0 /var/log/nginx/*.log
```

---

## 📚 ADDITIONAL RESOURCES

### Documentation Files
- [DEPLOYMENT-SUMMARY.md](DEPLOYMENT-SUMMARY.md) - Complete overview
- [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md) - Step-by-step checklist
- [QUICK-DEPLOY-GUIDE.md](QUICK-DEPLOY-GUIDE.md) - Quick reference

### Key Commands Cheat Sheet
```bash
# Deploy
./deploy-production.sh

# Health check
./health-check.sh

# Logs
docker compose logs -f

# Restart
docker compose restart

# Status
docker compose ps

# Rollback
./rollback.sh
```

### Important Locations
```
Project:        /opt/mypay-mock
Logs:           /opt/mypay-mock/logs
Backups:        /opt/mypay-mock/backups
Nginx Config:   /etc/nginx/sites-available/mypay.conf
SSL Certs:      /etc/letsencrypt/live/
```

---

**Last Updated:** December 9, 2025
**Version:** 1.0.0
**Status:** READY FOR PRODUCTION

_Read this document completely before deploying to production._
