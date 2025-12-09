#!/bin/bash

# ============================================
# MyPay Mock Platform - Docker Up Script
# ============================================

set -e

echo "🐳 Starting MyPay Mock Platform with Docker..."
echo ""

# Build and start all services
docker-compose -f docker/docker-compose.yml up -d --build

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 15

# Run migrations
echo "🗄️  Running database migrations..."
docker exec mypay-payout-api npx prisma migrate deploy

# Seed database
echo "🌱 Seeding database..."
docker exec mypay-payout-api npx prisma db seed

echo ""
echo "✅ All services are running!"
echo ""
echo "📋 Service URLs:"
echo "   • API Gateway:      http://localhost (or sandbox.mycodigital.io)"
echo "   • Payout API:       http://localhost:4001"
echo "   • Payment API:      http://localhost:4002"
echo "   • Merchant Portal:  http://localhost:4010 (or devportal.mycodigital.io)"
echo "   • Admin Portal:     http://localhost:4011 (or devadmin.mycodigital.io)"
echo ""
echo "📋 View logs with: docker-compose -f docker/docker-compose.yml logs -f"

