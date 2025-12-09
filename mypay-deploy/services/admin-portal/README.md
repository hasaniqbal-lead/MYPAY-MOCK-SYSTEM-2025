# Admin Portal

Admin Portal for MyPay Mock Payment Platform - System administration and monitoring.

## Features

- System-wide dashboard with statistics
- Merchant management
- Payment transaction monitoring
- Payout transaction monitoring
- System configuration

## Quick Start

```bash
# Install dependencies
pnpm install

# Run development server
pnpm run dev

# Build for production
pnpm run build

# Start production server
pnpm run start
```

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Admin login |
| `/dashboard` | System overview dashboard |
| `/merchants` | Merchant management |
| `/transactions` | Payment transactions |
| `/payouts` | Payout transactions |
| `/settings` | System configuration |

## Environment Variables

```env
NEXT_PUBLIC_API_URL=https://sandbox.mycodigital.io
NEXT_PUBLIC_ADMIN_PORTAL_URL=https://devadmin.mycodigital.io
```

## Test Credentials

- **Email:** admin@mycodigital.io
- **Password:** admin123456

## Docker

```bash
# Build image
docker build -t mypay-admin-portal .

# Run container
docker run -p 4011:3000 mypay-admin-portal
```

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Radix UI Components
- Lucide Icons
