# Dummy Payment API System

A dummy payment API system for testing Easypaisa and JazzCash payment integrations with multiple test scenarios based on mobile numbers.

## Features

- ✅ Complete checkout API implementation
- ✅ Multiple payment scenarios based on mobile numbers
- ✅ Simulated payment page for testing
- ✅ Webhook/Postback notifications
- ✅ Transaction status tracking
- ✅ API key validation
- ✅ Comprehensive error handling

## Tech Stack

- **Node.js** with Express
- **MySQL** for data persistence
- **Axios** for webhook calls
- **UUID** for unique identifiers

## Quick Start

### 1. Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

### 2. Installation

```bash
# Clone or create directory
cd dummy-payment-api

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your MySQL credentials
```

### 3. Database Setup

```bash
# Create database and tables
mysql -u root -p < database/schema.sql
```

### 4. Start Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:3000`

## API Documentation

### Authentication

All API requests require the `X-Api-Key` header:

```
X-Api-Key: test-api-key-123
```

### 1. Create Checkout Session

**Endpoint:** `POST /checkouts`

**Headers:**
```
X-Api-Key: test-api-key-123
Content-Type: application/json
```

**Request Body:**
```json
{
    "reference": "UNIQUE-REF-123",
    "amount": 1000.00,
    "paymentMethod": "jazzcash",
    "paymentType": "onetime",
    "successUrl": "https://yoursite.com/webhook",
    "returnUrl": "https://yoursite.com/return",
    "user": {
        "id": "user123",
        "email": "user@example.com"
    }
}
```

**Success Response:**
```json
{
    "success": true,
    "checkoutUrl": "http://localhost:3000/payment/uuid",
    "checkoutId": "uuid",
    "expiresAt": "2025-01-10T12:00:00Z"
}
```

### 2. Get Checkout Details

**Endpoint:** `GET /checkouts/:checkoutId`

### 3. Get Transaction Status

**Endpoint:** `GET /transactions/:reference`

### 4. Get Test Scenarios

**Endpoint:** `GET /test-scenarios`

## Test Mobile Numbers

| Mobile Number | Scenario | Status | Description |
|---------------|----------|--------|-------------|
| 03030000000 | Success | completed | Payment successful |
| 03021111111 | Failed | failed | Transaction failed |
| 03032222222 | Timeout | failed | Transaction timed-out |
| 03033333333 | Rejected | failed | Customer rejected transaction |
| 03034444444 | Invalid OTP | failed | Customer entered invalid OTP |
| 03035555555 | Insufficient | failed | Insufficient credit |
| 03036666666 | Deactivated | failed | Account deactivated |
| 03037777777 | No Response | failed | No response from wallet partner |
| 03038888888 | Invalid MPIN | failed | Customer entered invalid MPIN |
| 03039999999 | Not Approved | failed | Customer didn't approve |

## Payment Flow

1. **Merchant** calls `POST /checkouts` with transaction details
2. **API** returns a `checkoutUrl`
3. **Customer** is redirected to the payment page
4. **Customer** enters mobile number and PIN
5. **System** processes payment based on mobile number scenario
6. **Webhook** is sent to merchant's `successUrl`
7. **Customer** is redirected to merchant's `returnUrl`

## Webhook Payload

The system sends a POST request to your `successUrl` with:

```json
{
    "id": "checkout-uuid",
    "vendorId": "TEST_VENDOR_001",
    "checkoutId": "checkout-uuid",
    "reference": "your-reference",
    "paymentMethod": "jazzcash",
    "status": "completed",
    "statusCode": "SUCCESS",
    "createdAt": "2025-01-10T10:00:00Z",
    "updatedAt": "2025-01-10T10:00:30Z",
    "amount": 1000.00,
    "acknowledged": false,
    "tokenId": "checkout-uuid",
    "message": "Payment completed successfully"
}
```

## Testing with Postman

Import the Postman collection from `postman/Dummy_Payment_API.postman_collection.json`

## Development Tips

### Test a Complete Flow

1. Create a checkout session
2. Open the checkout URL in a browser
3. Enter a test mobile number
4. Check webhook logs in database
5. Verify transaction status

### Manual Webhook Testing

```bash
curl -X POST http://localhost:3000/webhooks/test \
  -H "Content-Type: application/json" \
  -d '{"checkoutId": "your-checkout-id"}'
```

### View Database

```sql
-- Check transactions
SELECT * FROM transactions ORDER BY created_at DESC;

-- Check webhook logs
SELECT * FROM webhook_logs ORDER BY created_at DESC;

-- Check scenarios
SELECT * FROM scenario_mappings;
```

## Error Handling

The API returns consistent error responses:

```json
{
    "success": false,
    "error": "Error message here"
}
```

Or for validation errors:

```json
{
    "success": false,
    "errors": [
        "amount must be a positive number",
        "paymentMethod must be either jazzcash or easypaisa"
    ]
}
```

## Production Considerations

1. **Security**: Implement proper RSA signature validation
2. **Database**: Use connection pooling (already implemented)
3. **Webhooks**: Add queue system for reliability
4. **Monitoring**: Add logging service
5. **Rate Limiting**: Implement API rate limits
6. **SSL**: Use HTTPS in production

## Deployment (VPS / Docker Compose)

1. Ensure DNS points `sandbox.mycodigital.io` to your VPS IP.
2. Copy repo to VPS (e.g., `/opt/dummy-payment-api`).
3. Run the deploy script:
```bash
cd /opt/dummy-payment-api
bash deploy/deploy.sh
```
4. Verify: `curl http://sandbox.mycodigital.io/health`
5. Add HTTPS (host-level):
```bash
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
sudo certbot --nginx -d sandbox.mycodigital.io
```


## Troubleshooting

### Database Connection Error
- Check MySQL is running
- Verify credentials in `.env`
- Ensure database exists

### Webhook Not Received
- Check `successUrl` is accessible
- Review webhook_logs table
- Verify network connectivity

### Payment Page Not Loading
- Check checkout session exists
- Verify it's not expired
- Check browser console for errors

## Support

For issues or questions:
1. Check the logs
2. Review test scenarios
3. Verify API parameters
4. Check webhook logs table

---

**Note:** This is a dummy system for testing purposes only. Do not use in production for real payments.
