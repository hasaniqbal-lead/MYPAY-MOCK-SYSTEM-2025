# 🚀 VPS Deployment Plan - Payment API Updates

## Overview

This deployment includes:
1. ✅ Revamped payment page with MyPay theme
2. ✅ Card payment method support
3. ✅ Enhanced test scenarios endpoint
4. ✅ All three payment methods (Easypaisa, JazzCash, Card)

## Pre-Deployment Checklist

- [ ] All local tests pass
- [ ] Payment pages verified in browser
- [ ] Test scenarios endpoint tested
- [ ] Card payments tested (success & decline)
- [ ] Wallet payments tested (Easypaisa & JazzCash)

## Deployment Steps

### Step 1: Backup Current Deployment

```bash
# SSH to VPS
ssh -i ~/.ssh/id_ed25519 root@45.80.181.139

# Backup current API
cd /opt/dummy-payment-api
docker compose down
cp -r . ../dummy-payment-api-backup-$(date +%Y%m%d-%H%M%S)
```

### Step 2: Upload Updated Files

```bash
# From local machine
cd "C:\Users\hasan\OneDrive\Desktop\myco payments\dummy-payment-api"

# Upload updated payment controller
scp -i "C:\Users\hasan\.ssh\id_ed25519" controllers/paymentController.js root@45.80.181.139:/opt/dummy-payment-api/controllers/

# Verify file uploaded
ssh -i "C:\Users\hasan\.ssh\id_ed25519" root@45.80.181.139 "ls -lh /opt/dummy-payment-api/controllers/paymentController.js"
```

### Step 3: Rebuild and Restart Container

```bash
# SSH to VPS
ssh -i ~/.ssh/id_ed25519 root@45.80.181.139

cd /opt/dummy-payment-api

# Rebuild container
docker compose down
docker compose build --no-cache
docker compose up -d

# Check logs
docker compose logs -f --tail 50
```

### Step 4: Verify Deployment

```bash
# Test health endpoint
curl https://sandbox.mycodigital.io/health

# Test test-scenarios endpoint
curl https://sandbox.mycodigital.io/test-scenarios | jq

# Test checkout creation
curl -X POST https://sandbox.mycodigital.io/checkouts \
  -H "X-Api-Key: test-api-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "TEST-CARD-VPS-001",
    "amount": 1000.00,
    "paymentMethod": "card",
    "paymentType": "onetime",
    "successUrl": "https://merchant.com/webhook",
    "returnUrl": "https://merchant.com/return"
  }'
```

### Step 5: Test Payment Pages

1. **Easypaisa Payment Page**
   - Create checkout with `paymentMethod: "easypaisa"`
   - Visit checkout URL
   - Verify: Green theme, mobile + PIN form

2. **JazzCash Payment Page**
   - Create checkout with `paymentMethod: "jazzcash"`
   - Visit checkout URL
   - Verify: Green theme, mobile + PIN form

3. **Card Payment Page**
   - Create checkout with `paymentMethod: "card"`
   - Visit checkout URL
   - Verify: Green theme, card form (number, expiry, CVV, name)

### Step 6: Test Payment Completion

1. **Card Success**
   - Use card: `4242 4242 4242 4242`
   - Expiry: `12/25`
   - CVV: `123`
   - Name: `Test User`
   - Expected: Success response

2. **Card Decline**
   - Use card: `4000 0000 0000 0002`
   - Expected: Decline response

3. **Wallet Success**
   - Mobile: `03030000000`
   - PIN: `1234`
   - Expected: Success response

## Rollback Plan

If deployment fails:

```bash
# SSH to VPS
ssh -i ~/.ssh/id_ed25519 root@45.80.181.139

cd /opt/dummy-payment-api

# Stop current container
docker compose down

# Restore backup (replace with actual backup name)
cd /opt
rm -rf dummy-payment-api
mv dummy-payment-api-backup-YYYYMMDD-HHMMSS dummy-payment-api
cd dummy-payment-api

# Restart
docker compose up -d
```

## Post-Deployment Verification

### API Endpoints
- [ ] `/health` - Returns OK
- [ ] `/test-scenarios` - Returns all scenarios
- [ ] `/checkouts` - Creates checkout for all methods
- [ ] `/payment/:sessionId` - Renders payment page
- [ ] `/payment/:sessionId/complete` - Processes payments

### Payment Pages
- [ ] Easypaisa page loads with theme
- [ ] JazzCash page loads with theme
- [ ] Card page loads with theme
- [ ] All forms are functional
- [ ] Test info displays correctly

### Payment Processing
- [ ] Card success scenario works
- [ ] Card decline scenario works
- [ ] Wallet success scenario works
- [ ] Wallet failure scenario works
- [ ] Webhooks are sent

## Environment Variables

Ensure these are set in VPS `.env`:

```env
DB_HOST=db
DB_USER=root
DB_PASSWORD=strong-db-pass
DB_NAME=dummy_payment_db
CHECKOUT_BASE_URL=https://sandbox.mycodigital.io
PORT=3000
```

## Monitoring

After deployment, monitor:
1. Container logs: `docker compose logs -f`
2. API response times
3. Error rates
4. Payment success rates

## Expected Timeline

- **File Upload**: 2-3 minutes
- **Container Rebuild**: 5-10 minutes
- **Testing**: 10-15 minutes
- **Total**: ~20-30 minutes

## Notes

- ✅ No database migrations required
- ✅ No breaking changes to existing endpoints
- ✅ Backward compatible with existing checkouts
- ✅ Card payments use same transaction table

## Deployment Approval

**Ready for deployment?** 

Please confirm:
1. ✅ Local tests passed
2. ✅ Payment pages verified
3. ✅ Ready for VPS deployment

Once approved, we'll proceed with the deployment steps above.

