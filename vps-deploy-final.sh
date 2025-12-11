#!/bin/bash
set -e

echo "=========================================="
echo "MyPay Mock System - VPS Deployment"
echo "=========================================="

cd /opt/mypay-mock

echo "Step 1: Building Docker images (this takes 10-15 minutes)..."
docker compose build --progress=plain

echo "Step 2: Starting all containers..."
docker compose up -d

echo "Step 3: Waiting for MySQL to be ready..."
sleep 30

echo "Step 4: Running Prisma migrations..."
docker compose exec -T payout-api npx prisma migrate deploy

echo "Step 5: Seeding database..."
docker compose exec -T payout-api npx prisma db seed

echo "Step 6: Checking container status..."
docker compose ps

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Services running at:"
echo "  - Payout API: http://localhost:4001"
echo "  - Payment API: http://localhost:4002"
echo "  - Merchant Portal: http://localhost:4010"
echo "  - Admin Portal: http://localhost:4011"
echo ""
echo "Next: Configure Nginx and SSL"
echo "=========================================="

