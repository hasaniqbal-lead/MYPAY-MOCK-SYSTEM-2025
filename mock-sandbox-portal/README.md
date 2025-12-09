# Merchant Portal - Dummy Payment API

Merchant portal for managing payment API credentials, viewing transactions, and managing account settings.

## Domain

- **Portal URL**: https://devportal.mycodigital.io
- **API URL**: https://sandbox.mycodigital.io

## Features

- 🔐 Merchant authentication (login/register)
- 📊 Dashboard with transaction statistics
- 📋 Transaction listing with filters and export (CSV/JSON)
- 🔑 API credentials management
- ⚙️ Profile and settings management

## Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **API Client**: Axios

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=https://sandbox.mycodigital.io
NEXT_PUBLIC_PORTAL_URL=https://devportal.mycodigital.io
```

3. Run development server:
```bash
npm run dev
```

4. Open http://localhost:3000

## Docker Deployment

### Build Image

```bash
docker build -t dummy-portal:latest .
```

### Run with Docker Compose

```bash
docker-compose up -d
```

### Manual Run

```bash
docker run -d \
  --name dummy-portal \
  -p 3001:3000 \
  -e NEXT_PUBLIC_API_URL=https://sandbox.mycodigital.io \
  -e NEXT_PUBLIC_PORTAL_URL=https://devportal.mycodigital.io \
  dummy-portal:latest
```

## Production Deployment

### On VPS

1. **Upload files to server**:
```bash
scp -r . user@server:/opt/dummy-sandbox-portal
```

2. **On server, build and run**:
```bash
cd /opt/dummy-sandbox-portal
docker-compose up -d --build
```

3. **Configure Nginx** (see `deploy/nginx.conf`)

4. **Set up SSL**:
```bash
certbot --nginx -d devportal.mycodigital.io
```

## API Integration

The portal connects to the Payment API at `https://sandbox.mycodigital.io` and expects the following endpoints:

### Required API Endpoints

The Payment API needs to be extended with these portal-specific endpoints:

- `POST /api/portal/auth/login` - Merchant login
- `POST /api/portal/auth/register` - Merchant registration
- `POST /api/portal/auth/logout` - Logout
- `GET /api/portal/merchant/profile` - Get merchant profile
- `PUT /api/portal/merchant/profile` - Update profile
- `GET /api/portal/merchant/credentials` - Get API credentials
- `POST /api/portal/merchant/credentials` - Generate new API key
- `GET /api/portal/transactions` - List transactions
- `GET /api/portal/transactions/:id` - Get transaction details
- `GET /api/portal/transactions/export/:format` - Export transactions
- `GET /api/portal/dashboard/stats` - Get dashboard statistics

See `API_EXTENSIONS.md` for implementation details.

## Project Structure

```
dummy-sandbox-portal/
├── src/
│   ├── app/              # Next.js pages
│   │   ├── login/
│   │   ├── register/
│   │   ├── dashboard/
│   │   ├── transactions/
│   │   ├── credentials/
│   │   └── settings/
│   ├── components/       # React components
│   ├── contexts/         # React contexts (Auth)
│   └── lib/              # Utilities (API client)
├── public/               # Static assets
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Payment API base URL
- `NEXT_PUBLIC_PORTAL_URL` - Portal base URL
- `NODE_ENV` - Environment (development/production)

## Troubleshooting

### Build fails
- Ensure Node.js 18+ is installed
- Clear `.next` folder and rebuild

### API connection issues
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS settings on API
- Verify API endpoints are implemented

### Docker build fails
- Check Dockerfile syntax
- Ensure all required files are present
- Check Next.js output configuration

## Support

For issues or questions, refer to the main project documentation.

