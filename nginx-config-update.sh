#!/bin/bash
#
# Update Nginx Configuration for Documentation at /doc/payout
# Run this on VPS after deployment
#

set -e

echo "Updating Nginx configuration for documentation at /doc/payout..."

# Backup existing config
cp /etc/nginx/sites-available/payout-api /etc/nginx/sites-available/payout-api.backup

# Create updated Nginx config
cat > /etc/nginx/sites-available/payout-api << 'NGINX_EOF'
server {
    listen 80;
    server_name sandbox.mycodigital.io;

    client_max_body_size 10M;

    # Serve documentation at /doc/payout
    location /doc/payout {
        alias /opt/payout-system/public;
        index index.html;
        try_files $uri $uri/ /index.html =404;
    }

    # Serve static assets for documentation
    location ~ ^/doc/payout/(.+\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot))$ {
        alias /opt/payout-system/public/$1;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Serve Postman collection
    location /doc/payout/MyPay_Payout_API.postman_collection.json {
        alias /opt/payout-system/public/MyPay_Payout_API.postman_collection.json;
        add_header Content-Type application/json;
        add_header Content-Disposition 'attachment; filename="MyPay_Payout_API.postman_collection.json"';
    }

    # OpenAPI spec
    location /doc/payout/api-docs.json {
        alias /opt/payout-system/public/api-docs.json;
        add_header Content-Type application/json;
    }

    # Root redirect to documentation
    location = / {
        return 302 /doc/payout;
    }

    # API endpoints
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }

    # IPN endpoint
    location /ipn/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Webhook endpoint
    location /webhooks {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINX_EOF

# Test configuration
nginx -t

if [ $? -eq 0 ]; then
    echo "✓ Nginx configuration is valid"
    
    # Reload Nginx
    systemctl reload nginx
    
    echo "✓ Nginx reloaded successfully"
    echo ""
    echo "Documentation is now live at:"
    echo "https://sandbox.mycodigital.io/doc/payout"
    echo ""
else
    echo "✗ Nginx configuration error"
    echo "Restoring backup..."
    cp /etc/nginx/sites-available/payout-api.backup /etc/nginx/sites-available/payout-api
    exit 1
fi


