#!/bin/bash

# ============================================
# MyPay Mock Platform - Docker Down Script
# ============================================

echo "🛑 Stopping MyPay Mock Platform..."
echo ""

docker-compose -f docker/docker-compose.yml down

echo ""
echo "✅ All services stopped!"
echo ""
echo "💡 To also remove volumes: docker-compose -f docker/docker-compose.yml down -v"

