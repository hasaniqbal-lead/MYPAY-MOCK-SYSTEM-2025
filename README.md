# MyPay Mock Platform

A centralized mock payment and payout platform for Pakistani FinTech applications. This monorepo contains all services needed for testing payment integrations including Easypaisa, JazzCash, card payments, and bank/wallet payouts.

## 🏗️ Architecture

```
mypay-mock-platform/
├── packages/               # Shared packages
│   └── shared/            # Common types, utilities
├── services/              # Microservices
│   ├── payout-api/        # Bank/Wallet payout service
│   ├── payment-api/       # Payment checkout service
│   ├── merchant-portal/   # Merchant dashboard (Next.js)
│   └── admin-portal/      # Admin dashboard (Next.js)
├── docker/                # Docker orchestration
│   ├── docker-compose.yml
│   └── nginx/             # API Gateway config
├── prisma/                # Unified database schema
└── scripts/               # Helper scripts
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose
- MySQL 8.0

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd mypay-mock-platform

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npx prisma db seed

# Start all services
pnpm run dev
```

### Using Docker

```bash
# Start all services with Docker
./scripts/docker-up.sh

# Or manually:
docker-compose -f docker/docker-compose.yml up -d --build

# Stop all services
./scripts/docker-down.sh
```

## 📦 Services

### Payout API (Port 4001)

Mock service for bank transfers and wallet payouts.

```bash
# Start payout API only
pnpm run dev:payout
```

**Endpoints:**
- `POST /api/v1/payouts` - Create payout
- `GET /api/v1/payouts` - List payouts
- `GET /api/v1/balance` - Get balance
- `GET /api/v1/directory` - Banks/Wallets directory

### Payment API (Port 4002)

Mock service for payment checkout with Easypaisa, JazzCash, and cards.

```bash
# Start payment API only
pnpm run dev:payment
```

**Endpoints:**
- `POST /checkouts` - Create checkout session
- `GET /checkouts/:id` - Get checkout details
- `GET /transactions/:ref` - Get transaction status

### Merchant Portal (Port 4010)

Next.js dashboard for merchants to manage their account.

```bash
# Start merchant portal only
pnpm run dev:merchant-portal
```

### Admin Portal (Port 4011)

Next.js dashboard for system administration.

```bash
# Start admin portal only
pnpm run dev:admin-portal
```

## 🌐 Domain Mapping

| Domain | Service |
|--------|---------|
| sandbox.mycodigital.io | API Gateway (Payout + Payment APIs) |
| devportal.mycodigital.io | Merchant Portal |
| devadmin.mycodigital.io | Admin Portal |

## 🧪 Test Credentials

### Payout API
```
API Key: Generated during database seeding
Test Account Numbers:
  - 123450001 → SUCCESS
  - 987650002 → RETRY then SUCCESS
  - 555550003 → FAILED
  - 111110004 → PENDING
```

### Payment API
```
API Key: test-api-key-123

Test Mobile Numbers:
  - 03030000000 → SUCCESS
  - 03021111111 → FAILED
  - 03032222222 → TIMEOUT

Test Card Numbers:
  - 4242 4242 4242 4242 → SUCCESS
  - 4000 0000 0000 0002 → DECLINED
```

### Portal Login
```
Email: test@mycodigital.io
Password: test123456
```

### Admin Login
```
Email: admin@mycodigital.io
Password: admin123456
```

## 📝 Development

### Adding a New Service

1. Create directory in `services/`
2. Add to `pnpm-workspace.yaml`
3. Add to `docker/docker-compose.yml`
4. Add nginx routing in `docker/nginx/nginx.conf`

### Database Migrations

```bash
# Create migration
npx prisma migrate dev --name <migration-name>

# Apply migrations
npx prisma migrate deploy

# Reset database
npx prisma migrate reset
```

### Building for Production

```bash
# Build all services
pnpm run build

# Build specific service
pnpm --filter @mypay/payout-api build
```

## 🔮 Future Services

The following services are planned and have placeholder directories:

- `services/crypto-api/` - Cryptocurrency payments
- `services/topup-api/` - Mobile top-up services
- `services/utility-api/` - Utility bill payments
- `services/education-api/` - Education/University payments
- `services/invoice-api/` - Invoice payment services

## 📚 Documentation

- [Payout API Documentation](services/payout-api/README.md)
- [Payment API Documentation](services/payment-api/README.md)
- [Merchant Portal Guide](services/merchant-portal/README.md)
- [Admin Portal Guide](services/admin-portal/README.md)

## 🛠️ Tech Stack

- **Runtime:** Node.js 18+
- **Package Manager:** pnpm (workspaces)
- **Build System:** Turborepo
- **Backend:** Express.js, TypeScript
- **Frontend:** Next.js 14, React, Tailwind CSS
- **Database:** MySQL 8.0, Prisma ORM
- **API Gateway:** Nginx
- **Containerization:** Docker, Docker Compose

## 📄 License

Private - MyPay Digital Solutions
