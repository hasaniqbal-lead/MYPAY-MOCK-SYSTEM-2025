# 🎯 Final Deployment Steps - VPS Setup

## Current Status

✅ **Local Development**: Complete and tested  
✅ **API Server**: Running on localhost:3000  
✅ **Worker Service**: Running and processing payouts  
✅ **Database**: Seeded with test data  
✅ **Postman Collection**: Created and tested  
✅ **Deployment Package**: Ready  

---

## VPS Information

- **IP Address**: 72.60.110.249
- **Domain**: sandbox.mycodigital.io (DNS configured)
- **User**: root
- **Password**: -v9(Q158qCwKk4--5/WY
- **SSH Key**: c:\Users\hasan\.ssh\id_ed25519

---

## 🚀 Deployment Process (Step-by-Step)

### Phase 1: Connect to VPS

**Open a NEW terminal window** and connect:

```bash
ssh root@72.60.110.249
```

When prompted for password, enter: `-v9(Q158qCwKk4--5/WY`

---

### Phase 2: Prepare VPS Environment

Once connected to VPS, run these commands one by one:

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose git -y

# Verify installations
docker --version
docker-compose --version

# Create project directory
mkdir -p /opt/payout-system
cd /opt/payout-system
```

---

### Phase 3: Transfer Project Files

**Option A: Using SCP (from your local machine - NEW terminal)**

```powershell
# Open PowerShell on local machine
scp -r C:\Users\hasan\OneDrive\Desktop\MYPAY-MOCK-SYSTEM\* root@72.60.110.249:/opt/payout-system/
# Enter password when prompted
```

**Option B: Using WinSCP (Recommended for Windows)**

1. Download: https://winscp.net/eng/download.php
2. Install and open WinSCP
3. New Site:
   - File protocol: SFTP
   - Host: 72.60.110.249
   - Port: 22
   - User: root
   - Password: -v9(Q158qCwKk4--5/WY
4. Login
5. Navigate to `/opt/payout-system/`
6. Upload all files from: `C:\Users\hasan\OneDrive\Desktop\MYPAY-MOCK-SYSTEM\`

**Option C: Using Git (if you have a repository)**

```bash
# On VPS
cd /opt/payout-system
git clone https://github.com/your-username/payout-system.git .
```

---

### Phase 4: Configure Production Environment

**On VPS**, create the production environment file:

```bash
cd /opt/payout-system

cat > .env << 'EOF'
DATABASE_URL=mysql://root:MyPaySecureDB2024!@mysql:3306/payout_system
PORT=3000
NODE_ENV=production
WEBHOOK_SECRET=prod-webhook-c8a95e9364756d1c6163f811343785390102d4730b8a4aa5039
WEBHOOK_URL=https://sandbox.mycodigital.io/webhooks
IPN_PORT=3001
EOF

# Verify the file
cat .env
```

---

### Phase 5: Update Docker Compose for Production

Edit the docker-compose.yml to use the same MySQL password:

```bash
nano docker-compose.yml
```

Update the MySQL password to match (or just verify it's consistent with .env).

---

### Phase 6: Start Services

```bash
cd /opt/payout-system

# Start all services
docker-compose up -d --build

# Check status
docker-compose ps

# Wait for MySQL to be ready (about 30 seconds)
echo "Waiting for MySQL to initialize..."
sleep 30

# Check logs to ensure MySQL is ready
docker-compose logs mysql | tail -20
```

---

### Phase 7: Database Setup

```bash
# Run migrations
docker-compose exec api npx prisma migrate deploy

# Seed database with test data
docker-compose exec api npm run prisma:seed

# IMPORTANT: Save the API key from the output!
# Look for: "API Key: mypay_..."
```

---

### Phase 8: Setup Nginx Reverse Proxy

```bash
# Install Nginx
apt install nginx -y

# Create Nginx configuration
cat > /etc/nginx/sites-available/payout-api << 'NGINX_EOF'
server {
    listen 80;
    server_name sandbox.mycodigital.io;

    # API endpoints
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }

    # Root redirect
    location = / {
        return 301 /api/v1/health;
    }

    # IPN endpoint
    location /ipn/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
NGINX_EOF

# Enable the site
ln -sf /etc/nginx/sites-available/payout-api /etc/nginx/sites-enabled/

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx

# Enable Nginx to start on boot
systemctl enable nginx
```

---

### Phase 9: Configure Firewall

```bash
# Configure UFW firewall
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS

# Enable firewall
echo "y" | ufw enable

# Check status
ufw status
```

---

### Phase 10: Install SSL Certificate

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d sandbox.mycodigital.io --non-interactive --agree-tos --email admin@mycodigital.io --redirect

# Verify auto-renewal is set up
certbot renew --dry-run
```

---

### Phase 11: Verify Deployment

```bash
# Test locally on VPS
curl http://localhost:3000/api/v1/health

# Test through Nginx (HTTP)
curl http://sandbox.mycodigital.io/api/v1/health

# Test HTTPS (after SSL setup)
curl https://sandbox.mycodigital.io/api/v1/health

# Check all services
docker-compose ps

# View logs
docker-compose logs --tail=50
```

**Expected response:**
```json
{"status":"healthy"}
```

---

### Phase 12: Get Production API Key

```bash
# View the API key from seed output
docker-compose logs api | grep "API Key"

# Or check full seed output
docker-compose logs api | grep -A 20 "Seeding completed"
```

**Save this API key!** You'll need it for testing.

---

## 🎯 Post-Deployment Checklist

- [ ] VPS connected and accessible
- [ ] Docker and Docker Compose installed
- [ ] All project files transferred to /opt/payout-system
- [ ] Environment file (.env) created with production settings
- [ ] Services started: MySQL, API, Worker, IPN
- [ ] Database migrated successfully
- [ ] Database seeded with test data
- [ ] **Production API key saved**
- [ ] Nginx installed and configured
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Health check responds: https://sandbox.mycodigital.io/api/v1/health
- [ ] Services set to restart automatically

---

## 🧪 Testing Production API

### Update Postman Collection

1. Open Postman
2. Go to Variables in the collection
3. Update:
   - `base_url` = `https://sandbox.mycodigital.io/api/v1`
   - `api_key` = `<your-production-api-key>`
4. Save changes

### Test Endpoints

1. **Health Check**
   ```
   GET https://sandbox.mycodigital.io/api/v1/health
   ```

2. **Get Balance**
   ```
   GET https://sandbox.mycodigital.io/api/v1/balance
   Headers: X-API-KEY: <your-key>
   ```

3. **Create Payout**
   ```
   POST https://sandbox.mycodigital.io/api/v1/payouts
   Headers: 
     X-API-KEY: <your-key>
     X-IDEMPOTENCY-KEY: <uuid>
   Body: { payout details }
   ```

---

## 📊 Management Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f worker
docker-compose logs -f mysql
```

### Restart Services
```bash
docker-compose restart
docker-compose restart api
```

### Update Code
```bash
cd /opt/payout-system
git pull origin main  # if using Git
docker-compose down
docker-compose up -d --build
docker-compose exec api npx prisma migrate deploy
```

### Backup Database
```bash
docker-compose exec mysql mysqldump -uroot -pMyPaySecureDB2024! payout_system > backup_$(date +%Y%m%d).sql
```

### Monitor Resources
```bash
docker stats
htop  # install with: apt install htop
```

---

## 🆘 Troubleshooting

### Services won't start
```bash
docker-compose logs
docker-compose ps
docker system prune -a  # if disk full
```

### Database connection issues
```bash
docker-compose exec mysql mysql -uroot -p
# Check if database exists
docker-compose exec mysql mysql -uroot -pMyPaySecureDB2024! -e "SHOW DATABASES;"
```

### API returns 502
```bash
docker-compose logs api
docker-compose restart api
systemctl status nginx
```

### SSL certificate issues
```bash
certbot certificates
certbot renew
systemctl restart nginx
```

### Port conflicts
```bash
netstat -tulpn | grep -E '3000|3306|80|443'
# Kill conflicting processes or change ports
```

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ `https://sandbox.mycodigital.io/api/v1/health` returns `{"status":"healthy"}`  
✅ Postman can connect and authenticate  
✅ You can create a payout successfully  
✅ Worker processes the payout within 5-10 seconds  
✅ Balance is updated correctly  
✅ All Docker containers are running  
✅ SSL certificate is valid  

---

## 📞 Next Steps After Deployment

1. Update production webhook URLs in client applications
2. Configure monitoring (optional: Grafana, Prometheus)
3. Set up automated backups (cron job)
4. Configure log rotation
5. Set up alerts for service failures
6. Document API endpoints for your team
7. Share production API key securely with authorized users

---

**Your production API will be live at:**

🌐 **https://sandbox.mycodigital.io/api/v1**

**Ready to deploy? Follow the steps above one by one!** 🚀

