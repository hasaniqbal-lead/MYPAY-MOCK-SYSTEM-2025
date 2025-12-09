#!/bin/bash
# Deployment script for VPS
# Run this ON THE VPS after transferring files

set -e

echo "🚀 Starting Payout System Deployment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Checking prerequisites...${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    apt install docker-compose -y
fi

echo -e "${GREEN}✓ Prerequisites checked${NC}"

echo -e "${YELLOW}Step 2: Creating environment file...${NC}"

cat > .env << 'EOF'
DATABASE_URL=mysql://root:SecurePassword123!@mysql:3306/payout_system
PORT=3000
NODE_ENV=production
WEBHOOK_SECRET=prod-webhook-secret-$(openssl rand -hex 32)
WEBHOOK_URL=https://sandbox.mycodigital.io/webhooks
IPN_PORT=3001
EOF

echo -e "${GREEN}✓ Environment file created${NC}"

echo -e "${YELLOW}Step 3: Starting Docker services...${NC}"

# Stop any existing services
docker-compose down 2>/dev/null || true

# Start services
docker-compose up -d --build

echo -e "${GREEN}✓ Docker services started${NC}"

echo -e "${YELLOW}Step 4: Waiting for MySQL to be ready...${NC}"
sleep 30

echo -e "${YELLOW}Step 5: Running database migrations...${NC}"
docker-compose exec -T api npm run prisma:migrate deploy || true

echo -e "${YELLOW}Step 6: Seeding database...${NC}"
docker-compose exec -T api npm run prisma:seed

echo -e "${GREEN}✓ Database setup complete${NC}"

echo -e "${YELLOW}Step 7: Setting up Nginx...${NC}"

# Install Nginx if not present
if ! command -v nginx &> /dev/null; then
    apt install nginx -y
fi

# Create Nginx config
cat > /etc/nginx/sites-available/payout-api << 'EOF'
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
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/payout-api /etc/nginx/sites-enabled/

# Test and reload Nginx
nginx -t
systemctl reload nginx

echo -e "${GREEN}✓ Nginx configured${NC}"

echo -e "${YELLOW}Step 8: Configuring firewall...${NC}"

# Configure UFW
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable

echo -e "${GREEN}✓ Firewall configured${NC}"

echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo "Services running:"
docker-compose ps
echo ""
echo "Test the API:"
echo "  curl http://localhost:3000/api/v1/health"
echo ""
echo "Next steps:"
echo "  1. Setup SSL: certbot --nginx -d sandbox.mycodigital.io"
echo "  2. Test externally: curl http://sandbox.mycodigital.io/api/v1/health"
echo "  3. Get API key from seed output above"
echo ""

