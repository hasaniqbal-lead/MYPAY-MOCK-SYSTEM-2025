# MyPay Transaction Engine API Guide

> **Core Connector Document**
> Transaction Engine → Portals & External Platforms

**Version:** 1.0
**Last Updated:** January 2026
**Base URL:** `https://api.vstore.cloud/api/v1`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Merchant Portal APIs](#merchant-portal-apis)
4. [Admin Portal APIs](#admin-portal-apis)
5. [Public Transaction APIs](#public-transaction-apis)
6. [Data Models](#data-models)
7. [Response Formats](#response-formats)
8. [Integration Examples](#integration-examples)
9. [Webhooks](#webhooks)

---

## Overview

This document serves as the **core connector specification** between the MyPay Transaction Engine and all consuming platforms:

- Merchant Portal (merchant.vstore.cloud)
- Admin Portal (admin.vstore.cloud)
- Future mobile apps
- Third-party integrations
- Analytics dashboards

### Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRANSACTION ENGINE                           │
│                   (Payment API Service)                         │
│                   api.vstore.cloud:4002                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ REST APIs
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Merchant    │   │    Admin      │   │   External    │
│    Portal     │   │    Portal     │   │   Platforms   │
│ devportal.*   │   │ devadmin.*    │   │  (Future)     │
└───────────────┘   └───────────────┘   └───────────────┘
```

---

## Authentication

### Merchant Portal Authentication
Uses **JWT tokens** obtained via login.

```http
POST /api/v1/portal/auth/login
Content-Type: application/json

{
  "email": "merchant@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "merchant": {
    "id": 1,
    "email": "merchant@example.com",
    "name": "Test Merchant"
  }
}
```

**Usage:** Include token in Authorization header:
```http
Authorization: Bearer <token>
```

---

### Admin Portal Authentication
Uses **Admin JWT tokens** obtained via admin login.

```http
POST /api/v1/admin/auth/login
Content-Type: application/json

{
  "email": "admin@vstore.cloud",
  "password": "admin@@1234"
}
```

**Usage:** Same as merchant - include in Authorization header.

---

### API Key Authentication (External/Checkout APIs)
Uses **X-Api-Key** header for checkout creation.

```http
X-Api-Key: mypay_452e40085ac5c675...
```

---

## Merchant Portal APIs

### 1. List Transactions

Retrieves paginated list of merchant's payment transactions.

```http
GET /api/v1/portal/transactions
Authorization: Bearer <token>
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Items per page |
| `status` | string | - | Filter: `completed`, `pending`, `failed` |
| `paymentMethod` | string | - | Filter: `card`, `easypaisa`, `jazzcash` |
| `startDate` | string | - | Filter: Start date (YYYY-MM-DD) |
| `endDate` | string | - | Filter: End date (YYYY-MM-DD) |

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "checkout_id": "chk_abc123xyz",
      "reference": "ORDER-001",
      "amount": 1500.00,
      "status": "completed",
      "status_code": "00",
      "payment_method": "easypaisa",
      "payment_type": "wallet",
      "mobile_number": "923001234567",
      "created_at": "2026-01-07T10:30:00.000Z",
      "updated_at": "2026-01-07T10:31:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

### 2. Get Single Transaction

Retrieves detailed information about a specific transaction.

```http
GET /api/v1/portal/transactions/:checkoutId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "checkout_id": "chk_abc123xyz",
    "reference": "ORDER-001",
    "amount": 1500.00,
    "status": "completed",
    "status_code": "00",
    "payment_method": "easypaisa",
    "payment_type": "wallet",
    "mobile_number": "923001234567",
    "success_url": "https://merchant.com/success",
    "return_url": "https://merchant.com/return",
    "webhook_status": "sent",
    "created_at": "2026-01-07T10:30:00.000Z",
    "updated_at": "2026-01-07T10:31:00.000Z"
  }
}
```

---

### 3. Export Transactions

Export transactions in CSV or JSON format.

```http
GET /api/v1/portal/transactions/export/:format
Authorization: Bearer <token>
```

**Path Parameters:**
- `format`: `csv` or `json`

**Query Parameters:** Same as List Transactions (status, startDate, endDate)

**Response (CSV):**
```csv
Reference,Amount,Status,Payment Method,Date
"ORDER-001",1500.00,"completed","easypaisa","2026-01-07T10:30:00.000Z"
```

---

### 4. List Payouts

Retrieves paginated list of merchant's payouts.

```http
GET /api/v1/portal/payouts
Authorization: Bearer <token>
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Items per page |
| `status` | string | - | Filter: `SUCCESS`, `PENDING`, `FAILED` |
| `destType` | string | - | Filter: `BANK`, `WALLET` |

**Response:**
```json
{
  "success": true,
  "payouts": [
    {
      "id": "payout_xyz789",
      "merchantReference": "PAYOUT-001",
      "amount": 5000.00,
      "currency": "PKR",
      "status": "SUCCESS",
      "destType": "BANK",
      "bankCode": "HBL",
      "accountNumber": "1234567890",
      "accountTitle": "John Doe",
      "created_at": "2026-01-07T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

---

### 5. Get Single Payout

```http
GET /api/v1/portal/payouts/:id
Authorization: Bearer <token>
```

---

### 6. Export Payouts

```http
GET /api/v1/portal/payouts/export/:format
Authorization: Bearer <token>
```

---

### 7. Dashboard Statistics

Retrieves aggregated statistics for merchant dashboard.

```http
GET /api/v1/portal/dashboard/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalTransactions": 150,
    "successfulTransactions": 120,
    "failedTransactions": 30,
    "successRate": 80.00,
    "totalAmount": 1500000.00
  },
  "cached": false
}
```

**Note:** Results are cached for 5 minutes for performance.

---

## Admin Portal APIs

### 1. Get All Transactions (System-Wide)

Retrieves all transactions across all merchants.

```http
GET /api/v1/admin/transactions
Authorization: Bearer <admin_token>
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Items per page |
| `merchantId` | integer | - | Filter by merchant |
| `status` | string | - | Filter: `completed`, `pending`, `failed` |

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": 1,
      "checkout_id": "chk_abc123xyz",
      "reference": "ORDER-001",
      "amount": 1500.00,
      "currency": "PKR",
      "status": "completed",
      "payment_method": "easypaisa",
      "created_at": "2026-01-07T10:30:00.000Z",
      "updated_at": "2026-01-07T10:31:00.000Z",
      "merchant": {
        "id": 1,
        "merchant_id": "MERCHANT_0001",
        "name": "Test Merchant",
        "company_name": "Test Company"
      }
    }
  ],
  "total": 500
}
```

---

### 2. Get All Payouts (System-Wide)

```http
GET /api/v1/admin/payouts
Authorization: Bearer <admin_token>
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Items per page |
| `merchantId` | integer | - | Filter by merchant |
| `status` | string | - | Filter: `SUCCESS`, `PENDING`, `FAILED` |

**Response:**
```json
{
  "success": true,
  "payouts": [
    {
      "id": "payout_xyz789",
      "merchantReference": "PAYOUT-001",
      "amount": 5000.00,
      "currency": "PKR",
      "status": "SUCCESS",
      "destType": "BANK",
      "bankCode": "HBL",
      "walletCode": null,
      "accountNumber": "1234567890",
      "accountTitle": "John Doe",
      "failureReason": null,
      "createdAt": "2026-01-07T12:00:00.000Z",
      "processedAt": "2026-01-07T12:05:00.000Z",
      "merchant": {
        "id": 1,
        "merchant_id": "MERCHANT_0001",
        "name": "Test Merchant",
        "company_name": "Test Company"
      }
    }
  ],
  "total": 200
}
```

---

### 3. Get All Merchants with Statistics

```http
GET /api/v1/admin/merchants
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "merchants": [
    {
      "id": 1,
      "merchant_id": "MERCHANT_0001",
      "name": "Test Merchant",
      "email": "merchant@example.com",
      "company_name": "Test Company",
      "status": "active",
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "transactionCount": 150,
      "totalVolume": 1500000.00,
      "payoutCount": 50,
      "totalPayoutVolume": 500000.00,
      "webhookUrl": "https://merchant.com/webhook"
    }
  ],
  "total": 10
}
```

---

### 4. Get Single Merchant Details

```http
GET /api/v1/admin/merchants/:id
Authorization: Bearer <admin_token>
```

**Response includes:**
- Merchant profile
- Recent 10 transactions
- Recent 10 payouts
- API keys

---

## Public Transaction APIs

These APIs use **API Key authentication** (X-Api-Key header).

### 1. Create Checkout Session

```http
POST /api/v1/checkouts
X-Api-Key: mypay_452e40085ac5c675...
Content-Type: application/json

{
  "reference": "ORDER-001",
  "amount": 1500.00,
  "paymentMethod": "easypaisa",
  "callbackUrl": "https://merchant.com/webhook",
  "successUrl": "https://merchant.com/success",
  "returnUrl": "https://merchant.com/return"
}
```

---

### 2. Get Checkout Details

```http
GET /api/v1/checkouts/:checkoutId
X-Api-Key: mypay_452e40085ac5c675...
```

---

### 3. Get Transaction Status by Reference

```http
GET /api/v1/transactions/:reference
X-Api-Key: mypay_452e40085ac5c675...
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "reference": "ORDER-001",
    "status": "completed",
    "status_code": "00",
    "amount": 1500.00,
    "payment_method": "easypaisa"
  }
}
```

---

## Data Models

### PaymentTransaction

| Field | Type | Description |
|-------|------|-------------|
| `checkout_id` | string | Unique checkout identifier |
| `reference` | string | Merchant's order reference |
| `amount` | decimal(10,2) | Transaction amount |
| `status` | string | `pending`, `completed`, `failed` |
| `status_code` | string | Status code (e.g., "00" for success) |
| `payment_method` | string | `card`, `easypaisa`, `jazzcash` |
| `payment_type` | string | `wallet`, `card`, etc. |
| `mobile_number` | string | Customer mobile (for wallet payments) |
| `merchant_id` | integer | Associated merchant ID |
| `success_url` | string | Redirect URL on success |
| `return_url` | string | Return URL |
| `webhook_status` | string | `pending`, `sent`, `failed` |
| `webhook_attempts` | integer | Number of webhook delivery attempts |
| `created_at` | datetime | Creation timestamp |
| `updated_at` | datetime | Last update timestamp |

### Payout

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique payout identifier |
| `merchantReference` | string | Merchant's payout reference |
| `amount` | decimal(10,2) | Payout amount |
| `currency` | string | Currency code (PKR) |
| `status` | string | `PENDING`, `SUCCESS`, `FAILED`, `ON_HOLD` |
| `destType` | string | `BANK` or `WALLET` |
| `bankCode` | string | Bank code (for bank transfers) |
| `walletCode` | string | Wallet code (for wallet transfers) |
| `accountNumber` | string | Destination account number |
| `accountTitle` | string | Account holder name |
| `failureReason` | string | Reason if failed |
| `merchantId` | integer | Associated merchant ID |
| `createdAt` | datetime | Creation timestamp |
| `processedAt` | datetime | Processing completion timestamp |

---

## Response Formats

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message description",
  "code": "ERROR_CODE"
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid/missing token) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Integration Examples

### JavaScript/TypeScript (Fetch)

```typescript
// Merchant Portal - List Transactions
const fetchTransactions = async (token: string, params?: {
  page?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const queryString = new URLSearchParams(params as any).toString();

  const response = await fetch(
    `https://api.vstore.cloud/api/v1/portal/transactions?${queryString}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.json();
};

// Usage
const result = await fetchTransactions(token, {
  page: 1,
  status: 'completed',
  startDate: '2026-01-01',
  endDate: '2026-01-31'
});
```

### React Query Example

```typescript
import { useQuery } from '@tanstack/react-query';

const useTransactions = (params: TransactionParams) => {
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: () => fetchTransactions(params),
    staleTime: 30000, // 30 seconds
  });
};

// In component
const { data, isLoading, error } = useTransactions({
  page: 1,
  status: 'completed'
});
```

### Admin Portal - Get All Transactions

```typescript
const fetchAdminTransactions = async (adminToken: string, params?: {
  merchantId?: number;
  status?: string;
  limit?: number;
}) => {
  const queryString = new URLSearchParams(params as any).toString();

  const response = await fetch(
    `https://api.vstore.cloud/api/v1/admin/transactions?${queryString}`,
    {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.json();
};
```

---

## Webhooks

When a transaction status changes, a webhook is sent to the merchant's configured `callbackUrl`.

### Webhook Payload

```json
{
  "event": "payment.completed",
  "checkout_id": "chk_abc123xyz",
  "reference": "ORDER-001",
  "amount": 1500.00,
  "status": "completed",
  "status_code": "00",
  "payment_method": "easypaisa",
  "timestamp": "2026-01-07T10:31:00.000Z"
}
```

### Webhook Events

| Event | Description |
|-------|-------------|
| `payment.completed` | Payment successful |
| `payment.failed` | Payment failed |
| `payment.pending` | Payment pending |

---

## API Endpoints Quick Reference

### Merchant Portal (JWT Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/portal/auth/login` | Login |
| POST | `/portal/auth/register` | Register |
| POST | `/portal/auth/logout` | Logout |
| GET | `/portal/merchant/profile` | Get profile |
| PUT | `/portal/merchant/profile` | Update profile |
| GET | `/portal/merchant/credentials` | Get API keys |
| POST | `/portal/merchant/credentials` | Generate new API key |
| GET | `/portal/transactions` | List transactions |
| GET | `/portal/transactions/:id` | Get transaction |
| GET | `/portal/transactions/export/:format` | Export transactions |
| GET | `/portal/payouts` | List payouts |
| GET | `/portal/payouts/:id` | Get payout |
| GET | `/portal/payouts/export/:format` | Export payouts |
| GET | `/portal/dashboard/stats` | Dashboard stats |

### Admin Portal (Admin JWT Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/auth/login` | Admin login |
| GET | `/admin/merchants` | List all merchants |
| GET | `/admin/merchants/:id` | Get merchant details |
| POST | `/admin/merchants` | Create merchant |
| PUT | `/admin/merchants/:id` | Update merchant |
| POST | `/admin/merchants/:id/toggle-status` | Toggle status |
| POST | `/admin/merchants/:id/reset-password` | Reset password |
| PUT | `/admin/merchants/:id/email` | Update email |
| GET | `/admin/transactions` | All transactions |
| GET | `/admin/payouts` | All payouts |

### Public APIs (API Key Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/checkouts` | Create checkout |
| GET | `/checkouts/:checkoutId` | Get checkout |
| GET | `/transactions/:reference` | Get by reference |
| GET | `/health` | Health check |

---

## Environment URLs

| Environment | Base URL |
|-------------|----------|
| **Sandbox** | `https://api.vstore.cloud/api/v1` |
| **Payout API** | `https://api.vstore.cloud/api/v1` |
| **Merchant Portal** | `https://merchant.vstore.cloud` |
| **Admin Portal** | `https://admin.vstore.cloud` |
| **Payment Page** | `https://api.vstore.cloud` |

---

## Contact & Support

For API issues or questions, contact the development team.

---

*Document generated for MyPay Mock System - Transaction Engine API v1.0*
