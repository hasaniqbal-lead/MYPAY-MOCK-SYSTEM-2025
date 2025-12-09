const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const API_KEY = process.env.TEST_API_KEY || 'test-api-key-123';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(60));
    log(title, 'cyan');
    console.log('='.repeat(60));
}

async function testEndpoint(name, method, url, data = null, headers = {}) {
    try {
        log(`\n🧪 Testing: ${name}`, 'yellow');
        log(`   ${method} ${url}`, 'blue');
        
        const config = {
            method,
            url,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };
        
        if (data) {
            config.data = data;
        }
        
        const response = await axios(config);
        
        log(`   ✅ Success (${response.status})`, 'green');
        if (response.data) {
            console.log('   Response:', JSON.stringify(response.data, null, 2));
        }
        
        return { success: true, data: response.data };
    } catch (error) {
        log(`   ❌ Failed`, 'red');
        if (error.response) {
            log(`   Status: ${error.response.status}`, 'red');
            log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
        } else if (error.code === 'ECONNREFUSED') {
            log(`   Error: Connection refused - Is the server running on ${API_BASE_URL}?`, 'red');
        } else {
            log(`   Error: ${error.message}`, 'red');
            log(`   Code: ${error.code || 'N/A'}`, 'red');
        }
        return { success: false, error: error.message };
    }
}

async function runTests() {
    logSection('🚀 Starting API Local Tests');
    log(`Base URL: ${API_BASE_URL}`, 'blue');
    log(`API Key: ${API_KEY}`, 'blue');
    
    const results = {
        passed: 0,
        failed: 0,
        tests: []
    };
    
    // Test 1: Health Check
    logSection('1️⃣ Health Check');
    const healthTest = await testEndpoint('Health Check', 'GET', `${API_BASE_URL}/health`);
    results.tests.push({ name: 'Health Check', ...healthTest });
    if (healthTest.success) results.passed++; else results.failed++;
    
    // Test 2: Test Scenarios Endpoint
    logSection('2️⃣ Test Scenarios Endpoint');
    const scenariosTest = await testEndpoint('Get Test Scenarios', 'GET', `${API_BASE_URL}/test-scenarios`);
    results.tests.push({ name: 'Test Scenarios', ...scenariosTest });
    if (scenariosTest.success) {
        results.passed++;
        if (scenariosTest.data) {
            log('\n   📊 Test Scenarios Summary:', 'cyan');
            if (scenariosTest.data.summary) {
                log(`   - Total Wallet Scenarios: ${scenariosTest.data.summary.totalWalletScenarios}`, 'green');
                log(`   - Total Card Scenarios: ${scenariosTest.data.summary.totalCardScenarios}`, 'green');
                log(`   - Total Scenarios: ${scenariosTest.data.summary.totalScenarios}`, 'green');
            }
            if (scenariosTest.data.paymentMethods) {
                log(`   - Payment Methods: ${Object.keys(scenariosTest.data.paymentMethods).join(', ')}`, 'green');
            }
        }
    } else {
        results.failed++;
    }
    
    // Test 3: Create Checkout - Easypaisa
    logSection('3️⃣ Create Checkout - Easypaisa');
    const easypaisaCheckout = await testEndpoint(
        'Create Easypaisa Checkout',
        'POST',
        `${API_BASE_URL}/checkouts`,
        {
            reference: `TEST-EP-${Date.now()}`,
            amount: 1000.00,
            paymentMethod: 'easypaisa',
            paymentType: 'onetime',
            successUrl: 'https://merchant.com/webhook',
            returnUrl: 'https://merchant.com/return'
        },
        { 'X-Api-Key': API_KEY }
    );
    results.tests.push({ name: 'Create Easypaisa Checkout', ...easypaisaCheckout });
    const easypaisaCheckoutId = easypaisaCheckout.data?.checkoutId;
    if (easypaisaCheckout.success && easypaisaCheckoutId) {
        results.passed++;
        log(`   ✅ Checkout ID: ${easypaisaCheckoutId}`, 'green');
        log(`   ✅ Checkout URL: ${easypaisaCheckout.data?.checkoutUrl}`, 'green');
    } else {
        results.failed++;
    }
    
    // Test 4: Create Checkout - JazzCash
    logSection('4️⃣ Create Checkout - JazzCash');
    const jazzcashCheckout = await testEndpoint(
        'Create JazzCash Checkout',
        'POST',
        `${API_BASE_URL}/checkouts`,
        {
            reference: `TEST-JC-${Date.now()}`,
            amount: 1500.00,
            paymentMethod: 'jazzcash',
            paymentType: 'onetime',
            successUrl: 'https://merchant.com/webhook',
            returnUrl: 'https://merchant.com/return'
        },
        { 'X-Api-Key': API_KEY }
    );
    results.tests.push({ name: 'Create JazzCash Checkout', ...jazzcashCheckout });
    const jazzcashCheckoutId = jazzcashCheckout.data?.checkoutId;
    if (jazzcashCheckout.success && jazzcashCheckoutId) {
        results.passed++;
        log(`   ✅ Checkout ID: ${jazzcashCheckoutId}`, 'green');
        log(`   ✅ Checkout URL: ${jazzcashCheckout.data?.checkoutUrl}`, 'green');
    } else {
        results.failed++;
    }
    
    // Test 5: Create Checkout - Card
    logSection('5️⃣ Create Checkout - Card');
    const cardCheckout = await testEndpoint(
        'Create Card Checkout',
        'POST',
        `${API_BASE_URL}/checkouts`,
        {
            reference: `TEST-CARD-${Date.now()}`,
            amount: 2000.00,
            paymentMethod: 'card',
            paymentType: 'onetime',
            successUrl: 'https://merchant.com/webhook',
            returnUrl: 'https://merchant.com/return'
        },
        { 'X-Api-Key': API_KEY }
    );
    results.tests.push({ name: 'Create Card Checkout', ...cardCheckout });
    const cardCheckoutId = cardCheckout.data?.checkoutId;
    if (cardCheckout.success && cardCheckoutId) {
        results.passed++;
        log(`   ✅ Checkout ID: ${cardCheckoutId}`, 'green');
        log(`   ✅ Checkout URL: ${cardCheckout.data?.checkoutUrl}`, 'green');
    } else {
        results.failed++;
    }
    
    // Test 6: Get Checkout Details
    if (easypaisaCheckoutId) {
        logSection('6️⃣ Get Checkout Details');
        const getCheckout = await testEndpoint(
            'Get Checkout',
            'GET',
            `${API_BASE_URL}/checkouts/${easypaisaCheckoutId}`,
            null,
            { 'X-Api-Key': API_KEY }
        );
        results.tests.push({ name: 'Get Checkout', ...getCheckout });
        if (getCheckout.success) results.passed++; else results.failed++;
    }
    
    // Test 7: Complete Payment - Easypaisa (Success)
    if (easypaisaCheckoutId) {
        logSection('7️⃣ Complete Payment - Easypaisa (Success)');
        const completePayment = await testEndpoint(
            'Complete Easypaisa Payment',
            'POST',
            `${API_BASE_URL}/payment/${easypaisaCheckoutId}/complete`,
            {
                mobileNumber: '03030000000',
                pin: '1234'
            }
        );
        results.tests.push({ name: 'Complete Easypaisa Payment', ...completePayment });
        if (completePayment.success) {
            results.passed++;
            log(`   ✅ Payment Status: ${completePayment.data?.success ? 'SUCCESS' : 'FAILED'}`, 'green');
            log(`   ✅ Message: ${completePayment.data?.message}`, 'green');
        } else {
            results.failed++;
        }
    }
    
    // Test 8: Complete Payment - JazzCash (Success)
    if (jazzcashCheckoutId) {
        logSection('8️⃣ Complete Payment - JazzCash (Success)');
        const completePayment = await testEndpoint(
            'Complete JazzCash Payment',
            'POST',
            `${API_BASE_URL}/payment/${jazzcashCheckoutId}/complete`,
            {
                mobileNumber: '03030000000',
                pin: '1234'
            }
        );
        results.tests.push({ name: 'Complete JazzCash Payment', ...completePayment });
        if (completePayment.success) {
            results.passed++;
            log(`   ✅ Payment Status: ${completePayment.data?.success ? 'SUCCESS' : 'FAILED'}`, 'green');
            log(`   ✅ Message: ${completePayment.data?.message}`, 'green');
        } else {
            results.failed++;
        }
    }
    
    // Test 9: Complete Payment - Card (Success)
    if (cardCheckoutId) {
        logSection('9️⃣ Complete Payment - Card (Success)');
        const completePayment = await testEndpoint(
            'Complete Card Payment',
            'POST',
            `${API_BASE_URL}/payment/${cardCheckoutId}/complete`,
            {
                cardNumber: '4242424242424242',
                expiryDate: '12/25',
                cvv: '123',
                cardholderName: 'John Doe'
            }
        );
        results.tests.push({ name: 'Complete Card Payment', ...completePayment });
        if (completePayment.success) {
            results.passed++;
            log(`   ✅ Payment Status: ${completePayment.data?.success ? 'SUCCESS' : 'FAILED'}`, 'green');
            log(`   ✅ Message: ${completePayment.data?.message}`, 'green');
        } else {
            results.failed++;
        }
    }
    
    // Test 10: Complete Payment - Card (Decline)
    logSection('🔟 Complete Payment - Card (Decline)');
    const cardDeclineCheckout = await testEndpoint(
        'Create Card Checkout (Decline Test)',
        'POST',
        `${API_BASE_URL}/checkouts`,
        {
            reference: `TEST-CARD-DECLINE-${Date.now()}`,
            amount: 500.00,
            paymentMethod: 'card',
            paymentType: 'onetime',
            successUrl: 'https://merchant.com/webhook',
            returnUrl: 'https://merchant.com/return'
        },
        { 'X-Api-Key': API_KEY }
    );
    
    if (cardDeclineCheckout.success && cardDeclineCheckout.data?.checkoutId) {
        const declineCheckoutId = cardDeclineCheckout.data.checkoutId;
        const completeDecline = await testEndpoint(
            'Complete Card Payment (Decline)',
            'POST',
            `${API_BASE_URL}/payment/${declineCheckoutId}/complete`,
            {
                cardNumber: '4000000000000002',
                expiryDate: '12/25',
                cvv: '123',
                cardholderName: 'John Doe'
            }
        );
        results.tests.push({ name: 'Complete Card Payment (Decline)', ...completeDecline });
        if (completeDecline.success && !completeDecline.data?.success) {
            results.passed++;
            log(`   ✅ Payment Correctly Declined`, 'green');
            log(`   ✅ Message: ${completeDecline.data?.message}`, 'green');
        } else {
            results.failed++;
        }
    }
    
    // Test 11: Payment Page Rendering
    logSection('1️⃣1️⃣ Payment Page Rendering');
    if (easypaisaCheckoutId) {
        try {
            const pageResponse = await axios.get(`${API_BASE_URL}/payment/${easypaisaCheckoutId}`);
            if (pageResponse.status === 200 && pageResponse.data.includes('MyPay')) {
                log('   ✅ Easypaisa Payment Page Rendered', 'green');
                results.passed++;
            } else {
                log('   ❌ Payment Page Rendering Failed', 'red');
                results.failed++;
            }
        } catch (error) {
            log(`   ❌ Payment Page Error: ${error.message}`, 'red');
            results.failed++;
        }
    }
    
    // Final Summary
    logSection('📊 Test Results Summary');
    log(`Total Tests: ${results.tests.length}`, 'cyan');
    log(`✅ Passed: ${results.passed}`, 'green');
    log(`❌ Failed: ${results.failed}`, 'red');
    log(`Success Rate: ${((results.passed / results.tests.length) * 100).toFixed(1)}%`, 'cyan');
    
    console.log('\n' + '='.repeat(60));
    if (results.failed === 0) {
        log('🎉 All tests passed!', 'green');
    } else {
        log('⚠️  Some tests failed. Please review the errors above.', 'yellow');
    }
    console.log('='.repeat(60) + '\n');
    
    return results;
}

// Run tests
if (require.main === module) {
    runTests().catch(error => {
        log(`\n❌ Test suite failed: ${error.message}`, 'red');
        process.exit(1);
    });
}

module.exports = { runTests };

