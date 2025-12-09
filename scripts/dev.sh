#!/bin/bash

# ============================================
# MyPay Mock Platform - Development Script
# ============================================

set -e

echo "🚀 Starting MyPay Mock Platform in development mode..."
echo ""

# Check if MySQL is running
if ! docker ps | grep -q mypay-mysql; then
    echo "📦 Starting MySQL container..."
    docker-compose -f docker/docker-compose.yml up -d mysql
    
    echo "⏳ Waiting for MySQL to be ready..."
    sleep 10
fi

# Run migrations
echo "🗄️  Running database migrations..."
npx prisma migrate dev --name init

# Seed database
echo "🌱 Seeding database..."
npx prisma db seed

echo ""
echo "🎉 Development environment ready!"
echo ""
echo "📋 Available services:"
echo "   • Payout API:       http://localhost:4001"
echo "   • Payment API:      http://localhost:4002"
echo "   • Merchant Portal:  http://localhost:4010"
echo "   • Admin Portal:     http://localhost:4011"
echo ""
echo "Starting all services..."
pnpm run dev

