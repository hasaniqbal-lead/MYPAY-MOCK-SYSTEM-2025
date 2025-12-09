# Portal API Implementation - Setup Guide

## ✅ What's Been Implemented

All portal API endpoints have been added to the Payment API:

### Authentication Endpoints
- ✅ `POST /api/portal/auth/register` - Merchant registration
- ✅ `POST /api/portal/auth/login` - Merchant login
- ✅ `POST /api/portal/auth/logout` - Logout

### Merchant Profile Endpoints
- ✅ `GET /api/portal/merchant/profile` - Get merchant profile
- ✅ `PUT /api/portal/merchant/profile` - Update profile/password

### Credentials Endpoints
- ✅ `GET /api/portal/merchant/credentials` - Get API credentials
- ✅ `POST /api/portal/merchant/credentials` - Generate new API key

### Transactions Endpoints
- ✅ `GET /api/portal/transactions` - List transactions (with filters)
- ✅ `GET /api/portal/transactions/:id` - Get transaction details
- ✅ `GET /api/portal/transactions/export/:format` - Export transactions (CSV/JSON)

### Dashboard Endpoints
- ✅ `GET /api/portal/dashboard/stats` - Get dashboard statistics

## 📦 New Dependencies

Added to `package.json`:
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing

## 🗄️ Database Setup

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Run Migration

Option A: Run migration script
```bash
node database/migrations/run-migration.js
```

Option B: Manual SQL
```bash
mysql -u root -p dummy_payment_db < database/migrations/001_add_merchants_simple.sql
```

Then manually add columns if needed:
```sql
ALTER TABLE api_keys ADD COLUMN merchant_id INT;
ALTER TABLE api_keys ADD FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE;

ALTER TABLE transactions ADD COLUMN merchant_id INT;
ALTER TABLE transactions ADD INDEX idx_merchant_id (merchant_id);
ALTER TABLE transactions ADD FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE SET NULL;
```

### Step 3: Create Default Merchant

```bash
node scripts/create-default-merchant.js
```

Default credentials:
- Email: `admin@test.com`
- Password: `admin123`

**⚠️ Change this password in production!**

## 🔐 Environment Variables

Add to your `.env` file:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## 🧪 Testing the API

### Register a Merchant
```bash
curl -X POST https://sandbox.mycodigital.io/api/portal/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Test Merchant",
    "email": "merchant@test.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST https://sandbox.mycodigital.io/api/portal/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "merchant@test.com",
    "password": "password123"
  }'
```

### Get Dashboard Stats (with token)
```bash
curl -X GET https://sandbox.mycodigital.io/api/portal/dashboard/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📊 Data Flow

1. **Merchant Registration** → Creates merchant + API key
2. **Create Checkout** → Links transaction to merchant via API key
3. **Portal Views** → Shows only merchant's transactions

## 🔄 Linking Existing Transactions

Existing transactions won't have merchant_id. To link them:

```sql
-- Link existing transactions to default merchant
UPDATE transactions t
JOIN api_keys ak ON t.vendor_id = ak.vendor_id
SET t.merchant_id = ak.merchant_id
WHERE t.merchant_id IS NULL;
```

## 🚀 Deployment

1. Install dependencies: `npm install`
2. Run migration on VPS
3. Add `JWT_SECRET` to `.env`
4. Restart API: `docker compose restart app`

## 📝 Notes

- All portal endpoints require authentication except register/login
- JWT tokens expire in 7 days
- Passwords are hashed with bcrypt (10 rounds)
- Transactions are automatically linked to merchants via API keys
- Merchant can have multiple API keys (old ones are deactivated when new one is generated)

