#!/bin/bash

###############################################################################
# MyPay Mock Platform - Health Check & Monitoring Script
# Version: 1.0.0
# Description: Validates all services are running and healthy
###############################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_DIR="/opt/mypay-mock"
TIMEOUT=5

# Print header
echo ""
echo "=============================================================================="
echo "  MyPay Mock Platform - Health Check"
echo "  Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================================================================="
echo ""

# Check Docker containers
echo -e "${BLUE}=== DOCKER CONTAINERS ===${NC}"
echo ""

containers=("mypay-mysql" "mypay-payout-api" "mypay-payment-api" "mypay-merchant-portal" "mypay-admin-portal")
all_running=true

for container in "${containers[@]}"; do
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        status=$(docker inspect --format='{{.State.Status}}' "$container")
        if [[ "$status" == "running" ]]; then
            uptime=$(docker inspect --format='{{.State.StartedAt}}' "$container")
            echo -e "${GREEN}✓${NC} $container: Running (started: $uptime)"
        else
            echo -e "${RED}✗${NC} $container: Not running (status: $status)"
            all_running=false
        fi
    else
        echo -e "${RED}✗${NC} $container: Not found"
        all_running=false
    fi
done

echo ""

# Check API endpoints
echo -e "${BLUE}=== API HEALTH ENDPOINTS ===${NC}"
echo ""

# Payout API
echo -n "Payout API (http://localhost:4001/api/v1/health): "
if response=$(curl -s -f --connect-timeout $TIMEOUT http://localhost:4001/api/v1/health 2>/dev/null); then
    echo -e "${GREEN}✓ Healthy${NC}"
    echo "  Response: $response"
else
    echo -e "${RED}✗ Failed${NC}"
    all_running=false
fi

# Payment API
echo -n "Payment API (http://localhost:4002/health): "
if response=$(curl -s -f --connect-timeout $TIMEOUT http://localhost:4002/health 2>/dev/null); then
    echo -e "${GREEN}✓ Healthy${NC}"
    echo "  Response: $response"
else
    echo -e "${RED}✗ Failed${NC}"
    all_running=false
fi

echo ""

# Check portals
echo -e "${BLUE}=== PORTAL ACCESSIBILITY ===${NC}"
echo ""

# Merchant Portal
echo -n "Merchant Portal (http://localhost:4010): "
if curl -s -f -I --connect-timeout $TIMEOUT http://localhost:4010 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Accessible${NC}"
else
    echo -e "${RED}✗ Not accessible${NC}"
    all_running=false
fi

# Admin Portal
echo -n "Admin Portal (http://localhost:4011): "
if curl -s -f -I --connect-timeout $TIMEOUT http://localhost:4011 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Accessible${NC}"
else
    echo -e "${RED}✗ Not accessible${NC}"
    all_running=false
fi

echo ""

# Check MySQL connectivity
echo -e "${BLUE}=== DATABASE CONNECTIVITY ===${NC}"
echo ""

echo -n "MySQL Connection: "
if docker exec mypay-mysql mysqladmin ping -h localhost --silent 2>/dev/null; then
    echo -e "${GREEN}✓ Connected${NC}"

    # Get database stats
    db_count=$(docker exec mypay-mysql mysql -u root -p"${DB_PASSWORD:-MyPay@Secure2025!}" -se "SELECT COUNT(*) FROM information_schema.SCHEMATA WHERE SCHEMA_NAME='mypay_mock_db';" 2>/dev/null)

    if [[ "$db_count" == "1" ]]; then
        echo -e "${GREEN}✓${NC} Database 'mypay_mock_db' exists"

        # Check merchant count
        merchant_count=$(docker exec mypay-mysql mysql -u root -p"${DB_PASSWORD:-MyPay@Secure2025!}" -D mypay_mock_db -se "SELECT COUNT(*) FROM Merchant;" 2>/dev/null || echo "0")
        echo "  Merchants: $merchant_count"
    else
        echo -e "${RED}✗${NC} Database 'mypay_mock_db' not found"
        all_running=false
    fi
else
    echo -e "${RED}✗ Cannot connect to MySQL${NC}"
    all_running=false
fi

echo ""

# Check public domain access (if applicable)
echo -e "${BLUE}=== PUBLIC DOMAIN ACCESS ===${NC}"
echo ""

domains=(
    "https://sandbox.mycodigital.io/api/v1/health|Payout API"
    "https://sandbox.mycodigital.io/health|Payment API"
    "https://devportal.mycodigital.io|Merchant Portal"
    "https://devadmin.mycodigital.io|Admin Portal"
)

for domain_info in "${domains[@]}"; do
    IFS='|' read -r url name <<< "$domain_info"
    echo -n "$name ($url): "

    if response_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT "$url" 2>/dev/null); then
        if [[ "$response_code" =~ ^(200|301|302|404)$ ]]; then
            echo -e "${GREEN}✓ Accessible (HTTP $response_code)${NC}"
        else
            echo -e "${YELLOW}⚠ Unexpected response (HTTP $response_code)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ Cannot reach (may not be configured)${NC}"
    fi
done

echo ""

# Check Nginx status (if installed)
if command -v nginx &> /dev/null; then
    echo -e "${BLUE}=== NGINX STATUS ===${NC}"
    echo ""

    if systemctl is-active --quiet nginx; then
        echo -e "${GREEN}✓${NC} Nginx is running"

        # Check nginx config
        if nginx -t 2>&1 | grep -q "successful"; then
            echo -e "${GREEN}✓${NC} Nginx configuration is valid"
        else
            echo -e "${RED}✗${NC} Nginx configuration has errors"
            all_running=false
        fi
    else
        echo -e "${RED}✗${NC} Nginx is not running"
        all_running=false
    fi
    echo ""
fi

# Check disk space
echo -e "${BLUE}=== SYSTEM RESOURCES ===${NC}"
echo ""

# Disk usage
disk_usage=$(df -h "$PROJECT_DIR" | awk 'NR==2 {print $5}')
echo "Disk Usage: $disk_usage"

# Docker disk usage
echo ""
echo "Docker Disk Usage:"
docker system df

echo ""

# Container resource usage
echo "Container Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo ""

# Recent logs (errors only)
echo -e "${BLUE}=== RECENT ERRORS ===${NC}"
echo ""

cd "$PROJECT_DIR"
errors=$(docker compose logs --since 5m 2>&1 | grep -i "error" | tail -n 10 || echo "No recent errors")
if [[ "$errors" == "No recent errors" ]]; then
    echo -e "${GREEN}✓ No recent errors in logs${NC}"
else
    echo -e "${YELLOW}Recent errors found:${NC}"
    echo "$errors"
fi

echo ""

# Summary
echo "=============================================================================="
if [[ "$all_running" == true ]]; then
    echo -e "${GREEN}✓ ALL SYSTEMS OPERATIONAL${NC}"
    exit 0
else
    echo -e "${RED}✗ SOME SYSTEMS ARE DOWN${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  - Check logs: docker compose logs -f"
    echo "  - Restart services: docker compose restart"
    echo "  - Full restart: docker compose down && docker compose up -d"
    exit 1
fi
echo "=============================================================================="
echo ""
