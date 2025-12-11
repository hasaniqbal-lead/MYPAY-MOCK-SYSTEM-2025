#!/bin/bash

###############################################################################
# MyPay Mock Platform - Pre-Deployment Validation Script
# Version: 1.0.0
# Description: Validates environment before deployment
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
REQUIRED_DISK_GB=15
REQUIRED_RAM_GB=2

errors=0
warnings=0

# Print header
echo ""
echo "=============================================================================="
echo "  MyPay Mock Platform - Pre-Deployment Validation"
echo "  Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================================================================="
echo ""

# Helper functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((errors++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((warnings++))
}

# Check 1: Root privileges
echo -e "${BLUE}[1/15] Checking privileges...${NC}"
if [[ $EUID -eq 0 ]]; then
    check_pass "Running as root"
else
    check_fail "Not running as root. Please run with sudo"
fi
echo ""

# Check 2: Operating system
echo -e "${BLUE}[2/15] Checking operating system...${NC}"
if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    echo "  OS: $PRETTY_NAME"
    if [[ "$ID" == "ubuntu" ]] || [[ "$ID" == "debian" ]]; then
        check_pass "Supported OS detected"
    else
        check_warn "Untested OS. Deployment may work but is not guaranteed"
    fi
else
    check_warn "Cannot determine OS version"
fi
echo ""

# Check 3: System resources - RAM
echo -e "${BLUE}[3/15] Checking RAM...${NC}"
total_ram_kb=$(grep MemTotal /proc/meminfo | awk '{print $2}')
total_ram_gb=$((total_ram_kb / 1024 / 1024))

if [[ $total_ram_gb -ge $REQUIRED_RAM_GB ]]; then
    check_pass "RAM: ${total_ram_gb}GB (required: ${REQUIRED_RAM_GB}GB)"
else
    check_warn "RAM: ${total_ram_gb}GB (recommended: ${REQUIRED_RAM_GB}GB+)"
fi
echo ""

# Check 4: System resources - Disk space
echo -e "${BLUE}[4/15] Checking disk space...${NC}"
if [[ -d "$PROJECT_DIR" ]]; then
    available_gb=$(df -BG "$PROJECT_DIR" | awk 'NR==2 {print $4}' | sed 's/G//')
else
    available_gb=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
fi

if [[ $available_gb -ge $REQUIRED_DISK_GB ]]; then
    check_pass "Disk space: ${available_gb}GB available (required: ${REQUIRED_DISK_GB}GB)"
else
    check_fail "Disk space: ${available_gb}GB available (required: ${REQUIRED_DISK_GB}GB)"
fi
echo ""

# Check 5: Docker installation
echo -e "${BLUE}[5/15] Checking Docker...${NC}"
if command -v docker &> /dev/null; then
    docker_version=$(docker --version)
    check_pass "Docker installed: $docker_version"

    # Check Docker daemon
    if docker info &> /dev/null; then
        check_pass "Docker daemon is running"
    else
        check_fail "Docker daemon is not running"
    fi
else
    check_fail "Docker is not installed"
fi
echo ""

# Check 6: Docker Compose installation
echo -e "${BLUE}[6/15] Checking Docker Compose...${NC}"
if docker compose version &> /dev/null; then
    compose_version=$(docker compose version)
    check_pass "Docker Compose installed: $compose_version"
else
    check_fail "Docker Compose is not installed"
fi
echo ""

# Check 7: Project directory
echo -e "${BLUE}[7/15] Checking project directory...${NC}"
if [[ -d "$PROJECT_DIR" ]]; then
    check_pass "Project directory exists: $PROJECT_DIR"

    # Check required files
    required_files=(
        "docker-compose.yml"
        "nginx/mypay.conf"
        ".env"
        "services/payout-api/Dockerfile"
        "services/payment-api/Dockerfile"
        "services/merchant-portal/Dockerfile"
        "services/admin-portal/Dockerfile"
        "prisma/schema.prisma"
    )

    for file in "${required_files[@]}"; do
        if [[ -f "$PROJECT_DIR/$file" ]]; then
            check_pass "  Found: $file"
        else
            check_fail "  Missing: $file"
        fi
    done
else
    check_fail "Project directory not found: $PROJECT_DIR"
fi
echo ""

# Check 8: Environment file validation
echo -e "${BLUE}[8/15] Validating .env file...${NC}"
if [[ -f "$PROJECT_DIR/.env" ]]; then
    check_pass ".env file exists"

    # Check required variables
    required_vars=(
        "DB_PASSWORD"
        "DB_NAME"
        "JWT_SECRET"
        "WEBHOOK_SECRET"
    )

    source "$PROJECT_DIR/.env" 2>/dev/null || true

    for var in "${required_vars[@]}"; do
        if [[ -n "${!var:-}" ]]; then
            # Check if it's still the default/weak value
            case $var in
                DB_PASSWORD)
                    if [[ "${!var}" == "mypay_secret" ]] || [[ "${!var}" == "dummy" ]]; then
                        check_warn "  $var is set to a weak/default value"
                    else
                        check_pass "  $var is configured"
                    fi
                    ;;
                JWT_SECRET)
                    if [[ "${!var}" == *"change"* ]] || [[ "${!var}" == "supersecret"* ]]; then
                        check_warn "  $var appears to be a default value"
                    else
                        check_pass "  $var is configured"
                    fi
                    ;;
                *)
                    check_pass "  $var is configured"
                    ;;
            esac
        else
            check_fail "  $var is not set"
        fi
    done
else
    check_fail ".env file not found"
fi
echo ""

# Check 9: Network connectivity
echo -e "${BLUE}[9/15] Checking network connectivity...${NC}"
if ping -c 1 google.com &> /dev/null; then
    check_pass "Internet connectivity available"
else
    check_warn "Cannot reach external networks (may affect Docker pulls)"
fi
echo ""

# Check 10: DNS resolution
echo -e "${BLUE}[10/15] Checking DNS resolution for domains...${NC}"
domains=("sandbox.mycodigital.io" "devportal.mycodigital.io" "devadmin.mycodigital.io")

for domain in "${domains[@]}"; do
    if host "$domain" &> /dev/null; then
        ip=$(host "$domain" | grep "has address" | awk '{print $4}' | head -1)
        check_pass "  $domain resolves to $ip"
    else
        check_warn "  $domain does not resolve (DNS may not be configured)"
    fi
done
echo ""

# Check 11: Port availability
echo -e "${BLUE}[11/15] Checking port availability...${NC}"
required_ports=(3306 4001 4002 4010 4011 80 443)

for port in "${required_ports[@]}"; do
    if lsof -i ":$port" &> /dev/null; then
        check_warn "  Port $port is already in use"
    else
        check_pass "  Port $port is available"
    fi
done
echo ""

# Check 12: Nginx installation
echo -e "${BLUE}[12/15] Checking Nginx...${NC}"
if command -v nginx &> /dev/null; then
    nginx_version=$(nginx -v 2>&1)
    check_pass "Nginx installed: $nginx_version"

    # Check nginx config syntax
    if nginx -t 2>&1 | grep -q "successful"; then
        check_pass "Nginx configuration syntax is valid"
    else
        check_warn "Nginx configuration has issues (will be fixed during deployment)"
    fi
else
    check_warn "Nginx is not installed (will be installed during deployment)"
fi
echo ""

# Check 13: Certbot installation
echo -e "${BLUE}[13/15] Checking Certbot...${NC}"
if command -v certbot &> /dev/null; then
    certbot_version=$(certbot --version 2>&1 | head -1)
    check_pass "Certbot installed: $certbot_version"
else
    check_warn "Certbot is not installed (will be installed during deployment)"
fi
echo ""

# Check 14: Existing deployment
echo -e "${BLUE}[14/15] Checking for existing deployment...${NC}"
if docker ps -a | grep -q mypay; then
    check_warn "Existing MyPay containers found (will be stopped during deployment)"
    echo "  Existing containers:"
    docker ps -a | grep mypay | awk '{print "    - " $NF}'
else
    check_pass "No existing MyPay deployment found"
fi
echo ""

# Check 15: Docker resources
echo -e "${BLUE}[15/15] Checking Docker resources...${NC}"
if docker info &> /dev/null; then
    # Check Docker storage
    docker_root=$(docker info 2>/dev/null | grep "Docker Root Dir" | awk '{print $NF}')
    if [[ -n "$docker_root" ]]; then
        docker_space=$(df -BG "$docker_root" | awk 'NR==2 {print $4}' | sed 's/G//')
        if [[ $docker_space -ge 10 ]]; then
            check_pass "Docker storage: ${docker_space}GB available"
        else
            check_warn "Docker storage: ${docker_space}GB available (low disk space)"
        fi
    fi
fi
echo ""

# Summary
echo "=============================================================================="
echo "  VALIDATION SUMMARY"
echo "=============================================================================="
echo ""

if [[ $errors -eq 0 ]] && [[ $warnings -eq 0 ]]; then
    echo -e "${GREEN}✓ ALL CHECKS PASSED${NC}"
    echo ""
    echo "System is ready for deployment!"
    echo ""
    echo "Next steps:"
    echo "  1. Review the deployment plan"
    echo "  2. Run: ./deploy-production.sh"
    echo ""
    exit 0
elif [[ $errors -eq 0 ]]; then
    echo -e "${YELLOW}⚠ PASSED WITH WARNINGS${NC}"
    echo ""
    echo "Found $warnings warning(s)"
    echo "System can proceed with deployment, but review warnings above"
    echo ""
    echo "To proceed anyway, run: ./deploy-production.sh"
    echo ""
    exit 0
else
    echo -e "${RED}✗ VALIDATION FAILED${NC}"
    echo ""
    echo "Found $errors error(s) and $warnings warning(s)"
    echo ""
    echo "Please fix the errors above before deploying"
    echo ""
    exit 1
fi
