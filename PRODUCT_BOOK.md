# MyPay and DarPay Mock Platform Product Book

Version: 1.0
Last updated: 2026-03-06
Source of truth: code and config in this repository

## 1. Purpose and Scope

This Product Book is the end-to-end technical and product guide for the mock payment ecosystem in this monorepo. It is written for:

- Developers building new features
- QA engineers validating behavior
- DevOps engineers deploying and operating the stack
- Product and implementation teams onboarding merchants

It covers:

- What the system does
- How it is built
- Data model and multitenancy
- Merchant, admin, and superadmin capabilities
- Payment, payout, and payment-page behavior
- API map and authentication
- Docker and Nginx deployment
- Test credentials and environment setup
- How to add new features safely

## 2. Product Overview

The platform is a sandbox and mock environment for Pakistani FinTech payment integrations.

Core capabilities:

- Payment checkout creation and completion (Easypaisa, JazzCash, Card)
- Payout creation and background processing (bank and wallet destinations)
- Merchant self-service portal (profile, credentials, transactions, payouts, payment-page config)
- Admin portal (merchant lifecycle management and global oversight)
- Configurable hosted payment page with merchant themes and admin policy rules
- Deterministic test scenarios for predictable outcomes

This is not a live acquiring/settlement system; it is designed for testing and integration workflows.

## 3. System Architecture

### 3.1 Services

- `services/payment-api`: checkout, payment completion, portal APIs, admin APIs, payment-page config APIs
- `services/payout-api`: payout APIs, balance APIs, directory APIs, account verification
- `services/payout-api` worker process: asynchronous payout processing and payout webhook delivery
- `services/merchant-portal`: Next.js merchant web app
- `services/admin-portal`: Next.js admin web app
- `services/payment-page`: Vite/React hosted checkout UI (config-driven)
- `mysql`: unified datastore for all services

### 3.2 Data and control flow

- Payment flow:
  1. Merchant backend calls Payment API `POST /api/v1/checkouts`.
  2. API stores `payment_transactions` record.
  3. API returns checkout URL pointing to Payment Page service.
  4. User completes payment via Payment API `POST /payment/:sessionId/complete`.
  5. Payment API updates status and sends webhook to merchant success URL.

- Payout flow:
  1. Merchant backend calls Payout API `POST /api/v1/payouts` with API key and idempotency key.
  2. API validates, locks balance, creates payout and outbox event.
  3. Worker picks `PENDING` payouts, transitions status, updates balances, writes ledger.
  4. Worker creates webhook deliveries from outbox events.

### 3.3 Monorepo orchestration

- Package manager: `pnpm` workspaces (`pnpm-workspace.yaml`)
- Build orchestration: `turbo` (`turbo.json`)
- Root workspace paths: `packages/*`, `services/*`

## 4. Technology Stack

Backend:

- Node.js 18+
- TypeScript
- Express
- Prisma ORM with MySQL
- JWT (merchant and admin sessions)

Frontend:

- Next.js 14 (merchant portal, admin portal)
- React + Vite (payment-page frontend)
- Tailwind CSS

Infra:

- Docker and Docker Compose
- Nginx reverse proxy with TLS termination

## 5. Repository Structure

High-value paths:

- `package.json`: root scripts and workspace-level commands
- `docker-compose.yml`: top-level multi-service runtime (DarPay naming)
- `docker/docker-compose.yml`: alternate compose setup (MyPay naming + gateway service)
- `prisma/schema.prisma`: unified schema for payment, payout, admin, and page config domains
- `prisma/seed.ts`: test data, credentials, scenarios, templates, admin account
- `nginx/mypay.conf`, `nginx/darpay-vps.conf`, `nginx/darpay-vstore.conf`: domain routing variants
- `services/payment-api/src/main.ts`: route registration and API surface
- `services/payout-api/src/api/routes.ts`: payout API surface

## 6. Multitenancy Model

Multitenancy is merchant-centric.

Tenant key:

- `Merchant.id` is the core tenant identifier across services.

Tenant isolation patterns in code:

- Portal transaction list filters by `payment_transactions.merchant_id = req.merchantId`.
- Portal payouts list filters by `payouts.merchantId = req.merchantId`.
- Payout APIs always scope by authenticated merchant from API key.
- Admin routes can view cross-merchant datasets.

Data partitioning:

- Shared physical database, logical isolation by merchant FK columns.
- No separate schema per merchant.

## 7. Identity, Roles, and Access Control

### 7.1 Merchant

Authentication:

- JWT bearer token from `POST /api/v1/portal/auth/login`.
- Token includes `merchantId` and is validated in `requireAuth` middleware.

Capabilities:

- View/update profile
- View/generate API credentials
- View/export own transactions and payouts
- View dashboard
- Manage own payment-page configurations

### 7.2 Admin

Authentication:

- JWT bearer token from `POST /api/v1/admin/auth/login`.
- Token includes `adminId` and `role`, validated in `requireAdminAuth` middleware.

Capabilities:

- Merchant CRUD and status toggles
- Password reset and merchant email update
- System-wide transaction and payout views
- Payment-page governance (rules/templates/global config visibility)

### 7.3 Superadmin

Current implementation:

- `admin_users.role` supports `admin` and `super_admin`.
- Seed creates a `super_admin` account.
- Route-level role differentiation is minimal today (mostly authenticated admin access).

Recommendation for enhancement:

- Add explicit role checks at route/controller level for superadmin-only operations.

## 8. Authentication and Security Model

### 8.1 Payment API auth modes

- Checkout auth: API key via `X-API-Key` (validated against `payment_api_keys`).
- Portal auth: merchant JWT bearer token.
- Admin auth: admin JWT bearer token.

### 8.2 Payout API auth

- API key via `X-API-KEY`.
- Stored merchant payout key is hash in `merchants.apiKey` (SHA-256 from middleware utility path).

### 8.3 Idempotency

Payout mutating endpoints require:

- `X-Idempotency-Key` UUID
- Server stores key/request hash in `payout_idempotency_keys`
- Duplicate same payload returns cached response
- Duplicate key with different payload returns conflict

### 8.4 Webhooks

- Payment webhooks: sent to transaction success URL with retry and logs in `payment_webhook_logs`
- Payout webhooks: outbox-driven; signed header `X-DarPay-Signature`, logs in `webhook_deliveries`

## 9. Database Architecture

Unified MySQL schema in `prisma/schema.prisma`.

### 9.1 Core tables

- `merchants`: shared tenant identity across payment and payout
- `merchant_balances`: payout balance and locked amount with optimistic lock version
- `payment_api_keys`: checkout API keys (`vendor_id`, `api_key`, `api_secret`, optional merchant link)
- `admin_users`: admin identities and role

### 9.2 Payment domain

- `payment_transactions`: checkout/payment lifecycle data
- `scenario_mappings`: deterministic mobile-number outcomes
- `payment_webhook_logs`: outbound webhook tracking

### 9.3 Payout domain

- `payouts`: payout requests and processing state
- `ledger_entries`: balance movements
- `outbox_events`: event queue for payout webhooks
- `payout_idempotency_keys`: dedupe cache
- `webhook_deliveries`: payout webhook delivery attempts
- `bank_directory`, `wallet_directory`: supported destinations

### 9.4 Admin and ops domain

- `system_config`: global key/value runtime settings
- `audit_logs`: user action logs

### 9.5 Payment-page domain

- `payment_page_configs`: merchant themes and behavior settings
- `payment_page_rules`: admin validation/lock rules
- `payment_page_templates`: reusable style and behavior templates

## 10. API Surface (Canonical)

Base URLs are environment-dependent. In code, the main API prefix is `/api/v1`.

### 10.1 Payment API

Public and integration:

- `GET /api/v1/health`
- `POST /api/v1/checkouts`
- `GET /api/v1/checkouts/:checkoutId`
- `GET /api/v1/transactions/:reference`
- `GET /api/v1/test-scenarios`
- `GET /payment/:sessionId`
- `POST /payment/:sessionId/complete`
- `GET /api/v1/payment-page/session/:checkoutId`

Merchant portal auth and profile:

- `POST /api/v1/portal/auth/register`
- `POST /api/v1/portal/auth/login`
- `POST /api/v1/portal/auth/logout`
- `GET /api/v1/portal/merchant/profile`
- `PUT /api/v1/portal/merchant/profile`
- `GET /api/v1/portal/merchant/credentials`
- `POST /api/v1/portal/merchant/credentials`

Merchant portal business data:

- `GET /api/v1/portal/dashboard/stats`
- `GET /api/v1/portal/transactions`
- `GET /api/v1/portal/transactions/:id`
- `GET /api/v1/portal/transactions/export/:format`
- `GET /api/v1/portal/payouts`
- `GET /api/v1/portal/payouts/:id`
- `GET /api/v1/portal/payouts/export/:format`

Payment page merchant customization:

- `GET /api/v1/portal/payment-page/configs`
- `GET /api/v1/portal/payment-page/configs/default`
- `GET /api/v1/portal/payment-page/configs/:id`
- `POST /api/v1/portal/payment-page/configs`
- `POST /api/v1/portal/payment-page/configs/from-template`
- `PUT /api/v1/portal/payment-page/configs/:id`
- `DELETE /api/v1/portal/payment-page/configs/:id`
- `POST /api/v1/portal/payment-page/configs/:id/activate`
- `GET /api/v1/portal/payment-page/templates`
- `GET /api/v1/portal/payment-page/rules`

Admin:

- `POST /api/v1/admin/auth/login`
- `GET /api/v1/admin/merchants`
- `GET /api/v1/admin/merchants/:id`
- `POST /api/v1/admin/merchants`
- `PUT /api/v1/admin/merchants/:id`
- `POST /api/v1/admin/merchants/:id/toggle-status`
- `POST /api/v1/admin/merchants/:id/reset-password`
- `PUT /api/v1/admin/merchants/:id/email`
- `GET /api/v1/admin/transactions`
- `GET /api/v1/admin/payouts`
- `GET|POST|PUT|DELETE /api/v1/admin/payment-page/rules...`
- `GET|POST|PUT|DELETE /api/v1/admin/payment-page/templates...`
- `GET /api/v1/admin/payment-page/configs`
- `GET /api/v1/admin/payment-page/configs/:id`

### 10.2 Payout API

- `GET /api/v1/health`
- `POST /api/v1/payouts`
- `GET /api/v1/payouts`
- `GET /api/v1/payouts/:id`
- `POST /api/v1/payouts/:id/reinitiate`
- `GET /api/v1/balance`
- `GET /api/v1/balance/history`
- `GET /api/v1/directory`
- `POST /api/v1/verify-account`

## 11. Payment Page Product and Technical Model

The payment page is a standalone React/Vite application in `services/payment-page`.

Routing:

- `/:checkoutId`
- `/pay/:checkoutId`

Session fetch:

- Calls Payment API `GET /api/v1/payment-page/session/:checkoutId` to fetch checkout details and merged merchant theme config.

Completion call:

- Submits to `POST /payment/:checkoutId/complete`.

Config model supports:

- Branding, colors, typography, layout
- Channel enablement and order
- Text and legal blocks
- Success/failure page behavior
- Field visibility and OTP behavior
- Optional custom CSS

Admin can define lock or validation policies through payment-page rules.

## 12. Payout Processing Mechanics

Synchronous API step:

- Validates request and destination
- Ensures merchant balance and optimistic lock consistency
- Moves amount into locked balance
- Writes payout, ledger entry, and outbox event

Asynchronous worker step:

- Poll interval: 5 seconds
- Picks pending payouts, sets `PROCESSING`, computes deterministic scenario outcome
- Updates final status and balance/ledger
- Processes outbox to webhook deliveries

## 13. Local Development and Build

### 13.1 Prerequisites

- Node.js 18+
- pnpm 8+
- MySQL 8 or Docker Desktop

### 13.2 Key root commands

- `pnpm install`
- `pnpm run db:generate`
- `pnpm run db:migrate`
- `pnpm run db:seed`
- `pnpm run dev`
- `pnpm run dev:payment`
- `pnpm run dev:payout`
- `pnpm run dev:merchant-portal`
- `pnpm run dev:admin-portal`
- `pnpm run dev:payment-page`

## 14. Docker Deployment

There are two compose models in repo:

- Root `docker-compose.yml`: DarPay naming, includes payment-page, resource limits, and production-style env wiring.
- `docker/docker-compose.yml`: MyPay naming with explicit Nginx gateway container.

Choose one model and standardize for your target environment to avoid drift.

Common container ports used:

- MySQL: `3306`
- Payout API: `4001`
- Payment API: `4002`
- Merchant portal: `4010`
- Admin portal: `4011`
- Payment page: `4012` (or domain-routed)

## 15. Nginx and Domain Routing

Nginx configs in `nginx/` support different domain topologies.

Files:

- `nginx/mypay.conf`: mypay-style routing matrix
- `nginx/darpay-vps.conf`: isolated vstore.cloud VPS setup
- `nginx/darpay-vstore.conf`: alternative vstore.cloud mapping

Typical approach:

- `api-*` domain routes API paths to payment and payout services
- Merchant and admin subdomains route to respective Next.js frontends
- Payment-page domain routes to payment-page service
- TLS via Let's Encrypt cert paths in server blocks

## 16. Credentials and Test Data

Seed data in `prisma/seed.ts` creates:

Merchant logins:

- `test@mycodigital.io` / `test123456`
- `hasaniqbal@mycodigital.io` / `hasan123456`

Admin login:

- `admin@mycodigital.io` / `admin@@1234` (role: `super_admin`)

Payment API keys (sample seeded):

- `test-api-key-123`
- `hasan-api-key-789`

Payout API keys:

- Generated with `mypay_` prefix and stored hashed in `merchants.apiKey`
- Plain key also stored in `merchants.apiKeyPlain` for portal display

Security note:

- Rotate all seeded/default credentials before external sharing.
- Never use seeded secrets in production.

## 17. Environment Variables

Use `.env.example` as baseline and `.env.production` for production template.

Critical secrets to set:

- `DATABASE_URL`
- `DB_PASSWORD`
- `JWT_SECRET`
- `WEBHOOK_SECRET`
- `API_KEY_SECRET`

Key URLs to align:

- `PAYMENT_PAGE_URL`
- `NEXT_PUBLIC_API_URL`
- Portal domain variables

## 18. Observability and Audit

Implemented logging and tracking includes:

- Request/response audit middleware in payout and payment APIs
- Payment webhook attempts in `payment_webhook_logs`
- Payout webhook attempts in `webhook_deliveries`
- Admin and merchant action log model in `audit_logs`

## 19. Known Repository Nuances

Important for new developers:

- Naming is mixed (`mypay` and `darpay`) across files, package names, container names, and domains.
- Multiple Nginx and compose variants exist for different deployment histories.
- Some frontend API clients include local mock fallbacks when APIs are unreachable.

Recommended operational standardization:

- Select one canonical naming and domain scheme.
- Select one canonical compose + Nginx stack for production.
- Keep environment-specific overlays in separate clearly named files.

## 20. Feature Development Guide

### 20.1 Add a new backend feature

1. Define product behavior and API contract.
2. Update Prisma schema (if needed).
3. Create migration and seed updates.
4. Add controller/service logic.
5. Wire route registration.
6. Add auth and tenant checks.
7. Add audit log event.
8. Update portal/admin client API calls.
9. Update docs and Postman collection.

### 20.2 Add a merchant-scoped feature safely

- Always read merchant ID from auth context, never from raw body alone.
- Add `where: { merchant_id: req.merchantId }` or equivalent relation filter.
- Do not return cross-merchant data in list or get endpoints.

### 20.3 Add an admin-only feature

- Protect route with admin auth middleware.
- If sensitive, add explicit role gate (`super_admin`) before action.
- Write audit log entry for mutating actions.

### 20.4 Extend payment page customization

1. Add new config field in TypeScript types.
2. Add defaults merge logic in payment-page defaults config.
3. Add validation rule support in API config validation service.
4. Add DB storage field in `payment_page_configs` JSON sections.
5. Expose in merchant editor and session payload.

## 21. QA and Validation Checklist

Before release:

- Payment checkout create/get/status endpoints pass
- Payment completion scenarios (success/fail) pass
- Payout creation + worker transitions pass
- Idempotency replay and conflict behavior pass
- Merchant tenant isolation checks pass
- Admin cross-merchant access checks pass
- Payment-page config activation and session rendering pass
- Webhook retry and logging pass
- Docker compose boot and health checks pass
- Nginx routes and TLS certs validated

## 22. Production Hardening Checklist

- Rotate all seeded credentials and secrets
- Restrict DB exposure to private network
- Enforce HTTPS only and modern TLS config
- Add explicit superadmin route guards where needed
- Add rate limiting for auth and write endpoints
- Add centralized log aggregation and alerting
- Back up MySQL and test restore
- Add integration and smoke tests to CI

## 23. Canonical Startup Paths

For local full-stack development:

1. Start MySQL.
2. Run migrations and seed.
3. Start payment API, payout API, payout worker.
4. Start merchant portal and admin portal.
5. Start payment-page frontend.

For containerized run:

1. Select compose file variant.
2. Provide `.env` values.
3. `docker compose up -d --build`.
4. Run DB migrations and seed from API container.
5. Validate health endpoints and portal logins.

## 24. Final Notes

This Product Book intentionally reflects the implementation currently present in code. If behavior changes, update this document together with:

- `prisma/schema.prisma`
- API route files
- portal API clients
- deployment manifests

That keeps architecture, code, and operations in sync.
