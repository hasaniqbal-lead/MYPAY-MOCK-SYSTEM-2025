# Password-based VPS Deployment Script for Windows
# This script helps deploy the payout system using password authentication

$VPS_IP = "72.60.110.249"
$VPS_USER = "root"
$VPS_PASSWORD = "-v9(Q158qCwKk4--5/WY"
$LOCAL_PATH = "C:\Users\hasan\OneDrive\Desktop\MYPAY-MOCK-SYSTEM"
$REMOTE_PATH = "/opt/payout-system"

Write-Host "`n=== PAYOUT SYSTEM VPS DEPLOYMENT ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "VPS: $VPS_IP" -ForegroundColor White
Write-Host "Domain: sandbox.mycodigital.io" -ForegroundColor White
Write-Host ""

# Check if plink is available (PuTTY)
$hasPlink = Get-Command plink -ErrorAction SilentlyContinue

if (-not $hasPlink) {
    Write-Host "⚠️  PuTTY/plink not found. Using manual deployment steps..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "MANUAL DEPLOYMENT STEPS:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Open a new terminal and connect to VPS:" -ForegroundColor Yellow
    Write-Host "   ssh root@$VPS_IP" -ForegroundColor White
    Write-Host "   Password: $VPS_PASSWORD" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. On VPS, create directory:" -ForegroundColor Yellow
    Write-Host "   mkdir -p $REMOTE_PATH" -ForegroundColor White
    Write-Host "   cd $REMOTE_PATH" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Back on local machine (new terminal), transfer files:" -ForegroundColor Yellow
    Write-Host "   pscp -r $LOCAL_PATH\* root@${VPS_IP}:$REMOTE_PATH/" -ForegroundColor White
    Write-Host "   (Or use WinSCP, FileZilla, or Git)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Back on VPS, run deployment:" -ForegroundColor Yellow
    Write-Host "   cd $REMOTE_PATH" -ForegroundColor White
    Write-Host "   chmod +x deploy-to-vps.sh" -ForegroundColor White
    Write-Host "   ./deploy-to-vps.sh" -ForegroundColor White
    Write-Host ""
    Write-Host "5. Setup SSL:" -ForegroundColor Yellow
    Write-Host "   apt install certbot python3-certbot-nginx -y" -ForegroundColor White
    Write-Host "   certbot --nginx -d sandbox.mycodigital.io" -ForegroundColor White
    Write-Host ""
    
    $continue = Read-Host "Press Enter to see detailed deployment commands"
    
    Write-Host "`n=== DETAILED VPS COMMANDS ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Run these commands ON THE VPS after transferring files:" -ForegroundColor Yellow
    Write-Host ""
    
    $commands = @"
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install docker-compose -y

# Go to project directory
cd $REMOTE_PATH

# Create environment file
cat > .env << 'EOF'
DATABASE_URL=mysql://root:SecurePayoutPass123!@mysql:3306/payout_system
PORT=3000
NODE_ENV=production
WEBHOOK_SECRET=$(openssl rand -hex 32)
WEBHOOK_URL=https://sandbox.mycodigital.io/webhooks
IPN_PORT=3001
EOF

# Start Docker services
docker-compose up -d --build

# Wait for MySQL
echo "Waiting for MySQL to be ready..."
sleep 30

# Run migrations
docker-compose exec -T api npx prisma migrate deploy

# Seed database
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
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_cache_bypass `$http_upgrade;
    }

    location /health {
        proxy_pass http://localhost:3000;
        proxy_set_header Host `$host;
    }

    location /ipn/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
    }
}
NGINX_EOF

# Enable site
ln -sf /etc/nginx/sites-available/payout-api /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Setup firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable

# Install SSL certificate
apt install certbot python3-certbot-nginx -y
certbot --nginx -d sandbox.mycodigital.io --non-interactive --agree-tos --email admin@mycodigital.io

# Check status
docker-compose ps
curl http://localhost:3000/api/v1/health

echo ""
echo "Deployment complete!"
echo "API URL: https://sandbox.mycodigital.io/api/v1"
echo ""
echo "Get API key from logs:"
docker-compose logs api | grep "API Key"
"@

    $commands | Out-File -FilePath "vps-deployment-commands.sh" -Encoding UTF8
    Write-Host "Commands saved to: vps-deployment-commands.sh" -ForegroundColor Green
    Write-Host $commands -ForegroundColor White
    
} else {
    Write-Host "Using plink for automated deployment..." -ForegroundColor Green
    # Automated deployment with plink
    Write-Host "This feature requires additional setup. Using manual mode." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== ALTERNATIVE: Use WinSCP ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Download WinSCP: https://winscp.net" -ForegroundColor White
Write-Host "2. Connect to: $VPS_IP" -ForegroundColor White
Write-Host "   User: $VPS_USER" -ForegroundColor White
Write-Host "   Password: $VPS_PASSWORD" -ForegroundColor White
Write-Host "3. Upload entire project folder to: /opt/payout-system" -ForegroundColor White
Write-Host "4. Use WinSCP's terminal to run: ./deploy-to-vps.sh" -ForegroundColor White
Write-Host ""

Write-Host "📖 See DEPLOYMENT_GUIDE.md for complete instructions" -ForegroundColor Cyan
Write-Host ""

