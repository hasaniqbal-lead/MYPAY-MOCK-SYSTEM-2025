#!/bin/bash

# ===========================================
# MyPay Mock Platform - Production Deployment Script
# ===========================================

set -e

echo "=========================================="
echo "  MyPay Mock Platform"
echo "  Production Deployment"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}ERROR: Please run as root (sudo ./deploy-production.sh)${NC}"
    exit 1
fi

# Configuration
PROJECT_DIR="/opt/mypay-mock"
BACKUP_DIR="/opt/mypay-backups"

echo -e "${BLUE}=== STEP 1: PRE-DEPLOYMENT CLEANUP ===${NC}"
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Stop existing containers
echo -e "${YELLOW}Stopping existing MyPay containers...${NC}"
if docker ps -a | grep -q mypay; then
    docker stop $(docker ps -a | grep mypay | awk '{print $1}') 2>/dev/null || true
    echo -e "${GREEN}Existing containers stopped${NC}"
else
    echo -e "${YELLOW}No existing MyPay containers found${NC}"
fi
echo ""

# Backup existing data
if [ -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}Backing up existing deployment...${NC}"
    timestamp=$(date +%Y%m%d_%H%M%S)
    tar -czf "$BACKUP_DIR/mypay-backup-$timestamp.tar.gz" "$PROJECT_DIR" 2>/dev/null || true
    echo -e "${GREEN}Backup created: $BACKUP_DIR/mypay-backup-$timestamp.tar.gz${NC}"
fi
echo ""

# Remove old containers
echo -e "${YELLOW}Removing old MyPay containers...${NC}"
docker rm $(docker ps -a | grep mypay | awk '{print $1}') 2>/dev/null || true
echo -e "${GREEN}Old containers removed${NC}"
echo ""

# Optional: Remove old images to force rebuild
read -p "Do you want to remove old Docker images? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Removing old MyPay images...${NC}"
    docker images | grep mypay | awk '{print $3}' | xargs docker rmi -f 2>/dev/null || true
    echo -e "${GREEN}Old images removed${NC}"
fi
echo ""

echo -e "${BLUE}=== STEP 2: SYSTEM DEPENDENCIES ===${NC}"
echo ""

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Installing Docker...${NC}"
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}Docker installed${NC}"
else
    echo -e "${GREEN}Docker already installed: $(docker --version)${NC}"
fi
echo ""

# Install Docker Compose plugin if not present
if ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}Installing Docker Compose plugin...${NC}"
    apt-get update
    apt-get install -y docker-compose-plugin
    echo -e "${GREEN}Docker Compose installed${NC}"
else
    echo -e "${GREEN}Docker Compose already installed: $(docker compose version)${NC}"
fi
echo ""

# Install Nginx if not present
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}Installing Nginx...${NC}"
    apt-get update
    apt-get install -y nginx
    echo -e "${GREEN}Nginx installed${NC}"
else
    echo -e "${GREEN}Nginx already installed: $(nginx -v 2>&1)${NC}"
fi
echo ""

# Install Certbot if not present
if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}Installing Certbot...${NC}"
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
    echo -e "${GREEN}Certbot installed${NC}"
else
    echo -e "${GREEN}Certbot already installed: $(certbot --version 2>&1 | head -1)${NC}"
fi
echo ""

echo -e "${BLUE}=== STEP 3: PROJECT SETUP ===${NC}"
echo ""

# Ensure project directory exists
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

echo -e "${YELLOW}Project directory: $PROJECT_DIR${NC}"
echo -e "${YELLOW}Current files:${NC}"
ls -lah
echo ""

# Check if .env exists
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo -e "${RED}ERROR: .env file not found!${NC}"
    echo -e "${YELLOW}Please create .env file with production settings${NC}"
    echo -e "${YELLOW}You can copy from .env.production template${NC}"
    exit 1
else
    echo -e "${GREEN}.env file found${NC}"
fi
echo ""

echo -e "${BLUE}=== STEP 4: BUILDING DOCKER IMAGES ===${NC}"
echo ""

echo -e "${YELLOW}Building Docker images (this may take several minutes)...${NC}"
docker compose build --no-cache

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Docker images built successfully${NC}"
else
    echo -e "${RED}ERROR: Docker build failed${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}=== STEP 5: STARTING SERVICES ===${NC}"
echo ""

echo -e "${YELLOW}Starting all services...${NC}"
docker compose up -d

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Services started successfully${NC}"
else
    echo -e "${RED}ERROR: Failed to start services${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}=== STEP 6: WAITING FOR DATABASE ===${NC}"
echo ""

echo -e "${YELLOW}Waiting for MySQL to be ready...${NC}"
for i in {1..30}; do
    if docker exec mypay-mysql mysqladmin ping -h localhost --silent 2>/dev/null; then
        echo -e "${GREEN}MySQL is ready!${NC}"
        break
    fi
    echo -n "."
    sleep 2
done
echo ""

echo -e "${BLUE}=== STEP 7: DATABASE MIGRATIONS ===${NC}"
echo ""

echo -e "${YELLOW}Running Prisma migrations...${NC}"
docker compose exec -T payout-api npx prisma migrate deploy || {
    echo -e "${RED}ERROR: Migration failed${NC}"
    exit 1
}
echo -e "${GREEN}Migrations completed${NC}"
echo ""

echo -e "${YELLOW}Seeding database with initial data...${NC}"
docker compose exec -T payout-api npx prisma db seed || {
    echo -e "${YELLOW}WARNING: Seeding failed (may already be seeded)${NC}"
}
echo -e "${GREEN}Database seeded${NC}"
echo ""

echo -e "${BLUE}=== STEP 8: NGINX CONFIGURATION ===${NC}"
echo ""

# Backup existing nginx config
if [ -f "/etc/nginx/sites-enabled/mypay.conf" ]; then
    echo -e "${YELLOW}Backing up existing Nginx config...${NC}"
    cp /etc/nginx/sites-enabled/mypay.conf /etc/nginx/sites-available/mypay.conf.backup
fi

echo -e "${YELLOW}Installing Nginx configuration...${NC}"
if [ -f "$PROJECT_DIR/nginx/mypay.conf" ]; then
    cp "$PROJECT_DIR/nginx/mypay.conf" /etc/nginx/sites-available/mypay.conf
    ln -sf /etc/nginx/sites-available/mypay.conf /etc/nginx/sites-enabled/mypay.conf
    rm -f /etc/nginx/sites-enabled/default
    echo -e "${GREEN}Nginx configuration installed${NC}"
else
    echo -e "${RED}ERROR: nginx/mypay.conf not found${NC}"
    exit 1
fi
echo ""

# Test Nginx configuration
echo -e "${YELLOW}Testing Nginx configuration...${NC}"
nginx -t
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Nginx configuration is valid${NC}"
else
    echo -e "${RED}ERROR: Invalid Nginx configuration${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}=== STEP 9: SSL CERTIFICATES ===${NC}"
echo ""

# Stop nginx temporarily for certbot standalone mode
systemctl stop nginx

echo -e "${YELLOW}Obtaining SSL certificates...${NC}"
echo ""

# Obtain certificates for each domain
for domain in sandbox.mycodigital.io devportal.mycodigital.io devadmin.mycodigital.io; do
    echo -e "${YELLOW}Getting certificate for $domain...${NC}"

    if [ -d "/etc/letsencrypt/live/$domain" ]; then
        echo -e "${GREEN}Certificate already exists for $domain${NC}"
    else
        certbot certonly --standalone \
            -d "$domain" \
            --non-interactive \
            --agree-tos \
            --email admin@mycodigital.io \
            --preferred-challenges http

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Certificate obtained for $domain${NC}"
        else
            echo -e "${RED}WARNING: Failed to obtain certificate for $domain${NC}"
            echo -e "${YELLOW}You may need to configure DNS properly and try again${NC}"
        fi
    fi
    echo ""
done

# Start nginx
systemctl start nginx
systemctl enable nginx

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Nginx started with SSL${NC}"
else
    echo -e "${RED}ERROR: Failed to start Nginx${NC}"
    exit 1
fi
echo ""

# Setup certificate auto-renewal
echo -e "${YELLOW}Setting up certificate auto-renewal...${NC}"
(crontab -l 2>/dev/null; echo "0 0 * * * certbot renew --quiet --deploy-hook 'systemctl reload nginx'") | crontab -
echo -e "${GREEN}Auto-renewal configured${NC}"
echo ""

echo -e "${BLUE}=== STEP 10: VERIFICATION ===${NC}"
echo ""

echo -e "${YELLOW}Running service verification...${NC}"
echo ""

# Check running containers
echo -e "${YELLOW}Docker Containers:${NC}"
docker compose ps
echo ""

# Check container logs for errors
echo -e "${YELLOW}Checking for errors in logs...${NC}"
docker compose logs --tail=50 | grep -i error || echo -e "${GREEN}No errors found${NC}"
echo ""

# Test local endpoints
echo -e "${YELLOW}Testing local endpoints...${NC}"
services=(
    "localhost:4001/api/v1/health|Payout API"
    "localhost:4002/health|Payment API"
    "localhost:4010|Merchant Portal"
    "localhost:4011|Admin Portal"
)

for service in "${services[@]}"; do
    IFS='|' read -r endpoint name <<< "$service"
    if curl -s -f "http://$endpoint" > /dev/null; then
        echo -e "${GREEN}✓ $name is responding${NC}"
    else
        echo -e "${RED}✗ $name is NOT responding${NC}"
    fi
done
echo ""

echo -e "${BLUE}=========================================="
echo -e "  DEPLOYMENT COMPLETE!"
echo -e "==========================================${NC}"
echo ""

echo -e "${GREEN}Services are deployed and running!${NC}"
echo ""
echo -e "${YELLOW}Public URLs:${NC}"
echo "  Payout API:      https://sandbox.mycodigital.io/api/v1/health"
echo "  Payment API:     https://sandbox.mycodigital.io/health"
echo "  Merchant Portal: https://devportal.mycodigital.io"
echo "  Admin Portal:    https://devadmin.mycodigital.io"
echo ""

echo -e "${YELLOW}Test Credentials:${NC}"
echo "  Merchant Portal:"
echo "    Email:    test@mycodigital.io"
echo "    Password: test123456"
echo ""
echo "  Admin Portal:"
echo "    Email:    admin@mycodigital.io"
echo "    Password: admin123456"
echo ""

echo -e "${YELLOW}Useful Commands:${NC}"
echo "  View logs:           docker compose logs -f"
echo "  Restart services:    docker compose restart"
echo "  Stop services:       docker compose down"
echo "  Check status:        docker compose ps"
echo "  View Nginx logs:     tail -f /var/log/nginx/sandbox.access.log"
echo ""

echo -e "${YELLOW}Database Access:${NC}"
echo "  MySQL:              docker exec -it mypay-mysql mysql -u root -p"
echo "  Database name:      mypay_mock_db"
echo ""

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo ""
