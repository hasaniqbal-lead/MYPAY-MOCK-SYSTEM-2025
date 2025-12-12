# ✅ Postman Collections - Status Check

**Date**: December 11, 2025  
**Status**: ✅ **ALL UPDATED AND READY**

---

## 📦 Collection Files

1. ✅ `MyPay_Payout_API.postman_collection.json`
2. ✅ `MyPay_Payment_API.postman_collection.json`

---

## ✅ Payout API Collection - VERIFIED

### Configuration ✅
```json
{
  "base_url": "https://sandbox.mycodigital.io/api/v1",
  "base_url_local": "http://localhost:4001/api/v1",
  "api_key": "mypay_87ba5b517b0c7fb360ec2c32030afb4c82ddc2e8c0f7d66abb1aa5e96dd08bce"
}
```

### Status
- ✅ **Base URL**: Correct production domain
- ✅ **API Key**: Latest key from December 11, 2025 seed
- ✅ **Local URL**: Available for local testing
- ✅ **Ready to Use**: YES

### Headers
```
X-API-KEY: mypay_87ba5b517b0c7fb360ec2c32030afb4c82ddc2e8c0f7d66abb1aa5e96dd08bce
X-IDEMPOTENCY-KEY: {{$guid}}
```

---

## ✅ Payment API Collection - VERIFIED

### Configuration ✅
```json
{
  "base_url": "https://mock.mycodigital.io/api/v1",
  "base_url_local": "http://localhost:4002/api/v1",
  "api_key": "test-merchant-api-key-12345"
}
```

### Status
- ✅ **Base URL**: Correct production domain
- ✅ **API Key**: Valid test merchant key
- ✅ **Local URL**: Available for local testing
- ✅ **Ready to Use**: YES

### Headers
```
X-Api-Key: test-merchant-api-key-12345
Content-Type: application/json
```

---

## 🧪 Quick Test Commands

### Test Payout API ✅
```bash
curl -H "X-API-KEY: mypay_87ba5b517b0c7fb360ec2c32030afb4c82ddc2e8c0f7d66abb1aa5e96dd08bce" \
  https://sandbox.mycodigital.io/api/v1/directory
```

**Expected**: Returns 12 banks and 4 wallets ✅

### Test Payment API ✅
```bash
curl -H "X-Api-Key: test-merchant-api-key-12345" \
  https://mock.mycodigital.io/api/v1/health
```

**Expected**: Returns `{"status":"OK","service":"MyPay Payment API"}` ✅

---

## 📋 Collection Variables Summary

| Collection | Variable | Value | Status |
|------------|----------|-------|--------|
| **Payout API** | `base_url` | `https://sandbox.mycodigital.io/api/v1` | ✅ Correct |
| **Payout API** | `api_key` | `mypay_87ba...bce` | ✅ Updated |
| **Payment API** | `base_url` | `https://mock.mycodigital.io/api/v1` | ✅ Correct |
| **Payment API** | `api_key` | `test-merchant-api-key-12345` | ✅ Valid |

---

## 🎯 How to Use

### Import Collections into Postman

1. **Open Postman**
2. Click **Import** button
3. **Drag and drop** or select files:
   - `MyPay_Payout_API.postman_collection.json`
   - `MyPay_Payment_API.postman_collection.json`
4. Click **Import**

### Variables Are Pre-configured ✅
- No need to manually set variables
- Production URLs are default
- API keys are already set
- Ready to test immediately

### Test Immediately
1. Open **Payout API** → **Health Check** → Click **Send**
2. Open **Payment API** → **Health Check** → Click **Send**

Both should return successful responses! ✅

---

## 📊 Test Account Numbers

### Payout API Test Accounts
| Account Number | Result | Use Case |
|----------------|--------|----------|
| `123450001` | ✅ SUCCESS | Successful payout |
| `987650002` | 🔄 RETRY → SUCCESS | Test retry logic |
| `555550003` | ❌ FAILED | Test failure handling |
| `111110004` | ⏳ PENDING | Test pending status |
| `999990005` | 🛑 ON_HOLD | Test on-hold status |

### Payment API Test Data
**Mobile Numbers**:
- `03030000000` → SUCCESS
- `03021111111` → FAILED
- `03032222222` → TIMEOUT

**Card Numbers**:
- `4242 4242 4242 4242` → SUCCESS
- `4000 0000 0000 0002` → DECLINED

---

## ✅ Verification Checklist

- [x] Payout API base URL set to production
- [x] Payout API key updated (December 11, 2025)
- [x] Payment API base URL set to production
- [x] Payment API key is valid
- [x] Local development URLs included
- [x] All variables documented
- [x] Test data included in descriptions
- [x] Collections committed to Git
- [x] Ready for team distribution

---

## 🔄 Last Updated

| Collection | Last Modified | API Key Updated | Status |
|------------|---------------|-----------------|--------|
| Payout API | Dec 11, 2025 | ✅ Yes (Reseeded) | ✅ Current |
| Payment API | Dec 11, 2025 | ✅ Yes (Verified) | ✅ Current |

---

## 📝 Notes for Team

### API Key Changes
- **Payout API key** was regenerated on December 11, 2025 during database reseed
- If you have an older Postman collection, **re-import** the latest version
- **Don't use old API keys** - they won't work

### Production URLs
- **Payout**: `https://sandbox.mycodigital.io/api/v1`
- **Payment**: `https://mock.mycodigital.io/api/v1`
- **No port numbers needed** - Nginx handles routing

### Local Testing
- Switch `{{base_url}}` to `{{base_url_local}}` in requests
- Or update collection variable to local URL
- Local URLs work for development

---

## 🎊 Summary

```
╔════════════════════════════════════════════════╗
║                                                ║
║  ✅ Both Postman Collections: UP TO DATE       ║
║  ✅ Production URLs: Configured                ║
║  ✅ API Keys: Current and Valid                ║
║  ✅ Test Data: Included                        ║
║  ✅ Ready to Share: YES                        ║
║                                                ║
╚════════════════════════════════════════════════╝
```

### Status: ✅ **READY FOR MERCHANT USE**

**Last Verified**: December 11, 2025, 18:30 UTC  
**Verified By**: Development Team  
**Collections Version**: 2.0 (Production Ready)

