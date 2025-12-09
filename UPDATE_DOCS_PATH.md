# Update Documentation Path

## Current Status

Your API is live at: https://sandbox.mycodigital.io

## Documentation URL Change

Documentation will be served at: **https://sandbox.mycodigital.io/doc/payout**

---

## Quick Update (On VPS)

### Option 1: Run Update Script

```bash
# SSH to VPS
ssh root@72.60.110.249

# Go to project directory
cd /opt/payout-system

# Make script executable
chmod +x nginx-config-update.sh

# Run update
./nginx-config-update.sh
```

### Option 2: Manual Update

```bash
# SSH to VPS
ssh root@72.60.110.249

# Edit Nginx configuration
nano /etc/nginx/sites-available/payout-api
```

Update the documentation location blocks:

```nginx
# Change this:
location = / {
    root /opt/payout-system/public;
    index index.html;
}

# To this:
location /doc/payout {
    alias /opt/payout-system/public;
    index index.html;
    try_files $uri $uri/ /index.html =404;
}

# Also add redirect from root:
location = / {
    return 302 /doc/payout;
}
```

Then:

```bash
# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

---

## Verify Documentation is Live

After update, visit:

```
https://sandbox.mycodigital.io/doc/payout
```

You should see the beautiful API documentation!

---

## All URLs After Update

```
📖 Documentation:
   https://sandbox.mycodigital.io/doc/payout

🔗 API Base:
   https://sandbox.mycodigital.io/api/v1

📥 Postman Collection:
   https://sandbox.mycodigital.io/doc/payout/MyPay_Payout_API.postman_collection.json

📋 OpenAPI Spec:
   https://sandbox.mycodigital.io/doc/payout/api-docs.json

🏥 Health Check:
   https://sandbox.mycodigital.io/api/v1/health
```

---

## Files to Upload to VPS

1. `public/index.html` (updated with correct download path)
2. `public/api-docs.json`
3. `public/MyPay_Payout_API.postman_collection.json`
4. `nginx-config-update.sh` (update script)

---

## Complete Deployment Commands

```bash
# 1. Transfer updated files
scp -r public/* root@72.60.110.249:/opt/payout-system/public/
scp nginx-config-update.sh root@72.60.110.249:/opt/payout-system/

# 2. Connect and update
ssh root@72.60.110.249

# 3. Run update script
cd /opt/payout-system
chmod +x nginx-config-update.sh
./nginx-config-update.sh

# 4. Verify
curl https://sandbox.mycodigital.io/doc/payout
```

---

## Testing

Open your browser and visit:
- https://sandbox.mycodigital.io/doc/payout

You should see:
- ✅ Beautiful API documentation
- ✅ All endpoints listed
- ✅ Download Postman button works
- ✅ Examples and code snippets
- ✅ Test scenarios
- ✅ Webhook documentation

---

## Root URL Behavior

When users visit: `https://sandbox.mycodigital.io/`

They will be automatically redirected to: `https://sandbox.mycodigital.io/doc/payout`

This ensures merchants always see the documentation first!


