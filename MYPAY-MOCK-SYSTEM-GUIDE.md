# MYPAY-MOCK-SYSTEM-GUIDE

MyPay Mock Platform - Complete Developer and QA Guide

Version: 1.0.0
Last Updated: December 2024

---

## TABLE OF CONTENTS

1. System Overview
2. Architecture and Service Communication
3. Project Structure and File Organization
4. Environment Variables Reference
5. Installation and Setup Guide
6. API Reference
7. Database Schema Reference
8. Nginx Gateway Configuration
9. Deployment Guide
10. Quality Assurance Guide
11. Troubleshooting Guide
12. Appendix

---

## 1. SYSTEM OVERVIEW

### 1.1 What is MyPay Mock Platform?

MyPay Mock Platform is a testing environment that simulates payment and payout services for Pakistani FinTech applications. It allows developers to test their integrations without using real money or connecting to actual payment providers.

The platform supports:
- Payment collection via Easypaisa, JazzCash, and Card
- Payouts to bank accounts and mobile wallets
- Merchant self-service portal
- Admin monitoring and management

### 1.2 Key Components

| Component | Purpose | Port | Domain |
|-----------|---------|------|--------|
| Payout API | Bank/wallet transfer processing | 4001 | sandbox.mycodigital.io/api/v1/ |
| Payment API | Payment checkout processing | 4002 | sandbox.mycodigital.io/checkouts |
| Merchant Portal | Merchant dashboard | 4010 | devportal.mycodigital.io |
| Admin Portal | System administration | 4011 | devadmin.mycodigital.io |
| Nginx Gateway | Request routing | 80/443 | All domains |
| MySQL Database | Data storage | 3306 | Internal only |

### 1.3 Technology Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 18+ |
| Language | TypeScript |
| Backend Framework | Express.js |
| Frontend Framework | Next.js 14 (App Router) |
| Database | MySQL 8.0 |
| ORM | Prisma |
| Package Manager | pnpm (workspaces) |
| Build System | Turborepo |
| Reverse Proxy | Nginx |
| Containerization | Docker, Docker Compose |
| Styling | Tailwind CSS |

---

## 2. ARCHITECTURE AND SERVICE COMMUNICATION

### 2.1 High-Level Architecture Diagram

```
                                    INTERNET
                                        |
                                        v
                    +-----------------------------------+
                    |         NGINX GATEWAY            |
                    |   (sandbox.mycodigital.io)       |
                    +-----------------------------------+
                           |              |
            +--------------+              +--------------+
            |                                            |
            v                                            v
    +---------------+                          +------------------+
    |  PAYOUT API   |                          |   PAYMENT API    |
    |  (Port 4001)  |                          |   (Port 4002)    |
    +---------------+                          +------------------+
            |                                            |
            |              +------------+                |
            +------------->|   MySQL    |<---------------+
                           | (Port 3306)|
                           +------------+
                                  ^
                                  |
    +---------------+    +------------------+
    |MERCHANT PORTAL|    |   ADMIN PORTAL   |
    | (Port 4010)   |    |   (Port 4011)    |
    +---------------+    +------------------+
```

### 2.2 Service Communication Matrix

| From | To | Protocol | Purpose |
|------|----|----------|---------|
| Browser | Nginx | HTTPS | All external requests |
| Nginx | Payout API | HTTP | Route /api/v1/* requests |
| Nginx | Payment API | HTTP | Route /checkouts, /payment, /api/portal/* |
| Nginx | Merchant Portal | HTTP | Route devportal.mycodigital.io |
| Nginx | Admin Portal | HTTP | Route devadmin.mycodigital.io |
| Payout API | MySQL | TCP | Database operations |
| Payment API | MySQL | TCP | Database operations |
| Merchant Portal | Payment API | HTTP | API calls via Nginx |
| Admin Portal | Payment API | HTTP | API calls via Nginx |
| Payment API | Merchant Webhook | HTTP | Payment notifications |
| Payout API | Merchant Webhook | HTTP | Payout notifications |

### 2.3 Public vs Internal APIs

#### PUBLIC APIs (Accessible from Internet)

These APIs are exposed through Nginx and can be called by external systems:

| API | Base URL | Authentication |
|-----|----------|----------------|
| Payout API | https://sandbox.mycodigital.io/api/v1/ | X-API-KEY header |
| Payment Checkout | https://sandbox.mycodigital.io/checkouts | X-Api-Key header |
| Payment Page | https://sandbox.mycodigital.io/payment/:id | None (public) |
| Portal Auth | https://sandbox.mycodigital.io/api/portal/auth/* | None (public) |
| Portal API | https://sandbox.mycodigital.io/api/portal/* | Bearer token |

#### INTERNAL APIs (Service-to-Service Only)

These are not exposed through Nginx:

| API | Internal URL | Purpose |
|-----|--------------|---------|
| Payout Worker | payout-api:3000 (internal) | Background job processing |
| Webhook Processing | Internal function calls | Send webhooks to merchants |
| Database | mysql:3306 | Data storage |

### 2.4 Request Flow Examples

#### Payment Flow:
```
1. Merchant Backend -> POST /checkouts (create checkout)
2. User Browser -> GET /payment/:sessionId (payment page)
3. User Browser -> POST /payment/:sessionId/complete (submit payment)
4. Payment API -> Merchant Webhook URL (notification)
5. Merchant Backend -> GET /transactions/:reference (verify status)
```

#### Payout Flow:
```
1. Merchant Backend -> POST /api/v1/payouts (create payout)
2. Payout Worker -> Process payout (background)
3. Payout API -> Merchant Webhook URL (notification)
4. Merchant Backend -> GET /api/v1/payouts/:id (check status)
```

---

## 3. PROJECT STRUCTURE AND FILE ORGANIZATION

### 3.1 Root Directory Structure

```
mypay-mock-platform/
|
+-- packages/                    # Shared packages
|   +-- shared/                  # Common types and utilities
|       +-- src/
|       |   +-- index.ts         # Main export file
|       |   +-- types/           # TypeScript type definitions
|       |   +-- utils/           # Utility functions
|       +-- package.json
|       +-- tsconfig.json
|
+-- services/                    # Microservices
|   +-- payout-api/              # Payout service
|   +-- payment-api/             # Payment service
|   +-- merchant-portal/         # Merchant dashboard
|   +-- admin-portal/            # Admin dashboard
|   +-- crypto-api/              # Future: Cryptocurrency
|   +-- topup-api/               # Future: Mobile top-up
|   +-- utility-api/             # Future: Utility bills
|   +-- education-api/           # Future: Education payments
|   +-- invoice-api/             # Future: Invoice payments
|
+-- docker/                      # Docker configuration
|   +-- docker-compose.yml       # Production compose file
|   +-- docker-compose.dev.yml   # Development overrides
|   +-- nginx/
|       +-- nginx.conf           # Gateway configuration
|
+-- prisma/                      # Database schema
|   +-- schema.prisma            # Unified Prisma schema
|   +-- seed.ts                  # Database seeding script
|   +-- migrations/              # Migration files
|
+-- scripts/                     # Helper scripts
|   +-- setup.sh                 # Initial setup
|   +-- dev.sh                   # Start development
|   +-- docker-up.sh             # Start with Docker
|   +-- docker-down.sh           # Stop Docker services
|
+-- package.json                 # Root package configuration
+-- pnpm-workspace.yaml          # Workspace configuration
+-- turbo.json                   # Build orchestration
+-- tsconfig.json                # TypeScript configuration
+-- README.md                    # Project documentation
```

### 3.2 Service Directory Structure

#### Payout API (services/payout-api/)
```
payout-api/
+-- src/
|   +-- api/
|   |   +-- main.ts              # API entry point
|   |   +-- routes.ts            # Route definitions
|   |   +-- controllers/
|   |   |   +-- payouts.controller.ts
|   |   |   +-- balance.controller.ts
|   |   |   +-- directory.controller.ts
|   |   |   +-- verification.controller.ts
|   |   +-- middleware/
|   |       +-- auth.middleware.ts
|   |       +-- idempotency.middleware.ts
|   |       +-- audit.logger.ts
|   +-- worker/
|   |   +-- worker.ts            # Background job processor
|   +-- ipn/
|   |   +-- main.ts              # IPN receiver
|   +-- shared/
|       +-- database.ts          # Prisma client
|       +-- types.ts             # Type definitions
|       +-- utils.ts             # Utility functions
+-- prisma/                      # Service-specific Prisma (optional)
+-- package.json
+-- tsconfig.json
+-- Dockerfile
+-- README.md
```

#### Payment API (services/payment-api/)
```
payment-api/
+-- src/
|   +-- main.ts                  # API entry point
|   +-- config/
|   |   +-- database.ts          # Prisma client
|   +-- controllers/
|   |   +-- checkoutController.ts
|   |   +-- paymentController.ts
|   |   +-- portalAuthController.ts
|   |   +-- portalMerchantController.ts
|   |   +-- portalTransactionsController.ts
|   |   +-- portalDashboardController.ts
|   +-- middleware/
|   |   +-- auth.ts              # JWT authentication
|   |   +-- validation.ts        # Request validation
|   +-- services/
|   |   +-- webhookService.ts    # Webhook delivery
|   +-- types/
|       +-- index.ts             # Type definitions
+-- prisma/
+-- package.json
+-- tsconfig.json
+-- Dockerfile
+-- README.md
```

#### Merchant Portal (services/merchant-portal/)
```
merchant-portal/
+-- src/
|   +-- app/                     # Next.js App Router pages
|   |   +-- page.tsx             # Home page
|   |   +-- layout.tsx           # Root layout
|   |   +-- globals.css          # Global styles
|   |   +-- login/page.tsx
|   |   +-- register/page.tsx
|   |   +-- dashboard/page.tsx
|   |   +-- transactions/page.tsx
|   |   +-- credentials/page.tsx
|   |   +-- settings/page.tsx
|   +-- components/
|   |   +-- Layout.tsx           # Main layout component
|   |   +-- ui/                  # UI components
|   +-- contexts/
|   |   +-- AuthContext.tsx      # Authentication context
|   +-- lib/
|       +-- api.ts               # API client
|       +-- utils.ts             # Utilities
+-- public/                      # Static assets
+-- package.json
+-- next.config.js
+-- tailwind.config.js
+-- Dockerfile
```

#### Admin Portal (services/admin-portal/)
```
admin-portal/
+-- src/
|   +-- app/
|   |   +-- page.tsx
|   |   +-- layout.tsx
|   |   +-- login/page.tsx
|   |   +-- dashboard/page.tsx
|   |   +-- merchants/page.tsx
|   |   +-- transactions/page.tsx
|   |   +-- payouts/page.tsx
|   |   +-- settings/page.tsx
|   +-- components/
|   +-- contexts/
|   +-- lib/
+-- public/
+-- package.json
+-- Dockerfile
```

### 3.3 What to Edit Where

| Task | File/Folder |
|------|-------------|
| Add new payout endpoint | services/payout-api/src/api/routes.ts |
| Add new payout controller | services/payout-api/src/api/controllers/ |
| Add new payment endpoint | services/payment-api/src/main.ts |
| Add new payment controller | services/payment-api/src/controllers/ |
| Modify database schema | prisma/schema.prisma |
| Add merchant portal page | services/merchant-portal/src/app/ |
| Add admin portal page | services/admin-portal/src/app/ |
| Modify API gateway routing | docker/nginx/nginx.conf |
| Add shared types | packages/shared/src/types/ |
| Add shared utilities | packages/shared/src/utils/ |
| Modify Docker setup | docker/docker-compose.yml |

---

## 4. ENVIRONMENT VARIABLES REFERENCE

### 4.1 Complete Environment Variables Chart

| Variable | Service | Required | Default | Description |
|----------|---------|----------|---------|-------------|
| DATABASE_URL | All APIs | Yes | - | MySQL connection string |
| PORT | All APIs | No | 3000 | Service port |
| NODE_ENV | All | No | development | Environment mode |
| JWT_SECRET | Payment API | Yes | - | JWT signing secret |
| WEBHOOK_SECRET | Payout API | No | - | Webhook signature secret |
| WEBHOOK_RETRY_ATTEMPTS | Payment API | No | 3 | Webhook retry count |
| WEBHOOK_RETRY_DELAY | Payment API | No | 5000 | Retry delay in ms |
| CHECKOUT_BASE_URL | Payment API | No | - | Base URL for checkout pages |
| NEXT_PUBLIC_API_URL | Portals | Yes | - | Backend API URL |
| NEXT_PUBLIC_PORTAL_URL | Merchant Portal | No | - | Portal public URL |
| NEXT_PUBLIC_ADMIN_PORTAL_URL | Admin Portal | No | - | Admin portal URL |
| DB_PASSWORD | Docker | No | mypay_secret | MySQL root password |
| DB_NAME | Docker | No | mypay_mock_db | Database name |

### 4.2 Sample .env File

```env
# Database
DATABASE_URL=mysql://root:mypay_secret@localhost:3306/mypay_mock_db

# Payout API
PORT=4001
NODE_ENV=development
WEBHOOK_SECRET=your-webhook-secret-key

# Payment API
PORT=4002
JWT_SECRET=your-jwt-secret-key-change-in-production
CHECKOUT_BASE_URL=http://localhost:4002/payment
WEBHOOK_RETRY_ATTEMPTS=3
WEBHOOK_RETRY_DELAY=5000

# Merchant Portal
NEXT_PUBLIC_API_URL=http://localhost:4002
NEXT_PUBLIC_PORTAL_URL=http://localhost:4010

# Admin Portal
NEXT_PUBLIC_API_URL=http://localhost:4002
NEXT_PUBLIC_ADMIN_PORTAL_URL=http://localhost:4011

# Docker
DB_PASSWORD=mypay_secret
DB_NAME=mypay_mock_db
```

### 4.3 Production Environment Variables

For production deployment, use these values:

```env
DATABASE_URL=mysql://root:STRONG_PASSWORD@mysql:3306/mypay_mock_db
NODE_ENV=production
JWT_SECRET=GENERATE_STRONG_SECRET_KEY
WEBHOOK_SECRET=GENERATE_STRONG_SECRET_KEY
CHECKOUT_BASE_URL=https://sandbox.mycodigital.io/payment
NEXT_PUBLIC_API_URL=https://sandbox.mycodigital.io
```

---

## 5. INSTALLATION AND SETUP GUIDE

### 5.1 Prerequisites

Before starting, ensure you have:

| Software | Version | Check Command |
|----------|---------|---------------|
| Node.js | 18.0.0+ | node -v |
| pnpm | 8.0.0+ | pnpm -v |
| Docker | 20.0.0+ | docker -v |
| Docker Compose | 2.0.0+ | docker-compose -v |
| Git | Any | git --version |

### 5.2 Step-by-Step Installation

#### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd mypay-mock-platform
```

#### Step 2: Install pnpm (if not installed)
```bash
npm install -g pnpm
```

#### Step 3: Install Dependencies
```bash
pnpm install
```

This command installs dependencies for all services in the monorepo.

#### Step 4: Create Environment File
```bash
# Copy the example file
cp .env.example .env

# Edit with your values
# On Windows: notepad .env
# On Mac/Linux: nano .env
```

#### Step 5: Start MySQL Database
```bash
# Using Docker
docker-compose -f docker/docker-compose.yml up -d mysql

# Wait for MySQL to be ready (about 30 seconds)
```

#### Step 6: Generate Prisma Client
```bash
npx prisma generate
```

#### Step 7: Run Database Migrations
```bash
npx prisma migrate dev
```

#### Step 8: Seed the Database
```bash
npx prisma db seed
```

#### Step 9: Start Development Servers
```bash
# Start all services
pnpm run dev

# Or start individual services
pnpm run dev:payout      # Payout API on port 4001
pnpm run dev:payment     # Payment API on port 4002
pnpm run dev:merchant-portal  # Merchant Portal on port 4010
pnpm run dev:admin-portal     # Admin Portal on port 4011
```

### 5.3 Using Docker (Alternative)

```bash
# Build and start all services
docker-compose -f docker/docker-compose.yml up -d --build

# View logs
docker-compose -f docker/docker-compose.yml logs -f

# Stop all services
docker-compose -f docker/docker-compose.yml down
```

### 5.4 Verification Steps

After installation, verify each component:

| Component | URL | Expected Response |
|-----------|-----|-------------------|
| Payout API | http://localhost:4001/api/v1/health | {"status":"healthy"} |
| Payment API | http://localhost:4002/health | {"status":"OK",...} |
| Merchant Portal | http://localhost:4010 | Login page |
| Admin Portal | http://localhost:4011 | Login page |

---

## 6. API REFERENCE

### 6.1 Payout API Endpoints (9 Endpoints)

Base URL: /api/v1/

| No. | Method | Endpoint | Auth | Purpose |
|-----|--------|----------|------|---------|
| 1 | GET | /health | No | Health check |
| 2 | POST | /payouts | Yes | Create new payout |
| 3 | GET | /payouts | Yes | List all payouts |
| 4 | GET | /payouts/:id | Yes | Get payout details |
| 5 | POST | /payouts/:id/reinitiate | Yes | Retry failed payout |
| 6 | GET | /balance | Yes | Get merchant balance |
| 7 | GET | /balance/history | Yes | Get balance history |
| 8 | GET | /directory | Yes | Get banks/wallets list |
| 9 | POST | /verify-account | Yes | Verify account details |

#### Payout API Authentication
```
Header: X-API-KEY: <your-api-key>
```

#### Create Payout Request Example
```json
POST /api/v1/payouts
{
  "merchantReference": "PAY-001",
  "amount": 5000,
  "destType": "BANK",
  "bankCode": "HBL",
  "accountNumber": "1234567890",
  "accountTitle": "John Doe"
}
```

### 6.2 Payment API Endpoints (19 Endpoints)

#### Checkout APIs (3 Endpoints)

| No. | Method | Endpoint | Auth | Purpose |
|-----|--------|----------|------|---------|
| 1 | POST | /checkouts | X-Api-Key | Create checkout session |
| 2 | GET | /checkouts/:checkoutId | X-Api-Key | Get checkout details |
| 3 | GET | /transactions/:reference | X-Api-Key | Get transaction status |

#### Payment Page APIs (3 Endpoints)

| No. | Method | Endpoint | Auth | Purpose |
|-----|--------|----------|------|---------|
| 4 | GET | /payment/:sessionId | None | Render payment page |
| 5 | POST | /payment/:sessionId/complete | None | Complete payment |
| 6 | GET | /test-scenarios | None | Get test scenarios |

#### Webhook APIs (2 Endpoints)

| No. | Method | Endpoint | Auth | Purpose |
|-----|--------|----------|------|---------|
| 7 | POST | /webhooks/test | None | Test webhook delivery |
| 8 | POST | /webhooks/process-pending | X-Api-Key | Process pending webhooks |

#### Portal Auth APIs (3 Endpoints)

| No. | Method | Endpoint | Auth | Purpose |
|-----|--------|----------|------|---------|
| 9 | POST | /api/portal/auth/register | None | Register merchant |
| 10 | POST | /api/portal/auth/login | None | Login merchant |
| 11 | POST | /api/portal/auth/logout | None | Logout merchant |

#### Portal Merchant APIs (4 Endpoints)

| No. | Method | Endpoint | Auth | Purpose |
|-----|--------|----------|------|---------|
| 12 | GET | /api/portal/merchant/profile | Bearer | Get profile |
| 13 | PUT | /api/portal/merchant/profile | Bearer | Update profile |
| 14 | GET | /api/portal/merchant/credentials | Bearer | Get API keys |
| 15 | POST | /api/portal/merchant/credentials | Bearer | Generate new API key |

#### Portal Transaction APIs (3 Endpoints)

| No. | Method | Endpoint | Auth | Purpose |
|-----|--------|----------|------|---------|
| 16 | GET | /api/portal/transactions | Bearer | List transactions |
| 17 | GET | /api/portal/transactions/:id | Bearer | Get transaction |
| 18 | GET | /api/portal/transactions/export/:format | Bearer | Export transactions |

#### Portal Dashboard APIs (1 Endpoint)

| No. | Method | Endpoint | Auth | Purpose |
|-----|--------|----------|------|---------|
| 19 | GET | /api/portal/dashboard/stats | Bearer | Get dashboard stats |

#### Create Checkout Request Example
```json
POST /checkouts
Headers:
  X-Api-Key: test-api-key-123

Body:
{
  "reference": "ORD-001",
  "amount": 5000,
  "paymentMethod": "jazzcash",
  "paymentType": "onetime",
  "successUrl": "https://example.com/success",
  "returnUrl": "https://example.com/return"
}
```

### 6.3 API Summary

| Service | Total Endpoints | Public | Authenticated |
|---------|-----------------|--------|---------------|
| Payout API | 9 | 1 | 8 |
| Payment API | 19 | 6 | 13 |
| Total | 28 | 7 | 21 |

### 6.4 API Responsibility Matrix

| API | Responsibility |
|-----|----------------|
| POST /api/v1/payouts | Creates a new bank/wallet payout request |
| GET /api/v1/balance | Returns current available and locked balance |
| GET /api/v1/directory | Returns list of supported banks and wallets |
| POST /checkouts | Creates a payment checkout session |
| GET /payment/:id | Renders the payment form for customers |
| POST /payment/:id/complete | Processes the payment submission |
| /api/portal/auth/* | Handles merchant authentication |
| /api/portal/merchant/* | Manages merchant profile and API keys |
| /api/portal/transactions | Provides transaction history |
| /api/portal/dashboard | Provides statistics for dashboard |

---

## 7. DATABASE SCHEMA REFERENCE

### 7.1 Database Overview

The system uses a single MySQL database with the following table groups:

| Group | Tables | Purpose |
|-------|--------|---------|
| Shared | merchants | Unified merchant data |
| Payout | merchant_balances, payouts, ledger_entries, outbox_events, payout_idempotency_keys, webhook_deliveries, bank_directory, wallet_directory | Payout processing |
| Payment | payment_api_keys, payment_transactions, scenario_mappings, payment_webhook_logs | Payment processing |
| Admin | admin_users, system_config, audit_logs | Administration |

### 7.2 Table Schemas

#### merchants (Shared)
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Primary key |
| uuid | VARCHAR(36) | UNIQUE | UUID identifier |
| name | VARCHAR(255) | NOT NULL | Merchant name |
| company_name | VARCHAR(255) | NULLABLE | Company name |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email address |
| password_hash | VARCHAR(255) | NULLABLE | Hashed password |
| apiKey | VARCHAR(255) | UNIQUE, NOT NULL | Hashed API key |
| webhookUrl | VARCHAR(255) | NULLABLE | Webhook URL |
| isActive | BOOLEAN | DEFAULT true | Active status |
| status | VARCHAR(50) | DEFAULT 'active' | Status string |
| createdAt | DATETIME | DEFAULT NOW() | Creation time |
| updatedAt | DATETIME | AUTO UPDATE | Update time |

#### payouts
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PK | UUID primary key |
| merchantId | INT | FK -> merchants | Merchant reference |
| merchantReference | VARCHAR(255) | NOT NULL | Merchant's reference |
| amount | DECIMAL(15,2) | NOT NULL | Payout amount |
| currency | VARCHAR(3) | DEFAULT 'PKR' | Currency code |
| destType | VARCHAR(20) | NOT NULL | BANK or WALLET |
| bankCode | VARCHAR(20) | NULLABLE | Bank code |
| walletCode | VARCHAR(20) | NULLABLE | Wallet code |
| accountNumber | VARCHAR(50) | NOT NULL | Account number |
| accountTitle | VARCHAR(255) | NOT NULL | Account holder name |
| status | VARCHAR(20) | DEFAULT 'PENDING' | Payout status |
| failureReason | VARCHAR(255) | NULLABLE | Failure reason |
| pspReference | VARCHAR(255) | NULLABLE | PSP reference |
| processedAt | DATETIME | NULLABLE | Processing time |
| createdAt | DATETIME | DEFAULT NOW() | Creation time |
| updatedAt | DATETIME | AUTO UPDATE | Update time |

Unique Constraint: (merchantId, merchantReference)

#### merchant_balances
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PK | UUID primary key |
| merchantId | INT | FK, UNIQUE | Merchant reference |
| balance | DECIMAL(15,2) | DEFAULT 0 | Available balance |
| lockedBalance | DECIMAL(15,2) | DEFAULT 0 | Locked balance |
| version | INT | DEFAULT 0 | Optimistic lock version |
| createdAt | DATETIME | DEFAULT NOW() | Creation time |
| updatedAt | DATETIME | AUTO UPDATE | Update time |

#### payment_transactions
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Primary key |
| checkout_id | VARCHAR(36) | UNIQUE, NOT NULL | Checkout session ID |
| vendor_id | VARCHAR(50) | NULLABLE | Vendor identifier |
| reference | VARCHAR(255) | NOT NULL | Merchant reference |
| amount | DECIMAL(10,2) | NOT NULL | Payment amount |
| payment_method | VARCHAR(20) | NOT NULL | jazzcash/easypaisa/card |
| payment_type | VARCHAR(20) | NOT NULL | Payment type |
| success_url | TEXT | NOT NULL | Success redirect URL |
| return_url | TEXT | NOT NULL | Return redirect URL |
| status | VARCHAR(20) | DEFAULT 'pending' | Transaction status |
| status_code | VARCHAR(50) | NULLABLE | Status code |
| mobile_number | VARCHAR(15) | NULLABLE | Mobile number used |
| user_data | JSON | NULLABLE | User metadata |
| webhook_status | VARCHAR(20) | DEFAULT 'pending' | Webhook status |
| webhook_attempts | INT | DEFAULT 0 | Webhook attempt count |
| merchant_id | INT | FK -> merchants | Merchant reference |
| created_at | DATETIME | DEFAULT NOW() | Creation time |
| updated_at | DATETIME | AUTO UPDATE | Update time |

#### payment_api_keys
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Primary key |
| vendor_id | VARCHAR(50) | UNIQUE | Vendor identifier |
| api_key | VARCHAR(255) | UNIQUE | API key |
| api_secret | TEXT | NOT NULL | API secret |
| merchant_id | INT | FK -> merchants | Merchant reference |
| is_active | BOOLEAN | DEFAULT true | Active status |
| created_at | DATETIME | DEFAULT NOW() | Creation time |

#### scenario_mappings
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Primary key |
| mobile_number | VARCHAR(15) | UNIQUE | Test mobile number |
| scenario | VARCHAR(50) | NOT NULL | Scenario name |
| status | VARCHAR(20) | NOT NULL | Result status |
| status_code | VARCHAR(50) | NOT NULL | Result status code |
| description | TEXT | NOT NULL | Description |
| created_at | DATETIME | DEFAULT NOW() | Creation time |

#### admin_users
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Primary key |
| email | VARCHAR(255) | UNIQUE | Admin email |
| password_hash | VARCHAR(255) | NOT NULL | Hashed password |
| name | VARCHAR(255) | NOT NULL | Admin name |
| role | VARCHAR(20) | DEFAULT 'admin' | Role (admin/super_admin) |
| is_active | BOOLEAN | DEFAULT true | Active status |
| created_at | DATETIME | DEFAULT NOW() | Creation time |
| updated_at | DATETIME | AUTO UPDATE | Update time |

### 7.3 Status Values

#### Payout Statuses
| Status | Description |
|--------|-------------|
| PENDING | Payout created, awaiting processing |
| PROCESSING | Payout being processed |
| SUCCESS | Payout completed successfully |
| FAILED | Payout failed |
| IN_REVIEW | Large amount, needs review |
| ON_HOLD | Payout on hold |

#### Payment Statuses
| Status | Description |
|--------|-------------|
| pending | Payment created, awaiting completion |
| completed | Payment successful |
| failed | Payment failed |
| cancelled | Payment cancelled by user |

### 7.4 Database Relationships

```
merchants
    |
    +-- 1:1 --> merchant_balances
    +-- 1:N --> payouts
    |               +-- 1:N --> ledger_entries
    +-- 1:N --> ledger_entries
    +-- 1:N --> outbox_events
    +-- 1:N --> webhook_deliveries
    +-- 1:N --> payment_api_keys
    +-- 1:N --> payment_transactions
```

---

## 8. NGINX GATEWAY CONFIGURATION

### 8.1 Domain Routing

| Domain | Routes To | Purpose |
|--------|-----------|---------|
| sandbox.mycodigital.io | Multiple backends | API Gateway |
| devportal.mycodigital.io | merchant-portal:3000 | Merchant Portal |
| devadmin.mycodigital.io | admin-portal:3000 | Admin Portal |

### 8.2 Path-Based Routing (sandbox.mycodigital.io)

| Path | Backend | Service |
|------|---------|---------|
| /api/v1/* | payout-api:3000 | Payout API |
| /checkouts | payment-api:3000 | Payment API |
| /transactions | payment-api:3000 | Payment API |
| /payment/* | payment-api:3000 | Payment API |
| /test-scenarios | payment-api:3000 | Payment API |
| /webhooks/* | payment-api:3000 | Payment API |
| /api/portal/* | payment-api:3000 | Portal API |
| /api/admin/* | payment-api:3000 | Admin API |
| /health | Nginx | Health check |
| / | Static response | API info |

### 8.3 Rate Limiting

| Zone | Rate | Burst | Applied To |
|------|------|-------|------------|
| api_limit | 10 req/s | 20 | API endpoints |
| portal_limit | 30 req/s | 50 | Portal pages |

### 8.4 Security Headers

All responses include:
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block

### 8.5 Upstream Configuration

```nginx
upstream payout_api {
    server payout-api:3000;
}

upstream payment_api {
    server payment-api:3000;
}

upstream merchant_portal {
    server merchant-portal:3000;
}

upstream admin_portal {
    server admin-portal:3000;
}
```

---

## 9. DEPLOYMENT GUIDE

### 9.1 VPS Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Storage | 20 GB SSD | 50 GB SSD |
| OS | Ubuntu 20.04+ | Ubuntu 22.04 |

### 9.2 Pre-Deployment Checklist

- [ ] VPS provisioned with SSH access
- [ ] Domain DNS configured
- [ ] SSL certificates obtained (Let's Encrypt)
- [ ] Firewall configured (ports 80, 443, 22)
- [ ] Docker and Docker Compose installed

### 9.3 Deployment Steps

#### Step 1: Connect to VPS
```bash
ssh root@your-vps-ip
```

#### Step 2: Install Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

#### Step 3: Install Docker Compose
```bash
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

#### Step 4: Clone Repository
```bash
cd /opt
git clone <repository-url> mypay-mock-platform
cd mypay-mock-platform
```

#### Step 5: Configure Environment
```bash
cp .env.example .env
nano .env
# Set production values
```

#### Step 6: Start Services
```bash
docker-compose -f docker/docker-compose.yml up -d --build
```

#### Step 7: Run Migrations
```bash
docker exec mypay-payout-api npx prisma migrate deploy
docker exec mypay-payout-api npx prisma db seed
```

#### Step 8: Configure SSL (with Certbot)
```bash
apt install certbot
certbot certonly --standalone -d sandbox.mycodigital.io
certbot certonly --standalone -d devportal.mycodigital.io
certbot certonly --standalone -d devadmin.mycodigital.io
```

### 9.4 Post-Deployment Verification

```bash
# Check all containers are running
docker ps

# Check logs for errors
docker-compose -f docker/docker-compose.yml logs

# Test endpoints
curl https://sandbox.mycodigital.io/health
curl https://sandbox.mycodigital.io/api/v1/health
```

### 9.5 Updating the Deployment

```bash
# Pull latest changes
cd /opt/mypay-mock-platform
git pull origin main

# Rebuild and restart
docker-compose -f docker/docker-compose.yml up -d --build

# Run any new migrations
docker exec mypay-payout-api npx prisma migrate deploy
```

---

## 10. QUALITY ASSURANCE GUIDE

### 10.1 Test Credentials

#### Merchant Portal Login
| Field | Value |
|-------|-------|
| Email | test@mycodigital.io |
| Password | test123456 |

#### Admin Portal Login
| Field | Value |
|-------|-------|
| Email | admin@mycodigital.io |
| Password | admin123456 |

#### Payout API Key
```
Generated during database seeding - check seed output
```

#### Payment API Key
```
X-Api-Key: test-api-key-123
```

### 10.2 Test Data for Payments

#### Mobile Wallet Test Numbers
| Mobile Number | Expected Result | Status Code |
|---------------|-----------------|-------------|
| 03030000000 | SUCCESS | SUCCESS |
| 03021111111 | FAILED | FAILED |
| 03032222222 | TIMEOUT | TIMEOUT |
| 03033333333 | REJECTED | REJECTED |
| 03034444444 | INVALID_OTP | INVALID_OTP |
| 03035555555 | INSUFFICIENT_FUNDS | INSUFFICIENT_FUNDS |
| 03036666666 | ACCOUNT_DEACTIVATED | ACCOUNT_DEACTIVATED |
| 03037777777 | NO_RESPONSE | NO_RESPONSE |
| 03038888888 | INVALID_MPIN | INVALID_MPIN |
| 03039999999 | NOT_APPROVED | NOT_APPROVED |

#### Card Test Numbers
| Card Number | Expected Result |
|-------------|-----------------|
| 4242 4242 4242 4242 | SUCCESS |
| 4111 1111 1111 1111 | SUCCESS |
| 4000 0000 0000 0002 | DECLINED |
| 4000 0000 0000 9995 | INSUFFICIENT_FUNDS |
| 4000 0000 0000 0005 | FAILED |

Card test details:
- Expiry: Any future date (e.g., 12/25)
- CVV: Any 3 digits (e.g., 123)
- Name: Any name

### 10.3 Test Data for Payouts

#### Account Number Test Patterns
| Account Ending | Expected Result |
|----------------|-----------------|
| 0001 | SUCCESS |
| 0002 | RETRY then SUCCESS |
| 0003 | FAILED |
| 0004 | PENDING |
| 0005 | ON_HOLD |

#### Amount-Based Rules
| Amount | Expected Result |
|--------|-----------------|
| >= 100,000 PKR | IN_REVIEW |

### 10.4 Test Cases

#### Payment API Test Cases

| TC No. | Test Case | Steps | Expected Result |
|--------|-----------|-------|-----------------|
| P001 | Create Checkout | POST /checkouts with valid data | 200 OK, checkout URL returned |
| P002 | Invalid API Key | POST /checkouts with wrong key | 401 Unauthorized |
| P003 | Missing Fields | POST /checkouts without reference | 400 Bad Request |
| P004 | Duplicate Reference | POST /checkouts with existing ref | 400 Duplicate error |
| P005 | Get Checkout | GET /checkouts/:id | 200 OK, checkout details |
| P006 | Invalid Checkout ID | GET /checkouts/invalid-id | 404 Not Found |
| P007 | Payment Page Load | GET /payment/:sessionId | 200 OK, HTML page |
| P008 | Complete Payment Success | POST /payment/:id/complete with 03030000000 | Success response |
| P009 | Complete Payment Failed | POST /payment/:id/complete with 03021111111 | Failed response |
| P010 | Card Payment Success | POST /payment/:id/complete with 4242... | Success response |
| P011 | Card Payment Declined | POST /payment/:id/complete with 4000...0002 | Failed response |
| P012 | Webhook Delivery | Complete payment | Webhook sent to successUrl |

#### Payout API Test Cases

| TC No. | Test Case | Steps | Expected Result |
|--------|-----------|-------|-----------------|
| PO001 | Create Payout | POST /api/v1/payouts with valid data | 200 OK, payout created |
| PO002 | Invalid API Key | POST /api/v1/payouts with wrong key | 401 Unauthorized |
| PO003 | Insufficient Balance | Create payout > balance | 400 Insufficient balance |
| PO004 | List Payouts | GET /api/v1/payouts | 200 OK, payout list |
| PO005 | Get Single Payout | GET /api/v1/payouts/:id | 200 OK, payout details |
| PO006 | Get Balance | GET /api/v1/balance | 200 OK, balance info |
| PO007 | Get Directory | GET /api/v1/directory | 200 OK, banks/wallets list |
| PO008 | Verify Account | POST /api/v1/verify-account | 200 OK, verification result |
| PO009 | Idempotency | Same request twice | Same response |
| PO010 | Large Amount Review | Payout >= 100,000 | Status: IN_REVIEW |

#### Portal Test Cases

| TC No. | Test Case | Steps | Expected Result |
|--------|-----------|-------|-----------------|
| PR001 | Merchant Registration | Fill form, submit | Account created, password shown |
| PR002 | Merchant Login | Enter credentials | Redirected to dashboard |
| PR003 | Invalid Login | Wrong password | Error message |
| PR004 | View Dashboard | Login, go to dashboard | Statistics displayed |
| PR005 | View Transactions | Go to transactions page | Transaction list shown |
| PR006 | View Credentials | Go to credentials page | API keys displayed |
| PR007 | Generate New Key | Click generate | New key created |
| PR008 | Update Profile | Change company name | Profile updated |
| PR009 | Change Password | Enter old/new password | Password changed |
| PR010 | Logout | Click logout | Redirected to login |

### 10.5 Core Functionality That Must Stay Intact

After any change or enhancement, verify these core functions:

#### Critical Payment Functions
1. Checkout creation must return valid checkout URL
2. Payment page must render correctly for all payment methods
3. Payment completion must update transaction status
4. Webhooks must be delivered to merchant URL
5. Transaction status must be queryable by reference

#### Critical Payout Functions
1. Payout creation must deduct from balance
2. Balance must never go negative
3. Payout status must be trackable
4. Webhooks must be delivered for status changes
5. Idempotency must prevent duplicate payouts

#### Critical Portal Functions
1. Login/logout must work correctly
2. Dashboard must show accurate statistics
3. Transaction list must be filterable
4. API credentials must be viewable and regeneratable

### 10.6 API Testing with Postman/cURL

#### Test Payment Checkout
```bash
curl -X POST https://sandbox.mycodigital.io/checkouts \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: test-api-key-123" \
  -d '{
    "reference": "TEST-001",
    "amount": 1000,
    "paymentMethod": "jazzcash",
    "paymentType": "onetime",
    "successUrl": "https://example.com/success",
    "returnUrl": "https://example.com/return"
  }'
```

#### Test Payout Creation
```bash
curl -X POST https://sandbox.mycodigital.io/api/v1/payouts \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your-api-key" \
  -d '{
    "merchantReference": "PAY-001",
    "amount": 5000,
    "destType": "BANK",
    "bankCode": "HBL",
    "accountNumber": "12345670001",
    "accountTitle": "Test Account"
  }'
```

#### Test Portal Login
```bash
curl -X POST https://sandbox.mycodigital.io/api/portal/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@mycodigital.io",
    "password": "test123456"
  }'
```

### 10.7 Regression Testing Checklist

Before each release, verify:

- [ ] All test cases pass
- [ ] Payment flow works end-to-end
- [ ] Payout flow works end-to-end
- [ ] Portal login/logout works
- [ ] Dashboard shows correct data
- [ ] Webhooks are delivered
- [ ] Error messages are clear
- [ ] No console errors in portals
- [ ] API responses match documentation

---

## 11. TROUBLESHOOTING GUIDE

### 11.1 Common Issues and Solutions

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| Cannot connect to database | MySQL not running | docker-compose up -d mysql |
| API returns 401 | Invalid API key | Check API key in request header |
| API returns 500 | Database connection failed | Check DATABASE_URL in .env |
| Portal login fails | Wrong credentials | Use test@mycodigital.io / test123456 |
| Webhook not received | Incorrect URL | Check successUrl in checkout request |
| Payment page blank | Service not running | Check payment-api container logs |
| Prisma error | Schema mismatch | Run npx prisma migrate dev |
| Port already in use | Another service running | Kill process or change port |
| Docker build fails | Cache issues | docker-compose build --no-cache |

### 11.2 Log Locations

| Service | Docker Log Command |
|---------|-------------------|
| Payout API | docker logs mypay-payout-api |
| Payment API | docker logs mypay-payment-api |
| Merchant Portal | docker logs mypay-merchant-portal |
| Admin Portal | docker logs mypay-admin-portal |
| Nginx | docker logs mypay-gateway |
| MySQL | docker logs mypay-mysql |

### 11.3 Health Check Commands

```bash
# Check all services
docker ps

# Check API health
curl http://localhost:4001/api/v1/health
curl http://localhost:4002/health

# Check database
docker exec mypay-mysql mysqladmin ping -u root -p

# Check Nginx
docker exec mypay-gateway nginx -t
```

### 11.4 Database Troubleshooting

```bash
# Connect to MySQL
docker exec -it mypay-mysql mysql -u root -p

# Check tables
SHOW TABLES;

# Check merchant data
SELECT * FROM merchants;

# Reset database
npx prisma migrate reset
```

---

## 12. APPENDIX

### 12.1 Glossary

| Term | Definition |
|------|------------|
| Checkout | A payment session created for collecting payment |
| Payout | A transfer of funds from merchant to bank/wallet |
| Merchant | A business using the platform to collect/send payments |
| Webhook | HTTP callback sent when an event occurs |
| Idempotency | Ensuring same request produces same result |
| PSP | Payment Service Provider |
| JWT | JSON Web Token for authentication |
| ORM | Object-Relational Mapping |
| Monorepo | Single repository containing multiple projects |

### 12.2 Supported Banks

| Code | Bank Name |
|------|-----------|
| HBL | Habib Bank Limited |
| UBL | United Bank Limited |
| MCB | MCB Bank Limited |
| ABL | Allied Bank Limited |
| JSBL | JS Bank Limited |
| BAHL | Bank Al Habib Limited |
| MEEZAN | Meezan Bank Limited |
| ASKARI | Askari Bank Limited |
| SONERI | Soneri Bank Limited |
| FBL | Faysal Bank Limited |
| BOP | Bank of Punjab |
| NBP | National Bank of Pakistan |

### 12.3 Supported Wallets

| Code | Wallet Name |
|------|-------------|
| EASYPAISA | Easypaisa |
| JAZZCASH | JazzCash |
| SADAPAY | SadaPay |
| NAYAPAY | NayaPay |

### 12.4 HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful request |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Invalid/missing auth |
| 403 | Forbidden | Not allowed |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Internal error |

### 12.5 File Quick Reference

| Need To | Look In |
|---------|---------|
| Add payout endpoint | services/payout-api/src/api/routes.ts |
| Add payment endpoint | services/payment-api/src/main.ts |
| Change database schema | prisma/schema.prisma |
| Add merchant portal page | services/merchant-portal/src/app/ |
| Add admin portal page | services/admin-portal/src/app/ |
| Change API routing | docker/nginx/nginx.conf |
| Change Docker config | docker/docker-compose.yml |
| Add shared code | packages/shared/src/ |

### 12.6 Command Quick Reference

| Task | Command |
|------|---------|
| Install dependencies | pnpm install |
| Start all services | pnpm run dev |
| Start payout API | pnpm run dev:payout |
| Start payment API | pnpm run dev:payment |
| Start merchant portal | pnpm run dev:merchant-portal |
| Start admin portal | pnpm run dev:admin-portal |
| Generate Prisma client | npx prisma generate |
| Run migrations | npx prisma migrate dev |
| Seed database | npx prisma db seed |
| Start Docker services | docker-compose -f docker/docker-compose.yml up -d |
| Stop Docker services | docker-compose -f docker/docker-compose.yml down |
| View Docker logs | docker-compose -f docker/docker-compose.yml logs -f |

---

## Document Information

- Document Title: MYPAY-MOCK-SYSTEM-GUIDE
- Version: 1.0.0
- Last Updated: December 2024
- Author: MyPay Development Team
- Status: Final

---

End of Document

