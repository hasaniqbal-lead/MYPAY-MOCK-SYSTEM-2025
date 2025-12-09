#!/bin/bash

# ===========================================
# MyPay VPS Cleanup Script
# WARNING: This will remove ALL MyPay containers, images, and volumes
# ===========================================

echo "=========================================="
echo "  MyPay VPS Cleanup"
echo "  WARNING: This is destructive!"
echo "=========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}ERROR: Please run as root (sudo ./vps-cleanup.sh)${NC}"
    exit 1
fi

echo -e "${RED}This script will:${NC}"
echo "  1. Stop all MyPay Docker containers"
echo "  2. Remove all MyPay Docker containers"
echo "  3. Remove all MyPay Docker images"
echo "  4. Remove MyPay Docker volumes (DATABASE WILL BE DELETED)"
echo "  5. Remove Nginx configuration"
echo "  6. Optionally remove project directory"
echo ""

read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm

if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}Cleanup cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Starting cleanup...${NC}"
echo ""

# Step 1: Stop all MyPay containers
echo -e "${YELLOW}[1/7] Stopping MyPay containers...${NC}"
if docker ps | grep -q mypay; then
    docker stop $(docker ps | grep mypay | awk '{print $1}') 2>/dev/null
    echo -e "${GREEN}Containers stopped${NC}"
else
    echo -e "${YELLOW}No running MyPay containers found${NC}"
fi
echo ""

# Step 2: Remove all MyPay containers
echo -e "${YELLOW}[2/7] Removing MyPay containers...${NC}"
if docker ps -a | grep -q mypay; then
    docker rm $(docker ps -a | grep mypay | awk '{print $1}') 2>/dev/null
    echo -e "${GREEN}Containers removed${NC}"
else
    echo -e "${YELLOW}No MyPay containers to remove${NC}"
fi
echo ""

# Step 3: Remove all MyPay images
echo -e "${YELLOW}[3/7] Removing MyPay images...${NC}"
if docker images | grep -q mypay; then
    docker images | grep mypay | awk '{print $3}' | xargs docker rmi -f 2>/dev/null
    echo -e "${GREEN}Images removed${NC}"
else
    echo -e "${YELLOW}No MyPay images to remove${NC}"
fi
echo ""

# Step 4: Remove MyPay volumes
echo -e "${YELLOW}[4/7] Removing MyPay volumes...${NC}"
read -p "Remove database volumes? This will DELETE ALL DATA (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker volume ls | grep mypay | awk '{print $2}' | xargs docker volume rm 2>/dev/null || true
    echo -e "${GREEN}Volumes removed${NC}"
else
    echo -e "${YELLOW}Volumes kept${NC}"
fi
echo ""

# Step 5: Remove MyPay network
echo -e "${YELLOW}[5/7] Removing MyPay network...${NC}"
docker network ls | grep mypay | awk '{print $1}' | xargs docker network rm 2>/dev/null || true
echo -e "${GREEN}Network removed${NC}"
echo ""

# Step 6: Remove Nginx configuration
echo -e "${YELLOW}[6/7] Removing Nginx configuration...${NC}"
if [ -f "/etc/nginx/sites-enabled/mypay.conf" ]; then
    rm -f /etc/nginx/sites-enabled/mypay.conf
    echo -e "${GREEN}Nginx config removed from sites-enabled${NC}"
fi

if [ -f "/etc/nginx/sites-available/mypay.conf" ]; then
    rm -f /etc/nginx/sites-available/mypay.conf
    echo -e "${GREEN}Nginx config removed from sites-available${NC}"
fi

# Reload Nginx
if systemctl is-active --quiet nginx; then
    nginx -t && systemctl reload nginx
    echo -e "${GREEN}Nginx reloaded${NC}"
fi
echo ""

# Step 7: Remove project directory
echo -e "${YELLOW}[7/7] Remove project directory?${NC}"
read -p "Remove /opt/mypay-mock directory? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -d "/opt/mypay-mock" ]; then
        # Create final backup before removal
        BACKUP_DIR="/opt/mypay-backups"
        mkdir -p "$BACKUP_DIR"
        timestamp=$(date +%Y%m%d_%H%M%S)
        tar -czf "$BACKUP_DIR/mypay-final-backup-$timestamp.tar.gz" "/opt/mypay-mock" 2>/dev/null || true
        echo -e "${GREEN}Final backup created: $BACKUP_DIR/mypay-final-backup-$timestamp.tar.gz${NC}"

        rm -rf /opt/mypay-mock
        echo -e "${GREEN}Project directory removed${NC}"
    else
        echo -e "${YELLOW}Project directory not found${NC}"
    fi
else
    echo -e "${YELLOW}Project directory kept${NC}"
fi
echo ""

# Optional: Clean up Docker system
echo -e "${YELLOW}Docker System Cleanup (Optional)${NC}"
read -p "Run docker system prune to free up space? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker system prune -af
    echo -e "${GREEN}Docker system cleaned${NC}"
fi
echo ""

echo "=========================================="
echo -e "  ${GREEN}CLEANUP COMPLETE${NC}"
echo "=========================================="
echo ""
echo "What was cleaned:"
echo "  ✓ All MyPay Docker containers stopped and removed"
echo "  ✓ All MyPay Docker images removed"
echo "  ✓ MyPay Docker network removed"
echo "  ✓ Nginx configuration removed"
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "  ✓ Project directory removed"
fi

echo ""
echo "What was NOT touched:"
echo "  - Docker installation"
echo "  - Nginx installation"
echo "  - Certbot and SSL certificates"
echo "  - Other Docker containers/images"
echo "  - System packages"
echo ""

echo -e "${GREEN}The VPS is now clean and ready for fresh deployment!${NC}"
echo ""
echo "To deploy again, run:"
echo "  ./deploy-production.sh"
echo ""
