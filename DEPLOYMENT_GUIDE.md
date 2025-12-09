# 🚀 VPS Deployment Guide

## Server Information

**Domain:** sandbox.mycodigital.io  
**VPS IP:** 72.60.110.249  
**SSH Key:** c:\Users\hasan\.ssh\id_ed25519  
**User:** root

---

## Deployment Steps

### Step 1: Connect to VPS

Open a terminal and connect:

```bash
ssh -i "c:\Users\hasan\.ssh\id_ed25519" root@72.60.110.249
```

### Step 2: Prepare VPS Environment

Once connected, run these commands:

```bash
# Update system
apt update && apt upgrade -y

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Create application directory
mkdir -p /opt/payout-system
cd /opt/payout-system
```

### Step 3: Transfer Files to VPS

From your **local machine** (new terminal), transfer the project:

```powershell
# Use SCP to transfer project files
scp -i "c:\Users\hasan\.ssh\id_ed25519" -r C:\Users\hasan\OneDrive\Desktop\MYPAY-MOCK-SYSTEM/* root@72.60.110.249:/opt/payout-system/
```

**OR** use Git (recommended):

```bash
# On VPS
cd /opt/payout-system
git init
git remote add origin <your-repo-url>
git pull origin main
```

### Step 4: Configure Environment on VPS

On the VPS, create production environment file:

```bash
cd /opt/payout-system

cat > .env << 'EOF'
DATABASE_URL=mysql://root:SecurePassword123!@mysql:3306/payout_system
PORT=3000
NODE_ENV=production
WEBHOOK_SECRET=production-webhook-secret-change-this-secure-key
WEBHOOK_URL=https://sandbox.mycodigital.io/webhooks
IPN_PORT=3001
EOF
```

### Step 5: Update Docker Compose for Production

```bash
nano docker-compose.yml
```

Update to production configuration (see docker-compose.production.yml below).

### Step 6: Start Services

```bash
# Start all services
docker-compose up -d

# Wait for MySQL to be ready (30 seconds)
sleep 30

# Run database migrations
docker-compose exec api npm run prisma:migrate

# Seed database
docker-compose exec api npm run prisma:seed

# View logs
docker-compose logs -f
```

### Step 7: Setup Nginx Reverse Proxy

```bash
# Install Nginx
apt install nginx -y

# Create Nginx configuration
nano /etc/nginx/sites-available/payout-api
```

Paste this configuration:

```nginx
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
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }

    # IPN endpoint
    location /ipn/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable the site:

```bash
# Enable site
ln -s /etc/nginx/sites-available/payout-api /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

### Step 8: Setup SSL with Let's Encrypt

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d sandbox.mycodigital.io

# Auto-renewal is configured automatically
```

### Step 9: Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### Step 10: Verify Deployment

```bash
# Test from VPS
curl http://localhost:3000/api/v1/health

# Test from outside
curl https://sandbox.mycodigital.io/api/v1/health
```

---

## Production Docker Compose

Create `docker-compose.production.yml`:

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: SecurePassword123!
      MYSQL_DATABASE: payout_system
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10
    restart: unless-stopped

  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: mysql://root:SecurePassword123!@mysql:3306/payout_system
      NODE_ENV: production
      PORT: 3000
      WEBHOOK_SECRET: production-webhook-secret-change-this
    depends_on:
      mysql:
        condition: service_healthy
    restart: unless-stopped

  worker:
    build:
      context: .
      dockerfile: Dockerfile
    command: npm run start:worker
    environment:
      DATABASE_URL: mysql://root:SecurePassword123!@mysql:3306/payout_system
      NODE_ENV: production
      WEBHOOK_SECRET: production-webhook-secret-change-this
    depends_on:
      mysql:
        condition: service_healthy
    restart: unless-stopped

  ipn:
    build:
      context: .
      dockerfile: Dockerfile
    command: npm run start:ipn
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: mysql://root:SecurePassword123!@mysql:3306/payout_system
      NODE_ENV: production
      IPN_PORT: 3001
    depends_on:
      mysql:
        condition: service_healthy
    restart: unless-stopped

volumes:
  mysql_data:
```

---

## Useful Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f worker
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart api
```

### Check Service Status
```bash
docker-compose ps
```

### Run Migrations
```bash
docker-compose exec api npm run prisma:migrate
```

### Access Database
```bash
docker-compose exec mysql mysql -uroot -p payout_system
```

### Update Code and Redeploy
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

---

## Monitoring

### Check API Health
```bash
curl https://sandbox.mycodigital.io/api/v1/health
```

### Check Docker Status
```bash
docker ps
docker stats
```

### Check Nginx Status
```bash
systemctl status nginx
```

### View Nginx Logs
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## Security Checklist

- [ ] Change MySQL root password
- [ ] Update WEBHOOK_SECRET to strong random value
- [ ] SSL certificate installed and working
- [ ] Firewall configured (UFW)
- [ ] Only necessary ports open (22, 80, 443)
- [ ] SSH key authentication only (no password)
- [ ] Regular backups configured
- [ ] Docker containers set to restart automatically

---

## Backup Strategy

### Database Backup Script

Create `/opt/scripts/backup-db.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/mysql"
mkdir -p $BACKUP_DIR

docker-compose exec -T mysql mysqldump -uroot -pSecurePassword123! payout_system > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

Make executable and add to cron:

```bash
chmod +x /opt/scripts/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /opt/scripts/backup-db.sh
```

---

## Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose logs

# Check if ports are in use
netstat -tulpn | grep -E '3000|3306'
```

### Can't connect to database
```bash
# Check MySQL is running
docker-compose ps mysql

# Test connection
docker-compose exec mysql mysql -uroot -p
```

### API returns 502 Bad Gateway
```bash
# Check if API is running
docker-compose ps api

# Check API logs
docker-compose logs api

# Restart API
docker-compose restart api
```

### SSL issues
```bash
# Test SSL
certbot certificates

# Renew manually
certbot renew --dry-run
```

---

## Post-Deployment Testing

Update your Postman collection:

- Change `base_url` to: `https://sandbox.mycodigital.io/api/v1`
- Test all endpoints
- Verify worker is processing payouts
- Check webhook delivery (if configured)

---

**Deployment complete! Your payout API is now live at:**

🌐 **https://sandbox.mycodigital.io**


