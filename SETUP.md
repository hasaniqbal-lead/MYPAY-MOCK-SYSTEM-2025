# Setup Guide

## Prerequisites

1. Node.js 18+ installed
2. Docker Desktop installed and running (for database)
   OR
   MySQL 8.0+ installed locally

## Quick Setup

### Option 1: Using Docker (Recommended)

1. **Start Docker Desktop**

2. **Start MySQL database:**
   ```bash
   docker-compose up -d mysql
   ```

3. **Create .env file:**
   ```bash
   # Copy this to .env file
   DATABASE_URL="mysql://root:password@localhost:3306/payout_system"
   PORT=3000
   NODE_ENV=development
   WEBHOOK_SECRET=your-webhook-secret-key-change-this-in-production
   WEBHOOK_URL=https://webhook.site/test
   IPN_PORT=3001
   ```

4. **Run database migrations:**
   ```bash
   npm run prisma:migrate
   ```

5. **Seed the database:**
   ```bash
   npm run prisma:seed
   ```

6. **Start the services:**
   ```bash
   # Terminal 1 - API Server
   npm run start:api

   # Terminal 2 - Worker Service
   npm run start:worker
   ```

### Option 2: Using Local MySQL

1. **Install and start MySQL locally**

2. **Create database:**
   ```sql
   CREATE DATABASE payout_system;
   ```

3. **Create .env file:**
   ```bash
   DATABASE_URL="mysql://root:your_password@localhost:3306/payout_system"
   PORT=3000
   NODE_ENV=development
   WEBHOOK_SECRET=your-webhook-secret-key-change-this-in-production
   WEBHOOK_URL=https://webhook.site/test
   IPN_PORT=3001
   ```

4. **Run database migrations:**
   ```bash
   npm run prisma:migrate
   ```

5. **Seed the database:**
   ```bash
   npm run prisma:seed
   ```

6. **Start the services:**
   ```bash
   # Terminal 1 - API Server
   npm run start:api

   # Terminal 2 - Worker Service
   npm run start:worker
   ```

## Testing

1. **Health Check:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Get API Key from seed output** (printed when you run `npm run prisma:seed`)

3. **Test Create Payout:**
   ```bash
   curl -X POST http://localhost:3000/api/v1/payouts \
     -H "X-API-KEY: your-api-key-here" \
     -H "X-IDEMPOTENCY-KEY: $(uuidgen)" \
     -H "Content-Type: application/json" \
     -d '{
       "merchantReference": "test-001",
       "amount": 1000,
       "currency": "PKR",
       "destType": "BANK",
       "bankCode": "HBL",
       "accountNumber": "123450001",
       "accountTitle": "Test User"
     }'
   ```

## Test Scenarios

Use these account numbers for predictable results:

- `123450001` → ✅ Immediate SUCCESS
- `987650002` → 🔄 RETRY then SUCCESS
- `555550003` → ❌ FAILED
- `111110004` → ⏳ PENDING
- `999990005` → 🚫 ON_HOLD
- Amount ≥ 100,000 → 📋 IN_REVIEW

## Troubleshooting

### Docker not running
- Make sure Docker Desktop is running
- Check with: `docker ps`

### Database connection error
- Verify MySQL is running
- Check DATABASE_URL in .env file
- Test connection: `mysql -u root -p -h localhost`

### Port already in use
- Change PORT in .env file
- Or stop the service using the port

