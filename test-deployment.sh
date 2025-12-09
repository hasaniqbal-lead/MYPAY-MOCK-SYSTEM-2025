#!/bin/bash

# ===========================================
# MyPay Mock Platform - Deployment Testing Script
# ===========================================

echo "=========================================="
echo "  MyPay Deployment Testing"
echo "=========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0

# Test function
test_endpoint() {
    local url=$1
    local name=$2
    local expected_code=${3:-200}
    local method=${4:-GET}
    local data=$5
    local headers=$6

    echo -n "Testing $name... "

    if [ -n "$data" ]; then
        if [ -n "$headers" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" -H "$headers" -d "$data")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" -d "$data")
        fi
    else
        if [ -n "$headers" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" -H "$headers")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$url")
        fi
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" -eq "$expected_code" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Expected $expected_code, got $http_code)"
        echo "Response: $body"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo -e "${BLUE}=== DOCKER CONTAINER TESTS ===${NC}"
echo ""

# Check if containers are running
containers=("mypay-mysql" "mypay-payout-api" "mypay-payment-api" "mypay-merchant-portal" "mypay-admin-portal")
for container in "${containers[@]}"; do
    echo -n "Checking $container... "
    if docker ps | grep -q "$container"; then
        echo -e "${GREEN}✓ RUNNING${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ NOT RUNNING${NC}"
        FAILED=$((FAILED + 1))
    fi
done
echo ""

echo -e "${BLUE}=== PAYOUT API TESTS ===${NC}"
echo ""

# Test Payout API Health
test_endpoint "https://sandbox.mycodigital.io/api/v1/health" "Payout API Health"

# Test Directory Endpoint
test_endpoint "https://sandbox.mycodigital.io/api/v1/directory" "Bank/Wallet Directory" 401

# Test Balance Endpoint (should fail without auth)
test_endpoint "https://sandbox.mycodigital.io/api/v1/balance" "Balance Check (no auth)" 401

echo ""
echo -e "${BLUE}=== PAYMENT API TESTS ===${NC}"
echo ""

# Test Payment API Health
test_endpoint "https://sandbox.mycodigital.io/health" "Payment API Health"

# Test Checkout Creation (should fail without API key)
test_endpoint "https://sandbox.mycodigital.io/checkouts" "Create Checkout (no auth)" 401 POST

# Test with API key
API_KEY="test-api-key-123"
checkout_data='{"reference":"TEST-001","amount":1000,"paymentMethod":"jazzcash","paymentType":"onetime","successUrl":"https://example.com/success","returnUrl":"https://example.com/return"}'

echo -n "Testing Create Checkout (with API key)... "
response=$(curl -s -w "\n%{http_code}" -X POST "https://sandbox.mycodigital.io/checkouts" \
    -H "Content-Type: application/json" \
    -H "X-Api-Key: $API_KEY" \
    -d "$checkout_data")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
    PASSED=$((PASSED + 1))

    # Extract checkout_id for payment page test
    CHECKOUT_ID=$(echo "$body" | grep -o '"checkout_id":"[^"]*"' | cut -d'"' -f4)

    if [ -n "$CHECKOUT_ID" ]; then
        echo "  Checkout ID: $CHECKOUT_ID"

        # Test payment page
        test_endpoint "https://sandbox.mycodigital.io/payment/$CHECKOUT_ID" "Payment Page Load"
    fi
else
    echo -e "${RED}✗ FAILED${NC} (Expected 200/201, got $http_code)"
    echo "Response: $body"
    FAILED=$((FAILED + 1))
fi

echo ""
echo -e "${BLUE}=== PORTAL AUTH TESTS ===${NC}"
echo ""

# Test Portal Login
login_data='{"email":"test@mycodigital.io","password":"test123456"}'

echo -n "Testing Portal Login... "
response=$(curl -s -w "\n%{http_code}" -X POST "https://sandbox.mycodigital.io/api/portal/auth/login" \
    -H "Content-Type: application/json" \
    -d "$login_data")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
    PASSED=$((PASSED + 1))

    # Extract token
    TOKEN=$(echo "$body" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

    if [ -n "$TOKEN" ]; then
        echo "  Token received: ${TOKEN:0:20}..."

        # Test authenticated endpoint
        echo -n "Testing Get Profile (with token)... "
        response=$(curl -s -w "\n%{http_code}" -X GET "https://sandbox.mycodigital.io/api/portal/merchant/profile" \
            -H "Authorization: Bearer $TOKEN")

        http_code=$(echo "$response" | tail -n1)

        if [ "$http_code" -eq 200 ]; then
            echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
            PASSED=$((PASSED + 1))
        else
            echo -e "${RED}✗ FAILED${NC} (Expected 200, got $http_code)"
            FAILED=$((FAILED + 1))
        fi
    fi
else
    echo -e "${RED}✗ FAILED${NC} (Expected 200, got $http_code)"
    echo "Response: $body"
    FAILED=$((FAILED + 1))
fi

echo ""
echo -e "${BLUE}=== PORTAL UI TESTS ===${NC}"
echo ""

# Test Merchant Portal
test_endpoint "https://devportal.mycodigital.io" "Merchant Portal UI"

# Test Admin Portal
test_endpoint "https://devadmin.mycodigital.io" "Admin Portal UI"

echo ""
echo -e "${BLUE}=== SSL CERTIFICATE TESTS ===${NC}"
echo ""

# Check SSL certificates
domains=("sandbox.mycodigital.io" "devportal.mycodigital.io" "devadmin.mycodigital.io")
for domain in "${domains[@]}"; do
    echo -n "Checking SSL for $domain... "

    ssl_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)

    if [ $? -eq 0 ]; then
        expiry=$(echo "$ssl_info" | grep "notAfter" | cut -d= -f2)
        echo -e "${GREEN}✓ VALID${NC} (Expires: $expiry)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ INVALID or NOT FOUND${NC}"
        FAILED=$((FAILED + 1))
    fi
done

echo ""
echo -e "${BLUE}=== DATABASE TESTS ===${NC}"
echo ""

# Test database connection
echo -n "Testing MySQL connection... "
if docker exec mypay-mysql mysqladmin ping -h localhost --silent 2>/dev/null; then
    echo -e "${GREEN}✓ CONNECTED${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ CONNECTION FAILED${NC}"
    FAILED=$((FAILED + 1))
fi

# Check if tables exist
echo -n "Checking database tables... "
table_count=$(docker exec mypay-mysql mysql -u root -p${DB_PASSWORD:-mypay_secure_password} -D mypay_mock_db -se "SHOW TABLES;" 2>/dev/null | wc -l)

if [ "$table_count" -gt 0 ]; then
    echo -e "${GREEN}✓ FOUND $table_count TABLES${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ NO TABLES FOUND${NC}"
    FAILED=$((FAILED + 1))
fi

# Check if test merchant exists
echo -n "Checking test merchant... "
merchant_exists=$(docker exec mypay-mysql mysql -u root -p${DB_PASSWORD:-mypay_secure_password} -D mypay_mock_db -se "SELECT COUNT(*) FROM merchants WHERE email='test@mycodigital.io';" 2>/dev/null)

if [ "$merchant_exists" -gt 0 ]; then
    echo -e "${GREEN}✓ TEST MERCHANT EXISTS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ TEST MERCHANT NOT FOUND${NC}"
    FAILED=$((FAILED + 1))
fi

echo ""
echo -e "${BLUE}=== NGINX TESTS ===${NC}"
echo ""

# Test Nginx status
echo -n "Checking Nginx status... "
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ RUNNING${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ NOT RUNNING${NC}"
    FAILED=$((FAILED + 1))
fi

# Test Nginx configuration
echo -n "Checking Nginx configuration... "
if nginx -t 2>&1 | grep -q "successful"; then
    echo -e "${GREEN}✓ VALID${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ INVALID${NC}"
    FAILED=$((FAILED + 1))
fi

echo ""
echo "=========================================="
echo "  TEST SUMMARY"
echo "=========================================="
echo ""

total=$((PASSED + FAILED))
pass_rate=$((PASSED * 100 / total))

echo -e "Total Tests:  $total"
echo -e "${GREEN}Passed:       $PASSED${NC}"
echo -e "${RED}Failed:       $FAILED${NC}"
echo -e "Success Rate: $pass_rate%"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}=========================================="
    echo -e "  ALL TESTS PASSED! ✓"
    echo -e "==========================================${NC}"
    echo ""
    echo -e "${GREEN}Your MyPay deployment is working correctly!${NC}"
    exit 0
else
    echo -e "${YELLOW}=========================================="
    echo -e "  SOME TESTS FAILED"
    echo -e "==========================================${NC}"
    echo ""
    echo -e "${YELLOW}Please review the failed tests above and fix any issues.${NC}"
    echo ""
    echo -e "${YELLOW}Common issues:${NC}"
    echo "  1. Services not fully started - wait a minute and try again"
    echo "  2. SSL certificates not configured - check DNS and run certbot"
    echo "  3. Database not seeded - run: docker compose exec payout-api npx prisma db seed"
    echo "  4. Wrong API keys - check .env file"
    echo ""
    exit 1
fi
