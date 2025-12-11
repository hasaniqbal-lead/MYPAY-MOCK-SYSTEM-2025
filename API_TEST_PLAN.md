# MYPAY MOCK SYSTEM - COMPLETE API TEST PLAN

## 📋 Overview
This document provides a comprehensive test plan for all MyPay Mock System APIs. Both Payment and Payout APIs now follow a unified structure with `/api/v1` prefix and standardized error responses.

---

## 🎯 Pre-Test Setup

### 1. Start Database
```bash
# If not running already
docker run -d --name mysql -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=MyPay@Secure2025! \
  -e MYSQL_DATABASE=mypay_mock_db \
  mysql:8.0
```

### 2. Run Migrations & Seed
```bash
pnpm exec prisma migrate dev
pnpm exec prisma db seed
```

### 3. Start Both APIs
```bash
# Terminal 1 - Payout API
cd services/payout-api
pnpm build
PORT=4001 node dist/api/main.js

# Terminal 2 - Payment API
cd services/payment-api
pnpm build
PORT=4002 node dist/main.js
```

### 4. Get Test Credentials from Seed Output
When you run `prisma db seed`, note the following:
- **Merchant Email**: test@merchant.com
- **Payout API Key**: (dynamically generated, shown in seed output)
- **Payment Session Token**: (obtain via login)

---

## 🔧 PAYOUT API TESTS (Port 4001)

### Base URL: `http://localhost:4001/api/v1`

### Test 1: Health Check
```bash
curl http://localhost:4001/api/v1/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "service": "Payout API",
  "timestamp": "2024-XX-XXTXX:XX:XX.XXXZ"
}
```

---

### Test 2: Get Bank Directory (Authenticated)
```bash
curl -X GET http://localhost:4001/api/v1/directory \
  -H "X-API-Key: YOUR_PAYOUT_API_KEY_HERE" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "code": "HBL",
      "name": "Habib Bank Limited",
      "type": "bank",
      "enabled": true
    },
    {
      "code": "EASYPAISA",
      "name": "Easypaisa",
      "type": "mobile_wallet",
      "enabled": true
    },
    // ... more banks
  ]
}
```

---

### Test 3: Create Payout (POST)
```bash
curl -X POST http://localhost:4001/api/v1/payouts \
  -H "X-API-Key: YOUR_PAYOUT_API_KEY_HERE" \
  -H "X-Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "merchantTransactionId": "TXN-'$(date +%s)'",
    "amount": 1000.00,
    "currency": "PKR",
    "beneficiary": {
      "name": "Test User",
      "accountNumber": "1234567890",
      "bankCode": "HBL",
      "cnic": "1234567890123",
      "phone": "03001234567",
      "email": "test@example.com"
    },
    "purpose": "Salary Payment",
    "metadata": {
      "department": "Engineering",
      "employee_id": "EMP001"
    }
  }'
```

**Expected Response (Success):**
```json
{
  "success": true,
  "data": {
    "payoutId": "pyt_xxxxxxxxxxxxx",
    "merchantTransactionId": "TXN-1234567890",
    "status": "pending",
    "amount": 1000.00,
    "currency": "PKR",
    "createdAt": "2024-XX-XXTXX:XX:XX.XXXZ",
    "estimatedSettlement": "2024-XX-XXTXX:XX:XX.XXXZ"
  }
}
```

**Error Cases to Test:**
1. Missing API Key → 401 Invalid API key
2. Missing Idempotency Key → 400 Idempotency key required
3. Invalid Amount → 400 Validation error
4. Invalid Bank Code → 400 Invalid bank code

---

### Test 4: Get Payout Details
```bash
curl -X GET http://localhost:4001/api/v1/payouts/pyt_xxxxxxxxxxxxx \
  -H "X-API-Key: YOUR_PAYOUT_API_KEY_HERE" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "payoutId": "pyt_xxxxxxxxxxxxx",
    "merchantTransactionId": "TXN-1234567890",
    "status": "completed",
    "amount": 1000.00,
    "currency": "PKR",
    "beneficiary": {
      "name": "Test User",
      "accountNumber": "1234567890",
      "bankCode": "HBL"
    },
    "timeline": [
      {
        "status": "pending",
        "timestamp": "2024-XX-XXTXX:XX:XX.XXXZ"
      },
      {
        "status": "processing",
        "timestamp": "2024-XX-XXTXX:XX:XX.XXXZ"
      },
      {
        "status": "completed",
        "timestamp": "2024-XX-XXTXX:XX:XX.XXXZ"
      }
    ]
  }
}
```

---

### Test 5: List Payouts (with filters)
```bash
curl -X GET "http://localhost:4001/api/v1/payouts?status=completed&page=1&limit=10" \
  -H "X-API-Key: YOUR_PAYOUT_API_KEY_HERE" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "payouts": [
      {
        "payoutId": "pyt_xxxxxxxxxxxxx",
        "merchantTransactionId": "TXN-1234567890",
        "status": "completed",
        "amount": 1000.00,
        "currency": "PKR",
        "createdAt": "2024-XX-XXTXX:XX:XX.XXXZ"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### Test 6: Get Merchant Balance
```bash
curl -X GET http://localhost:4001/api/v1/balance \
  -H "X-API-Key: YOUR_PAYOUT_API_KEY_HERE" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "currency": "PKR",
    "available": 9000.00,
    "pending": 1000.00,
    "total": 10000.00,
    "lastUpdated": "2024-XX-XXTXX:XX:XX.XXXZ"
  }
}
```

---

## 💳 PAYMENT API TESTS (Port 4002)

### Base URL: `http://localhost:4002/api/v1`

### Test 1: Health Check
```bash
curl http://localhost:4002/api/v1/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "service": "MyPay Payment API",
  "timestamp": "2024-XX-XXTXX:XX:XX.XXXZ"
}
```

---

### Test 2: Create Checkout Session (Authenticated)
```bash
curl -X POST http://localhost:4002/api/v1/checkouts \
  -H "X-API-Key: YOUR_PAYMENT_API_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1500.00,
    "currency": "PKR",
    "reference": "ORDER-'$(date +%s)'",
    "description": "Test Payment for Order #12345",
    "customer": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "03001234567"
    },
    "webhook_url": "https://your-domain.com/webhooks/payment",
    "redirect_url": "https://your-domain.com/payment/success",
    "metadata": {
      "order_id": "12345",
      "product": "Premium Subscription"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "checkout_id": "chk_xxxxxxxxxxxxx",
  "session_id": "ses_xxxxxxxxxxxxx",
  "payment_url": "http://localhost:4002/payment/ses_xxxxxxxxxxxxx",
  "expires_at": "2024-XX-XXTXX:XX:XX.XXXZ"
}
```

---

### Test 3: Get Checkout Details
```bash
curl -X GET http://localhost:4002/api/v1/checkouts/chk_xxxxxxxxxxxxx \
  -H "X-API-Key: YOUR_PAYMENT_API_KEY_HERE" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "checkout_id": "chk_xxxxxxxxxxxxx",
    "reference": "ORDER-1234567890",
    "amount": 1500.00,
    "currency": "PKR",
    "status": "pending",
    "customer": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "03001234567"
    },
    "payment_url": "http://localhost:4002/payment/ses_xxxxxxxxxxxxx",
    "created_at": "2024-XX-XXTXX:XX:XX.XXXZ"
  }
}
```

---

### Test 4: Get Transaction Status
```bash
curl -X GET http://localhost:4002/api/v1/transactions/ORDER-1234567890 \
  -H "X-API-Key: YOUR_PAYMENT_API_KEY_HERE" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "reference": "ORDER-1234567890",
    "status": "completed",
    "amount": 1500.00,
    "currency": "PKR",
    "payment_method": "EASYPAISA",
    "transaction_id": "TXN_xxxxxxxxxxxxx",
    "completed_at": "2024-XX-XXTXX:XX:XX.XXXZ"
  }
}
```

---

## 🔐 PORTAL API TESTS (Both APIs)

### Payment Portal API (Port 4002)

#### Test 1: Merchant Registration
```bash
curl -X POST http://localhost:4002/api/v1/portal/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Merchant",
    "email": "newmerchant@test.com",
    "password": "SecurePass123!",
    "company_name": "Test Company Ltd"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Merchant registered successfully",
  "merchant_id": 123
}
```

---

#### Test 2: Merchant Login
```bash
curl -X POST http://localhost:4002/api/v1/portal/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@merchant.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "merchant": {
    "id": 1,
    "name": "Test Merchant",
    "email": "test@merchant.com",
    "company_name": "Test Company"
  }
}
```

---

#### Test 3: Get Merchant Profile (Authenticated)
```bash
curl -X GET http://localhost:4002/api/v1/portal/merchant/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "merchant": {
    "id": 1,
    "name": "Test Merchant",
    "email": "test@merchant.com",
    "company_name": "Test Company",
    "status": "active",
    "created_at": "2024-XX-XXTXX:XX:XX.XXXZ"
  }
}
```

---

#### Test 4: Get API Credentials
```bash
curl -X GET http://localhost:4002/api/v1/portal/merchant/credentials \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "credentials": {
    "api_key": "pk_live_xxxxxxxxxxxxxxxxxx",
    "created_at": "2024-XX-XXTXX:XX:XX.XXXZ"
  }
}
```

---

#### Test 5: Get Dashboard Statistics
```bash
curl -X GET http://localhost:4002/api/v1/portal/dashboard/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "stats": {
    "total_transactions": 150,
    "total_volume": 250000.00,
    "successful_transactions": 145,
    "failed_transactions": 5,
    "pending_transactions": 0,
    "success_rate": 96.67,
    "period": "all_time"
  }
}
```

---

#### Test 6: List Transactions
```bash
curl -X GET "http://localhost:4002/api/v1/portal/transactions?page=1&limit=10&status=completed" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": 1,
      "reference": "ORDER-12345",
      "amount": 1500.00,
      "currency": "PKR",
      "status": "completed",
      "payment_method": "EASYPAISA",
      "created_at": "2024-XX-XXTXX:XX:XX.XXXZ"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 145,
    "totalPages": 15
  }
}
```

---

## 🧪 ERROR HANDLING TESTS

### Both APIs Should Return Standardized Errors

#### Test 1: 404 Not Found
```bash
curl http://localhost:4001/api/v1/nonexistent
```

**Expected Response:**
```json
{
  "error": {
    "message": "Route not found",
    "code": "NOT_FOUND"
  }
}
```

---

#### Test 2: 401 Unauthorized (Missing API Key)
```bash
curl -X GET http://localhost:4001/api/v1/directory
```

**Expected Response:**
```json
{
  "error": {
    "message": "Invalid API key",
    "code": "UNAUTHORIZED"
  }
}
```

---

#### Test 3: 400 Validation Error
```bash
curl -X POST http://localhost:4001/api/v1/payouts \
  -H "X-API-Key: YOUR_PAYOUT_API_KEY_HERE" \
  -H "X-Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": -100
  }'
```

**Expected Response:**
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [
      "Amount must be positive",
      "merchantTransactionId is required"
    ]
  }
}
```

---

## 📊 TEST CHECKLIST

### Payout API (Port 4001)
- [ ] Health check returns 200
- [ ] Directory endpoint requires authentication
- [ ] Create payout with valid data succeeds
- [ ] Create payout with invalid data fails with 400
- [ ] Missing API key returns 401
- [ ] Missing idempotency key returns 400
- [ ] Get payout details works
- [ ] List payouts with filters works
- [ ] Balance endpoint returns correct data
- [ ] Audit logs are generated for all requests

### Payment API (Port 4002)
- [ ] Health check returns 200
- [ ] Create checkout session works
- [ ] Get checkout details works
- [ ] Get transaction status works
- [ ] Missing API key returns 401
- [ ] Invalid checkout ID returns 404
- [ ] Audit logs are generated for all requests

### Portal API (Payment API)
- [ ] Merchant registration works
- [ ] Merchant login returns JWT token
- [ ] Get profile with valid token works
- [ ] Get profile without token returns 401
- [ ] Get credentials works
- [ ] Get dashboard stats works
- [ ] List transactions with pagination works
- [ ] Export transactions works

### Error Handling
- [ ] 404 returns standardized error
- [ ] 401 returns standardized error
- [ ] 400 returns standardized error with details
- [ ] 500 returns standardized error

---

## 🎯 INTEGRATION TESTS

### Test 1: Complete Payment Flow
1. Create checkout session
2. Visit payment URL
3. Complete payment with test card
4. Verify transaction status
5. Check webhook delivery

### Test 2: Complete Payout Flow
1. Check merchant balance
2. Create payout
3. Poll payout status until completed
4. Verify balance deduction
5. Check webhook delivery

---

## 📝 NOTES

1. **API Key Management**: Both Payout and Payment APIs use different API keys. Get them from seed output or portal.
2. **Idempotency**: Payout API requires UUID format for idempotency keys.
3. **Rate Limiting**: Not implemented yet, but should be added for production.
4. **Webhooks**: Test webhook delivery manually or use tools like webhook.site.
5. **Audit Logs**: Check console output for `[AUDIT-REQUEST]` and `[AUDIT-RESPONSE]` logs.

---

## 🚀 NEXT STEPS

After all tests pass locally:
1. Commit all changes to Git
2. Clean VPS completely
3. Deploy using Docker Compose
4. Run same tests on production URLs
5. Configure SSL certificates
6. Setup monitoring and alerting

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Status:** Ready for Testing

