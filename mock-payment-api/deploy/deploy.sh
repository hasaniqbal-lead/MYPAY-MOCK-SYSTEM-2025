#!/usr/bin/env bash
set -euo pipefail

# Quick deploy script for VPS

APP_DIR=/opt/dummy-payment-api
DOMAIN=${DOMAIN:-sandbox.mycodigital.io}

echo "==> Creating app directory: $APP_DIR"
sudo mkdir -p "$APP_DIR"
sudo chown -R "$USER":"$USER" "$APP_DIR"

echo "==> Installing Docker and Compose"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER" || true
fi
if ! docker compose version >/dev/null 2>&1; then
  sudo apt-get update -y
  sudo apt-get install -y docker-compose-plugin
fi

echo "==> Syncing project files to $APP_DIR"
rsync -a --delete --exclude node_modules --exclude .git ./ "$APP_DIR"/

echo "==> Creating production .env if missing"
if [ ! -f "$APP_DIR/.env" ]; then
  cat > "$APP_DIR/.env" <<'ENV'
# App
PORT=3000
NODE_ENV=production
API_SECRET_KEY=change-me

# DB (Docker network)
DB_HOST=db
DB_USER=root
DB_PASSWORD=strong-db-pass
DB_NAME=dummy_payment_db
DB_PORT=3306

# Public URLs
API_BASE_URL=https://sandbox.mycodigital.io
CHECKOUT_BASE_URL=https://sandbox.mycodigital.io/payment

# Webhooks
WEBHOOK_RETRY_ATTEMPTS=3
WEBHOOK_RETRY_DELAY=5000
ENV
fi

echo "==> Starting services with Docker Compose"
cd "$APP_DIR"
docker compose up -d --pull always

echo "==> Services started. You can now request http://$DOMAIN/health"
echo "==> Next: set up SSL with certbot on the host if desired."


