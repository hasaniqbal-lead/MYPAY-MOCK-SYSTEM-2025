# 🚀 Quick Start Guide

## Step 1: Start Docker Desktop

**IMPORTANT**: Docker Desktop must be running before proceeding!

1. Open Docker Desktop application on your Windows machine
2. Wait for it to fully start (you'll see "Docker Desktop is running" in the system tray)
3. Once running, come back here and we'll continue

## Step 2: Start Database

Once Docker Desktop is running, we'll execute:
```bash
docker-compose up -d mysql
```

## Step 3: Run Migrations

```bash
npm run prisma:migrate
```

## Step 4: Seed Database

```bash
npm run prisma:seed
```

This will create:
- Test merchant account
- API key (you'll need this for testing)
- Bank and wallet directories
- Initial balance (1,000,000 PKR)

## Step 5: Start Services

Open **two terminal windows**:

**Terminal 1 - API Server:**
```bash
npm run start:api
```

**Terminal 2 - Worker Service:**
```bash
npm run start:worker
```

## Step 6: Test the API

```bash
# Health check
curl http://localhost:3000/health

# Get your API key from the seed output, then test a payout
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

---

**Ready?** Start Docker Desktop and let me know when it's running!

