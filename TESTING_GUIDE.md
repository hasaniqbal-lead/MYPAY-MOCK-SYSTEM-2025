# 🧪 MYPAY MOCK SYSTEM - TESTING GUIDE

## ⚠️ Database Setup Required First

Before testing APIs, you need to set up the database. Here's how:

### Step 1: Create .env File

Create a `.env` file in the project root with:

```bash
DATABASE_URL="mysql://root:YOUR_MYSQL_PASSWORD@localhost:3306/mypay_mock_db"
NODE_ENV="development"
JWT_SECRET="MyPayJWTSecret2025SecureKey"
NEXT_PUBLIC_API_URL="http://localhost:4002"
```

**Note**: Replace `YOUR_MYSQL_PASSWORD` with your actual MySQL root password.

### Step 2: Create Database and Run Migrations

```bash
# Create database (run in MySQL)
CREATE DATABASE IF NOT EXISTS mypay_mock_db;

# Or via command line:
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS mypay_mock_db;"

# Run migrations
pnpm exec prisma migrate dev

# Or if migrations exist:
pnpm exec prisma db push

# Seed the database
pnpm exec prisma db seed
```

### Step 3: Note the API Key from Seed Output

When you run `prisma db seed`, it will output:
```
✅ Seeded merchants
Merchant: Test Merchant (test@merchant.com)
Payout API Key: pyt_xxxxxxxxxxxxxxxxxxxx
```

**SAVE THIS API KEY** - you'll need it for testing!

---

## 🚀 Testing the APIs

### Start Both APIs

**Terminal 1 - Payout API:**
```bash
cd services/payout-api
$env:DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/mypay_mock_db"
$env:PORT="4001"
node dist/api/main.js
```

**Terminal 2 - Payment API:**
```bash
cd services/payment-api
$env:DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/mypay_mock_db"
$env:PORT="4002"
$env:JWT_SECRET="MyPayJWTSecret2025SecureKey"
node dist/main.js
```

---

## ✅ API Tests

### 1. Test Health Checks

**Payout API:**
```powershell
curl http://localhost:4001/api/v1/health
```

**Expected:**
```json
{
  "status": "OK",
  "service": "Payout API",
  "timestamp": "2024-XX-XXTXX:XX:XX.XXXZ"
}
```

**Payment API:**
```powershell
curl http://localhost:4002/api/v1/health
```

**Expected:**
```json
{
  "status": "OK",
  "service": "MyPay Payment API",
  "timestamp": "2024-XX-XXTXX:XX:XX.XXXZ"
}
```

---

### 2. Test Payout API - Bank Directory

```powershell
curl -X GET http://localhost:4001/api/v1/directory `
  -H "X-API-Key: YOUR_PAYOUT_API_KEY_HERE" `
  -H "Content-Type: application/json"
```

**Expected:** List of banks and mobile wallets

---

### 3. Test Payout API - Create Payout

```powershell
$idempotencyKey = [guid]::NewGuid().ToString()
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

curl -X POST http://localhost:4001/api/v1/payouts `
  -H "X-API-Key: YOUR_PAYOUT_API_KEY_HERE" `
  -H "X-Idempotency-Key: $idempotencyKey" `
  -H "Content-Type: application/json" `
  -d "{
    \`"merchantTransactionId\`": \`"TXN-$timestamp\`",
    \`"amount\`": 1000.00,
    \`"currency\`": \`"PKR\`",
    \`"beneficiary\`": {
      \`"name\`": \`"Test User\`",
      \`"accountNumber\`": \`"1234567890\`",
      \`"bankCode\`": \`"HBL\`",
      \`"cnic\`": \`"1234567890123\`",
      \`"phone\`": \`"03001234567\`",
      \`"email\`": \`"test@example.com\`"
    },
    \`"purpose\`": \`"Salary Payment\`",
    \`"metadata\`": {
      \`"department\`": \`"Engineering\`"
    }
  }"
```

**Expected:** Payout created with `payoutId` and status `pending`

---

### 4. Test Payment API - Create Checkout

```powershell
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

curl -X POST http://localhost:4002/api/v1/checkouts `
  -H "X-API-Key: YOUR_PAYMENT_API_KEY_HERE" `
  -H "Content-Type: application/json" `
  -d "{
    \`"amount\`": 1500.00,
    \`"currency\`": \`"PKR\`",
    \`"reference\`": \`"ORDER-$timestamp\`",
    \`"description\`": \`"Test Payment\`",
    \`"customer\`": {
      \`"name\`": \`"John Doe\`",
      \`"email\`": \`"john@example.com\`",
      \`"phone\`": \`"03001234567\`"
    },
    \`"webhook_url\`": \`"https://example.com/webhook\`",
    \`"redirect_url\`": \`"https://example.com/success\`"
  }"
```

**Expected:** Checkout session created with `checkout_id` and `payment_url`

---

### 5. Test Portal API - Merchant Login

```powershell
curl -X POST http://localhost:4002/api/v1/portal/auth/login `
  -H "Content-Type: application/json" `
  -d '{
    \"email\": \"test@merchant.com\",
    \"password\": \"password123\"
  }'
```

**Expected:** JWT token returned

---

### 6. Test Portal API - Get Dashboard Stats

```powershell
# First, get the token from login, then:
curl -X GET http://localhost:4002/api/v1/portal/dashboard/stats `
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" `
  -H "Content-Type: application/json"
```

**Expected:** Dashboard statistics

---

## 🎯 Quick Test Checklist

### Payout API (Port 4001)
- [ ] `/api/v1/health` returns 200 OK
- [ ] `/api/v1/directory` requires authentication
- [ ] `/api/v1/directory` returns bank list with valid API key
- [ ] `/api/v1/payouts` creates payout with valid data
- [ ] `/api/v1/payouts` fails without idempotency key
- [ ] `/api/v1/balance` returns merchant balance
- [ ] Audit logs appear in console

### Payment API (Port 4002)
- [ ] `/api/v1/health` returns 200 OK
- [ ] `/api/v1/checkouts` creates checkout session
- [ ] `/api/v1/checkouts/:id` returns checkout details
- [ ] `/api/v1/portal/auth/login` returns JWT token
- [ ] `/api/v1/portal/dashboard/stats` requires auth
- [ ] `/api/v1/portal/dashboard/stats` returns stats with valid token
- [ ] Audit logs appear in console

### Error Handling
- [ ] 404 returns standardized error: `{ error: { message, code } }`
- [ ] 401 returns standardized error
- [ ] Both APIs use same error format

---

## 📝 Common Issues

### Issue 1: "Authentication failed against database"
**Solution**: Check your DATABASE_URL in .env file. Make sure password is correct.

### Issue 2: "Port already in use"
**Solution**: Kill existing processes:
```powershell
# Find process using port 4001 or 4002
Get-Process -Id (Get-NetTCPConnection -LocalPort 4001).OwningProcess
# Kill it
Stop-Process -Id <PROCESS_ID>
```

### Issue 3: "Cannot find module '@prisma/client'"
**Solution**: Regenerate Prisma client:
```bash
pnpm exec prisma generate
```

### Issue 4: "P1001: Can't reach database server"
**Solution**: Make sure MySQL is running on port 3306

---

## 🎊 Success Criteria

Your system is working correctly if:

1. ✅ Both APIs start without errors
2. ✅ Health checks return 200 OK
3. ✅ Payout API accepts authenticated requests
4. ✅ Payment API creates checkouts
5. ✅ Portal login returns JWT token
6. ✅ Dashboard stats work with authentication
7. ✅ Audit logs appear in console
8. ✅ Error responses are standardized

---

## 🚀 Next Steps After Testing

Once all tests pass:
1. Commit any fixes to Git
2. Deploy to VPS using Docker Compose
3. Run same tests on production URLs
4. Configure Nginx and SSL
5. Set up monitoring

---

**Document Created**: December 11, 2024  
**Status**: Ready for Use

