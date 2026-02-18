# MyPay Transaction Engine - Postman Collection

## Quick Start

### 1. Import Files into Postman
1. Open Postman
2. Click **Import** button
3. Import both files:
   - `MyPay_Transaction_Engine_API.postman_collection.json`
   - `MyPay_Environment.postman_environment.json`

### 2. Select Environment
- Click the environment dropdown (top-right)
- Select **"MyPay Transaction Engine"**

### 3. Authenticate
Run one of these requests first (tokens auto-save):
- **Merchant Login** → saves `{{merchant_token}}`
- **Admin Login** → saves `{{admin_token}}`

### 4. Start Testing
All other requests will use the saved tokens automatically.

---

## Pre-Configured Credentials

### Merchant Portal
| Email | Password |
|-------|----------|
| `test@mycodigital.io` | `test123456` |
| `hasaniqbal@mycodigital.io` | `hasan123456` |

### Admin Portal
| Email | Password |
|-------|----------|
| `admin@mycodigital.io` | `admin@@1234` |

### API Keys (for Checkout APIs)
| Key | Value |
|-----|-------|
| `api_key` | `test-api-key-123` |
| `api_key_hasan` | `hasan-api-key-789` |

---

## Environment Variables

| Variable | Description | Auto-Set |
|----------|-------------|----------|
| `base_url` | Payment API base URL | No |
| `payout_url` | Payout API base URL | No |
| `api_key` | API key for checkouts | No |
| `merchant_token` | JWT token for merchant | Yes (after login) |
| `admin_token` | JWT token for admin | Yes (after login) |
| `merchant_id` | Logged-in merchant ID | Yes (after login) |
| `checkout_id` | Last viewed checkout | Yes (after list) |
| `new_checkout_id` | Newly created checkout | Yes (after create) |

---

## Collection Structure

```
📁 MyPay Transaction Engine API
├── 🔐 Authentication
│   ├── Merchant Login ⭐ (run first)
│   ├── Admin Login ⭐ (run first)
│   ├── Merchant Register
│   └── Merchant Logout
│
├── 📊 Merchant Portal
│   ├── 📈 Dashboard
│   │   └── Get Dashboard Stats
│   ├── 💳 Transactions
│   │   ├── List Transactions
│   │   ├── List (Completed Only)
│   │   ├── List (Failed Only)
│   │   ├── List (Date Range)
│   │   ├── Get Single Transaction
│   │   ├── Export (CSV)
│   │   └── Export (JSON)
│   ├── 💸 Payouts
│   │   ├── List Payouts
│   │   ├── Get Single Payout
│   │   ├── Export (CSV)
│   │   └── Export (JSON)
│   └── 👤 Profile & Credentials
│       ├── Get Profile
│       ├── Update Profile
│       ├── Get API Credentials
│       └── Generate New API Key
│
├── 👑 Admin Portal
│   ├── 🏢 Merchants
│   │   ├── List All Merchants
│   │   ├── Get Merchant by ID
│   │   ├── Create New Merchant
│   │   ├── Update Merchant
│   │   ├── Toggle Status
│   │   ├── Reset Password
│   │   └── Update Email
│   ├── 💳 Transactions (System-Wide)
│   │   ├── Get All Transactions
│   │   ├── Get by Merchant
│   │   └── Get by Status
│   └── 💸 Payouts (System-Wide)
│       ├── Get All Payouts
│       └── Get by Merchant
│
├── 💳 Public APIs (Checkout)
│   ├── Health Check
│   ├── Create Checkout Session
│   ├── Create Checkout (JazzCash)
│   ├── Create Checkout (Card)
│   ├── Get Checkout Details
│   └── Get Transaction by Reference
│
└── 🧪 Test Scenarios
    ├── Success Payment (03030000000)
    ├── Failed Payment (03021111111)
    └── Timeout Payment (03032222222)
```

---

## Test Mobile Numbers

| Mobile Number | Result |
|---------------|--------|
| `03030000000` | SUCCESS |
| `03021111111` | FAILED |
| `03032222222` | TIMEOUT |

## Test Card Numbers

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | SUCCESS |
| `4000 0000 0000 0002` | DECLINED |

---

## API Base URLs

| Service | URL |
|---------|-----|
| Payment API | `https://test.mypay.mx/api/v1` |
| Payout API | `https://sandbox.mypay.mx/api/v1` |
| Merchant Portal | `https://devportal.mypay.mx` |
| Admin Portal | `https://devadmin.mypay.mx` |
| Payment Page | `https://demo.mypay.mx` |

---

## Tips

### Auto-Token Refresh
Login requests have test scripts that automatically save tokens to environment variables.

### Dynamic Variables
Use `{{$timestamp}}` in reference fields to generate unique order IDs.

### Filtering
Most list endpoints support these query params:
- `page` - Page number
- `limit` - Items per page
- `status` - Filter by status
- `merchantId` - Filter by merchant (admin only)

### Disabled Params
Some requests have pre-configured but disabled query parameters. Enable them as needed.

---

## Troubleshooting

### "Unauthorized" Error
1. Run the login request first
2. Check that token was saved (look in Environment variables)
3. Verify the Authorization header uses `Bearer {{merchant_token}}` or `Bearer {{admin_token}}`

### "Invalid API Key" Error
1. Check that `X-Api-Key` header is set
2. Verify `{{api_key}}` environment variable has correct value

### Empty Response
1. Check the base URL is correct
2. Verify the API service is running: `GET {{base_url}}/health`
