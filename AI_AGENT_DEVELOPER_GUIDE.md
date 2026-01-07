# MyPay Mock System - AI Agent & Developer Guide

> **Version**: 1.0.0
> **Last Updated**: January 2026
> **Purpose**: Complete reference for AI agents and developers to understand, modify, and extend the MyPay Mock System

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Deep Dive](#2-architecture-deep-dive)
3. [Payment Processing](#3-payment-processing)
4. [Payout Processing](#4-payout-processing)
5. [Merchant API Integration](#5-merchant-api-integration)
6. [Admin & Merchant Portals](#6-admin--merchant-portals)
7. [Database Schema](#7-database-schema)
8. [VPS Infrastructure](#8-vps-infrastructure)
9. [Development Workflow](#9-development-workflow)
10. [Common Tasks & How-To](#10-common-tasks--how-to)
11. [Troubleshooting](#11-troubleshooting)
12. [Quick Reference](#12-quick-reference)

---

## 1. System Overview

### What is MyPay Mock System?

MyPay Mock System is a **complete fintech payment simulation platform** designed for testing and development of Pakistani payment integrations. It simulates:

- **Payment Collection**: Easypaisa, JazzCash, and Card payments
- **Payouts**: Bank transfers and wallet disbursements
- **Merchant Management**: Self-service portals for merchants
- **Admin Operations**: System monitoring and merchant management

### Key Characteristics

| Aspect | Detail |
|--------|--------|
| **Type** | Mock/Sandbox Payment System |
| **Region** | Pakistan (PKR currency) |
| **Architecture** | Monorepo with microservices |
| **Stack** | Node.js, Next.js, MySQL, Docker |
| **Package Manager** | pnpm with workspaces |
| **Build Tool** | Turborepo |

### Service Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    MyPay Mock System                            │
├─────────────────────────────────────────────────────────────────┤
│  APIS                          │  PORTALS                       │
│  ├─ Payment API (4002)         │  ├─ Merchant Portal (4010)     │
│  │  └─ Checkout & Payments     │  │  └─ Dashboard, Transactions │
│  └─ Payout API (4001)          │  └─ Admin Portal (4011)        │
│     ├─ Bank/Wallet Payouts     │     └─ Merchant Mgmt, Payouts  │
│     └─ Background Worker       │                                │
├─────────────────────────────────────────────────────────────────┤
│  DATABASE: MySQL 8.0 (Port 3306)                                │
│  └─ Unified schema for all services                             │
└─────────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
MYPAY-MOCK-SYSTEM/
├── services/                    # Core microservices
│   ├── payment-api/             # Payment checkout API
│   ├── payout-api/              # Payout disbursement API
│   ├── merchant-portal/         # Merchant dashboard (Next.js)
│   └── admin-portal/            # Admin dashboard (Next.js)
├── packages/
│   └── shared/                  # Shared types & utilities
├── prisma/                      # Unified database schema
│   ├── schema.prisma            # Main schema definition
│   └── migrations/              # Database migrations
├── docker/                      # Docker configurations
│   └── nginx/                   # Nginx reverse proxy
├── nginx/                       # Production Nginx config
├── scripts/                     # Automation scripts
└── docs/                        # Additional documentation
```

---

## 2. Architecture Deep Dive

### Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Backend Runtime** | Node.js | 18+ |
| **Backend Framework** | Express.js | 4.18.2 |
| **Frontend Framework** | Next.js | 14.0.4 |
| **UI Library** | React | 18.2.0 |
| **Database** | MySQL | 8.0 |
| **ORM** | Prisma | 5.7.0+ |
| **Styling** | Tailwind CSS | 3.4.0 |
| **UI Components** | Radix UI | Latest |
| **Container** | Docker | Latest |
| **Orchestration** | Docker Compose | v2 |
| **Reverse Proxy** | Nginx | Latest |
| **Language** | TypeScript | 5.3.3 |

### Service Communication

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Merchant   │────▶│  Payment API │────▶│    MySQL     │
│   Browser    │     │   (4002)     │     │   (3306)     │
└──────────────┘     └──────────────┘     └──────────────┘
                            │                    ▲
                            │ Webhook            │
                            ▼                    │
                     ┌──────────────┐            │
                     │   Merchant   │            │
                     │   Server     │            │
                     └──────────────┘            │
                                                 │
┌──────────────┐     ┌──────────────┐            │
│   Merchant   │────▶│  Payout API  │────────────┤
│   System     │     │   (4001)     │            │
└──────────────┘     └──────────────┘            │
                            │                    │
                            ▼                    │
                     ┌──────────────┐            │
                     │   Worker     │────────────┘
                     │  (Background)│
                     └──────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Merchant   │────▶│   Merchant   │────▶│  Payment API │
│   User       │     │   Portal     │     │   (4002)     │
└──────────────┘     │   (4010)     │     └──────────────┘
                     └──────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Admin     │────▶│    Admin     │────▶│  Both APIs   │
│    User      │     │   Portal     │     │ (4001+4002)  │
└──────────────┘     │   (4011)     │     └──────────────┘
```

### Authentication Flow

**API Authentication (Merchants)**:
1. Merchant obtains API key from portal
2. API key sent in `X-API-KEY` header
3. Backend hashes key with SHA256
4. Matches against stored hash in database
5. Merchant info attached to request context

**Portal Authentication (Users)**:
1. User submits email/password
2. Backend validates credentials
3. JWT token generated and returned
4. Token stored in HTTP-only cookie
5. Subsequent requests include Bearer token

---

## 3. Payment Processing

### Overview

The Payment API handles **incoming payments** from customers to merchants. It supports:
- **Easypaisa** (mobile wallet)
- **JazzCash** (mobile wallet)
- **Card payments** (Visa/Mastercard)

### File Locations

| Purpose | File Path |
|---------|-----------|
| Main Entry | `services/payment-api/src/main.ts` |
| Payment Controller | `services/payment-api/src/controllers/paymentController.ts` |
| Checkout Controller | `services/payment-api/src/controllers/checkoutController.ts` |
| Webhook Service | `services/payment-api/src/services/webhookService.ts` |
| Database Schema | `services/payment-api/prisma/schema.prisma` |

### Payment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     PAYMENT FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. CHECKOUT CREATION                                           │
│     POST /api/v1/checkouts                                      │
│     ├─ Merchant sends: reference, amount, paymentMethod, urls   │
│     ├─ System creates PaymentTransaction (status: pending)      │
│     └─ Returns: checkoutUrl, checkoutId                         │
│                                                                 │
│  2. PAYMENT PAGE                                                │
│     GET /payment/:sessionId                                     │
│     ├─ Renders HTML payment form                                │
│     └─ Shows appropriate input (card/mobile+PIN)                │
│                                                                 │
│  3. PAYMENT SUBMISSION                                          │
│     POST /payment/:sessionId/complete                           │
│     ├─ User submits credentials                                 │
│     ├─ System determines outcome (test scenarios)               │
│     ├─ Updates transaction status                               │
│     └─ Triggers async webhook                                   │
│                                                                 │
│  4. WEBHOOK NOTIFICATION                                        │
│     ├─ POST to merchant's success_url                           │
│     ├─ Includes: id, reference, status, amount, user            │
│     ├─ Retry: 3 attempts, 5s delay                              │
│     └─ Logs delivery in payment_webhook_logs                    │
│                                                                 │
│  5. STATUS QUERY                                                │
│     GET /api/v1/transactions/:reference                         │
│     └─ Returns complete transaction details                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/checkouts` | Create checkout session |
| GET | `/api/v1/checkouts/:checkoutId` | Get checkout details |
| GET | `/api/v1/transactions/:reference` | Get transaction status |
| GET | `/payment/:sessionId` | Render payment form |
| POST | `/payment/:sessionId/complete` | Process payment |
| GET | `/api/v1/test-scenarios` | List test scenarios |
| POST | `/api/v1/webhooks/test` | Manually trigger webhook |

### Test Scenarios

**Card Numbers**:
| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | SUCCESS |
| `4111 1111 1111 1111` | SUCCESS |
| `4000 0000 0000 0002` | FAILED |
| `4000 0000 0000 9995` | INSUFFICIENT_FUNDS |

**Mobile Numbers** (from scenario_mappings table):
| Number | Scenario |
|--------|----------|
| `03030000000` | SUCCESS |
| `03021111111` | FAILED |
| `03032222222` | TIMEOUT |
| `03035555555` | INSUFFICIENT_FUNDS |

### Adding a New Payment Method

1. **Update paymentController.ts**:
```typescript
// services/payment-api/src/controllers/paymentController.ts
// Add new payment method handler in processPayment function
case 'new_method':
  status = determineNewMethodStatus(req.body);
  break;
```

2. **Add scenario mappings** (optional):
```sql
INSERT INTO scenario_mappings (mobile_number, scenario, status, status_code, description)
VALUES ('030XXXXXXXX', 'new_scenario', 'completed', 'SUCCESS', 'Test scenario');
```

3. **Update payment form** to render new method input fields

---

## 4. Payout Processing

### Overview

The Payout API handles **outgoing disbursements** from merchants to recipients. It supports:
- **Bank Transfers** (14 Pakistani banks)
- **Wallet Transfers** (Easypaisa, JazzCash, SadaPay, NayaPay)

### File Locations

| Purpose | File Path |
|---------|-----------|
| API Entry | `services/payout-api/src/api/main.ts` |
| Routes | `services/payout-api/src/api/routes.ts` |
| Payouts Controller | `services/payout-api/src/api/controllers/payouts.controller.ts` |
| Balance Controller | `services/payout-api/src/api/controllers/balance.controller.ts` |
| Worker | `services/payout-api/src/worker/worker.ts` |
| Auth Middleware | `services/payout-api/src/api/middleware/auth.middleware.ts` |
| Database | `services/payout-api/src/shared/database.ts` |

### Payout Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     PAYOUT FLOW                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. PAYOUT REQUEST                                              │
│     POST /api/v1/payouts                                        │
│     Headers: X-API-KEY, X-Idempotency-Key                       │
│     Body: merchantReference, amount, destType, bankCode/        │
│           walletCode, accountNumber, accountTitle               │
│                                                                 │
│  2. VALIDATION & BALANCE CHECK                                  │
│     ├─ Validate bank/wallet code against directory              │
│     ├─ Validate account number format (10-16 digits)            │
│     ├─ Check: availableBalance >= amount                        │
│     └─ availableBalance = balance - lockedBalance               │
│                                                                 │
│  3. TRANSACTION CREATION (Atomic)                               │
│     ├─ Create payout record (status: PENDING)                   │
│     ├─ Lock amount: lockedBalance += amount                     │
│     ├─ Create ledger entry (type: DEBIT)                        │
│     ├─ Create outbox event (for webhook)                        │
│     └─ Increment version (optimistic locking)                   │
│                                                                 │
│  4. BACKGROUND PROCESSING (Worker - every 5s)                   │
│     ├─ Fetch PENDING payouts (batch of 10)                      │
│     ├─ Update status: PENDING → PROCESSING                      │
│     ├─ Determine final status (test scenarios)                  │
│     ├─ Update balances accordingly                              │
│     └─ Create completion ledger entry                           │
│                                                                 │
│  5. WEBHOOK DELIVERY                                            │
│     ├─ Process outbox events                                    │
│     ├─ Sign payload with HMAC-SHA256                            │
│     ├─ POST to merchant's webhookUrl                            │
│     └─ Log delivery attempt                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/payouts` | Create payout |
| GET | `/api/v1/payouts` | List payouts |
| GET | `/api/v1/payouts/:id` | Get payout details |
| POST | `/api/v1/payouts/:id/reinitiate` | Retry failed payout |
| GET | `/api/v1/balance` | Get merchant balance |
| GET | `/api/v1/balance/history` | Get ledger entries |
| GET | `/api/v1/directory` | Get banks/wallets list |
| POST | `/api/v1/verify-account` | Verify account |

### Payout Status Flow

```
PENDING → PROCESSING → SUCCESS
                    → FAILED
                    → RETRY → SUCCESS/FAILED
                    → IN_REVIEW
                    → ON_HOLD
```

### Test Scenarios (Account Number Suffix)

| Suffix | Resulting Status |
|--------|------------------|
| `0001` | SUCCESS (instant) |
| `0002` | RETRY → SUCCESS |
| `0003` | FAILED |
| `0004` | PENDING (stays) |
| `0005` | ON_HOLD |
| Amount ≥ 100,000 | IN_REVIEW |

### Supported Banks & Wallets

**Banks** (14):
`HBL`, `UBL`, `MCB`, `ABL`, `JSBL`, `BAHL`, `MEEZAN`, `ASKARI`, `BANKALHABIB`, `SONERI`, `FBL`, `BOP`, `NBP`, `SBP`

**Wallets** (4):
`EASYPAISA`, `JAZZCASH`, `SADAPAY`, `NAYAPAY`

### Adding a New Bank/Wallet

```sql
-- Add new bank
INSERT INTO bank_directory (id, code, name, isActive)
VALUES (UUID(), 'NEW_BANK', 'New Bank Name', true);

-- Add new wallet
INSERT INTO wallet_directory (id, code, name, isActive)
VALUES (UUID(), 'NEW_WALLET', 'New Wallet Name', true);
```

---

## 5. Merchant API Integration

### Authentication

**Required Headers**:
```
X-API-KEY: mypay_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
X-Idempotency-Key: uuid-v4 (for POST/PUT/PATCH)
Content-Type: application/json
```

**API Key Format**: `mypay_` + 32 hex characters

**Authentication Flow**:
```typescript
// services/payout-api/src/api/middleware/auth.middleware.ts
1. Extract X-API-KEY from headers
2. Hash with SHA256
3. Query: SELECT * FROM merchants WHERE apiKey = hash AND isActive = true
4. Attach merchant to request context
```

### Idempotency

- Required for all mutation operations (POST/PUT/PATCH)
- Key stored for 24 hours
- Duplicate requests return cached response
- Prevents double-processing

```typescript
// services/payout-api/src/api/middleware/idempotency.middleware.ts
// Stores: merchantId + key + requestHash + response
```

### Webhook Security

**Signature Generation**:
```typescript
const signature = crypto
  .createHmac('sha256', process.env.WEBHOOK_SECRET)
  .update(JSON.stringify(payload))
  .digest('hex');
```

**Verification (Merchant Side)**:
```typescript
const expectedSig = crypto
  .createHmac('sha256', webhookSecret)
  .update(rawBody)
  .digest('hex');

if (expectedSig !== receivedSignature) {
  throw new Error('Invalid signature');
}
```

### Webhook Payload Structure

```json
{
  "event": "PAYOUT_CREATED | PAYOUT_UPDATED | PAYOUT_REINITIATED",
  "payout": {
    "id": "uuid",
    "merchantId": "string",
    "merchantReference": "string",
    "amount": "string",
    "currency": "PKR",
    "status": "string",
    "failureReason": "string | null",
    "pspReference": "string | null",
    "createdAt": "ISO8601"
  },
  "timestamp": "ISO8601"
}
```

### Error Handling

| Error Code | Meaning |
|------------|---------|
| `MISSING_API_KEY` | No X-API-KEY header |
| `INVALID_API_KEY` | Key not found or inactive |
| `MISSING_IDEMPOTENCY_KEY` | Required header missing |
| `VALIDATION_ERROR` | Request validation failed |
| `DUPLICATE_REFERENCE` | Reference already used |
| `INSUFFICIENT_BALANCE` | Not enough funds |
| `BALANCE_CONFLICT` | Concurrent modification |

---

## 6. Admin & Merchant Portals

### Merchant Portal

**URL**: `https://devportal.mycodigital.io` (Port 4010)

**Features**:
| Page | Path | Purpose |
|------|------|---------|
| Dashboard | `/dashboard` | Metrics, recent transactions, system status |
| Transactions | `/transactions` | View payments & payouts with filters |
| Credentials | `/credentials` | API keys management |
| Settings | `/settings` | Account configuration |

**File Locations**:
```
services/merchant-portal/
├── src/
│   ├── app/                    # Next.js pages
│   │   ├── dashboard/
│   │   ├── transactions/
│   │   ├── credentials/
│   │   └── settings/
│   ├── components/
│   │   ├── auth/               # Login/Register forms
│   │   ├── dashboard/          # Dashboard widgets
│   │   └── ui/                 # Reusable UI components
│   ├── contexts/
│   │   └── AuthContext.tsx     # Authentication state
│   └── lib/
│       └── api.ts              # API client
```

### Admin Portal

**URL**: `https://devadmin.mycodigital.io` (Port 4011)

**Features**:
| Page | Path | Purpose |
|------|------|---------|
| Dashboard | `/dashboard` | System KPIs, service health |
| Merchants | `/merchants` | CRUD operations, status toggle |
| Transactions | `/transactions` | All payment transactions |
| Payouts | `/payouts` | All payout transactions |
| Settings | `/settings` | System configuration |

**File Locations**:
```
services/admin-portal/
├── src/
│   ├── app/                    # Next.js pages
│   │   ├── dashboard/
│   │   ├── merchants/
│   │   ├── transactions/
│   │   ├── payouts/
│   │   └── settings/
│   ├── components/             # Similar structure to merchant
│   ├── contexts/
│   └── lib/
```

### Portal-Backend Connection

**API Communication**:
```typescript
// lib/api.ts
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor - adds auth token
api.interceptors.request.use((config) => {
  const token = Cookies.get('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handles 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Test Credentials

| Portal | Email | Password |
|--------|-------|----------|
| Admin | `admin@mycodigital.io` | `admin123456` |
| Merchant | `vendor@mycodigital.io` | `vendor123456` |

### Adding a New Portal Page

1. **Create page component**:
```typescript
// services/merchant-portal/src/app/new-page/page.tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';

export default function NewPage() {
  const { user } = useAuth();

  return (
    <Layout>
      <h1>New Page</h1>
      {/* Page content */}
    </Layout>
  );
}
```

2. **Add to navigation** in Layout component

3. **Add API methods** in `lib/api.ts` if needed

4. **Protect route** (already handled by middleware)

---

## 7. Database Schema

### Schema Location

**Primary**: `prisma/schema.prisma` (Unified schema)

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE SCHEMA                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  merchants (Central Entity)                                     │
│  ├── id (PK), uuid, name, email, apiKey, webhookUrl, status    │
│  │                                                              │
│  ├──1:1──▶ merchant_balances                                   │
│  │         ├── balance, lockedBalance, version                 │
│  │                                                              │
│  ├──1:N──▶ payouts                                             │
│  │         ├── merchantReference, amount, status, destType     │
│  │         └── bankCode/walletCode, accountNumber              │
│  │                                                              │
│  ├──1:N──▶ ledger_entries                                      │
│  │         ├── type (DEBIT/CREDIT), amount, balance            │
│  │                                                              │
│  ├──1:N──▶ payment_transactions                                │
│  │         ├── checkout_id, reference, amount, status          │
│  │         └── payment_method, success_url, user_data          │
│  │                                                              │
│  ├──1:N──▶ outbox_events (webhook queue)                       │
│  ├──1:N──▶ webhook_deliveries (delivery logs)                  │
│  └──1:N──▶ payment_api_keys                                    │
│                                                                 │
│  Standalone Tables:                                             │
│  ├── bank_directory (code, name, isActive)                     │
│  ├── wallet_directory (code, name, isActive)                   │
│  ├── scenario_mappings (mobile_number → test outcome)          │
│  ├── admin_users (admin portal auth)                           │
│  ├── system_config (key-value settings)                        │
│  └── audit_logs (activity trail)                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Tables

#### merchants
```sql
CREATE TABLE merchants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(191) UNIQUE DEFAULT (UUID()),
  name VARCHAR(191) NOT NULL,
  company_name VARCHAR(191),
  email VARCHAR(191) UNIQUE NOT NULL,
  password_hash VARCHAR(191),
  apiKey VARCHAR(191) UNIQUE NOT NULL,
  apiKeyPlain VARCHAR(191),
  webhookUrl VARCHAR(191),
  isActive BOOLEAN DEFAULT true,
  status VARCHAR(191) DEFAULT 'active',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME ON UPDATE CURRENT_TIMESTAMP
);
```

#### payouts
```sql
CREATE TABLE payouts (
  id VARCHAR(191) PRIMARY KEY DEFAULT (UUID()),
  merchantId INT NOT NULL,
  merchantReference VARCHAR(191) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(191) DEFAULT 'PKR',
  destType VARCHAR(191) NOT NULL,        -- BANK or WALLET
  bankCode VARCHAR(191),
  walletCode VARCHAR(191),
  accountNumber VARCHAR(191) NOT NULL,
  accountTitle VARCHAR(191) NOT NULL,
  status VARCHAR(191) DEFAULT 'PENDING',
  failureReason VARCHAR(191),
  pspReference VARCHAR(191),
  processedAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY (merchantId, merchantReference),
  INDEX (merchantId, status, createdAt),
  FOREIGN KEY (merchantId) REFERENCES merchants(id)
);
```

#### payment_transactions
```sql
CREATE TABLE payment_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  checkout_id VARCHAR(191) UNIQUE NOT NULL,
  vendor_id VARCHAR(191),
  reference VARCHAR(191) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(191) NOT NULL,
  payment_type VARCHAR(191) NOT NULL,
  success_url TEXT,
  return_url TEXT,
  status VARCHAR(191) DEFAULT 'pending',
  status_code VARCHAR(191),
  mobile_number VARCHAR(191),
  user_data JSON,
  webhook_status VARCHAR(191) DEFAULT 'pending',
  webhook_attempts INT DEFAULT 0,
  merchant_id INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,

  INDEX (merchant_id, status, created_at),
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE SET NULL
);
```

### Database Commands

```bash
# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Apply migrations (production)
pnpm prisma migrate deploy

# Seed database
pnpm prisma db seed

# Open Prisma Studio (GUI)
pnpm prisma studio

# Reset database
pnpm prisma migrate reset
```

### Adding a New Table

1. **Update schema.prisma**:
```prisma
model NewTable {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now()) @map("created_at")

  @@map("new_table")
}
```

2. **Create migration**:
```bash
pnpm prisma migrate dev --name add_new_table
```

3. **Regenerate client**:
```bash
pnpm prisma generate
```

---

## 8. VPS Infrastructure

### Server Details

| Aspect | Value |
|--------|-------|
| **IP Address** | 72.60.110.249 |
| **OS** | Ubuntu/Debian Linux |
| **Domains** | sandbox.mycodigital.io, devportal.mycodigital.io, devadmin.mycodigital.io |

### Domain Routing

```
sandbox.mycodigital.io     → Nginx → Payment API (4002) + Payout API (4001)
devportal.mycodigital.io   → Nginx → Merchant Portal (4010)
devadmin.mycodigital.io    → Nginx → Admin Portal (4011)
```

### Docker Services

```yaml
# docker-compose.yml services
services:
  mysql:          # Port 3306, MySQL 8.0
  payout-api:     # Port 4001, Express
  payout-worker:  # Background processor
  payment-api:    # Port 4002, Express
  merchant-portal: # Port 4010, Next.js
  admin-portal:   # Port 4011, Next.js
```

### Resource Limits

| Service | CPU | Memory |
|---------|-----|--------|
| MySQL | 2 cores | 1024MB |
| APIs | 0.5-0.75 cores | 384-512MB |
| Portals | 0.5 cores | 384MB |

### Nginx Configuration

**Location**: `/nginx/mypay.conf`

**Key Features**:
- SSL/TLS via Let's Encrypt
- HTTP → HTTPS redirect
- Rate limiting (API: 10 req/s, Portal: 30 req/s)
- Security headers
- Gzip compression
- WebSocket support for Next.js

### Deployment Commands

```bash
# SSH to server
ssh root@72.60.110.249

# View running containers
docker compose ps

# View logs
docker compose logs -f [service-name]

# Restart a service
docker compose restart [service-name]

# Full redeploy
docker compose down
docker compose up -d --build

# Run migrations
docker compose exec payment-api npx prisma migrate deploy
```

### SSL Certificates

```bash
# Certificates managed by Certbot
/etc/letsencrypt/live/sandbox.mycodigital.io/
/etc/letsencrypt/live/devportal.mycodigital.io/
/etc/letsencrypt/live/devadmin.mycodigital.io/

# Renew certificates
certbot renew
```

### Health Check

```bash
# Run health check script
./health-check.sh

# Manual checks
curl https://sandbox.mycodigital.io/health
curl https://sandbox.mycodigital.io/api/v1/health
```

---

## 9. Development Workflow

### Initial Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd MYPAY-MOCK-SYSTEM

# 2. Install dependencies
pnpm install

# 3. Setup environment
cp .env.example .env
# Edit .env with local settings

# 4. Start database
docker compose up -d mysql

# 5. Run migrations
pnpm prisma migrate dev

# 6. Seed database
pnpm prisma db seed

# 7. Start all services
pnpm dev
```

### Development Commands

```bash
# Start all services
pnpm dev

# Start individual services
pnpm dev:payment      # Payment API only
pnpm dev:payout       # Payout API only
pnpm dev:merchant-portal
pnpm dev:admin-portal

# Build all services
pnpm build

# Run type checking
pnpm typecheck

# Run linting
pnpm lint

# Run tests
pnpm test
```

### Docker Development

```bash
# Start with Docker (development)
docker compose -f docker-compose.yml -f docker/docker-compose.dev.yml up -d

# View logs
docker compose logs -f payment-api

# Rebuild specific service
docker compose up -d --build payment-api

# Stop all
docker compose down
```

### Making Changes

1. **Backend API Changes**:
   - Edit files in `services/[api-name]/src/`
   - Service auto-reloads with nodemon
   - Test with Postman or curl

2. **Frontend Changes**:
   - Edit files in `services/[portal-name]/src/`
   - Next.js hot-reloads automatically
   - View at localhost:4010 or 4011

3. **Database Changes**:
   - Edit `prisma/schema.prisma`
   - Run `pnpm prisma migrate dev --name description`
   - Regenerate client: `pnpm prisma generate`

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes, then commit
git add .
git commit -m "feat: description of change"

# Push branch
git push origin feature/new-feature

# Create PR to main branch
```

---

## 10. Common Tasks & How-To

### Add a New API Endpoint

**Payment API Example**:

1. **Create controller function**:
```typescript
// services/payment-api/src/controllers/newController.ts
export const newEndpoint = async (req: Request, res: Response) => {
  try {
    // Implementation
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: 'Internal error' });
  }
};
```

2. **Add route in main.ts**:
```typescript
// services/payment-api/src/main.ts
import { newEndpoint } from './controllers/newController';

app.get('/api/v1/new-endpoint', authMiddleware, newEndpoint);
```

### Add a New Merchant

**Via Admin Portal**:
1. Login to https://devadmin.mycodigital.io
2. Navigate to Merchants
3. Click "Add Merchant"
4. Fill form and submit

**Via Database**:
```sql
INSERT INTO merchants (uuid, name, email, apiKey, apiKeyPlain, isActive)
VALUES (
  UUID(),
  'New Merchant',
  'new@merchant.com',
  SHA2('mypay_newkey123456789', 256),
  'mypay_newkey123456789',
  true
);

INSERT INTO merchant_balances (id, merchantId, balance)
VALUES (UUID(), LAST_INSERT_ID(), 100000);
```

### Add New Test Scenario

```sql
INSERT INTO scenario_mappings (mobile_number, scenario, status, status_code, description)
VALUES ('03401234567', 'custom_scenario', 'completed', 'SUCCESS', 'Custom test scenario');
```

### Debug a Failed Payout

1. **Check payout status**:
```sql
SELECT * FROM payouts WHERE id = 'payout-uuid';
```

2. **Check ledger entries**:
```sql
SELECT * FROM ledger_entries WHERE payoutId = 'payout-uuid';
```

3. **Check webhook deliveries**:
```sql
SELECT * FROM webhook_deliveries WHERE merchantId = X ORDER BY createdAt DESC;
```

4. **Check worker logs**:
```bash
docker compose logs -f payout-worker
```

### Modify Webhook Retry Logic

Edit `services/payout-api/src/worker/worker.ts`:
```typescript
const WEBHOOK_RETRY_ATTEMPTS = 3;  // Change this
const WEBHOOK_RETRY_DELAY = 5000;  // Change this (ms)
```

### Reset Merchant Balance

```sql
UPDATE merchant_balances
SET balance = 100000, lockedBalance = 0, version = version + 1
WHERE merchantId = X;
```

---

## 11. Troubleshooting

### Common Issues

#### "Database connection failed"
```bash
# Check MySQL is running
docker compose ps mysql

# Check connection
docker compose exec mysql mysql -u root -p -e "SELECT 1"

# Verify DATABASE_URL in .env
```

#### "API returns 401 Unauthorized"
- Verify X-API-KEY header is present
- Check API key is correct (not expired/revoked)
- Verify merchant isActive = true in database

#### "Webhook not received"
- Check merchant has webhookUrl configured
- Verify webhookUrl is accessible from server
- Check webhook_deliveries table for errors
- Review worker logs for exceptions

#### "Payout stuck in PENDING"
- Check worker is running: `docker compose ps payout-worker`
- Review worker logs: `docker compose logs payout-worker`
- Manually process: Update status in database

#### "Portal shows blank page"
- Check NEXT_PUBLIC_API_URL in portal .env
- Verify API is accessible from browser
- Check browser console for errors
- Verify authentication token

### Log Locations

| Service | Command |
|---------|---------|
| All services | `docker compose logs -f` |
| Payment API | `docker compose logs -f payment-api` |
| Payout API | `docker compose logs -f payout-api` |
| Worker | `docker compose logs -f payout-worker` |
| MySQL | `docker compose logs -f mysql` |
| Nginx | `tail -f /var/log/nginx/access.log` |

### Database Debugging

```sql
-- Check recent transactions
SELECT * FROM payment_transactions ORDER BY created_at DESC LIMIT 10;

-- Check recent payouts
SELECT * FROM payouts ORDER BY createdAt DESC LIMIT 10;

-- Check merchant balance
SELECT m.name, mb.balance, mb.lockedBalance
FROM merchants m
JOIN merchant_balances mb ON m.id = mb.merchantId;

-- Check failed webhooks
SELECT * FROM webhook_deliveries WHERE status = 'FAILED';
```

---

## 12. Quick Reference

### URLs

| Service | Local | Production |
|---------|-------|------------|
| Payment API | http://localhost:4002 | https://sandbox.mycodigital.io |
| Payout API | http://localhost:4001 | https://sandbox.mycodigital.io |
| Merchant Portal | http://localhost:4010 | https://devportal.mycodigital.io |
| Admin Portal | http://localhost:4011 | https://devadmin.mycodigital.io |

### API Quick Reference

**Payment API**:
```bash
# Create checkout
curl -X POST http://localhost:4002/api/v1/checkouts \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your-api-key" \
  -d '{"reference":"ORD-001","amount":1000,"paymentMethod":"easypaisa","successUrl":"http://example.com/success"}'

# Get transaction
curl http://localhost:4002/api/v1/transactions/ORD-001 \
  -H "X-API-KEY: your-api-key"
```

**Payout API**:
```bash
# Create payout
curl -X POST http://localhost:4001/api/v1/payouts \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your-api-key" \
  -H "X-Idempotency-Key: $(uuidgen)" \
  -d '{"merchantReference":"PAY-001","amount":5000,"destType":"BANK","bankCode":"HBL","accountNumber":"12345600001","accountTitle":"John Doe"}'

# Get balance
curl http://localhost:4001/api/v1/balance \
  -H "X-API-KEY: your-api-key"
```

### Key Files

| Purpose | Path |
|---------|------|
| Payment API entry | `services/payment-api/src/main.ts` |
| Payout API entry | `services/payout-api/src/api/main.ts` |
| Payout Worker | `services/payout-api/src/worker/worker.ts` |
| Database schema | `prisma/schema.prisma` |
| Docker config | `docker-compose.yml` |
| Nginx config | `nginx/mypay.conf` |
| Environment | `.env` |

### Environment Variables

```bash
# Database
DATABASE_URL=mysql://root:password@localhost:3306/mypay_mock_db

# Ports
PAYMENT_API_PORT=4002
PAYOUT_API_PORT=4001

# Secrets (change in production!)
JWT_SECRET=your-jwt-secret-min-32-chars
WEBHOOK_SECRET=your-webhook-secret-min-32-chars

# URLs
NEXT_PUBLIC_API_URL=http://localhost:4002
```

### Test Credentials

| Type | Value |
|------|-------|
| Admin Email | admin@mycodigital.io |
| Admin Password | admin123456 |
| Merchant Email | vendor@mycodigital.io |
| Merchant Password | vendor123456 |
| Test Card (Success) | 4242 4242 4242 4242 |
| Test Mobile (Success) | 03030000000 |
| Test Account (Success) | XXXXX0001 |

---

## Appendix: File Structure Reference

```
MYPAY-MOCK-SYSTEM/
├── services/
│   ├── payment-api/
│   │   ├── src/
│   │   │   ├── main.ts                 # Entry point
│   │   │   ├── controllers/            # Request handlers
│   │   │   ├── middleware/             # Auth, validation
│   │   │   ├── services/               # Business logic
│   │   │   └── config/                 # Configuration
│   │   ├── prisma/
│   │   │   └── schema.prisma           # Database schema
│   │   └── package.json
│   │
│   ├── payout-api/
│   │   ├── src/
│   │   │   ├── api/
│   │   │   │   ├── main.ts             # API entry
│   │   │   │   ├── routes.ts           # Route definitions
│   │   │   │   ├── controllers/        # Request handlers
│   │   │   │   └── middleware/         # Auth, idempotency
│   │   │   ├── worker/
│   │   │   │   └── worker.ts           # Background processor
│   │   │   └── shared/
│   │   │       ├── database.ts         # Prisma client
│   │   │       ├── types.ts            # TypeScript types
│   │   │       └── utils.ts            # Utilities
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── package.json
│   │
│   ├── merchant-portal/
│   │   ├── src/
│   │   │   ├── app/                    # Next.js pages
│   │   │   ├── components/             # React components
│   │   │   ├── contexts/               # React contexts
│   │   │   └── lib/                    # API client
│   │   └── package.json
│   │
│   └── admin-portal/
│       └── [similar to merchant-portal]
│
├── packages/
│   └── shared/                         # Shared code
│
├── prisma/
│   ├── schema.prisma                   # Unified schema
│   └── migrations/                     # Database migrations
│
├── docker/
│   ├── docker-compose.yml
│   └── nginx/
│
├── nginx/
│   └── mypay.conf                      # Production Nginx
│
├── scripts/
│   ├── dev.sh
│   ├── docker-up.sh
│   └── setup.sh
│
├── docker-compose.yml                  # Main Docker config
├── package.json                        # Root package
├── pnpm-workspace.yaml                 # Workspace config
├── turbo.json                          # Turborepo config
└── .env                                # Environment variables
```

---

**Document End**

*This guide should be the first reference for any AI agent or developer working on the MyPay Mock System. Keep it updated as the system evolves.*
