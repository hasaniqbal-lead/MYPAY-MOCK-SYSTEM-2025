# API Extensions Required for Portal

This document outlines the API endpoints that need to be added to the existing Payment API (`dummy-payment-api`) to support the merchant portal.

## Database Schema Changes

Add these tables to your MySQL database:

```sql
-- Merchants table
CREATE TABLE IF NOT EXISTS merchants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status ENUM('active', 'suspended', 'pending') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Link existing api_keys to merchants
ALTER TABLE api_keys ADD COLUMN merchant_id INT;
ALTER TABLE api_keys ADD FOREIGN KEY (merchant_id) REFERENCES merchants(id);

-- Add merchant_id to transactions
ALTER TABLE transactions ADD COLUMN merchant_id INT;
ALTER TABLE transactions ADD FOREIGN KEY (merchant_id) REFERENCES merchants(id);
```

## Required API Endpoints

### Authentication Endpoints

#### POST /api/portal/auth/login
```javascript
// Request body
{
  "email": "merchant@example.com",
  "password": "password123"
}

// Response
{
  "success": true,
  "token": "jwt-token-here",
  "merchant": {
    "id": 1,
    "email": "merchant@example.com",
    "companyName": "Merchant Company"
  }
}
```

#### POST /api/portal/auth/register
```javascript
// Request body
{
  "companyName": "Merchant Company",
  "email": "merchant@example.com",
  "password": "password123"
}

// Response
{
  "success": true,
  "token": "jwt-token-here",
  "merchant": {
    "id": 1,
    "email": "merchant@example.com",
    "companyName": "Merchant Company"
  }
}
```

#### POST /api/portal/auth/logout
```javascript
// Response
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Merchant Profile Endpoints

#### GET /api/portal/merchant/profile
```javascript
// Response
{
  "success": true,
  "merchant": {
    "id": 1,
    "email": "merchant@example.com",
    "companyName": "Merchant Company",
    "status": "active"
  }
}
```

#### PUT /api/portal/merchant/profile
```javascript
// Request body
{
  "companyName": "Updated Company",
  "email": "newemail@example.com",
  "currentPassword": "oldpass", // if changing password
  "newPassword": "newpass"      // if changing password
}

// Response
{
  "success": true,
  "merchant": { ... }
}
```

### Credentials Endpoints

#### GET /api/portal/merchant/credentials
```javascript
// Response
{
  "success": true,
  "credentials": {
    "api_key": "test-api-key-123",
    "api_secret": "test-api-secret-456",
    "vendor_id": "TEST_VENDOR_001"
  }
}
```

#### POST /api/portal/merchant/credentials
```javascript
// Response
{
  "success": true,
  "credentials": {
    "api_key": "new-api-key-789",
    "api_secret": "new-api-secret-012",
    "vendor_id": "TEST_VENDOR_001"
  }
}
```

### Transactions Endpoints

#### GET /api/portal/transactions
```javascript
// Query params
?page=1&limit=20&status=completed&startDate=2025-01-01&endDate=2025-01-31

// Response
{
  "success": true,
  "transactions": [
    {
      "checkout_id": "uuid",
      "reference": "REF-123",
      "amount": 1000.00,
      "status": "completed",
      "status_code": "SUCCESS",
      "payment_method": "jazzcash",
      "created_at": "2025-01-01T10:00:00Z",
      "updated_at": "2025-01-01T10:00:30Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

#### GET /api/portal/transactions/:id
```javascript
// Response
{
  "success": true,
  "transaction": { ... }
}
```

#### GET /api/portal/transactions/export/:format
```javascript
// Query params: ?startDate=...&endDate=...&status=...
// format: csv or json

// Response: File download (CSV or JSON)
```

### Dashboard Endpoints

#### GET /api/portal/dashboard/stats
```javascript
// Response
{
  "success": true,
  "stats": {
    "totalTransactions": 150,
    "successfulTransactions": 120,
    "failedTransactions": 30,
    "successRate": 80.0,
    "totalAmount": 150000.00
  }
}
```

## Authentication Middleware

Create a middleware to protect portal routes:

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.merchantId = decoded.merchantId;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
}
```

## Implementation Notes

1. Use bcrypt for password hashing
2. Use JWT for authentication tokens
3. Filter transactions by merchant_id
4. Implement pagination for transaction lists
5. Add rate limiting for API endpoints
6. Validate all input data
7. Return consistent error responses

## Testing

Test all endpoints with Postman or curl before deploying to production.

