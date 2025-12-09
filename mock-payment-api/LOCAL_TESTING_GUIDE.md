# 🧪 Local API Testing Guide

## Prerequisites

1. **Database Running**: Ensure MySQL is running and accessible
2. **Environment Variables**: Check `.env` file has correct database credentials
3. **Dependencies**: Run `npm install` if needed

## Step 1: Start the Server

```bash
# Terminal 1 - Start the API server
npm start

# OR use nodemon for development
npm run dev
```

The server should start on `http://localhost:3000`

## Step 2: Run Tests

```bash
# Terminal 2 - Run the test suite
node test-api-local.js
```

## Test Coverage

The test suite covers:

### ✅ Core Endpoints
1. **Health Check** - `GET /health`
2. **Test Scenarios** - `GET /test-scenarios`
3. **Create Checkout (Easypaisa)** - `POST /checkouts`
4. **Create Checkout (JazzCash)** - `POST /checkouts`
5. **Create Checkout (Card)** - `POST /checkouts`
6. **Get Checkout** - `GET /checkouts/:checkoutId`
7. **Complete Payment (Easypaisa)** - `POST /payment/:sessionId/complete`
8. **Complete Payment (JazzCash)** - `POST /payment/:sessionId/complete`
9. **Complete Payment (Card Success)** - `POST /payment/:sessionId/complete`
10. **Complete Payment (Card Decline)** - `POST /payment/:sessionId/complete`
11. **Payment Page Rendering** - `GET /payment/:sessionId`

## Manual Testing

### Test 1: Test Scenarios Endpoint
```bash
curl http://localhost:3000/test-scenarios
```

Expected: JSON with all payment method scenarios

### Test 2: Create Checkout - Easypaisa
```bash
curl -X POST http://localhost:3000/checkouts \
  -H "X-Api-Key: test-api-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "TEST-EP-001",
    "amount": 1000.00,
    "paymentMethod": "easypaisa",
    "paymentType": "onetime",
    "successUrl": "https://merchant.com/webhook",
    "returnUrl": "https://merchant.com/return"
  }'
```

### Test 3: Create Checkout - Card
```bash
curl -X POST http://localhost:3000/checkouts \
  -H "X-Api-Key: test-api-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "TEST-CARD-001",
    "amount": 2000.00,
    "paymentMethod": "card",
    "paymentType": "onetime",
    "successUrl": "https://merchant.com/webhook",
    "returnUrl": "https://merchant.com/return"
  }'
```

### Test 4: View Payment Page
1. Create a checkout (use checkoutId from above)
2. Open browser: `http://localhost:3000/payment/{checkoutId}`
3. Verify:
   - MyPay theme colors
   - Correct payment method form
   - Test info displayed

### Test 5: Complete Payment - Card
```bash
curl -X POST http://localhost:3000/payment/{checkoutId}/complete \
  -H "Content-Type: application/json" \
  -d '{
    "cardNumber": "4242424242424242",
    "expiryDate": "12/25",
    "cvv": "123",
    "cardholderName": "John Doe"
  }'
```

## Expected Results

### Test Scenarios Endpoint
- ✅ Returns all wallet scenarios (Easypaisa/JazzCash)
- ✅ Returns all card scenarios
- ✅ Includes summary statistics
- ✅ Includes quick reference guide

### Payment Pages
- ✅ Easypaisa: Shows mobile number + PIN form
- ✅ JazzCash: Shows mobile number + PIN form
- ✅ Card: Shows card number + expiry + CVV + name form
- ✅ All use MyPay green theme
- ✅ All show test scenario information

### Payment Processing
- ✅ Card 4242...4242 → Success
- ✅ Card 4000...0002 → Decline
- ✅ Mobile 03030000000 → Success
- ✅ Mobile 03021111111 → Failed

## Troubleshooting

### Server Won't Start
1. Check if port 3000 is already in use
2. Verify database connection in `.env`
3. Check `server.err.log` for errors

### Database Connection Issues
1. Verify MySQL is running
2. Check database credentials in `.env`
3. Ensure database `dummy_payment_db` exists

### Tests Failing
1. Ensure server is running on port 3000
2. Check API key is correct (`test-api-key-123`)
3. Verify database has test data

## Next Steps

Once all local tests pass:
1. ✅ Review test results
2. ✅ Test payment pages manually in browser
3. ✅ Verify all three payment methods work
4. ✅ Proceed with VPS deployment

