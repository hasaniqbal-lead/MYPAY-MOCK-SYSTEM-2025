# 📬 MyPay Postman Collections

Complete API testing collections for all MyPay Mock System services.

**Last Updated**: December 11, 2025

---

## 📦 Available Collections

### 1. 💰 Payout API Collection
**File**: `MyPay_Payout_API.postman_collection.json`

### 2. 💳 Payment API Collection
**File**: `MyPay_Payment_API.postman_collection.json`

---

## 🌐 Environment Configuration

Both collections support **Production** and **Local** testing.

### Production URLs (VPS)

| Service | Base URL | Notes |
|---------|----------|-------|
| **Payout API** | `https://sandbox.mycodigital.io/api/v1` | No port number, HTTPS enabled |
| **Payment API** | `https://mock.mycodigital.io/api/v1` | No port number, HTTPS enabled |

### Local Development URLs

| Service | Base URL | Notes |
|---------|----------|-------|
| **Payout API** | `http://localhost:4001/api/v1` | For local testing |
| **Payment API** | `http://localhost:4002/api/v1` | For local testing |

---

## 🚀 Quick Start

### Step 1: Import Collections

1. Open Postman
2. Click **Import** button
3. Select both collection files:
   - `MyPay_Payout_API.postman_collection.json`
   - `MyPay_Payment_API.postman_collection.json`
4. Click **Import**

### Step 2: Choose Environment

Each collection has variables pre-configured:

**For Production Testing** (VPS):
- Use variable: `{{base_url}}` (default)
- URLs use HTTPS and production domains

**For Local Testing**:
- Change requests to use: `{{base_url_local}}`
- URLs use HTTP and localhost

### Step 3: Start Testing!

- All endpoints are ready to use
- Test credentials are pre-filled
- API keys are configured

---

## 💰 Payout API Collection

### Collection Variables

```
base_url: https://sandbox.mycodigital.io/api/v1
base_url_local: http://localhost:4001/api/v1
api_key: mypay_3771a05970d71c8a95e9364756d1c6163f811343785390102d4730b8a4aa5039
```

### Available Endpoints

1. **Health Check** - `GET /health`
2. **Create Payout** - `POST /payouts`
3. **List Payouts** - `GET /payouts`
4. **Get Payout** - `GET /payouts/:id`
5. **Reinitiate Payout** - `POST /payouts/:id/reinitiate`
6. **Get Directory** - `GET /directory`
7. **Callback Webhook** - `POST /callback` (simulated)

### Test Account Numbers

Use these account numbers to test different scenarios:

| Account Number | Result | Description |
|----------------|--------|-------------|
| `*****0001` | ✅ SUCCESS | Immediate success |
| `*****0002` | 🔄 RETRY → SUCCESS | First fails, then succeeds |
| `*****0003` | ❌ FAILED | Always fails |
| `*****0004` | ⏳ PENDING | Stays in pending |
| `*****0005` | 🛑 ON_HOLD | Gets put on hold |
| Amount ≥ 100,000 | 🔍 IN_REVIEW | Goes to review status |

**Example**: Use account number `1234567890` (ends in 0001) for success.

### Sample Request: Create Payout

```bash
POST https://sandbox.mycodigital.io/api/v1/payouts
Headers:
  X-API-KEY: mypay_3771a05970d71c8a95e9364756d1c6163f811343785390102d4730b8a4aa5039
  X-IDEMPOTENCY-KEY: 550e8400-e29b-41d4-a716-446655440000
  Content-Type: application/json

Body:
{
  "account_number": "1234567890",
  "amount": 1000.00,
  "currency": "PKR",
  "purpose": "SALARY",
  "description": "Test payout"
}
```

---

## 💳 Payment API Collection

### Collection Variables

```
base_url: https://mock.mycodigital.io/api/v1
base_url_local: http://localhost:4002/api/v1
api_key: test-merchant-api-key-12345
```

### Available Endpoints

1. **Health Check** - `GET /health`
2. **Create Checkout (JazzCash)** - `POST /checkouts`
3. **Create Checkout (Easypaisa)** - `POST /checkouts`
4. **Create Checkout (Card)** - `POST /checkouts`
5. **Get Checkout Status** - `GET /checkouts/:id`
6. **Capture Payment** - `POST /capture`
7. **Portal Endpoints** (Login, Dashboard, Transactions, etc.)

### Test Merchant Credentials

**For Portal Login**:
```
Email: merchant@test.com
Password: Test123!
```

**For API Requests**:
```
API Key: test-merchant-api-key-12345
```

### Test Card Numbers

| Card Number | Result | Description |
|-------------|--------|-------------|
| `4242424242424242` | ✅ SUCCESS | Payment succeeds |
| `4000000000000002` | ❌ DECLINED | Card declined |
| `4000000000009995` | ❌ INSUFFICIENT_FUNDS | Not enough funds |

### Sample Request: Create Checkout

```bash
POST https://mock.mycodigital.io/api/v1/checkouts
Headers:
  X-Api-Key: test-merchant-api-key-12345
  Content-Type: application/json

Body:
{
  "reference": "TEST-12345",
  "amount": 1000.00,
  "paymentMethod": "jazzcash",
  "paymentType": "onetime",
  "successUrl": "https://merchant.com/success",
  "returnUrl": "https://merchant.com/return",
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "name": "Test User"
  }
}
```

---

## 🔄 Switching Between Environments

### Method 1: Collection Variables (Recommended)

**In Postman:**
1. Click on the collection name
2. Go to **Variables** tab
3. Change `base_url` current value:
   - Production: `https://sandbox.mycodigital.io/api/v1` (Payout) or `https://mock.mycodigital.io/api/v1` (Payment)
   - Local: `http://localhost:4001/api/v1` (Payout) or `http://localhost:4002/api/v1` (Payment)
4. Save collection

### Method 2: Create Postman Environment (Advanced)

**Create Production Environment:**
```json
{
  "name": "MyPay Production",
  "values": [
    {
      "key": "payout_base_url",
      "value": "https://sandbox.mycodigital.io/api/v1"
    },
    {
      "key": "payment_base_url",
      "value": "https://mock.mycodigital.io/api/v1"
    },
    {
      "key": "payout_api_key",
      "value": "mypay_3771a05970d71c8a95e9364756d1c6163f811343785390102d4730b8a4aa5039"
    },
    {
      "key": "payment_api_key",
      "value": "test-merchant-api-key-12345"
    }
  ]
}
```

**Create Local Environment:**
```json
{
  "name": "MyPay Local",
  "values": [
    {
      "key": "payout_base_url",
      "value": "http://localhost:4001/api/v1"
    },
    {
      "key": "payment_base_url",
      "value": "http://localhost:4002/api/v1"
    },
    {
      "key": "payout_api_key",
      "value": "mypay_3771a05970d71c8a95e9364756d1c6163f811343785390102d4730b8a4aa5039"
    },
    {
      "key": "payment_api_key",
      "value": "test-merchant-api-key-12345"
    }
  ]
}
```

---

## 🧪 Testing Workflows

### Payout API Testing Flow

1. **Health Check** → Verify API is running
2. **Get Directory** → Check available banks/methods
3. **Create Payout (Success)** → Test successful payout
4. **Get Payout** → Check payout status
5. **List Payouts** → Verify in payout list
6. **Create Payout (Failed)** → Test with account ending in 0003
7. **Reinitiate Payout** → Retry the failed payout

### Payment API Testing Flow

1. **Health Check** → Verify API is running
2. **Create Checkout (JazzCash)** → Test JazzCash checkout
3. **Get Checkout Status** → Check checkout status
4. **Create Checkout (Easypaisa)** → Test Easypaisa checkout
5. **Create Checkout (Card)** → Test card payment
6. **Capture Payment** → Complete the payment

### Portal Testing Flow

1. **Portal Login** → Get JWT token
2. **Get Merchant Profile** → Fetch merchant details
3. **Get Dashboard Stats** → View dashboard data
4. **List Transactions** → View transaction history
5. **Export Transactions** → Download transaction CSV

---

## 🔑 API Keys & Authentication

### Payout API

**Header**: `X-API-KEY`  
**Value**: `mypay_3771a05970d71c8a95e9364756d1c6163f811343785390102d4730b8a4aa5039`

**Idempotency Header**: `X-IDEMPOTENCY-KEY`  
**Format**: UUID v4  
**Example**: `550e8400-e29b-41d4-a716-446655440000`

### Payment API

**Header**: `X-Api-Key`  
**Value**: `test-merchant-api-key-12345`

**For Portal Endpoints**: JWT Bearer token (obtained from login)

---

## 📊 Response Status Codes

### Success Responses

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |

### Error Responses

| Code | Meaning | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Invalid or missing API key |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate idempotency key |
| 500 | Server Error | Internal server error |

---

## 🐛 Troubleshooting

### Issue: "Could not connect to server"

**Solutions**:
1. **Check if service is running**:
   ```bash
   # On VPS
   ssh root@72.60.110.249
   docker ps | grep mypay
   
   # Locally
   docker compose ps
   ```

2. **Verify URL**:
   - Production: Use HTTPS with domain names
   - Local: Use HTTP with localhost and correct port

3. **Check Nginx** (Production only):
   ```bash
   sudo systemctl status nginx
   ```

### Issue: "401 Unauthorized"

**Solutions**:
1. Check API key is correct
2. Verify API key header name:
   - Payout API: `X-API-KEY`
   - Payment API: `X-Api-Key`
3. Ensure no extra spaces in header value

### Issue: "404 Not Found"

**Solutions**:
1. Verify the `/api/v1` prefix is included
2. Check endpoint path is correct
3. Confirm service is running on correct port

### Issue: "409 Conflict" (Payout API)

**Cause**: Duplicate idempotency key

**Solution**: Generate a new UUID for `X-IDEMPOTENCY-KEY` header:
- In Postman, use: `{{$guid}}`
- Or generate new UUID manually

---

## 📝 Testing Checklist

### Before Testing

- [ ] Import both collections into Postman
- [ ] Verify collection variables are set correctly
- [ ] Confirm services are running (local or VPS)
- [ ] Check DNS is resolving correctly (production)

### Payout API Tests

- [ ] Health check returns 200
- [ ] Can retrieve directory
- [ ] Can create successful payout (account ending in 0001)
- [ ] Can list all payouts
- [ ] Can get specific payout by ID
- [ ] Can create failed payout (account ending in 0003)
- [ ] Can reinitiate failed payout
- [ ] Idempotency key prevents duplicates

### Payment API Tests

- [ ] Health check returns 200
- [ ] Can create JazzCash checkout
- [ ] Can create Easypaisa checkout
- [ ] Can create card checkout
- [ ] Can get checkout status
- [ ] Can capture payment
- [ ] Portal login works
- [ ] Can fetch dashboard stats
- [ ] Can list transactions
- [ ] Can export transactions

---

## 📚 Additional Resources

### Documentation
- `API_TEST_PLAN.md` - Comprehensive API testing plan
- `API_TEST_RESULTS.md` - Latest test results
- `VPS_API_TEST_RESULTS.md` - Production API test results

### Service URLs
- **Payout API**: https://sandbox.mycodigital.io
- **Payment API**: https://mock.mycodigital.io
- **Merchant Portal**: https://devportal.mycodigital.io
- **Admin Portal**: https://devadmin.mycodigital.io

### API Documentation
- Payout API: `services/payout-api/README.md`
- Payment API: `services/payment-api/README.md`

---

## 🎯 Quick Commands

### Test Production APIs

```bash
# Payout API Health
curl https://sandbox.mycodigital.io/api/v1/health

# Payment API Health
curl https://mock.mycodigital.io/api/v1/health

# Payout API Directory
curl -H "X-API-KEY: mypay_3771a05970d71c8a95e9364756d1c6163f811343785390102d4730b8a4aa5039" \
  https://sandbox.mycodigital.io/api/v1/directory
```

### Test Local APIs

```bash
# Payout API Health
curl http://localhost:4001/api/v1/health

# Payment API Health
curl http://localhost:4002/api/v1/health
```

---

## 🔄 Updates & Maintenance

### When URLs Change
1. Update collection variables (`base_url`)
2. Update this documentation
3. Test all endpoints
4. Commit changes to Git

### When API Keys Change
1. Update collection variables (`api_key`)
2. Update `.env` files
3. Reseed database if needed
4. Test authentication

### When New Endpoints Added
1. Add new requests to collections
2. Document in this file
3. Add to test plan
4. Test thoroughly

---

## ✅ Collection Status

| Collection | Status | Last Updated | Version |
|------------|--------|--------------|---------|
| Payout API | ✅ Updated | Dec 11, 2025 | 2.0 |
| Payment API | ✅ Updated | Dec 11, 2025 | 2.0 |

**Changes in v2.0**:
- ✅ Updated to production URLs (no port numbers)
- ✅ Added HTTPS support
- ✅ Added local development URLs as alternates
- ✅ Standardized variable names (`base_url`, `api_key`)
- ✅ Updated descriptions and documentation
- ✅ Added comprehensive testing notes

---

**Questions or Issues?** Contact the development team or refer to the main project documentation.

**Last Updated**: December 11, 2025  
**Maintained by**: MyPay Team

