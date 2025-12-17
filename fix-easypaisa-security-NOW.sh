#!/bin/bash
# ==================================================
# EMERGENCY SECURITY FIX FOR EASYPAISA-DB
# ==================================================
# This script fixes the critical security vulnerabilities
# Run this IMMEDIATELY to prevent re-infection
#
# Usage: bash fix-easypaisa-security-NOW.sh
# ==================================================

set -e

echo "🚨 EMERGENCY SECURITY FIX FOR EASYPAISA-DB"
echo "==========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Please run as root: sudo bash $0${NC}"
  exit 1
fi

echo -e "${YELLOW}⚠️  This will:${NC}"
echo "1. Stop the easypaisa-db container"
echo "2. Generate a strong password"
echo "3. Update configuration to only allow localhost access"
echo "4. Restart with security hardening"
echo ""
read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 1
fi

# Navigate to easypaisa directory
cd /opt/easypaisa-wallet || { echo -e "${RED}❌ Directory /opt/easypaisa-wallet not found${NC}"; exit 1; }

echo ""
echo "Step 1: Stopping container..."
docker-compose down

# Backup original files
echo "Step 2: Backing up original configuration..."
cp docker-compose.yml docker-compose.yml.backup.$(date +%Y%m%d_%H%M%S)
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Generate strong password
echo "Step 3: Generating strong password..."
NEW_PASSWORD=$(openssl rand -base64 32)
echo -e "${GREEN}✅ New password generated${NC}"

# Update .env file
echo "Step 4: Updating .env file..."
sed -i "s/DATABASE_PASSWORD=postgres/DATABASE_PASSWORD=${NEW_PASSWORD}/" .env
echo -e "${GREEN}✅ .env updated${NC}"

# Update docker-compose.yml to only listen on localhost
echo "Step 5: Securing PostgreSQL port..."
sed -i 's/- "\${DATABASE_PORT:-5432}:5432"/- "127.0.0.1:5432:5432"/' docker-compose.yml
echo -e "${GREEN}✅ Port now restricted to localhost only${NC}"

# Add security hardening to docker-compose.yml
echo "Step 6: Adding security hardening..."

# Create temporary file with security additions
cat > /tmp/security-additions.txt << 'EOF'
    
    # Security Hardening
    security_opt:
      - no-new-privileges:true
    tmpfs:
      - /tmp:noexec,nosuid,nodev,size=50M
      - /var/run/postgresql:noexec,nosuid,nodev
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - DAC_OVERRIDE
      - SETUID
      - SETGID
      - FOWNER
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 512M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
EOF

# Insert security additions before healthcheck in postgres service
sed -i '/healthcheck:/i\    # Security Hardening\n    security_opt:\n      - no-new-privileges:true\n    tmpfs:\n      - /tmp:noexec,nosuid,nodev,size=50M\n      - /var/run/postgresql:noexec,nosuid,nodev\n    cap_drop:\n      - ALL\n    cap_add:\n      - CHOWN\n      - DAC_OVERRIDE\n      - SETUID\n      - SETGID\n      - FOWNER\n    deploy:\n      resources:\n        limits:\n          cpus: "2"\n          memory: 512M\n    logging:\n      driver: "json-file"\n      options:\n        max-size: "10m"\n        max-file: "3"' docker-compose.yml

echo -e "${GREEN}✅ Security hardening added${NC}"

# Start with new configuration
echo "Step 7: Starting container with new configuration..."
docker-compose up -d

# Wait for container to be healthy
echo "Waiting for database to be ready..."
sleep 10

# Verify container is running
if docker ps | grep -q easypaisa-db; then
  echo -e "${GREEN}✅ Container started successfully${NC}"
else
  echo -e "${RED}❌ Container failed to start! Check logs with: docker logs easypaisa-db${NC}"
  exit 1
fi

# Verify port is not exposed to internet
PORT_CHECK=$(docker port easypaisa-db 5432 | grep -c "0.0.0.0" || echo "0")
if [ "$PORT_CHECK" -eq "0" ]; then
  echo -e "${GREEN}✅ Port 5432 is NOT exposed to internet${NC}"
else
  echo -e "${YELLOW}⚠️  Warning: Port might still be exposed. Verify manually.${NC}"
fi

# Check for suspicious processes
echo ""
echo "Step 8: Checking for malware..."
SUSPICIOUS=$(docker exec easypaisa-db ps aux | grep -E 'mysql|crypto|mine' | grep -v grep || echo "")
if [ -z "$SUSPICIOUS" ]; then
  echo -e "${GREEN}✅ No suspicious processes found${NC}"
else
  echo -e "${RED}❌ ALERT: Suspicious processes detected!${NC}"
  echo "$SUSPICIOUS"
fi

# Check /tmp
TEMP_FILES=$(docker exec easypaisa-db ls -la /tmp/ | tail -n +4)
if [ -z "$TEMP_FILES" ]; then
  echo -e "${GREEN}✅ /tmp is clean${NC}"
else
  echo -e "${YELLOW}⚠️  Files in /tmp:${NC}"
  echo "$TEMP_FILES"
fi

echo ""
echo "========================================"
echo -e "${GREEN}✅ SECURITY FIX COMPLETE!${NC}"
echo "========================================"
echo ""
echo "📋 IMPORTANT INFORMATION:"
echo "------------------------"
echo ""
echo "1. NEW PASSWORD:"
echo "   $NEW_PASSWORD"
echo ""
echo "   ⚠️  SAVE THIS PASSWORD SECURELY!"
echo "   Update your application's .env file if needed."
echo ""
echo "2. CONFIGURATION CHANGES:"
echo "   - PostgreSQL now only listens on localhost (127.0.0.1)"
echo "   - /tmp directory is now noexec (cannot run executables)"
echo "   - Container capabilities restricted"
echo "   - Resource limits applied"
echo ""
echo "3. WHAT TO DO NEXT:"
echo "   - Test your easypaisa application"
echo "   - Monitor for 24 hours: docker stats easypaisa-db"
echo "   - Set up monitoring (see SECURITY_AUDIT_REPORT)"
echo "   - Configure fail2ban"
echo ""
echo "4. BACKUPS CREATED:"
echo "   - docker-compose.yml.backup.*"
echo "   - .env.backup.*"
echo ""
echo "5. IF SOMETHING BREAKS:"
echo "   - Restore backup: cp docker-compose.yml.backup.* docker-compose.yml"
echo "   - Restart: docker-compose down && docker-compose up -d"
echo ""
echo "========================================"
echo ""
echo -e "${YELLOW}⚠️  REMEMBER: Test your application to ensure it still works!${NC}"
echo ""

