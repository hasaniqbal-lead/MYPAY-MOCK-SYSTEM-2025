# 📮 Postman Testing Guide

## How to Import and Use the Postman Collection

### Step 1: Import Collection

1. Open Postman
2. Click **Import** button (top left)
3. Select **File** tab
4. Choose `MyPay_Payout_API.postman_collection.json`
5. Click **Import**

### Step 2: Collection Structure

The collection is organized into folders:

```
MyPay Payout API - Complete
├── Health Check
├── Payouts/
│   ├── Create Payout - SUCCESS (account *0001)
│   ├── Create Payout - RETRY (account *0002)
│   ├── Create Payout - FAILED (account *0003)
│   ├── Create Payout - PENDING (account *0004)
│   ├── Create Payout - ON_HOLD (account *0005)
│   ├── Create Payout - IN_REVIEW (amount ≥ 100K)
│   ├── Get Payout by ID
│   ├── List Payouts
│   └── Reinitiate Failed Payout
├── Balance/
│   ├── Get Balance
│   └── Get Balance History
├── Directory/
│   └── Get Banks and Wallets Directory
└── Verification/
    ├── Verify Bank Account
    └── Verify Wallet Account
```

### Step 3: Pre-configured Variables

The collection includes:

- **Base URL:** `http://localhost:3000/api/v1`
- **API Key:** `mypay_3771a05970d71c8a95e9364756d1c6163f811343785390102d4730b8a4aa5039`
- **Dynamic Variables:**
  - `{{$guid}}` - Auto-generates UUID for idempotency keys
  - `{{$timestamp}}` - Auto-generates timestamp for unique references

### Step 4: Testing Flow

#### Quick Start Test

1. **Health Check** - Verify API is running
2. **Get Directory** - See available banks and wallets
3. **Get Balance** - Check initial balance (should be 999,000 PKR)
4. **Create Payout - SUCCESS** - Create a successful payout
5. Wait 5-10 seconds for worker to process
6. **Get Balance** - See balance deducted
7. **Get Balance History** - See ledger entries

#### Test All Scenarios

Run each "Create Payout" request to test different behaviors:

1. **SUCCESS** - Immediate success
   - Account: `1234500001`
   - Wait 5s, check status → SUCCESS

2. **RETRY** - Retry then succeed
   - Account: `9876500002`
   - Wait 7-10s, check status → SUCCESS (after retry)

3. **FAILED** - Account validation failed
   - Account: `5555500003`
   - Wait 5s, check status → FAILED
   - Balance should be released (not deducted)

4. **PENDING** - Stays pending
   - Account: `1111100004`
   - Check status → PENDING (stays pending)

5. **ON_HOLD** - Account blocked
   - Account: `9999900005`
   - Wait 5s, check status → ON_HOLD

6. **IN_REVIEW** - Large amount
   - Amount: 150,000
   - Check status → IN_REVIEW

### Step 5: Important Notes

#### Idempotency Keys
- **Automatic:** Each request uses `{{$guid}}` to auto-generate unique keys
- **Manual:** You can replace with your own UUID if needed
- **Reusing:** Using the same key returns the cached response

#### Account Numbers
- Must be **10-16 digits**
- Test scenarios based on **last 4 digits:**
  - `*0001` → SUCCESS
  - `*0002` → RETRY
  - `*0003` → FAILED
  - `*0004` → PENDING
  - `*0005` → ON_HOLD

#### Response Times
- API responds immediately
- Worker processes payouts every **5 seconds**
- Wait 5-10 seconds after creating payout before checking status

#### Payout IDs
- Copy payout ID from "Create Payout" response
- Use it in "Get Payout by ID" request
- Replace `:payoutId` variable in the URL

### Step 6: Example Workflow

```
1. POST Create Payout - SUCCESS
   ↓ (get payout ID from response)
   
2. Wait 5 seconds
   
3. GET Payout by ID
   ↓ (verify status is SUCCESS)
   
4. GET Balance
   ↓ (verify amount was deducted)
   
5. GET Balance History
   ↓ (see ledger entries)
```

### Step 7: Testing Failed Payout Reinitiation

```
1. POST Create Payout - FAILED
   ↓ (get payout ID)
   
2. Wait 5 seconds
   
3. GET Payout by ID
   ↓ (verify status is FAILED)
   
4. POST Reinitiate Failed Payout
   ↓ (use the failed payout ID)
   
5. Wait 5 seconds
   
6. GET Payout by ID
   ↓ (status will depend on account number)
```

## 🎯 Quick Test Checklist

- [ ] Health check passes
- [ ] Get directory returns 14 banks + 4 wallets
- [ ] Get balance returns current balance
- [ ] Create SUCCESS payout works
- [ ] Worker processes payout to SUCCESS
- [ ] Balance is deducted correctly
- [ ] Ledger entries are created
- [ ] Create FAILED payout works
- [ ] Failed payout doesn't deduct balance
- [ ] List payouts with pagination works
- [ ] Verify account endpoint works
- [ ] Reinitiate failed payout works

## 📊 Expected Responses

### Successful Payout Creation
```json
{
  "success": true,
  "message": "Payout created successfully",
  "data": {
    "id": "uuid",
    "status": "PENDING",
    "amount": "1000.00",
    ...
  }
}
```

### After Worker Processing (SUCCESS)
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "SUCCESS",
    "pspReference": "PSP...",
    "processedAt": "2025-11-26T...",
    ...
  }
}
```

### After Worker Processing (FAILED)
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "FAILED",
    "failureReason": "Account validation failed",
    ...
  }
}
```

## 🔧 Troubleshooting

### "Route not found" error
- Make sure API server is running
- Check base URL is correct: `http://localhost:3000/api/v1`

### "Invalid API key" error
- Verify API key in collection variables matches seed output
- Check X-API-KEY header is present

### "Invalid account number format" error
- Account number must be 10-16 digits
- No spaces or special characters

### Payout stays in PENDING
- This is expected for accounts ending in `0004`
- For others, wait 5-10 seconds for worker to process

## 📝 Notes

- All requests require `X-API-KEY` header (pre-configured)
- POST/PUT/PATCH require `X-IDEMPOTENCY-KEY` header (auto-generated)
- Worker processes payouts every 5 seconds
- Account numbers determine test scenario outcomes
- Balance starts at 1,000,000 PKR

Enjoy testing! 🚀

