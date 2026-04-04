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

## 24. Settlix Deployment (Client Organization)

### 24.1 Overview

Settlix is the first standalone client deployment — a fully branded payment platform running on its own VPS with its own domain. It uses the same Docker images from this monorepo but with all branding, colors, logos, and API URLs configured via environment variables and build args.

- **Domain:** `settlix.net` (wildcard DNS)
- **VPS:** `168.144.66.40` (Contabo, Ubuntu)
- **Deployment repo:** `hasaniqbal-lead/settlix-deployment` (private)
- **Approach:** Pull `hasanvatrix/darpay-*` images from Docker Hub, brand via env vars + `:settlix` tagged frontend images

### 24.2 Live URLs (Sandbox)

| Service | URL | Port |
|---------|-----|------|
| Payment API + Payout API | `https://sbx-api.settlix.net` | 5002 / 5001 |
| Merchant Portal | `https://sbx-merchant.settlix.net` | 5010 |
| Admin Portal | `https://sbx-admin.settlix.net` | 5011 |
| Payment Page | `https://sbx-pay.settlix.net` | 5012 |
| API Documentation | `https://docs.settlix.net` | static (nginx) |

Reserved (future): `sbx-send`, `sbx-wallet`, `sbx-card`, `sbx-qr`, `sbx-raast`, `sbx-payout`, `sbx-webhook`, `sbx-listener`

### 24.3 Docker Images & Tags

| Service | Image | Tag |
|---------|-------|-----|
| Payment API | `hasanvatrix/darpay-payment-api` | `latest` |
| Payout API | `hasanvatrix/darpay-payout-api` | `latest` |
| Merchant Portal | `hasanvatrix/darpay-merchant-portal` | `settlix` |
| Admin Portal | `hasanvatrix/darpay-admin-portal` | `settlix` |
| Payment Page | `hasanvatrix/darpay-payment-page` | `settlix` |
| MySQL | `mysql:8.0` | `8.0` |

The `:settlix` tagged images are built via the `build-branded.yml` GitHub Actions workflow with Settlix-specific build args (brand name, color, logo, API URLs baked in at Next.js/Vite build time).

### 24.4 Branding Configuration

| Variable | Value |
|----------|-------|
| `ORG_BRAND_NAME` | Settlix |
| `ORG_SLUG` | settlix |
| `ORG_EMAIL_DOMAIN` | settlix.net |
| `ORG_PRIMARY_COLOR` | #3B9EE8 |
| `NEXT_PUBLIC_ORG_BRAND_NAME` | Settlix |
| `NEXT_PUBLIC_ORG_PRIMARY_COLOR` | #3B9EE8 |
| `NEXT_PUBLIC_ORG_LOGO_URL` | /settlix-logo.png |
| `NEXT_PUBLIC_API_URL` | https://sbx-api.settlix.net |

### 24.5 API Key Format

Unified format across all organizations:

| Key Type | Format | Purpose |
|----------|--------|---------|
| Payment Key | `{org}_pk_{64 hex chars}` | Checkout creation, transaction queries |
| Send Key | `{org}_sk_{64 hex chars}` | Payout disbursements, balance queries |

Examples:
- `settlix_pk_46dc9cec...` (payment key for vatrix merchant)
- `settlix_sk_c56afd1c...` (send key for vatrix merchant)

Payment keys are stored in the `payment_api_keys` table (plain text, matched directly).
Send keys are stored as SHA256 hash in `merchants.apiKey`, plain text in `merchants.apiKeyPlain`.

### 24.6 Database

- Container: `settlix-mysql` (port 5306)
- Database: `settlix_db`
- Schema: identical to all orgs (managed by Prisma)

### 24.7 Admin Credentials

| Email | Password | Role |
|-------|----------|------|
| `admin@settlix.net` | `admin@@1234` | System admin (seeded) |
| `osama@settlix.net` | `osama@@321@` | Admin |

### 24.8 Test Merchant

| Field | Value |
|-------|-------|
| Name | vatrix |
| Email | `vatrix@settlix.net` |
| Payment Key | `settlix_pk_46dc9cecf61278c3862e27ab633f9daf36550e58438ac2f8458834b2dba56375` |
| Send Key | `settlix_sk_c56afd1c5e6ce3831a1b13a12b5b00e1d6787423bd41427667076c86bfb65b31` |
| Sandbox Balance | 10,000,000 PKR |

### 24.9 CI/CD

**Core images:** Built by `.github/workflows/deploy.yml` on push to `main` in MYPAY-MOCK-SYSTEM-2025. Pushes `:latest` tags.

**Branded images:** Built by `.github/workflows/build-branded.yml` (manual trigger / workflow_dispatch). Pushes `:settlix` tags with build args for branding.

**Deployment:** `settlix-deployment` repo has its own `.github/workflows/deploy.yml` — SSHs to Settlix VPS, pulls images, restarts containers.

### 24.10 Nginx

Config at `/etc/nginx/sites-available/settlix-sbx.conf`:
- `sbx-api.settlix.net` → localhost:5002 (catch-all) + localhost:5001 (`/api/v1/payouts` prefix)
- `sbx-merchant.settlix.net` → localhost:5010 (WebSocket upgrade for Next.js HMR)
- `sbx-admin.settlix.net` → localhost:5011
- `sbx-pay.settlix.net` → localhost:5012
- `docs.settlix.net` → static files at `/opt/settlix/docs/`

SSL: Let's Encrypt via Certbot, auto-redirect HTTP → HTTPS, auto-renewal.

### 24.11 API Documentation

Live at `https://docs.settlix.net`:
- Powered by Scalar (CDN) with light theme forced via CSS overrides
- OpenAPI 3.0 spec at `/openapi.yaml` — merchant-facing endpoints only (12 endpoints)
- Settlix header bar with logo
- No dark mode, no "Powered by Scalar" branding
- Covers: Health, Checkout (create/get/status), Payouts (CRUD + balance + directory + verify), Webhooks

### 24.12 Postman Collections

| Collection | File | Endpoints | Pre-configured Key |
|------------|------|-----------|-------------------|
| Settlix Payment API | `Settlix_Payment_API.postman_collection.json` | 53 | `settlix_pk_46dc...` |
| Settlix Payout API | `Settlix_Payout_API.postman_collection.json` | 16 | `settlix_sk_c56a...` |

Both collections:
- Base URL: `https://sbx-api.settlix.net`
- Auto-save tokens and IDs via test scripts
- Ready to import and run — no environment setup needed

### 24.13 Merchant Portal Features

| Feature | Status |
|---------|--------|
| Payment checkout (Easypaisa, JazzCash, Card) | Live |
| Configurable checkout expiry (15min to 7 days) | Live |
| Quick Payment Link generator (dashboard widget) | Live |
| Payout disbursements (Bank + Wallet) | Live |
| Merchant self-registration with auto payout key | Live |
| Transaction detail drawer + receipt download | Live |
| Refund system (full + partial, dedicated /refunds page) | Live |
| Multi-key management (create/toggle/delete) | Live |
| API credit counter (dashboard widget) | Live |
| Team members + roles (10 role types, auto-gen credentials) | Live |
| Support tickets (create, reply, conversation thread) | Live |
| Settlement requests (date range, auto-calculated) | Live |
| Mobile-native bottom nav + PWA | Live |
| Rate limiting (5/sec, 30/min, 500/hr, 5000/day) | Live |

### 24.14 Admin Portal Features

| Feature | Page | Status |
|---------|------|--------|
| Dashboard (real stats + pending actions + health checks) | `/dashboard` | Live |
| Operations Center (5 tabs: users, methods, blacklist, notifications, logs) | `/operations` | Live |
| Merchant management (CRUD + keys + password reset) | `/merchants` | Live |
| Merchant detail (rates, limits, keys — per-merchant config) | `/merchants/[id]` | Live |
| Payment transactions (table + filters + search) | `/transactions` | Live |
| Payout transactions (table + filters) | `/payouts` | Live |
| Refund management (approve/reject with admin notes) | `/refunds` | Live |
| Settlement management (review/approve/complete/reject) | `/settlements` | Live |
| Support ticket management (reply + status control) | `/tickets` | Live |
| Finance & Settlement Engine (revenue, PSP costs, margins, per-merchant) | `/finance` | Live |
| PSP Management (CRUD, credentials, rates, margin analysis) | `/psp` | Live |
| Send Money (3-step flow with secret key auth) | `/send-money` | Live |
| Payment Page admin (rules, templates, merchant configs) | `/payment-page` | Live |
| System Settings (webhook retry, checkout expiry, maintenance mode) | `/settings` | Live |

### 24.15 Admin Portal API Endpoints (50+)

| Group | Endpoints |
|-------|-----------|
| Auth | POST /admin/auth/login |
| Stats | GET /admin/stats |
| Merchants | GET/POST/PUT /admin/merchants, toggle-status, reset-password, email |
| Merchant Rates | GET/POST /admin/merchants/:id/rates |
| Transactions | GET /admin/transactions |
| Payouts | GET /admin/payouts |
| Refunds | GET /admin/refunds, PUT /admin/refunds/:id/status |
| Tickets | GET /admin/tickets, GET/:id, POST/:id/reply, PUT/:id/status |
| Settlements | GET /admin/settlements, PUT/:id/status |
| Admin Users | GET/POST /admin/users, POST/:id/toggle |
| Blacklist | GET/POST/DELETE /admin/blacklist |
| Methods | GET/PUT /admin/methods |
| Notifications | GET/POST /admin/notifications |
| Activity Logs | GET /admin/activity-logs |
| PSP | GET/POST/PUT /admin/psps, credentials, rates |
| Finance | GET /admin/finance/overview, by-method, by-merchant |
| Margins | GET /admin/margins |
| Payment Page | Rules CRUD, Templates CRUD, Configs list |

### 24.16 Database Models (25+)

Core: Merchant, ApiKey, PaymentTransaction, Payout, MerchantBalance, LedgerEntry
Auth: AdminUser, MerchantTeamMember
Config: PaymentPageConfig, PaymentPageTemplate, PaymentPageRule, SystemConfig
Finance: PSP, PSPCredential, PSPRate, MerchantRate
Operations: BlacklistEntry, PaymentMethodConfig, AdminNotification, ActivityLog2
Transactions: Refund, SupportTicket, TicketMessage, Settlement
Misc: ScenarioMapping, WebhookDelivery, AuditLog, OutboxEvent

### 24.17 Changelog

| Date | Change |
|------|--------|
| 2026-04-02 | Initial Settlix VPS deployment (6 containers + MySQL) |
| 2026-04-02 | SSL certificates issued for 5 subdomains + docs |
| 2026-04-02 | API documentation live at docs.settlix.net |
| 2026-04-02 | `:settlix` branded images built (merchant, admin, payment page) |
| 2026-04-02 | Favicon, logo, colors fixed across all portals |
| 2026-04-02 | Mock dashboard data removed — real DB aggregations |
| 2026-04-02 | Admin stats endpoint created |
| 2026-04-02 | All payment + payout APIs verified end-to-end |
| 2026-04-03 | Auto payout key generation on merchant registration |
| 2026-04-03 | Quick Payment Link + API credit counter on dashboard |
| 2026-04-03 | Mobile bottom nav + PWA for both portals |
| 2026-04-03 | Unified API key format: `{org}_pk_` / `{org}_sk_` |
| 2026-04-03 | Merchant portal: transaction drawer, refunds, team, tickets, settlements |
| 2026-04-03 | Multi-key management + enable/disable |
| 2026-04-03 | 8 merchant portal bug fixes (payment link, receipt, logo, roles) |
| 2026-04-04 | Admin: refunds, tickets, settlements UI (Phase 1) |
| 2026-04-04 | Admin: Operations Center — users, methods, blacklist, notifications, logs (Phase 2) |
| 2026-04-04 | Admin: PSP Management — CRUD, credentials, rates, margin analysis (Phase 3) |
| 2026-04-04 | Admin: Finance Engine — revenue, PSP costs, merchant fees, margins (Phase 4) |
| 2026-04-04 | Admin: Merchant detail page with rates/limits/keys config (Phase 5) |
| 2026-04-04 | Admin: Send Money — 3-step flow with secret key auth (Phase 9) |
| 2026-04-04 | Admin: Enhanced dashboard — pending actions, health checks, quick actions (Phase 10) |

---

## 25. Final Notes

Last updated: 2026-04-04

This Product Book intentionally reflects the implementation currently present in code. If behavior changes, update this document together with:

- `prisma/schema.prisma`
- API route files
- portal API clients
- deployment manifests

That keeps architecture, code, and operations in sync.
