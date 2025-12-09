# 🚀 VPS Quick Setup Guide (Password Authentication)

## Connection Details

- **VPS IP:** 72.60.110.249
- **Domain:** sandbox.mycodigital.io
- **User:** root
- **Password:** -v9(Q158qCwKk4--5/WY

---

## 🎯 Quick Deployment (Copy-Paste Method)

### Step 1: Connect to VPS

Open a terminal and run:

```bash
ssh root@72.60.110.249
# Enter password when prompted: -v9(Q158qCwKk4--5/WY
```

### Step 2: Run All Commands at Once

Once connected to VPS, copy and paste this entire block:

```bash
# Update system and install Docker
apt update && apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install docker-compose git -y

# Create project directory
mkdir -p /opt/payout-system
cd /opt/payout-system

# Clone or prepare for file upload
# (You'll upload files via WinSCP or SCP - see below)

# Create environment file
cat > .env << 'EOF'
DATABASE_URL=mysql://root:SecurePayoutPass123!@mysql:3306/payout_system
PORT=3000
NODE_ENV=production
WEBHOOK_SECRET=prod-webhook-$(openssl rand -hex 32)
WEBHOOK_URL=https://sandbox.mycodigital.io/webhooks
IPN_PORT=3001
EOF

# Once files are uploaded, start services
docker-compose up -d --build

# Wait for MySQL
echo "Waiting 30 seconds for MySQL..."
sleep 30

# Run migrations and seed
docker-compose exec -T api npx prisma migrate deploy
docker-compose exec -T api npm run prisma:seed

# Install and configure Nginx
apt install nginx -y

cat > /etc/nginx/sites-available/payout-api << 'NGINX_EOF'
server {
    listen 80;
    server_name sandbox.mycodigital.io;

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

    location /health {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }

    location /ipn/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
    }
}
NGINX_EOF

ln -sf /etc/nginx/sites-available/payout-api /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Configure firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable

# Install SSL
apt install certbot python3-certbot-nginx -y
certbot --nginx -d sandbox.mycodigital.io

# Show status
docker-compose ps
curl http://localhost:3000/api/v1/health

# Get API key
echo ""
echo "=== YOUR API KEY ==="
docker-compose logs api | grep "API Key" | tail -1
echo ""
```

---

## 📦 File Transfer Options

### Option A: WinSCP (Easiest for Windows)

1. Download WinSCP: https://winscp.net
2. Install and open WinSCP
3. Create new connection:
   - File protocol: SFTP
   - Host: 72.60.110.249
   - Port: 22
   - User: root
   - Password: -v9(Q158qCwKk4--5/WY
4. Connect and drag-drop entire project folder to `/opt/payout-system`

### Option B: SCP Command (PowerShell)

```powershell
# From Windows PowerShell
scp -r C:\Users\hasan\OneDrive\Desktop\MYPAY-MOCK-SYSTEM\* root@72.60.110.249:/opt/payout-system/
# Enter password when prompted
```

### Option C: Git (Recommended)

```bash
# On VPS
cd /opt/payout-system
git clone https://github.com/your-username/payout-system.git .
```

---

## ✅ Verification Steps

After deployment, test:

```bash
# On VPS
curl http://localhost:3000/api/v1/health

# From anywhere
curl http://sandbox.mycodigital.io/api/v1/health
curl https://sandbox.mycodigital.io/api/v1/health  # After SSL
```

Expected response:
```json
{"status":"healthy"}
```

---

## 🔑 Get Your API Key

```bash
# On VPS
docker-compose logs api | grep "API Key"
```

Copy the API key and update your Postman collection:
- Variable: `base_url` = `https://sandbox.mycodigital.io/api/v1`
- Variable: `api_key` = `<your-new-api-key>`

---

## 📊 Management Commands

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Update code and redeploy
git pull origin main
docker-compose down
docker-compose up -d --build

# Backup database
docker-compose exec mysql mysqldump -uroot -pSecurePayoutPass123! payout_system > backup_$(date +%Y%m%d).sql
```

---

## 🆘 Troubleshooting

### Services won't start
```bash
docker-compose logs
docker-compose ps
```

### Port conflicts
```bash
netstat -tulpn | grep -E '3000|3306|80'
```

### SSL issues
```bash
certbot certificates
certbot renew --dry-run
```

### Can't connect to API
```bash
# Check if services are running
docker-compose ps

# Check Nginx
systemctl status nginx
nginx -t

# Check logs
docker-compose logs api
tail -f /var/log/nginx/error.log
```

---

## 🎉 Success Checklist

- [ ] VPS connected
- [ ] Docker installed
- [ ] Files transferred to /opt/payout-system
- [ ] Services started with docker-compose
- [ ] Database migrated and seeded
- [ ] Nginx configured
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Health check responds
- [ ] API key obtained
- [ ] Postman collection updated and tested

---

**Your API is live at:** https://sandbox.mycodigital.io/api/v1 🚀

