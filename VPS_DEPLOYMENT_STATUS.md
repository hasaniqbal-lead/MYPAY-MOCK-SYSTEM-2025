# MyPay Mock System - VPS Deployment Status

**Date**: December 11, 2025  
**VPS IP**: 72.60.110.249  
**Deployment Path**: `/opt/mypay-mock`

---

## ✅ Successfully Deployed Services

### 1. Payout API ✓
- **Status**: Running
- **Port**: 4001
- **Health Check**: http://72.60.110.249:4001/api/v1/health
- **Container**: mypay-payout-api
- **Endpoints**: All /api/v1 endpoints operational

### 2. Payment API ✓
- **Status**: Running
- **Port**: 4002
- **Health Check**: http://72.60.110.249:4002/api/v1/health
- **Container**: mypay-payment-api
- **Endpoints**: All /api/v1 endpoints operational

### 3. MySQL Database ✓
- **Status**: Running (Healthy)
- **Port**: 3306
- **Container**: mypay-mysql
- **Database**: mypay_mock_db
- **Seeded**: Yes (with test data and credentials)

---

## 🔧 In Progress

### 4. Merchant Portal
- **Status**: Debugging
- **Port**: 4010
- **Container**: mypay-merchant-portal
- **Issue**: Next.js dependencies resolution

### 5. Admin Portal
- **Status**: Debugging
- **Port**: 4011
- **Container**: mypay-admin-portal
- **Issue**: Next.js dependencies resolution

---

## 📋 Seeded Test Credentials

### Payout API
```
API Key: mypay_b5c79892eecfea9b9c968636e794a3aeeccb25cf0d6aeb67c3e09a06f4bd80de
Merchant ID: 1
Header: X-API-KEY
```

### Payment API
```
API Key: test-api-key-123
Header: X-Api-Key
```

### Portal Login
```
Email: test@darpay.vstore.cloud
Password: test123456
```

### Admin Login
```
Email: admin@darpay.vstore.cloud
Password: admin123456
```

---

## 🧪 API Testing on VPS

### Payout API Test (from Postman)
```bash
# Health Check
GET http://72.60.110.249:4001/api/v1/health

# Directory Endpoint
GET http://72.60.110.249:4001/api/v1/directory
Headers:
  X-API-KEY: mypay_b5c79892eecfea9b9c968636e794a3aeeccb25cf0d6aeb67c3e09a06f4bd80de

# Balance Endpoint
GET http://72.60.110.249:4001/api/v1/balance
Headers:
  X-API-KEY: mypay_b5c79892eecfea9b9c968636e794a3aeeccb25cf0d6aeb67c3e09a06f4bd80de

# Create Payout
POST http://72.60.110.249:4001/api/v1/payouts
Headers:
  X-API-KEY: mypay_b5c79892eecfea9b9c968636e794a3aeeccb25cf0d6aeb67c3e09a06f4bd80de
  X-Idempotency-Key: <generate-uuid>
  Content-Type: application/json
Body:
{
  "amount": 1000,
  "currency": "PKR",
  "purpose": "SALARY",
  "method": "bank_transfer",
  "account_number": "1234567890",
  "account_title": "Test Account",
  "bank_code": "HBL",
  "callback_url": "https://webhook.site/your-unique-url"
}
```

### Payment API Test (from Postman)
```bash
# Health Check
GET http://72.60.110.249:4002/api/v1/health

# Create Checkout Session
POST http://72.60.110.249:4002/api/checkout/sessions
Headers:
  X-Api-Key: test-api-key-123
  Content-Type: application/json
Body:
{
  "amount": 1000,
  "currency": "PKR",
  "description": "Test Payment",
  "successUrl": "https://yoursite.com/success",
  "cancelUrl": "https://yoursite.com/cancel",
  "webhookUrl": "https://webhook.site/your-unique-url"
}

# Portal Login
POST http://72.60.110.249:4002/api/v1/portal/auth/login
Headers:
  Content-Type: application/json
Body:
{
  "email": "test@darpay.vstore.cloud",
  "password": "test123456"
}

# Get Dashboard Stats (requires JWT from login)
GET http://72.60.110.249:4002/api/v1/portal/dashboard/stats
Headers:
  Authorization: Bearer <jwt-token-from-login>
```

---

## 🧪 Test Account Numbers

### Payout Test Accounts
```
1234567890 → SUCCESS
9876543210 → RETRY then SUCCESS
5555555555 → FAILED
1111111111 → PENDING
9999999999 → ON_HOLD
```

### Payment Test Mobile Numbers
```
03030000000 → SUCCESS
03021111111 → FAILED
03032222222 → TIMEOUT
```

### Payment Test Card Numbers
```
4242 4242 4242 4242 → SUCCESS
4000 0000 0000 0002 → DECLINED
```

---

## 🐳 Docker Management Commands

### View All Containers
```bash
ssh root@72.60.110.249 "cd /opt/mypay-mock && docker compose ps"
```

### View Logs
```bash
# Payout API logs
ssh root@72.60.110.249 "cd /opt/mypay-mock && docker compose logs payout-api --tail=50"

# Payment API logs
ssh root@72.60.110.249 "cd /opt/mypay-mock && docker compose logs payment-api --tail=50"

# Merchant Portal logs
ssh root@72.60.110.249 "cd /opt/mypay-mock && docker compose logs merchant-portal --tail=50"

# Admin Portal logs
ssh root@72.60.110.249 "cd /opt/mypay-mock && docker compose logs admin-portal --tail=50"
```

### Restart Services
```bash
# Restart all services
ssh root@72.60.110.249 "cd /opt/mypay-mock && docker compose restart"

# Restart specific service
ssh root@72.60.110.249 "cd /opt/mypay-mock && docker compose restart payout-api"
```

### Rebuild Services
```bash
# Rebuild specific service
ssh root@72.60.110.249 "cd /opt/mypay-mock && docker compose build --no-cache merchant-portal"

# Rebuild all
ssh root@72.60.110.249 "cd /opt/mypay-mock && docker compose build --no-cache"
```

---

## 📝 Next Steps

### Portal Debugging
1. ✓ Identified issue with Next.js standalone builds and pnpm symlinks
2. ✓ Added node_modules copy to Dockerfile
3. 🔄 Testing portal accessibility
4. 🔄 Configuring Nginx reverse proxy for domain routing

### Nginx Configuration (Pending)
Once portals are stable:
1. Configure Nginx for domain routing:
   - `api-darpay.vstore.cloud` → Payout API (port 4001)
   - `api-darpay.vstore.cloud` → Payment API (port 4002)
   - `merchant-darpay.vstore.cloud` → Merchant Portal (port 4010)
   - `admin-darpay.vstore.cloud` → Admin Portal (port 4011)
2. Setup SSL certificates with Certbot
3. Test HTTPS access

---

## 🔐 Environment Configuration

Current `.env` on VPS:
```
DB_PASSWORD=MyPaySecure2025
DB_NAME=mypay_mock_db
DATABASE_URL=mysql://root:MyPaySecure2025@mysql:3306/mypay_mock_db
NODE_ENV=production
JWT_SECRET=MyPayJWTSecret2025SecureKey
WEBHOOK_SECRET=MyPayWebhookSecret2025Key
API_KEY_SECRET=MyPayAPIKeySecret2025
PAYOUT_API_PORT=4001
PAYMENT_API_PORT=4002
NEXT_PUBLIC_API_URL=https://api-darpay.vstore.cloud
MERCHANT_PORTAL_URL=https://merchant-darpay.vstore.cloud
ADMIN_PORTAL_URL=https://admin-darpay.vstore.cloud
```

---

## ✅ Achievements

1. ✓ Successfully deployed both APIs to VPS
2. ✓ MySQL database running and seeded with test data
3. ✓ APIs accessible from internet (direct IP access)
4. ✓ All API endpoints tested and functional
5. ✓ Audit logging operational on both APIs
6. ✓ Standardized error responses across all endpoints
7. ✓ Health checks passing for all critical services
8. ✓ Docker containers isolated and independent

---

## 📊 System Health Summary

| Service | Status | Health Check | Notes |
|---------|--------|--------------|-------|
| Payout API | ✅ Running | ✅ Healthy | All endpoints operational |
| Payment API | ✅ Running | ✅ Healthy | All endpoints operational |
| MySQL | ✅ Running | ✅ Healthy | Database seeded |
| Merchant Portal | 🟡 Debugging | ⏳ Pending | Next.js dependencies |
| Admin Portal | 🟡 Debugging | ⏳ Pending | Next.js dependencies |

**Overall Status**: 3/5 services fully operational (60%)
**Critical Services**: 100% operational (both APIs + database)

---

## 🚀 Ready for Testing

The VPS is now ready for comprehensive API testing with Postman. Both Payout and Payment APIs are fully functional and accessible at:

- **Payout API Base**: `http://72.60.110.249:4001/api/v1`
- **Payment API Base**: `http://72.60.110.249:4002/api/v1`

Portal testing will resume once the debugging is complete.

