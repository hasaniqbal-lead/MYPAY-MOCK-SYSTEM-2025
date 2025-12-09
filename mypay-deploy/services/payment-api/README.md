# Payment API Service

Mock Payment API for testing Easypaisa, JazzCash, and Card payment integrations.

## Features

- Checkout session creation
- Multiple payment methods (Easypaisa, JazzCash, Card)
- Test scenarios based on mobile numbers
- Webhook notifications
- Merchant portal API

## Quick Start

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm run db:generate

# Run migrations
pnpm run db:migrate

# Seed database
pnpm run db:seed

# Start development server
pnpm run dev
```

## API Endpoints

### Checkout API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/checkouts` | Create checkout session |
| GET | `/checkouts/:checkoutId` | Get checkout details |
| GET | `/transactions/:reference` | Get transaction status |

### Payment Pages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/payment/:sessionId` | Render payment page |
| POST | `/payment/:sessionId/complete` | Complete payment |
| GET | `/test-scenarios` | Get test scenarios |

### Portal API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/portal/auth/register` | Register merchant |
| POST | `/api/portal/auth/login` | Login merchant |
| GET | `/api/portal/dashboard/stats` | Dashboard stats |
| GET | `/api/portal/transactions` | List transactions |
| GET | `/api/portal/merchant/credentials` | Get API credentials |

## Test Mobile Numbers

| Mobile Number | Scenario | Status |
|---------------|----------|--------|
| 03030000000 | Success | completed |
| 03021111111 | Failed | failed |
| 03032222222 | Timeout | failed |
| 03033333333 | Rejected | failed |
| 03034444444 | Invalid OTP | failed |
| 03035555555 | Insufficient | failed |

## Test Card Numbers

| Card Number | Scenario | Status |
|-------------|----------|--------|
| 4242 4242 4242 4242 | Success | completed |
| 4000 0000 0000 0002 | Decline | failed |
| 4000 0000 0000 9995 | Insufficient | failed |

## Environment Variables

```env
DATABASE_URL=mysql://root:password@localhost:3306/mypay_mock_db
PORT=4002
JWT_SECRET=your-jwt-secret
CHECKOUT_BASE_URL=http://localhost:4002/payment
```

## Docker

```bash
# Build image
docker build -t mypay-payment-api .

# Run container
docker run -p 4002:3000 mypay-payment-api
```

