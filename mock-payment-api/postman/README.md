# Dummy Payment API - Postman Collection

## Quick Start

### Import Collection
1. Open Postman
2. Click **Import** button (top left)
3. Select the file: `Dummy_Payment_API.postman_collection.json`
4. The collection will appear in your Postman workspace

### Configuration
The collection is pre-configured with:
- **Base URL**: `https://sandbox.mycodigital.io`
- **API Key**: `test-api-key-123`

All requests use these variables automatically. You can change them in the collection variables if needed.

## Available Endpoints

### 1. Health Check
- **Method**: GET
- **URL**: `/health`
- **Auth**: None required
- **Description**: Verify API is running

### 2. Get Test Scenarios
- **Method**: GET
- **URL**: `/test-scenarios`
- **Auth**: None required
- **Description**: View all available test mobile numbers and scenarios

### 3. Create Checkout - Success Scenario
- **Method**: POST
- **URL**: `/checkouts`
- **Auth**: X-Api-Key header required
- **Description**: Create a checkout session (auto-saves checkoutId for later use)

### 4. Create Checkout - Easypaisa
- **Method**: POST
- **URL**: `/checkouts`
- **Auth**: X-Api-Key header required
- **Description**: Create checkout for Easypaisa payment method

### 5. Get Checkout Details
- **Method**: GET
- **URL**: `/checkouts/{{checkoutId}}`
- **Auth**: X-Api-Key header required
- **Description**: Get details of a checkout session

### 6. Get Transaction Status
- **Method**: GET
- **URL**: `/transactions/{reference}`
- **Auth**: X-Api-Key header required
- **Description**: Get transaction status by reference number

### 7. Complete Payment - Success
- **Method**: POST
- **URL**: `/payment/{{checkoutId}}/complete`
- **Auth**: None required
- **Description**: Complete payment with success scenario (mobile: 03030000000)

### 8. Complete Payment - Failed
- **Method**: POST
- **URL**: `/payment/{{checkoutId}}/complete`
- **Auth**: None required
- **Description**: Complete payment with failure scenario (mobile: 03021111111)

### 9. Test Webhook
- **Method**: POST
- **URL**: `/webhooks/test`
- **Auth**: None required
- **Description**: Manually trigger webhook for a checkout

## Test Scenarios

The collection supports multiple test scenarios based on mobile numbers:

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

## Usage Flow

### Typical Testing Flow:
1. **Health Check** - Verify API is accessible
2. **Create Checkout** - Create a new checkout session
3. **Get Checkout Details** - Verify checkout was created (uses saved checkoutId)
4. **Complete Payment** - Simulate payment completion
5. **Get Transaction Status** - Check final transaction status

### Example Request Body (Create Checkout):
```json
{
    "reference": "TEST-123",
    "amount": 1000.00,
    "paymentMethod": "jazzcash",
    "paymentType": "onetime",
    "successUrl": "https://merchant.com/webhook",
    "returnUrl": "https://merchant.com/return",
    "user": {
        "id": "user123",
        "email": "user@example.com",
        "name": "Test User"
    }
}
```

## Environment Variables

The collection uses these variables:
- `{{baseUrl}}` - Set to `https://sandbox.mycodigital.io`
- `{{apiKey}}` - Set to `test-api-key-123`
- `{{checkoutId}}` - Auto-populated after creating a checkout

## Notes

- All endpoints use HTTPS (SSL enabled)
- The API is deployed on sandbox.mycodigital.io
- Test API key is pre-configured
- Checkout IDs are automatically saved after creating a checkout
- Webhooks are sent automatically after payment completion

## Support

For issues or questions, refer to the main README.md in the project root.

