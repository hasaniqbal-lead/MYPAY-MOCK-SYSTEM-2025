# Changelog

All notable changes to the MyPay Mock Sandbox Portal will be documented in this file.

## [1.1.0] - 2026-01-08

### Added

#### Mock API Routes for Local Development
The portal now includes complete mock API routes enabling full local development without external dependencies.

**Authentication Routes:**
- `POST /api/portal/auth/register` - User registration with mock merchant creation
- `POST /api/portal/auth/logout` - User logout with cookie cleanup

**Merchant Routes:**
- `GET /api/portal/merchant/credentials` - Retrieve API keys, secrets, and vendor ID
- `POST /api/portal/merchant/credentials` - Generate new API credentials

**Dashboard Routes:**
- `GET /api/portal/dashboard/stats` - Dashboard statistics (transactions, revenue, success rates)

**Transaction Routes:**
- `GET /api/portal/transactions` - List transactions with pagination and filtering by status/date

**Payment Page Configuration Routes:**
- `GET /api/portal/payment-page/config` - Get payment page configuration
- `PUT /api/portal/payment-page/config` - Update full configuration
- `PATCH /api/portal/payment-page/config` - Partial configuration updates
- `GET /api/portal/payment-page/templates` - List available templates
- `GET /api/portal/payment-page/links` - List payment links
- `POST /api/portal/payment-page/links` - Generate new payment link
- `GET /api/portal/payment-page/preview` - Get preview URL for payment page

#### Project Configuration
- `.gitignore` - Added to exclude build artifacts, node_modules, and environment files

### Why These Changes Were Made
The portal frontend was complete but missing the backend API routes needed for local development. Previously, pages would fail to load data because the API endpoints didn't exist. This update implements all required mock endpoints so developers can:

1. Run the portal locally with `npm run dev`
2. Test all portal tabs (Dashboard, Transactions, Credentials, Settings, Payment Page)
3. Use demo credentials: `demo@mypay.com` / `demo123`

### Demo Credentials
| Email | Password | Merchant ID |
|-------|----------|-------------|
| demo@mypay.com | demo123 | demo-merchant-001 |
| admin@mypay.com | admin123 | demo-merchant-002 |

### Notes
- The Payment Page Designer tab includes a live preview iframe that requires the separate payment page service (`mypay-payment-page-v2`) running on port 5173
- Set `NEXT_PUBLIC_PAYMENT_PAGE_URL` in `.env.local` to point to the payment page service if running elsewhere

---

## [1.0.0] - Previous Release

### Initial Features
- Landing page with navigation
- Login/Register authentication flow
- Dashboard with metrics display
- Transactions list with filtering
- API Credentials management
- Settings page for profile updates
- Payment Page Designer UI
- Responsive design with Tailwind CSS
- Dark mode support
