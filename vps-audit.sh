#!/bin/bash

# ===========================================
# MyPay VPS Audit Script
# Run this script on the VPS to check current state
# ===========================================

echo "=========================================="
echo "  MyPay VPS Audit - System Check"
echo "=========================================="
echo ""

# System Information
echo "=== SYSTEM INFORMATION ==="
echo "Hostname: $(hostname)"
echo "OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
echo "Kernel: $(uname -r)"
echo "Uptime: $(uptime -p)"
echo ""

# Resource Usage
echo "=== RESOURCE USAGE ==="
echo "CPU Cores: $(nproc)"
echo "Memory:"
free -h
echo ""
echo "Disk Space:"
df -h | grep -E "Filesystem|/$|/opt"
echo ""

# Network Configuration
echo "=== NETWORK CONFIGURATION ==="
echo "IP Address: $(hostname -I | awk '{print $1}')"
echo "Listening Ports:"
netstat -tulpn | grep LISTEN || ss -tulpn | grep LISTEN
echo ""

# Docker Status
echo "=== DOCKER STATUS ==="
if command -v docker &> /dev/null; then
    echo "Docker Version: $(docker --version)"
    echo ""
    echo "Running Containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo "All Containers (including stopped):"
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"
    echo ""
    echo "Docker Images:"
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
    echo ""
    echo "Docker Networks:"
    docker network ls
    echo ""
    echo "Docker Volumes:"
    docker volume ls
else
    echo "Docker is NOT installed"
fi
echo ""

# Nginx Status
echo "=== NGINX STATUS ==="
if command -v nginx &> /dev/null; then
    echo "Nginx Version: $(nginx -v 2>&1)"
    echo "Nginx Status: $(systemctl is-active nginx || echo 'not running')"
    echo ""
    echo "Nginx Sites Enabled:"
    ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "No sites-enabled directory"
    echo ""
    echo "Nginx Configuration Test:"
    nginx -t 2>&1
else
    echo "Nginx is NOT installed"
fi
echo ""

# SSL Certificates
echo "=== SSL CERTIFICATES ==="
if command -v certbot &> /dev/null; then
    echo "Certbot Version: $(certbot --version 2>&1 | head -1)"
    echo ""
    echo "Certificates:"
    certbot certificates 2>&1 || echo "No certificates found"
else
    echo "Certbot is NOT installed"
fi
echo ""

# Application Directories
echo "=== APPLICATION DIRECTORIES ==="
echo "Contents of /opt/:"
ls -lah /opt/ 2>/dev/null || echo "/opt/ not accessible"
echo ""

# Check if mypay is deployed
if [ -d "/opt/mypay-mock" ]; then
    echo "MyPay deployment found at /opt/mypay-mock/"
    echo "Contents:"
    ls -lah /opt/mypay-mock/
else
    echo "No MyPay deployment found at /opt/mypay-mock/"
fi
echo ""

# Check environment files
echo "=== ENVIRONMENT FILES ==="
if [ -f "/opt/mypay-mock/.env" ]; then
    echo "Production .env file exists"
    echo "Size: $(ls -lh /opt/mypay-mock/.env | awk '{print $5}')"
else
    echo "No production .env file found"
fi
echo ""

# Running Services
echo "=== RUNNING SERVICES ==="
echo "MyPay Related Services:"
systemctl list-units --type=service --state=running | grep -i mypay || echo "No MyPay systemd services found"
echo ""

# Firewall Status
echo "=== FIREWALL STATUS ==="
if command -v ufw &> /dev/null; then
    echo "UFW Status:"
    ufw status
elif command -v firewall-cmd &> /dev/null; then
    echo "Firewalld Status:"
    firewall-cmd --list-all
else
    echo "No firewall detected (ufw or firewalld)"
fi
echo ""

# Check DNS Resolution
echo "=== DNS RESOLUTION ==="
echo "Testing domain resolution:"
for domain in sandbox.mycodigital.io devportal.mycodigital.io devadmin.mycodigital.io; do
    ip=$(dig +short $domain | tail -1)
    if [ -n "$ip" ]; then
        echo "  $domain -> $ip"
    else
        echo "  $domain -> NOT RESOLVED"
    fi
done
echo ""

# Summary
echo "=========================================="
echo "  AUDIT COMPLETE"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "1. Review the audit results above"
echo "2. Stop and remove old containers if needed: docker stop \$(docker ps -aq) && docker rm \$(docker ps -aq)"
echo "3. Remove old images if needed: docker image prune -a"
echo "4. Clean up old deployments in /opt/"
echo "5. Run the deployment script: ./deploy-production.sh"
echo ""
