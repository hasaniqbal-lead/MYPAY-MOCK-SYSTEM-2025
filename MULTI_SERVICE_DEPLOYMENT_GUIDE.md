# 📋 VPS Multi-Service Configuration Guide

**For Development Team**  
**VPS**: 72.60.110.249  
**Last Updated**: December 11, 2025

---

## 🎯 Goal

Run **multiple services** on the same VPS with:
- ✅ Clean URLs (no port numbers visible to users)
- ✅ HTTPS/SSL for all services
- ✅ No conflicts between services
- ✅ One Nginx reverse proxy managing everything

---

## 🏗️ Architecture Overview

```
Internet → VPS (72.60.110.249)
           ↓
    Nginx (Port 80/443 ONLY)
           ↓
    Routes by domain name:
           ↓
    ├── service1.mycodigital.io → localhost:5001
    ├── service2.mycodigital.io → localhost:5002
    ├── service3.mycodigital.io → localhost:5003
    └── serviceN.mycodigital.io → localhost:XXXX
```

**Key Rule**: Only **Nginx** uses ports 80/443. All other services use internal ports.

---

## ⚠️ IMPORTANT: Port Rules

### ❌ NEVER Use These Ports
- **Port 80** - Reserved for Nginx HTTP
- **Port 443** - Reserved for Nginx HTTPS
- **Port 8080** - Already in use
- **Port 8888** - Currently used by Nginx (will move to 80)

### ✅ Safe Ports to Use
Choose any port from these ranges:
- **4000-4999** - Application ports
- **5000-5999** - API ports
- **6000-6999** - Backend services
- **7000-7999** - Other services
- **9000-9999** - Other services

**Example**: If adding a new service, pick an unused port like `5050`, `6001`, etc.

---

## 📝 Step-by-Step: Adding Your Service

### Step 1: Configure Your Service

**In your `docker-compose.yml`:**

```yaml
services:
  your-service:
    image: your-image
    container_name: your-service-name
    ports:
      - "5050:8080"  # Format: "external:internal"
    # external = port on VPS (choose unused port 4000-9999)
    # internal = port your app runs on inside container
    networks:
      - your-network
    restart: unless-stopped

networks:
  your-network:
    driver: bridge
```

**Important Notes:**
- ✅ Choose an **unused external port** (check with team first!)
- ✅ Use a **dedicated network** for isolation
- ✅ Don't use port 80 or 443
- ✅ Document which port you're using in the table below

### Step 2: Register Your Service with Nginx

**Contact DevOps team or add to `/etc/nginx/sites-available/all-services`:**

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name your-service.mycodigital.io;
    
    # SSL certificates (auto-configured by Certbot)
    ssl_certificate /etc/letsencrypt/live/your-service.mycodigital.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-service.mycodigital.io/privkey.pem;
    
    location / {
        proxy_pass http://localhost:5050;  # Your service's port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### Step 3: Test Configuration

```bash
# SSH to VPS
ssh root@72.60.110.249

# Test Nginx configuration
sudo nginx -t

# If OK, reload Nginx
sudo systemctl reload nginx
```

### Step 4: Get SSL Certificate

```bash
# Get free SSL certificate from Let's Encrypt
sudo certbot --nginx -d your-service.mycodigital.io

# Certbot will:
# 1. Get SSL certificate
# 2. Update Nginx config automatically
# 3. Set up auto-renewal
```

---

## 📊 Current Port Assignments

**⚠️ IMPORTANT: Update this table when adding services!**

| Service | Domain | Internal Port | Status | Owner/Team | Notes |
|---------|--------|---------------|--------|------------|-------|
| Mock Payout API | sandbox.mycodigital.io | 4001 | ✅ Active | MyPay Team | Test/Mock service |
| Mock Payment API | mock.mycodigital.io | 4002 | ✅ Active | MyPay Team | Test/Mock service |
| Mock Merchant Portal | devportal.mycodigital.io | 4010 | ✅ Active | MyPay Team | Test/Mock service |
| Mock Admin Portal | devadmin.mycodigital.io | 4011 | ✅ Active | MyPay Team | Test/Mock service |
| MySQL (MyPay Mock) | Internal only | 3306 | ✅ Active | MyPay Team | Not exposed externally |
| Wallet Linking Service | link.mycodigital.io | 3000 | ✅ Active | MyPay Team | Multi-provider wallet linking (Easypaisa, JazzCash) |
| *(Add your service)* | *(your domain)* | *(port)* | - | *(your name)* | *(description)* |

**Instructions**: 
1. Before deploying, add your service info to this table
2. Commit the change to this file
3. Notify the team in your PR/commit message

---

## 🔍 How to Check Available Ports

**Before choosing a port, check if it's available:**

```bash
# SSH to VPS
ssh root@72.60.110.249

# Method 1: Check all ports in use
sudo netstat -tlnp | grep LISTEN

# Method 2: Check all ports (alternative)
sudo ss -tlnp | grep LISTEN

# Method 3: Check specific port (example: 5050)
sudo netstat -tlnp | grep :5050
sudo ss -tlnp | grep :5050

# If no output = port is available ✅
# If shows output = port is in use ❌
```

**Example output if port is in use:**
```
tcp  0  0  0.0.0.0:5050  0.0.0.0:*  LISTEN  12345/docker-proxy
```

---

## 🚫 Common Mistakes to Avoid

### ❌ DON'T DO THIS:
```yaml
services:
  my-service:
    ports:
      - "80:8080"  # ❌ Port 80 is reserved for Nginx!
      - "443:8080"  # ❌ Port 443 is reserved for SSL!
```

**Problem**: This will conflict with Nginx and break all services.

### ✅ DO THIS INSTEAD:
```yaml
services:
  my-service:
    ports:
      - "5050:8080"  # ✅ Use available port from safe ranges
    networks:
      - my-network  # ✅ Use isolated network
```

### ❌ DON'T HARDCODE CREDENTIALS:
```yaml
environment:
  DB_PASSWORD: "mypassword123"  # ❌ Security risk!
```

### ✅ USE ENVIRONMENT FILES:
```yaml
env_file:
  - .env  # ✅ Keep secrets in .env (not in git!)
```

---

## 🔧 Troubleshooting

### Problem: "Port already in use"

**Error message:**
```
Error starting userland proxy: listen tcp4 0.0.0.0:5050: bind: address already in use
```

**Solution:**
1. Check which service is using the port:
   ```bash
   sudo netstat -tlnp | grep :5050
   ```

2. If it's your old container:
   ```bash
   docker ps -a | grep 5050
   docker stop CONTAINER_ID
   docker rm CONTAINER_ID
   ```

3. If it's another service, choose a different port

4. Update your docker-compose.yml with the new port

---

### Problem: "Cannot access my service via domain"

**Checklist:**

1. **Is your service running?**
   ```bash
   docker ps | grep your-service
   ```
   If not: `docker compose up -d`

2. **Is Nginx configured?**
   ```bash
   cat /etc/nginx/sites-available/all-services | grep your-service
   ```
   If not: Add Nginx config (Step 2 above)

3. **Is Nginx running and reloaded?**
   ```bash
   sudo systemctl status nginx
   sudo systemctl reload nginx
   ```

4. **Is DNS pointing to VPS?**
   ```bash
   nslookup your-service.mycodigital.io
   # Should return: 72.60.110.249
   ```

5. **Is SSL certificate installed?**
   ```bash
   sudo certbot certificates | grep your-service
   ```
   If not: Run certbot (Step 4 above)

---

### Problem: "502 Bad Gateway"

**Common causes:**

1. **Service is not running**
   ```bash
   docker ps | grep your-service
   # If not running: docker compose up -d
   ```

2. **Wrong port in Nginx config**
   ```bash
   # Check Nginx config matches your service port
   grep -A 10 "your-service.mycodigital.io" /etc/nginx/sites-available/all-services
   ```

3. **Service crashed**
   ```bash
   docker logs your-container-name
   # Check for errors
   ```

4. **Firewall blocking the port**
   ```bash
   sudo ufw status
   # Port should allow internal communication
   ```

---

### Problem: "SSL certificate errors"

**Solution:**
```bash
# Renew certificates
sudo certbot renew

# Or get new certificate
sudo certbot --nginx -d your-service.mycodigital.io

# Test SSL
curl -I https://your-service.mycodigital.io
```

---

## 📞 Useful Commands

### View All Running Services
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### View All Docker Compose Services
```bash
# In your service directory
docker compose ps
```

### View Nginx Configuration
```bash
# Test configuration
sudo nginx -t

# View config
sudo cat /etc/nginx/sites-available/all-services

# View enabled sites
ls -la /etc/nginx/sites-enabled/
```

### View Logs

**Nginx logs:**
```bash
# Error log
sudo tail -f /var/log/nginx/error.log

# Access log
sudo tail -f /var/log/nginx/access.log

# Specific service access
sudo grep "your-service.mycodigital.io" /var/log/nginx/access.log
```

**Service logs:**
```bash
# Real-time logs
docker logs -f your-container-name

# Last 100 lines
docker logs --tail=100 your-container-name

# With timestamps
docker logs -t your-container-name
```

### Restart Services

**Restart Nginx:**
```bash
sudo systemctl restart nginx
```

**Restart your service:**
```bash
cd /path/to/your/service
docker compose restart
```

**Restart specific container:**
```bash
docker restart your-container-name
```

---

## 🎯 Quick Deployment Checklist

**Before deploying your service, complete this checklist:**

- [ ] Choose an available port (4000-9999, not 80/443/8080/8888)
- [ ] Check port is not in use: `sudo ss -tlnp | grep :YOUR_PORT`
- [ ] Update port assignment table in this document
- [ ] Create/update your `docker-compose.yml` with chosen port
- [ ] Test locally if possible
- [ ] Deploy your service: `docker compose up -d`
- [ ] Verify service is running: `docker ps`
- [ ] Check service logs: `docker logs your-container`
- [ ] Create Nginx configuration for your domain
- [ ] Test Nginx config: `sudo nginx -t`
- [ ] Reload Nginx: `sudo systemctl reload nginx`
- [ ] Test HTTP access: `curl http://your-service.mycodigital.io`
- [ ] Get SSL certificate: `sudo certbot --nginx -d your-service.mycodigital.io`
- [ ] Test HTTPS access: `curl https://your-service.mycodigital.io`
- [ ] Update this documentation
- [ ] Notify team in Slack/Email/PR

---

## 💡 Best Practices

### 1. Use Docker Networks
```yaml
# Isolate your services
networks:
  my-app-network:
    driver: bridge

services:
  my-service:
    networks:
      - my-app-network
```

### 2. Don't Expose Unnecessary Ports
```yaml
# ❌ Bad: Exposing database
services:
  postgres:
    ports:
      - "5432:5432"  # Public exposure!

# ✅ Good: Internal only
services:
  postgres:
    # No ports mapping - only accessible via Docker network
    networks:
      - my-app-network
```

### 3. Use Environment Variables
```yaml
# ✅ Good
services:
  my-service:
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - PORT=${APP_PORT}
```

### 4. Add Health Checks
```yaml
services:
  my-service:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 5. Set Restart Policies
```yaml
services:
  my-service:
    restart: unless-stopped  # Auto-restart on crash
```

### 6. Use Resource Limits
```yaml
services:
  my-service:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
```

### 7. Document Everything
- Update this guide when deploying
- Add comments in your docker-compose.yml
- Keep a README in your service directory
- Document environment variables needed

---

## 🔐 Security Notes

### Port Security
- ✅ Never expose database ports (3306, 5432, 27017) externally
- ✅ Use Docker networks for inter-service communication
- ✅ Only expose web service ports (via Nginx)
- ✅ Keep services isolated in their own networks

### Credential Security
- ✅ Use `.env` files for sensitive data
- ✅ Never commit `.env` files to git
- ✅ Use strong passwords for all services
- ✅ Rotate credentials regularly

### SSL/HTTPS
- ✅ Always use HTTPS for production services
- ✅ Certbot auto-renews certificates (check: `sudo certbot renew --dry-run`)
- ✅ Test SSL configuration: https://www.ssllabs.com/ssltest/

### Monitoring
- ✅ Review Nginx logs regularly
- ✅ Set up log monitoring/alerting
- ✅ Monitor for suspicious activity
- ✅ Keep Docker and system packages updated

---

## 🆘 Emergency Procedures

### If Nginx is Down
```bash
# Check status
sudo systemctl status nginx

# View logs
sudo journalctl -u nginx -n 50

# Restart
sudo systemctl restart nginx

# If config is broken, restore backup
sudo cp /etc/nginx/sites-available/all-services.backup /etc/nginx/sites-available/all-services
sudo nginx -t
sudo systemctl restart nginx
```

### If Service Won't Start
```bash
# Check logs
docker logs your-container

# Check if port is available
sudo ss -tlnp | grep :YOUR_PORT

# Force recreate
docker compose down
docker compose up -d --force-recreate

# Check disk space
df -h
```

### If Everything is Broken
```bash
# Contact DevOps team immediately
# Don't try to fix production without backup plan

# View all services
docker ps -a
sudo systemctl status nginx

# Take screenshots of errors
# Share in team channel
```

---

## 📚 Additional Resources

### Documentation
- **Nginx**: https://nginx.org/en/docs/
- **Docker Compose**: https://docs.docker.com/compose/
- **Docker Networking**: https://docs.docker.com/network/
- **Certbot**: https://certbot.eff.org/

### Tools
- **SSL Test**: https://www.ssllabs.com/ssltest/
- **Port Check**: https://www.yougetsignal.com/tools/open-ports/
- **DNS Check**: https://dnschecker.org/

### Tutorials
- Nginx reverse proxy guide: https://nginx.org/en/docs/beginners_guide.html
- Docker security best practices: https://docs.docker.com/engine/security/

---

## 👥 Team Contacts

**For Deployment Support:**
- DevOps Lead: [Name/Email/Slack]
- VPS Admin: [Name/Email/Slack]  
- MyPay Team Lead: [Name/Email/Slack]

**For Nginx/SSL Issues:**
- Contact: [Name/Email/Slack]

**For Docker Issues:**
- Contact: [Name/Email/Slack]

---

## 📝 Version History

| Date | Changes | Author |
|------|---------|--------|
| 2025-12-11 | Initial version created | MyPay Team |
| | Added MyPay Mock services (ports 4001, 4002, 4010, 4011) | |
| | Configured Nginx on port 8888 (temporary) | |
| *(Update when you make changes)* | | |

---

## 🎉 Example: Successful Deployment

Here's a real example from the MyPay Mock System:

**Service**: Mock Payment API  
**Domain**: mock.mycodigital.io  
**Port**: 4002

**docker-compose.yml:**
```yaml
services:
  payment-api:
    build:
      context: .
      dockerfile: services/payment-api/Dockerfile
    container_name: mypay-payment-api
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=4002
    ports:
      - "4002:4002"
    networks:
      - mypay-network
```

**Nginx config:**
```nginx
server {
    listen 8888;
    server_name mock.mycodigital.io;
    
    location / {
        proxy_pass http://localhost:4002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Result**: ✅ Service accessible at `http://mock.mycodigital.io:8888`

---

**Questions?** Contact the DevOps team or ask in the development channel.

**Last Updated**: December 11, 2025  
**Maintained by**: DevOps Team

