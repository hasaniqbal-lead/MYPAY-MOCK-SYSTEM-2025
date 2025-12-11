# MyPay Mock System - Subdomain Mapping

**Updated**: December 11, 2025  
**Status**: ✅ Configured and Ready

---

## 🌐 Subdomain Configuration

### Nginx Port: 8888

All subdomains are configured to route through Nginx on port **8888**.

---

## 📍 Subdomain Map

| Subdomain | Service | Backend Port | Purpose |
|-----------|---------|--------------|---------|
| **sandbox.mycodigital.io:8888** | Payout API | 4001 | Payout transactions |
| **mock.mycodigital.io:8888** | Payment API | 4002 | Payment transactions |
| **devportal.mycodigital.io:8888** | Merchant Portal | 4010 | Merchant dashboard |
| **devadmin.mycodigital.io:8888** | Admin Portal | 4011 | Admin dashboard |

---

## 🔗 API Base URLs

### For Payout API Integration
```
Base URL: http://sandbox.mycodigital.io:8888
Endpoints: /api/v1/*

Examples:
- http://sandbox.mycodigital.io:8888/api/v1/health
- http://sandbox.mycodigital.io:8888/api/v1/directory
- http://sandbox.mycodigital.io:8888/api/v1/balance
- http://sandbox.mycodigital.io:8888/api/v1/payouts
```

### For Payment API Integration
```
Base URL: http://mock.mycodigital.io:8888
Endpoints: /api/v1/*

Examples:
- http://mock.mycodigital.io:8888/api/v1/health
- http://mock.mycodigital.io:8888/api/v1/portal/auth/login
- http://mock.mycodigital.io:8888/api/v1/portal/dashboard/stats
- http://mock.mycodigital.io:8888/api/checkout/sessions
```

---

## 🌐 Portal URLs

### Merchant Portal
```
URL: http://devportal.mycodigital.io:8888
Login: test@mycodigital.io / test123456
```

### Admin Portal
```
URL: http://devadmin.mycodigital.io:8888
Login: admin@mycodigital.io / admin123456
```

---

## 🔧 DNS Configuration Required

To use these subdomains, configure your DNS with:

### Option 1: Individual A Records with Port
```
sandbox.mycodigital.io   → 72.60.110.249:8888
mock.mycodigital.io      → 72.60.110.249:8888
devportal.mycodigital.io → 72.60.110.249:8888
devadmin.mycodigital.io  → 72.60.110.249:8888
```

### Option 2: Wildcard + Port Forwarding
```
*.mycodigital.io → 72.60.110.249

Then configure port forwarding on your network:
External Port 80 → VPS Port 8888
```

### Option 3: Direct IP Access (Currently Working)
If DNS isn't configured yet, use direct IP:
```
Payout API:      http://72.60.110.249:4001
Payment API:     http://72.60.110.249:4002
Merchant Portal: http://72.60.110.249:4010
Admin Portal:    http://72.60.110.249:4011
```

---

## 📝 Postman Collection Setup

### Environment Variables
Create a Postman environment with:

```json
{
  "payout_api_url": "http://sandbox.mycodigital.io:8888/api/v1",
  "payment_api_url": "http://mock.mycodigital.io:8888/api/v1",
  "payout_api_key": "mypay_b5c79892eecfea9b9c968636e794a3aeeccb25cf0d6aeb67c3e09a06f4bd80de",
  "payment_api_key": "test-api-key-123",
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

✅ **Nginx configured** for subdomain routing  
✅ **Port 8888** selected (80 & 8080 in use)  
✅ **4 subdomains** mapped to services  
✅ **All services** operational  
✅ **Ready for** DNS configuration  

**Current Access Method**: Direct IP (working now)  
**Future Access Method**: Subdomains (requires DNS update)  

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

