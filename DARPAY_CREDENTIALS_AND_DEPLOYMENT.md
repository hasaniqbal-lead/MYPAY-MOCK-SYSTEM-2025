# DarPay System - Test Credentials & Deployment Summary
**Generated**: February 18, 2026  
**Status**: Ready for Production Deployment

---

## 🔐 TEST CREDENTIALS

### Merchant Portal Login
- **URL**: https://merchant-darpay.vstore.cloud
- **Email**: `test@darpay.com`
- **Password**: `test123456`

### Admin Portal Login  
- **URL**: https://admin-darpay.vstore.cloud
- **Email**: `admin@darpay.com`
- **Password**: `admin@@1234`

### Payment API
- **Endpoint**: https://api-darpay.vstore.cloud
- **API Key**: `test-api-key-123`
- **API Secret**: `test-api-secret-456`
- **Vendor ID**: `DARPAY_TEST_001`

### Payout API
- **Endpoint**: https://payout-darpay.vstore.cloud
- **API Key**: (Generated during seeding - check logs)
- **Header**: `X-API-KEY`

---

## 🧪 TEST SCENARIOS

### Payment API - Mobile Numbers
| Mobile Number | Scenario | Expected Result |
|---------------|----------|-----------------|
| 03030000000 | Success | COMPLETED |
| 03021111111 | Failed | FAILED |
| 03032222222 | Timeout | TIMEOUT |
| 03033333333 | Rejected | REJECTED |
| 03034444444 | Invalid OTP | INVALID_OTP |
| 03035555555 | Insufficient Funds | INSUFFICIENT_FUNDS |
| 03036666666 | Deactivated | ACCOUNT_DEACTIVATED |
| 03037777777 | No Response | NO_RESPONSE |
| 03038888888 | Invalid MPIN | INVALID_MPIN |
| 03039999999 | Not Approved | NOT_APPROVED |

### Payment API - Card Numbers
| Card Number | Expected Result |
|-------------|-----------------|
| 4242 4242 4242 4242 | SUCCESS |
| 4000 0000 0000 0002 | DECLINED |

### Payout API - Account Numbers
| Account Number (last 4 digits) | Expected Result |
|---------------------------------|-----------------|
| xxx0001 | SUCCESS |
| xxx0002 | RETRY → SUCCESS |
| xxx0003 | FAILED |
| xxx0004 | PENDING |
| xxx0005 | ON_HOLD |
| Amount ≥ 100,000 PKR | IN_REVIEW |

---

## ✅ BRANDING CLEANUP STATUS

### Completed Changes

#### 1. **API Source Code** ✅
- Replaced all `MyPay` → `DarPay`
- Replaced all `mypay` → `darpay`
- Replaced all `mycodigital.io` → `darpay.com`
- Updated API key prefix: `mypay_` → `darpay_`
- Updated service names in health endpoints
- Updated webhook headers: `X-MyPay-*` → `X-DarPay-*`

#### 2. **Checkout URL Fix** ✅
- **OLD**: `http://localhost:4020/{checkoutId}`
- **NEW**: `https://payment-darpay.vstore.cloud/{checkoutId}`
- Fallback now points to production domain

#### 3. **Database Schema** ✅
- Updated schema comment header
- Clean seed data with DarPay branding
- Test merchant: `DarPay Test Merchant`
- Emails: `test@darpay.com`, `admin@darpay.com`

#### 4. **Docker Configuration** ✅
- `PAYMENT_PAGE_URL` → `https://payment-darpay.vstore.cloud`
- `NEXT_PUBLIC_API_URL` → `https://api-darpay.vstore.cloud`
- All environment variables updated

---

## 📦 DEPLOYMENT STRATEGY

### Phase 1: APIs (Current)
✅ payment-api source cleaned  
✅ payout-api source cleaned  
✅ Seed files updated  
✅ Docker images building  
⏳ Deploy to VPS  
⏳ Reseed database  

### Phase 2: Payment Page (Next)
- [ ] Update UI to match DarPay theme from `daypay-seamless-payments-main`
- [ ] Replace logo
- [ ] Update branding colors
- [ ] Test checkout flow

### Phase 3: Portals (Final)
- [ ] Merchant Portal: Replace all MyPay → DarPay
- [ ] Admin Portal: Replace all MyPay → DarPay
- [ ] Update Tailwind configs
- [ ] Replace CSS class names (`mypay-*` → `darpay-*`)

---

## 🛡️ VPS SECURITY & CLEANUP

### Current VPS Structure
```
/opt/darpay/
├── docker-compose.yml
├── darpay-images.tar (temporary)
├── source code/ ❌ TO BE REMOVED
└── build artifacts/ ❌ TO BE REMOVED
```

### Target VPS Structure (Secure)
```
/opt/darpay/
├── docker-compose.yml  ✅
└── [NOTHING ELSE]
```

### Cleanup Actions Required
1. ✅ Build all images **locally** (Windows machine)
2. ✅ Transfer only `.tar` image archives to VPS
3. ✅ Load images into Docker on VPS
4. ✅ Start containers from loaded images
5. ❌ **Remove all source code from VPS**
6. ❌ **Remove all temporary tar files after loading**
7. ❌ **Remove node_modules, build artifacts**

### What Should Remain on VPS
- ✅ Running Docker containers
- ✅ Docker images in local registry
- ✅ docker-compose.yml (configuration only)
- ✅ MySQL data volume
- ✅ Nginx proxy configuration

### What Must Be Removed from VPS
- ❌ All TypeScript/JavaScript source code
- ❌ node_modules directories
- ❌ .git repositories
- ❌ Build artifacts (dist/, .next/)
- ❌ .tar image archives (after loading)
- ❌ Any .env files with secrets

---

## 🚀 DEPLOYMENT COMMANDS

### Build Locally (Windows)
```bash
docker build --no-cache -t darpay-payment-api:latest -f services/payment-api/Dockerfile .
docker build --no-cache -t darpay-payout-api:latest -f services/payout-api/Dockerfile .
docker build --no-cache -t darpay-payment-page:latest -f services/payment-page/Dockerfile .
docker build --no-cache -t darpay-merchant-portal:latest -f services/merchant-portal/Dockerfile .
docker build --no-cache -t darpay-admin-portal:latest -f services/admin-portal/Dockerfile .
docker build --no-cache -t darpay-mysql:latest -f docker/mysql/Dockerfile .

# Save to tar
docker save darpay-payment-api darpay-payout-api darpay-payment-page darpay-merchant-portal darpay-admin-portal darpay-mysql:latest -o darpay-all.tar
```

### Deploy to VPS
```bash
# Transfer tar (one-time, large upload)
scp darpay-all.tar root@145.79.10.159:/opt/darpay/

# SSH to VPS
ssh root@145.79.10.159

# Load images
cd /opt/darpay
docker load -i darpay-all.tar

# Start services
docker compose up -d

# CLEANUP - Remove source code
rm -f darpay-all.tar
rm -rf services/
rm -rf node_modules/
rm -rf prisma/

# Verify only essentials remain
ls -la /opt/darpay
# Should show: docker-compose.yml only

# Check running containers
docker ps
```

### Reseed Database
```bash
# From VPS
docker exec -it darpay-payment-api pnpm exec prisma migrate reset --force
docker exec -it darpay-payment-api pnpm exec prisma db seed
```

---

## 📝 NOTES

1. **No Source Code on VPS**: All builds happen locally on Windows dev machine
2. **Secure Transfer**: Only pre-built Docker images are transferred
3. **Clean Database**: Seeding creates clean DarPay-branded test data
4. **Zero Old Branding**: No myco/mypay references anywhere in production
5. **API Keys**: Payment/Payout keys are displayed during seeding

---

## ✨ NEXT STEPS

1. ✅ Complete API deployment
2. ⏳ Update payment-page with DarPay UI theme
3. ⏳ Update merchant-portal branding
4. ⏳ Update admin-portal branding  
5. ⏳ Final VPS cleanup
6. ⏳ End-to-end testing

