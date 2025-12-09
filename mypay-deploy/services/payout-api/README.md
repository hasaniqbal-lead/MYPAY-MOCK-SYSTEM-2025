# Payout API Service

Mock Payout API for testing bank transfers and wallet payouts in Pakistani FinTech applications.

## Features

- Bank account payouts (HBL, UBL, MCB, etc.)
- Wallet payouts (Easypaisa, JazzCash, SadaPay, NayaPay)
- Account verification
- Balance management
- Webhook notifications
- Idempotency support

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

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/payouts` | Create a new payout |
| GET | `/api/v1/payouts` | List all payouts |
| GET | `/api/v1/payouts/:id` | Get payout details |
| POST | `/api/v1/payouts/:id/reinitiate` | Reinitiate failed payout |
| GET | `/api/v1/balance` | Get merchant balance |
| GET | `/api/v1/balance/history` | Get balance history |
| GET | `/api/v1/directory` | Get banks/wallets directory |
| POST | `/api/v1/verify-account` | Verify account details |

## Test Account Numbers

| Suffix | Result |
|--------|--------|
| 0001 | SUCCESS |
| 0002 | RETRY → SUCCESS |
| 0003 | FAILED |
| 0004 | PENDING |
| 0005 | ON_HOLD |

## Services

- **API Server**: Main REST API (port 4001)
- **Worker**: Background job processor for payouts
- **IPN**: Instant Payment Notification receiver

## Environment Variables

```env
DATABASE_URL=mysql://root:password@localhost:3306/mypay_mock_db
PORT=4001
WEBHOOK_SECRET=your-webhook-secret
```

## Docker

```bash
# Build image
docker build -t mypay-payout-api .

# Run container
docker run -p 4001:3000 mypay-payout-api
```

