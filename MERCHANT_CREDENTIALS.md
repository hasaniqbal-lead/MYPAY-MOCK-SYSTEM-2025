# Merchant Portal Credentials

**Date**: December 12, 2025  
**Status**: ✅ Active - Both Accounts Ready  

---

## 🔑 Merchant Account 1 (Test Account)

### Portal Login
- **URL**: https://devportal.mycodigital.io
- **Email**: `test@mycodigital.io`
- **Password**: `test123456`

### Company Details
- **Merchant ID**: 7
- **Company Name**: Test Merchant Company
- **Balance**: 1,000,000 PKR

### API Credentials

**Payment API**:
```
API Key: test-api-key-123
Base URL: https://mock.mycodigital.io/api/v1
Header: X-Api-Key: test-api-key-123
```

**Payout API**:
```
API Key: mypay_67239b5456039524335e26219c0d9f8daf6651cae91aefb60220e96874e1936e
Base URL: https://sandbox.mycodigital.io/api/v1
Header: X-API-KEY: mypay_67239b5456039524335e26219c0d9f8daf6651cae91aefb60220e96874e1936e
```

---

## 🔑 Merchant Account 2 (Hasan Iqbal)

### Portal Login
- **URL**: https://devportal.mycodigital.io
- **Email**: `hasaniqbal@mycodigital.io`
- **Password**: `hasan123456`

### Company Details
- **Merchant ID**: 8
- **Company Name**: MyCo Digital
- **Balance**: 2,000,000 PKR

### API Credentials

**Payment API**:
```
API Key: hasan-api-key-789
Base URL: https://mock.mycodigital.io/api/v1
Header: X-Api-Key: hasan-api-key-789
```

**Payout API**:
```
API Key: mypay_d34f9084a055562149db2b6d065a40c4fc6887151523689a7538e01f07415929
Base URL: https://sandbox.mycodigital.io/api/v1
Header: X-API-KEY: mypay_d34f9084a055562149db2b6d065a40c4fc6887151523689a7538e01f07415929
```

---

## 👨‍💼 Admin Portal Access

### Portal Login
- **URL**: https://devadmin.mycodigital.io
- **Email**: `admin@mycodigital.io`
- **Password**: `admin@@1234`

### Permissions
- **Role**: Super Admin
- Full system access
- Manage all merchants
- View all transactions
- System settings

---

## 📊 Testing the Portal

### Merchant Portal Features:

1. **Dashboard**
   - View transaction statistics
   - Recent transactions
   - Balance overview

2. **Transactions**
   - Payment transactions tab
   - Payout transactions tab
   - Export to CSV
   - Filter by date/status

3. **Credentials**
   - Single unified API key
   - Merchant ID display
   - Copy to clipboard
   - Show/Hide keys toggle

4. **Settings**
   - Update profile
   - Change password
   - Webhook configuration

### Admin Portal Features:

1. **Dashboard**
   - System-wide statistics
   - All merchants overview
   - Transaction volumes

2. **Merchants**
   - List all merchants
   - View merchant details
   - Activate/Deactivate accounts

3. **Transactions**
   - View all payment transactions
   - View all payout transactions
   - Export reports

4. **Payouts**
   - View all payouts
   - Process manual payouts
   - Approve/Reject

5. **Settings**
   - System configuration
   - Maintenance mode
   - Webhook settings

---

## 🧪 Test Scenarios

### Payment Test Numbers

**Mobile Numbers**:
- `03030000000` → SUCCESS
- `03021111111` → FAILED
- `03032222222` → TIMEOUT

**Card Numbers**:
- `4242 4242 4242 4242` → SUCCESS
- `4000 0000 0000 0002` → DECLINED

### Payout Test Account Numbers

Account number suffixes determine the outcome:
- `*0001` (e.g., `123450001`) → SUCCESS
- `*0002` (e.g., `987650002`) → RETRY then SUCCESS
- `*0003` (e.g., `555550003`) → FAILED
- `*0004` (e.g., `111110004`) → PENDING (stays pending)
- `*0005` (e.g., `999990005`) → ON_HOLD

**Special Cases**:
- Amount ≥ 100,000 PKR → IN_REVIEW

---

## 🔄 How to Test Portal Login

### Merchant Portal Test:

1. Open https://devportal.mycodigital.io
2. Enter credentials:
   - **Option 1**: `test@mycodigital.io` / `test123456`
   - **Option 2**: `hasaniqbal@mycodigital.io` / `hasan123456`
3. Click "Sign In"
4. Should redirect to Dashboard
5. Navigate to Credentials tab
6. Verify:
   - Shows "Merchant ID" (not "Vendor ID")
   - Shows single "API Key" section
   - Shows explanation: "Use this key for both Payment and Payout API requests"
   - Shows "Merchant ID" section below

### Admin Portal Test:

1. Open https://devadmin.mycodigital.io
2. Verify login page:
   - **No test credentials box visible** ✅
   - Clean, professional login form
3. Enter credentials:
   - Email: `admin@mycodigital.io`
   - Password: `admin@@1234`
4. Click "Sign In"
5. Should redirect to Admin Dashboard
6. Verify access to all admin features

---

## 🔧 API Testing

### Test Payment API (Merchant 1):

```bash
# Create checkout session
curl -X POST https://mock.mycodigital.io/api/v1/checkouts \
  -H "X-Api-Key: test-api-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "currency": "PKR",
    "phone": "03030000000",
    "callbackUrl": "https://example.com/callback",
    "metadata": {"order_id": "TEST001"}
  }'
```

### Test Payment API (Merchant 2):

```bash
# Create checkout session
curl -X POST https://mock.mycodigital.io/api/v1/checkouts \
  -H "X-Api-Key: hasan-api-key-789" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 2000,
    "currency": "PKR",
    "phone": "03030000000",
    "callbackUrl": "https://example.com/callback",
    "metadata": {"order_id": "HASAN001"}
  }'
```

### Test Payout API (Merchant 1):

```bash
# Create payout
curl -X POST https://sandbox.mycodigital.io/api/v1/payouts \
  -H "X-API-KEY: mypay_67239b5456039524335e26219c0d9f8daf6651cae91aefb60220e96874e1936e" \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: $(uuidgen)" \
  -d '{
    "amount": 5000,
    "currency": "PKR",
    "accountNumber": "1234500001",
    "accountTitle": "John Doe",
    "bankCode": "HBL",
    "purpose": "salary"
  }'
```

### Test Payout API (Merchant 2):

```bash
# Create payout
curl -X POST https://sandbox.mycodigital.io/api/v1/payouts \
  -H "X-API-KEY: mypay_d34f9084a055562149db2b6d065a40c4fc6887151523689a7538e01f07415929" \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: $(uuidgen)" \
  -d '{
    "amount": 10000,
    "currency": "PKR",
    "accountNumber": "9876500002",
    "accountTitle": "Hasan Iqbal",
    "bankCode": "UBL",
    "purpose": "bonus"
  }'
```

---

## 📝 Notes

- **Password Policy**: Minimum 6 characters (for testing)
- **API Keys**: Never expire (for testing environment)
- **Session Duration**: 7 days (JWT expiry)
- **Balance**: Virtual balance for testing, resets on reseed
- **Webhooks**: Configured but can be updated in portal settings

---

## 🚨 Important Reminders

1. **These are test credentials** - Do not use in production
2. **API keys are regenerated** - Each time you reseed the database
3. **Balances are virtual** - For testing purposes only
4. **No real money** - This is a mock payment system
5. **Data can be reset** - Running `prisma db seed` will clear all data

---

## 🆘 Troubleshooting

### Can't Login to Merchant Portal?

**Solution**:
1. Verify you're using the correct email (check spelling)
2. Password is case-sensitive
3. Try clearing browser cache
4. Check if database was recently reseeded

### API Returns 401 Unauthorized?

**Solution**:
1. Verify API key is correct (check for typos)
2. Ensure correct header name (`X-Api-Key` for Payment, `X-API-KEY` for Payout)
3. Check if merchant account is active
4. Confirm you're using the latest API key after reseed

### Portal Shows Old Data?

**Solution**:
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear browser cache
3. Check if services were restarted after deployment

---

## 📞 Support

For issues or questions:
1. Check Docker logs: `docker compose logs <service-name>`
2. Verify database: `docker compose exec mysql mysql -u root -p`
3. Review this document for correct credentials
4. Contact dev team if issues persist

---

**Last Updated**: December 12, 2025  
**System Version**: v1.0.0  
**Environment**: Production Mock System (VPS)

