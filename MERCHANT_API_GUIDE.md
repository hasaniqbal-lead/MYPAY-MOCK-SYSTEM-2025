# MyPay Payout API - Merchant Integration Guide

## Production API Details

**Base URL:**
```
https://sandbox.mycodigital.io/api/v1
```

**Features:**
- ✅ HTTPS with SSL/TLS encryption
- ✅ Auto HTTP to HTTPS redirect
- ✅ Professional domain
- ✅ Let's Encrypt SSL certificate (auto-renews)

---

## Authentication

All API requests require authentication using an API key.

### Required Headers:
```
X-API-KEY: your_api_key_here
Content-Type: application/json
X-Idempotency-Key: unique-uuid-per-request (for POST requests only)
```

### Sandbox Test Credentials:
```
API Key: mypay_342699b6453691099d2a94c84957fec8189edb386dee26c5def0d4cefd0faee6
Merchant ID: db494a83-ac5e-4d8c-bb64-7edad0717dad
Initial Balance: 1,000,000 PKR
```

---

## API Endpoints

### 1. Get Merchant Balance
**GET** `/balance`

**cURL Example:**
```bash
curl -H "X-API-KEY: your_api_key" \
  https://sandbox.mycodigital.io/api/v1/balance
```

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": "999000",
    "lockedBalance": "0",
    "availableBalance": "999000.00"
  }
}
```

---

### 2. Get Banks & Wallets Directory
**GET** `/directory`

Returns list of supported banks and wallets.

**cURL Example:**
```bash
curl -H "X-API-KEY: your_api_key" \
  https://sandbox.mycodigital.io/api/v1/directory
```

**Response:**
```json
{
  "success": true,
  "data": {
    "banks": [
      {"code": "HBL", "name": "Habib Bank Limited", "isActive": true},
      {"code": "UBL", "name": "United Bank Limited", "isActive": true},
      ...
    ],
    "wallets": [
      {"code": "EASYPAISA", "name": "Easypaisa", "isActive": true},
      {"code": "JAZZCASH", "name": "JazzCash", "isActive": true},
      ...
    ]
  }
}
```

**Supported Banks:** HBL, UBL, MCB, ABL, NBP, Meezan, Askari, BOP, FBL, JSBL, Soneri, SBP, BAHL
**Supported Wallets:** Easypaisa, JazzCash, NayaPay, SadaPay

---

### 3. Create Payout (Transfer Money)
**POST** `/payouts`

Create a new payout to send money to a bank account or mobile wallet.

**Request Body:**
```json
{
  "merchantReference": "ORDER12345",
  "amount": 5000,
  "destType": "BANK",
  "accountNumber": "12345678901",
  "accountTitle": "Customer Name",
  "bankCode": "HBL",
  "purpose": "Payment for order #12345",
  "currency": "PKR"
}
```

**Field Descriptions:**
- `merchantReference` (required): Your unique reference ID
- `amount` (required): Amount in PKR (must be > 0)
- `destType` (required): "BANK" or "WALLET"
- `accountNumber` (required): 11 digits
- `accountTitle` (required): Recipient's name
- `bankCode` (required if BANK): From directory endpoint
- `walletCode` (required if WALLET): From directory endpoint
- `purpose` (optional): Payment description
- `currency` (optional): Default "PKR"

**cURL Example:**
```bash
curl -X POST https://sandbox.mycodigital.io/api/v1/payouts \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -H "X-Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "merchantReference": "ORDER12345",
    "amount": 5000,
    "destType": "BANK",
    "accountNumber": "12345678901",
    "accountTitle": "John Doe",
    "bankCode": "HBL",
    "purpose": "Payment for services",
    "currency": "PKR"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Payout created successfully",
  "data": {
    "id": "643e832c-081a-4074-9525-71e2f88d594f",
    "merchantId": "db494a83-ac5e-4d8c-bb64-7edad0717dad",
    "merchantReference": "ORDER12345",
    "amount": "5000.00",
    "currency": "PKR",
    "destType": "BANK",
    "bankCode": "HBL",
    "accountNumber": "12345678901",
    "accountTitle": "John Doe",
    "status": "PENDING",
    "createdAt": "2025-11-26T19:00:00.000Z",
    "updatedAt": "2025-11-26T19:00:00.000Z"
  }
}
```

---

### 4. Get Payout Status
**GET** `/payouts/{payoutId}`

Check the status of a specific payout.

**cURL Example:**
```bash
curl -H "X-API-KEY: your_api_key" \
  https://sandbox.mycodigital.io/api/v1/payouts/643e832c-081a-4074-9525-71e2f88d594f
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "643e832c-081a-4074-9525-71e2f88d594f",
    "merchantReference": "ORDER12345",
    "amount": "5000.00",
    "status": "SUCCESS",
    "pspReference": "PSP1764185244991",
    "processedAt": "2025-11-26T19:00:05.000Z",
    "createdAt": "2025-11-26T19:00:00.000Z"
  }
}
```

---

## Payout Status Values

| Status | Description |
|--------|-------------|
| `PENDING` | Payout is queued for processing |
| `PROCESSING` | Payout is being processed |
| `SUCCESS` | ✅ Payout completed successfully |
| `FAILED` | ❌ Payout failed |
| `IN_REVIEW` | Large amount under review |
| `ON_HOLD` | Account blocked/suspended |

---

## Code Examples

### JavaScript (Node.js)
```javascript
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const createPayout = async () => {
  try {
    const response = await axios.post(
      'https://sandbox.mycodigital.io/api/v1/payouts',
      {
        merchantReference: 'ORDER12345',
        amount: 5000,
        destType: 'BANK',
        accountNumber: '12345678901',
        accountTitle: 'John Doe',
        bankCode: 'HBL',
        purpose: 'Payment for services',
        currency: 'PKR'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': 'your_api_key_here',
          'X-Idempotency-Key': uuidv4()
        }
      }
    );

    console.log('Payout created:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
};

createPayout();
```

### Python
```python
import requests
import uuid

def create_payout():
    url = 'https://sandbox.mycodigital.io/api/v1/payouts'
    headers = {
        'Content-Type': 'application/json',
        'X-API-KEY': 'your_api_key_here',
        'X-Idempotency-Key': str(uuid.uuid4())
    }
    payload = {
        'merchantReference': 'ORDER12345',
        'amount': 5000,
        'destType': 'BANK',
        'accountNumber': '12345678901',
        'accountTitle': 'John Doe',
        'bankCode': 'HBL',
        'purpose': 'Payment for services',
        'currency': 'PKR'
    }

    response = requests.post(url, json=payload, headers=headers)
    print(response.json())

create_payout()
```

### PHP
```php
<?php
function createPayout() {
    $url = 'https://sandbox.mycodigital.io/api/v1/payouts';

    $data = [
        'merchantReference' => 'ORDER12345',
        'amount' => 5000,
        'destType' => 'BANK',
        'accountNumber' => '12345678901',
        'accountTitle' => 'John Doe',
        'bankCode' => 'HBL',
        'purpose' => 'Payment for services',
        'currency' => 'PKR'
    ];

    $headers = [
        'Content-Type: application/json',
        'X-API-KEY: your_api_key_here',
        'X-Idempotency-Key: ' . uniqid('', true)
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);
    curl_close($ch);

    print_r(json_decode($response, true));
}

createPayout();
?>
```

---

## Error Handling

### Common Error Codes:

| Code | HTTP | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing API key |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `INSUFFICIENT_BALANCE` | 400 | Not enough balance |
| `INVALID_BANK_CODE` | 400 | Bank code not in directory |
| `INVALID_ACCOUNT_NUMBER` | 400 | Invalid format (must be 11 digits) |
| `MISSING_IDEMPOTENCY_KEY` | 400 | Header required for POST |
| `INVALID_IDEMPOTENCY_KEY` | 400 | Must be valid UUID |

### Error Response Format:
```json
{
  "error": {
    "message": "Insufficient balance",
    "code": "INSUFFICIENT_BALANCE",
    "timestamp": "2025-11-26T19:00:00.000Z"
  }
}
```

---

## Best Practices

### 1. Idempotency Keys
Always use unique UUIDs for `X-Idempotency-Key` to prevent duplicate payouts.

### 2. Check Balance First
Always check balance before creating payouts to avoid errors.

### 3. Poll for Status
After creating a payout, poll the status endpoint every 5-10 seconds until status is `SUCCESS` or `FAILED`.

### 4. Store PSP Reference
Save the `pspReference` for reconciliation and customer support.

### 5. Handle Errors Gracefully
Implement retry logic for network errors, but never retry with the same idempotency key.

---

## Sandbox Testing

### Test Account Numbers:
These special account numbers trigger specific behaviors:

| Account Number | Behavior |
|----------------|----------|
| `12345678901` | ✅ Instant SUCCESS |
| `98765432109` | ✅ SUCCESS after retry |
| `11111111111` | ⏳ Stays PENDING |
| `55555555555` | ❌ FAILED |
| `99999999999` | 🔒 ON_HOLD |

### Large Amount Testing:
- Amounts ≥ 100,000 PKR → Status: `IN_REVIEW`

---

## Rate Limits
- **Sandbox**: No limits
- **Production**: To be determined based on your plan

---

## SSL Certificate Information
- **Provider**: Let's Encrypt (Free, Trusted)
- **Expires**: February 24, 2026
- **Auto-Renewal**: Yes (every 60 days)
- **Grade**: A+ SSL Rating

---

## Support & Contact

**Technical Support:**
For API integration assistance or issues, contact your account manager.

**API Status:**
Check API health: `https://sandbox.mycodigital.io/`

**Version:** 1.0.0
**Last Updated:** November 26, 2025

---

## Postman Collection

A Postman collection is available in the project repository:
`MyPay_Payout_API.postman_collection.json`

Import this into Postman for quick testing!

---

© 2025 MyPay - MyCo Digital Payment Solutions
