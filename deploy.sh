#!/bin/bash

# ===========================================
# MyPay Mock Platform - Deployment Script
# ===========================================

set -e

echo "=========================================="
echo "  MyPay Mock Platform - Deployment"
echo "=========================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (sudo ./deploy.sh)"
    exit 1
fi

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# Install Docker Compose plugin if not present
if ! docker compose version &> /dev/null; then
    echo "Installing Docker Compose plugin..."
    apt-get update
    apt-get install -y docker-compose-plugin
fi

# Install Nginx if not present
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    apt-get update
    apt-get install -y nginx
fi

# Install Certbot if not present
if ! command -v certbot &> /dev/null; then
    echo "Installing Certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# Create project directory
PROJECT_DIR="/opt/mypay-mock"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

echo ""
echo "=========================================="
echo "  Step 1: Building Docker Images"
echo "=========================================="
docker compose build --no-cache

echo ""
echo "=========================================="
echo "  Step 2: Starting Services"
echo "=========================================="
docker compose up -d

echo ""
echo "=========================================="
echo "  Step 3: Waiting for MySQL to be ready"
echo "=========================================="
sleep 15

echo ""
echo "=========================================="
echo "  Step 4: Running Database Migrations"
echo "=========================================="
docker compose exec -T payout-api npx prisma migrate deploy
docker compose exec -T payout-api npx prisma db seed

echo ""
echo "=========================================="
echo "  Step 5: Configuring Nginx"
echo "=========================================="
cp nginx/mypay.conf /etc/nginx/sites-available/mypay.conf
ln -sf /etc/nginx/sites-available/mypay.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

echo ""
echo "=========================================="
echo "  Step 6: Setting up SSL Certificates"
echo "=========================================="
echo "Obtaining SSL certificates for all domains..."

# Stop nginx temporarily for certbot standalone mode
systemctl stop nginx

# Get certificates
certbot certonly --standalone -d sandbox.mycodigital.io --non-interactive --agree-tos --email admin@mycodigital.io || true
certbot certonly --standalone -d devportal.mycodigital.io --non-interactive --agree-tos --email admin@mycodigital.io || true
certbot certonly --standalone -d devadmin.mycodigital.io --non-interactive --agree-tos --email admin@mycodigital.io || true

# Restart nginx
systemctl start nginx
systemctl enable nginx

echo ""
echo "=========================================="
echo "  Step 7: Verifying Services"
echo "=========================================="
docker compose ps

echo ""
echo "=========================================="
echo "  Deployment Complete!"
echo "=========================================="
echo ""
echo "Services are running at:"
echo "  - Payout API:      https://sandbox.mycodigital.io/api/v1/health"
echo "  - Payment API:     https://sandbox.mycodigital.io/health"
echo "  - Merchant Portal: https://devportal.mycodigital.io"
echo "  - Admin Portal:    https://devadmin.mycodigital.io"
echo ""
echo "Test Credentials:"
echo "  Merchant Portal:"
echo "    Email: test@mycodigital.io"
echo "    Password: test123456"
echo ""
echo "  Admin Portal:"
echo "    Email: admin@mycodigital.io"
echo "    Password: admin123456"
echo ""

