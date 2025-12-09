#!/bin/bash

# ============================================
# MyPay Mock Platform - Setup Script
# ============================================

set -e

echo "🚀 Setting up MyPay Mock Platform..."
echo ""

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Installing..."
    npm install -g pnpm
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo "✅ pnpm $(pnpm -v) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
cd prisma && npx prisma generate && cd ..

# Build shared package
echo "🔧 Building shared package..."
pnpm --filter @mypay/shared build

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Copy .env.example to .env and configure"
echo "   2. Run database migrations: pnpm run db:migrate"
echo "   3. Seed the database: pnpm run db:seed"
echo "   4. Start development: pnpm run dev"
echo ""

