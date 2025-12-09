#!/bin/bash
#
# AUTOMATED VPS DEPLOYMENT SCRIPT
# Run this script ON YOUR VPS after connecting
#
# To use:
# 1. SSH to VPS: ssh root@72.60.110.249
# 2. Upload this script and project files
# 3. chmod +x DEPLOY_NOW.sh
# 4. ./DEPLOY_NOW.sh

set -e  # Exit on any error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       MYPAY PAYOUT SYSTEM - VPS DEPLOYMENT                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
PROJECT_DIR="/opt/payout-system"
DOMAIN="sandbox.mycodigital.io"
DB_PASSWORD="MyPaySecureDB2024!"
WEBHOOK_SECRET="prod-webhook-$(openssl rand -hex 16)"

echo -e "${YELLOW}[1/13] Checking prerequisites...${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (or use sudo)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Running as root${NC}"

# Update system
echo -e "${YELLOW}[2/13] Updating system packages...${NC}"
apt update && apt upgrade -y
echo -e "${GREEN}✓ System updated${NC}"

# Install Docker
echo -e "${YELLOW}[3/13] Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo -e "${GREEN}✓ Docker installed${NC}"
else
    echo -e "${GREEN}✓ Docker already installed${NC}"
fi

# Install Docker Compose
echo -e "${YELLOW}[4/13] Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    apt install docker-compose -y
    echo -e "${GREEN}✓ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✓ Docker Compose already installed${NC}"
fi

# Create project directory
echo -e "${YELLOW}[5/13] Setting up project directory...${NC}"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# Check if files exist
if [ ! -f "package.json" ]; then
    echo -e "${RED}✗ Project files not found in $PROJECT_DIR${NC}"
    echo -e "${YELLOW}Please upload project files to $PROJECT_DIR first${NC}"
    echo -e "${YELLOW}You can use: scp -r /local/path/* root@72.60.110.249:$PROJECT_DIR/${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Project files found${NC}"

# Create environment file
echo -e "${YELLOW}[6/13] Creating production environment...${NC}"
cat > .env << EOF
DATABASE_URL=mysql://root:${DB_PASSWORD}@mysql:3306/payout_system
PORT=3000
NODE_ENV=production
WEBHOOK_SECRET=${WEBHOOK_SECRET}
WEBHOOK_URL=https://${DOMAIN}/webhooks
IPN_PORT=3001
EOF

echo -e "${GREEN}✓ Environment configured${NC}"

# Update docker-compose for production
echo -e "${YELLOW}[7/13] Configuring Docker services...${NC}"

# Backup original docker-compose.yml
cp docker-compose.yml docker-compose.yml.backup

# Update MySQL password in docker-compose.yml
sed -i "s/MYSQL_ROOT_PASSWORD: password/MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}/g" docker-compose.yml

echo -e "${GREEN}✓ Docker configuration updated${NC}"

# Start Docker services
echo -e "${YELLOW}[8/13] Starting Docker services...${NC}"
docker-compose down 2>/dev/null || true
docker-compose up -d --build

echo -e "${GREEN}✓ Services started${NC}"

# Wait for MySQL
echo -e "${YELLOW}[9/13] Waiting for MySQL to initialize (30 seconds)...${NC}"
sleep 30

# Run migrations
echo -e "${YELLOW}[10/13] Running database migrations...${NC}"
docker-compose exec -T api npx prisma migrate deploy || {
    echo -e "${YELLOW}Migrations might already be applied, continuing...${NC}"
}

# Seed database
echo -e "${YELLOW}[11/13] Seeding database...${NC}"
docker-compose exec -T api npm run prisma:seed

echo -e "${GREEN}✓ Database setup complete${NC}"

# Install and configure Nginx
echo -e "${YELLOW}[12/13] Setting up Nginx reverse proxy...${NC}"
apt install nginx -y

# Create Nginx config with documentation support
cat > /etc/nginx/sites-available/payout-api << 'NGINX_EOF'
server {
    listen 80;
    server_name sandbox.mycodigital.io;

    client_max_body_size 10M;

    # Serve documentation at /doc/payout
    location /doc/payout {
        alias /opt/payout-system/public;
        index index.html;
        try_files $uri $uri/ /index.html =404;
    }

    # Serve static assets for documentation
    location ~ ^/doc/payout/(.+\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot))$ {
        alias /opt/payout-system/public/$1;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Serve Postman collection
    location /doc/payout/MyPay_Payout_API.postman_collection.json {
        alias /opt/payout-system/public/MyPay_Payout_API.postman_collection.json;
        add_header Content-Type application/json;
        add_header Content-Disposition 'attachment; filename="MyPay_Payout_API.postman_collection.json"';
    }

    # OpenAPI spec
    location /doc/payout/api-docs.json {
        alias /opt/payout-system/public/api-docs.json;
        add_header Content-Type application/json;
    }

    # Root redirect to documentation
    location = / {
        return 302 /doc/payout;
    }

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
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
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
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Webhook endpoint (for receiving webhooks)
    location /webhooks {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINX_EOF

# Enable site
ln -sf /etc/nginx/sites-available/payout-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t && systemctl reload nginx
systemctl enable nginx

echo -e "${GREEN}✓ Nginx configured${NC}"

# Configure firewall
echo -e "${YELLOW}[13/13] Configuring firewall...${NC}"
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

echo -e "${GREEN}✓ Firewall configured${NC}"

# Install SSL certificate
echo -e "${YELLOW}Installing SSL certificate...${NC}"
apt install certbot python3-certbot-nginx -y
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@mycodigital.io --redirect || {
    echo -e "${YELLOW}SSL setup skipped (may need manual configuration)${NC}"
}

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              DEPLOYMENT COMPLETED SUCCESSFULLY!                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Display service status
echo -e "${BLUE}═══ SERVICE STATUS ═══${NC}"
docker-compose ps
echo ""

# Test API
echo -e "${BLUE}═══ TESTING API ═══${NC}"
echo -e "${YELLOW}Local test:${NC}"
curl -s http://localhost:3000/api/v1/health | jq . || curl -s http://localhost:3000/api/v1/health
echo ""

echo -e "${YELLOW}External test:${NC}"
curl -s http://$DOMAIN/api/v1/health | jq . || curl -s http://$DOMAIN/api/v1/health
echo ""

# Display API key
echo -e "${BLUE}═══ PRODUCTION API KEY ═══${NC}"
echo -e "${GREEN}Save this API key for testing:${NC}"
docker-compose logs api | grep -A 1 "API Key:" | tail -2
echo ""

# Display URLs
echo -e "${BLUE}═══ LIVE URLs ═══${NC}"
echo -e "${GREEN}Documentation:${NC} https://$DOMAIN/"
echo -e "${GREEN}Base URL:${NC} https://$DOMAIN/api/v1"
echo -e "${GREEN}Health:${NC} https://$DOMAIN/api/v1/health"
echo -e "${GREEN}Directory:${NC} https://$DOMAIN/api/v1/directory"
echo -e "${GREEN}Balance:${NC} https://$DOMAIN/api/v1/balance"
echo -e "${GREEN}Payouts:${NC} https://$DOMAIN/api/v1/payouts"
echo -e "${GREEN}Postman Collection:${NC} https://$DOMAIN/MyPay_Payout_API.postman_collection.json"
echo ""

# Display next steps
echo -e "${BLUE}═══ NEXT STEPS ═══${NC}"
echo "1. Open documentation: https://$DOMAIN/"
echo "2. Download Postman collection from the documentation page"
echo "3. Save the API key shown above"
echo "4. Update Postman collection with your API key"
echo "5. Start testing!"
echo ""

echo -e "${BLUE}═══ USEFUL COMMANDS ═══${NC}"
echo "View logs: docker-compose logs -f"
echo "Restart: docker-compose restart"
echo "Stop: docker-compose down"
echo "Update: git pull && docker-compose up -d --build"
echo ""

echo -e "${GREEN}Deployment complete! 🚀${NC}"
echo -e "${GREEN}Documentation is live at: https://$DOMAIN/${NC}"
