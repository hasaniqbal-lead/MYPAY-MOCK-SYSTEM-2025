# MyPay Mock System - Subdomain Mapping

**Updated**: January 7, 2026
**Status**: ✅ Configured and Ready

---

## 🌐 Subdomain Configuration

### Domains Supported
- **mypay.mx** (Primary - New)
- **mycodigital.io** (Legacy)

### Nginx Port: 8888 (or 80/443 with SSL)

All subdomains are configured to route through Nginx.

---

## 📍 Subdomain Map - mypay.mx (Primary)

| Subdomain | Service | Backend Port | Purpose |
|-----------|---------|--------------|---------|
| **sandbox.mypay.mx** | Payout API | 4001 | Payout transactions |
| **test.mypay.mx** | Payment API | 4002 | Payment transactions |
| **devportal.mypay.mx** | Merchant Portal | 4010 | Merchant dashboard |
| **devadmin.mypay.mx** | Admin Portal | 4011 | Admin dashboard |
| **demo.mypay.mx** | Payment Page | 4012 | Checkout/Payment page |

## 📍 Subdomain Map - mycodigital.io (Legacy)

| Subdomain | Service | Backend Port | Purpose |
|-----------|---------|--------------|---------|
| **sandbox.mycodigital.io** | Payout API | 4001 | Payout transactions |
| **mock.mycodigital.io** | Payment API | 4002 | Payment transactions |
| **devportal.mycodigital.io** | Merchant Portal | 4010 | Merchant dashboard |
| **devadmin.mycodigital.io** | Admin Portal | 4011 | Admin dashboard |
| **pay.mycodigital.io** | Payment Page | 4012 | Checkout/Payment page |

---

## 🔗 API Base URLs - mypay.mx (Primary)

### For Payout API Integration
```
Base URL: https://sandbox.mypay.mx
Endpoints: /api/v1/*

Examples:
- https://sandbox.mypay.mx/api/v1/health
- https://sandbox.mypay.mx/api/v1/directory
- https://sandbox.mypay.mx/api/v1/balance
- https://sandbox.mypay.mx/api/v1/payouts
```

### For Payment API Integration
```
Base URL: https://test.mypay.mx
Endpoints: /api/v1/*

Examples:
- https://test.mypay.mx/api/v1/health
- https://test.mypay.mx/api/v1/portal/auth/login
- https://test.mypay.mx/api/v1/portal/dashboard/stats
- https://test.mypay.mx/api/checkout/sessions
```

---

## 🔗 API Base URLs - mycodigital.io (Legacy)

### For Payout API Integration
```
Base URL: https://sandbox.mycodigital.io
Endpoints: /api/v1/*
```

### For Payment API Integration
```
Base URL: https://mock.mycodigital.io
Endpoints: /api/v1/*
```

---

## 🌐 Portal URLs - mypay.mx (Primary)

### Merchant Portal
```
URL: https://devportal.mypay.mx
Login: test@mypay.mx / test123456
```

### Admin Portal
```
URL: https://devadmin.mypay.mx
Login: admin@mypay.mx / admin123456
```

### Payment Page (Demo)
```
URL: https://demo.mypay.mx
```

---

## 🌐 Portal URLs - mycodigital.io (Legacy)

### Merchant Portal
```
URL: https://devportal.mycodigital.io
Login: test@mycodigital.io / test123456
```

### Admin Portal
```
URL: https://devadmin.mycodigital.io
Login: admin@mycodigital.io / admin123456
```

---

## 🔧 DNS Configuration Required

### mypay.mx Domain (Wildcard configured)
```
*.mypay.mx → VPS IP (wildcard already pointing to VPS)
```

Subdomains ready to use:
- sandbox.mypay.mx (Payout API)
- test.mypay.mx (Payment API)
- devportal.mypay.mx (Merchant Portal)
- devadmin.mypay.mx (Admin Portal)
- demo.mypay.mx (Payment Page)

### mycodigital.io Domain (Legacy - Wildcard configured)
```
*.mycodigital.io → VPS IP (wildcard already pointing to VPS)
```

### Direct IP Access (For Testing)
If DNS isn't configured yet, use direct IP:
```
Payout API:      http://VPS_IP:4001
Payment API:     http://VPS_IP:4002
Merchant Portal: http://VPS_IP:4010
Admin Portal:    http://VPS_IP:4011
Payment Page:    http://VPS_IP:4012
```

---

## 📝 Postman Collection Setup

### Environment Variables - mypay.mx (Primary)
Create a Postman environment with:

```json
{
  "payout_api_url": "https://sandbox.mypay.mx/api/v1",
  "payment_api_url": "https://test.mypay.mx/api/v1",
  "payout_api_key": "YOUR_PAYOUT_API_KEY",
  "payment_api_key": "YOUR_PAYMENT_API_KEY",
  "merchant_email": "test@mypay.mx",
  "merchant_password": "test123456"
}
```

### Environment Variables - mycodigital.io (Legacy)
```json
{
  "payout_api_url": "https://sandbox.mycodigital.io/api/v1",
  "payment_api_url": "https://mock.mycodigital.io/api/v1",
  "payout_api_key": "YOUR_PAYOUT_API_KEY",
  "payment_api_key": "YOUR_PAYMENT_API_KEY",
  "merchant_email": "test@mycodigital.io",
  "merchant_password": "test123456"
}
```

### Sample Requests

#### 1. Payout API Health Check
```
GET {{payout_api_url}}/health
```

#### 2. Get Bank Directory
```
GET {{payout_api_url}}/directory
Headers:
  X-API-KEY: {{payout_api_key}}
```

#### 3. Payment API Login
```
POST {{payment_api_url}}/portal/auth/login
Body:
{
  "email": "{{merchant_email}}",
  "password": "{{merchant_password}}"
}
```

---

## 🔄 Nginx Configuration

Current Nginx setup:
- **Config File**: `/etc/nginx/sites-available/mypay-mock`
- **Enabled**: `/etc/nginx/sites-enabled/mypay-mock`
- **Listen Port**: 8888
- **Status**: ✅ Active and running

### View Nginx Status
```bash
ssh root@72.60.110.249 "systemctl status nginx"
```

### View Nginx Logs
```bash
ssh root@72.60.110.249 "tail -f /var/log/nginx/access.log"
ssh root@72.60.110.249 "tail -f /var/log/nginx/error.log"
```

### Reload Nginx (After Config Changes)
```bash
ssh root@72.60.110.249 "nginx -t && systemctl reload nginx"
```

---

## 🔐 SSL/HTTPS Setup (Future)

To enable HTTPS (requires standard ports 80/443):

### Prerequisites
1. Free up port 80 (currently used by Docker)
2. Update Nginx to listen on port 80
3. Install Certbot

### Installation Steps
```bash
# On VPS
ssh root@72.60.110.249

# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get certificates
certbot --nginx \
  -d sandbox.mycodigital.io \
  -d mock.mycodigital.io \
  -d devportal.mycodigital.io \
  -d devadmin.mycodigital.io

# Certbot will auto-configure HTTPS
```

Then your URLs will become:
- `https://sandbox.mycodigital.io` (Payout API)
- `https://mock.mycodigital.io` (Payment API)
- `https://devportal.mycodigital.io` (Merchant Portal)
- `https://devadmin.mycodigital.io` (Admin Portal)

---

## 📊 Testing Subdomain Routing

### Test 1: Health Checks via Subdomain
```bash
# Payout API (via subdomain)
curl http://sandbox.mycodigital.io:8888/api/v1/health

# Payment API (via subdomain)
curl http://mock.mycodigital.io:8888/api/v1/health
```

### Test 2: Verify Nginx Routing
```bash
# Check which backend is responding
curl -H "Host: sandbox.mycodigital.io" http://72.60.110.249:8888/api/v1/health
curl -H "Host: mock.mycodigital.io" http://72.60.110.249:8888/api/v1/health
```

### Test 3: Portal Access
Open in browser:
```
http://devportal.mycodigital.io:8888
http://devadmin.mycodigital.io:8888
```

---

## 🎯 Summary

### mypay.mx Domain (Primary)
✅ **sandbox.mypay.mx** → Payout API (Port 4001)
✅ **test.mypay.mx** → Payment API (Port 4002)
✅ **devportal.mypay.mx** → Merchant Portal (Port 4010)
✅ **devadmin.mypay.mx** → Admin Portal (Port 4011)
✅ **demo.mypay.mx** → Payment Page (Port 4012)

### mycodigital.io Domain (Legacy)
✅ **sandbox.mycodigital.io** → Payout API
✅ **mock.mycodigital.io** → Payment API
✅ **devportal.mycodigital.io** → Merchant Portal
✅ **devadmin.mycodigital.io** → Admin Portal
✅ **pay.mycodigital.io** → Payment Page

### Status
✅ **Nginx configured** for both domains
✅ **Wildcard DNS** configured for both domains
✅ **5 subdomains** per domain mapped to services
✅ **All services** operational
✅ **SSL ready** via Let's Encrypt wildcard certificates  

---

## 📞 Support Commands

### Quick Service Check
```bash
ssh root@72.60.110.249 "cd /opt/mypay-mock && docker compose ps && echo '---' && systemctl status nginx --no-pager | head -5"
```

### View All Logs
```bash
ssh root@72.60.110.249 "cd /opt/mypay-mock && docker compose logs --tail=20"
```

### Restart Everything
```bash
ssh root@72.60.110.249 "cd /opt/mypay-mock && docker compose restart && systemctl restart nginx"
```

---

**Last Updated**: December 11, 2025  
**Nginx Status**: ✅ Running  
**All Services**: ✅ Operational  
**Ready for**: Testing and Integration

