# MyPay Mock System - Postman Collections Guide

**Last Updated**: December 13, 2025

## 📦 Available Collections

### 1. Payment API Collection (Complete)
**File**: `MyPay_Payment_API_Complete.postman_collection.json`

This collection includes:
- ✅ Public APIs (Health Check, Test Scenarios)
- ✅ Checkout & Payment APIs
- ✅ Merchant Portal APIs (Login, Profile, Credentials, Transactions, Dashboard)
- ✅ Admin Portal APIs (Login, Merchant Management, Transactions, Payouts, Credential Reset)

### 2. Payout API Collection
**File**: `MyPay_Payout_API.postman_collection.json`

This collection includes:
- ✅ Health Check
- ✅ Create Payout (All test scenarios)
- ✅ Get Payout Details
- ✅ List Payouts
- ✅ Reinitiate Failed Payout
- ✅ Get Balance
- ✅ Webhooks

---

## 🚀 Quick Start

### Step 1: Import Collections
1. Open Postman
2. Click **Import** button
3. Import both JSON files:
   - `MyPay_Payment_API_Complete.postman_collection.json`
   - `MyPay_Payout_API.postman_collection.json`

### Step 2: Choose Environment
Both collections have built-in variables. By default, they use **Production URLs**:

**Production URLs:**
- Payment API: `https://mock.mycodigital.io/api/v1`
- Payout API: `https://sandbox.mycodigital.io/api/v1`

**For Local Testing:**
- Change `{{base_url}}` to `{{base_url_local}}` in requests
- Payment API Local: `http://localhost:4002/api/v1`
- Payout API Local: `http://localhost:4001/api/v1`

### Step 3: Test It!
1. Start with **Health Check** to confirm API is running
2. For Merchant APIs: Run **Merchant Login** first (saves JWT token automatically)
3. For Admin APIs: Run **Admin Login** first (saves admin JWT token automatically)
4. All authenticated requests will use saved tokens automatically

---

## 🔑 Test Credentials

### Merchant Credentials

#### Merchant 1 (Hasan)
- **Email**: `hasaniqbal@mycodigital.io`
- **Password**: `hasan123456`
- **Merchant ID**: `MERCHANT_0012`
- **Payment API Key**: `hasan-api-key-789`
- **Payout API Key**: ⚠️ **Get from Merchant Portal Credentials page**

#### Merchant 2 (Test)
- **Email**: `test@mycodigital.io`
- **Password**: `test123456`
- **Merchant ID**: `MERCHANT_0011`
- **Payment API Key**: `test-merchant-api-key-12345`
- **Payout API Key**: ⚠️ **Get from Merchant Portal Credentials page**

### Admin Credentials
- **Email**: `admin@mycodigital.io`
- **Password**: `admin@@1234`

---

## 📝 Important Notes

### About API Keys

#### Payment API Keys
- **Fixed keys** defined in seed file
- Used with header: `X-Api-Key: {key}`
- Examples:
  - `test-merchant-api-key-12345`
  - `hasan-api-key-789`

#### Payout API Keys
- **Generated randomly** on each database seed
- **Must retrieve from Merchant Portal** after login:
  1. Login to merchant portal: `https://devportal.mycodigital.io`
  2. Go to **Credentials** tab
  3. Copy the **Payout API Key** (starts with `mypay_`)
  4. Update in Postman collection variable `api_key`
- Used with header: `X-API-KEY: {key}`
- Format: `mypay_[64-character-hex-string]`

### Authentication Flow

#### Merchant Portal Authentication
1. Run **Merchant Login** request
2. JWT token is automatically saved to `{{merchant_jwt_token}}`
3. All subsequent merchant requests use: `Authorization: Bearer {{merchant_jwt_token}}`

#### Admin Portal Authentication
1. Run **Admin Login** request
2. JWT token is automatically saved to `{{admin_jwt_token}}`
3. All subsequent admin requests use: `Authorization: Bearer {{admin_jwt_token}}`

---

## 🧪 Test Scenarios

### Payment Test Scenarios

#### Success Scenarios (Wallet - JazzCash/Easypaisa)
- **Mobile**: `03030000000` → SUCCESS
- **PIN**: Any 4-digit number

#### Failed Scenarios (Wallet)
- `03021111111` → FAILED
- `03032222222` → TIMEOUT
- `03033333333` → REJECTED

#### Card Test Numbers
- `4242 4242 4242 4242` → SUCCESS
- `4000 0000 0000 0002` → DECLINED
- `4000 0000 0000 9995` → INSUFFICIENT_FUNDS

### Payout Test Scenarios

#### Account Numbers
- `123450001` → SUCCESS
- `987650002` → RETRY then SUCCESS (after worker processes)
- `555550003` → FAILED
- `111110004` → PENDING (indefinitely)
- `999990005` → ON_HOLD

#### Amount-Based Scenarios
- Amount ≥ `100,000` PKR → IN_REVIEW status

---

## 🔄 Automated Features

### Auto-Saved Variables
The collections automatically save these variables:
- `{{merchant_jwt_token}}` - After merchant login
- `{{admin_jwt_token}}` - After admin login
- `{{checkout_id}}` - After creating a checkout

### Pre-Request Scripts
Some requests include pre-request scripts:
- Auto-generate timestamps for unique references
- Auto-generate GUIDs for idempotency keys

---

## 📋 Collection Structure

### Payment API Collection

```
1. Public APIs
   ├─ Health Check
   └─ Get Test Scenarios

2. Checkout & Payment APIs
   ├─ Create Checkout - JazzCash Success
   ├─ Create Checkout - Easypaisa Success
   ├─ Create Checkout - Card Payment
   ├─ Get Checkout Details
   └─ Get Transaction Status

3. Merchant Portal APIs
   ├─ Merchant Login ⚡ (Saves JWT)
   ├─ Get Merchant Profile 🔒
   ├─ Get Merchant Credentials 🔒
   ├─ Get Merchant Transactions 🔒
   ├─ Get Dashboard Stats 🔒
   └─ Update Merchant Profile 🔒

4. Admin Portal APIs
   ├─ Admin Login ⚡ (Saves JWT)
   ├─ Get All Merchants 🔒
   ├─ Get Merchant By ID 🔒
   ├─ Create Merchant 🔒
   ├─ Update Merchant 🔒
   ├─ Toggle Merchant Status 🔒
   ├─ Reset Merchant Password 🔒
   ├─ Update Merchant Email 🔒
   ├─ Get All Transactions (Admin) 🔒
   └─ Get All Payouts (Admin) 🔒
```

🔒 = Requires authentication (JWT token)
⚡ = Saves JWT token automatically

### Payout API Collection

```
├─ Health Check
├─ Payouts
│  ├─ Create Payout - SUCCESS
│  ├─ Create Payout - RETRY
│  ├─ Create Payout - FAILED
│  ├─ Create Payout - PENDING
│  ├─ Create Payout - ON_HOLD
│  ├─ Create Payout - IN_REVIEW
│  ├─ Get Payout Details
│  ├─ List Payouts
│  └─ Reinitiate Failed Payout
├─ Balance
│  └─ Get Balance
└─ Webhooks
   └─ Process Pending Webhooks
```

---

## 🛠️ Troubleshooting

### Issue: "Invalid API Key" for Payout API

**Cause**: Payout API keys are regenerated on each database seed.

**Solution**:
1. Login to merchant portal: `https://devportal.mycodigital.io`
2. Navigate to **Credentials** tab
3. Copy the **Payout API Key** (looks like `mypay_abc123...`)
4. In Postman, update the collection variable:
   - Click on collection name
   - Go to **Variables** tab
   - Update `api_key` value
   - Save

### Issue: "Unauthorized" for Merchant/Admin APIs

**Cause**: JWT token expired or not set.

**Solution**:
1. Run the **Merchant Login** or **Admin Login** request again
2. Token will be automatically saved
3. Retry your request

### Issue: Checkout URL points to localhost

**Cause**: `CHECKOUT_BASE_URL` environment variable not set correctly in Docker.

**Solution**: This should be already fixed in production. Checkout URLs should be:
- `https://mock.mycodigital.io/payment/{checkoutId}`

### Issue: Payout stuck in PENDING

**Cause**: Payout worker may not be running.

**Solution**: Payout worker processes payouts every 30 seconds. Wait up to 1 minute for status to update based on test scenario (mobile number).

---

## 📊 Admin Features

The **Payment API Complete Collection** now includes comprehensive admin management features:

### Merchant Management
- View all merchants with statistics
- Create new merchants (auto-generates password and API keys)
- Edit merchant details
- Toggle merchant active/inactive status
- Reset merchant passwords
- Update merchant email addresses

### Transaction & Payout Analytics
- View all transactions across all merchants
- Filter transactions by merchant ID or status
- View all payouts across all merchants
- Filter payouts by merchant ID or status

### Security Features
- JWT-based authentication
- Admin role verification
- 7-day token expiration

---

## 🎯 Testing Workflow

### For Developers Testing Payment Flow
1. **Health Check** → Confirm API is running
2. **Get Test Scenarios** → See all test mobile numbers and expected results
3. **Create Checkout - JazzCash Success** → Create a checkout session
4. Open the `checkoutUrl` in a browser → Complete the payment
5. **Get Transaction Status** → Verify the transaction status

### For Merchants Testing Their Integration
1. **Merchant Login** → Get JWT token
2. **Get Merchant Credentials** → Retrieve API keys
3. **Create Checkout** → Test creating checkouts with their API key
4. **Get Merchant Transactions** → View their transaction history
5. **Get Dashboard Stats** → See their statistics

### For Admins Testing Management Features
1. **Admin Login** → Get admin JWT token
2. **Get All Merchants** → View all registered merchants
3. **Create Merchant** → Add a new merchant
4. **Get All Transactions** → View all transactions (with filters)
5. **Get All Payouts** → View all payouts (with filters)
6. **Reset Merchant Password** → Test credential management

---

## 🌐 Portal URLs

### Merchant Portal
- **Production**: `https://devportal.mycodigital.io`
- **Local**: `http://localhost:3001`

### Admin Portal
- **Production**: `https://devadmin.mycodigital.io`
- **Local**: `http://localhost:3002`

---

## 📞 Support

For issues or questions:
- Check this guide first
- Review test credentials and scenarios
- Verify JWT tokens are being saved correctly
- Ensure you're using the correct API keys (especially for Payout API)

---

## ✅ Ready to Go!

Both Postman collections are:
- ✅ Up to date with all latest features
- ✅ Pre-configured with production URLs
- ✅ Include all test credentials
- ✅ Have automatic token management
- ✅ Include all admin management features
- ✅ Include comprehensive test scenarios

**Just import and start testing!** 🚀

