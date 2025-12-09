# ✅ Portal API Implementation Complete

## What's Been Done

### 1. ✅ Dependencies Added
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing

### 2. ✅ Database Schema
- `merchants` table created
- `merchant_id` added to `api_keys` table
- `merchant_id` added to `transactions` table
- Foreign keys and indexes added

### 3. ✅ Authentication System
- JWT token generation
- Password hashing with bcrypt
- Auth middleware for protected routes

### 4. ✅ Portal API Endpoints
All endpoints implemented and added to `server.js`:

#### Authentication
- `POST /api/portal/auth/register`
- `POST /api/portal/auth/login`
- `POST /api/portal/auth/logout`

#### Merchant Profile
- `GET /api/portal/merchant/profile`
- `PUT /api/portal/merchant/profile`

#### Credentials
- `GET /api/portal/merchant/credentials`
- `POST /api/portal/merchant/credentials`

#### Transactions
- `GET /api/portal/transactions`
- `GET /api/portal/transactions/:id`
- `GET /api/portal/transactions/export/:format`

#### Dashboard
- `GET /api/portal/dashboard/stats`

### 5. ✅ Transaction Linking
- Checkout creation now links transactions to merchants
- Transactions filtered by merchant in portal

## 🚀 Next Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Add JWT Secret to .env
```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 3. Run Database Migration

**On Local:**
```bash
npm run migrate
```

**On VPS:**
```bash
ssh root@45.80.181.139
cd /opt/dummy-payment-api
npm run migrate
```

### 4. Create Default Merchant
```bash
npm run create-merchant
```

Default credentials:
- Email: `admin@test.com`
- Password: `admin123`

### 5. Link Existing Transactions (Optional)
```sql
UPDATE transactions t
JOIN api_keys ak ON t.vendor_id = ak.vendor_id
SET t.merchant_id = ak.merchant_id
WHERE t.merchant_id IS NULL;
```

### 6. Restart API
```bash
# Local
npm run dev

# VPS
cd /opt/dummy-payment-api
docker compose restart app
```

## 🧪 Test the API

### Register
```bash
curl -X POST http://localhost:3000/api/portal/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Test Merchant",
    "email": "test@merchant.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/portal/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@merchant.com",
    "password": "password123"
  }'
```

### Get Dashboard Stats (use token from login)
```bash
curl -X GET http://localhost:3000/api/portal/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📊 Data Flow

1. **Merchant registers** → Gets API key automatically
2. **Merchant uses API key** → Creates checkout → Transaction linked to merchant
3. **Merchant logs into portal** → Sees only their transactions
4. **Merchant can export** → Get CSV/JSON of their transactions

## 🔗 Integration with Portal

The portal at `devportal.mycodigital.io` will now:
- ✅ Show merchant's transactions
- ✅ Display dashboard statistics
- ✅ Allow credential management
- ✅ Export transaction data
- ✅ Update profile and settings

## ⚠️ Important Notes

1. **JWT Secret**: Change `JWT_SECRET` in production!
2. **Default Password**: Change default merchant password!
3. **Existing Transactions**: Run SQL to link existing transactions to merchants
4. **API Keys**: New merchants automatically get API keys on registration

## 📁 Files Created/Modified

### New Files:
- `middleware/auth.js` - Authentication middleware
- `controllers/portalAuthController.js` - Auth endpoints
- `controllers/portalMerchantController.js` - Merchant management
- `controllers/portalTransactionsController.js` - Transaction listing
- `controllers/portalDashboardController.js` - Dashboard stats
- `database/migrations/001_add_merchants_simple.sql` - Database migration
- `database/migrations/run-migration.js` - Migration runner
- `scripts/create-default-merchant.js` - Default merchant creator

### Modified Files:
- `server.js` - Added portal routes
- `package.json` - Added dependencies and scripts
- `controllers/checkoutController.js` - Links transactions to merchants

## ✅ Ready to Deploy!

All portal API endpoints are implemented and ready. The portal will now have complete data reflection from the database!

