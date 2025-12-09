const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';
const WEBHOOK_URL = 'http://localhost:4000/webhook';
const API_KEY = 'test-api-key-123';

async function testCompleteFlow() {
    console.log('🚀 Starting Complete Payment Flow Test\n');

    try {
        // 1. Create checkout session
        console.log('1️⃣ Creating checkout session...');
        const checkoutResponse = await axios.post(`${API_BASE_URL}/checkouts`, {
            reference: `TEST-${Date.now()}`,
            amount: 1500.00,
            paymentMethod: 'jazzcash',
            paymentType: 'onetime',
            successUrl: WEBHOOK_URL,
            returnUrl: 'https://merchant.com/return'
        }, {
            headers: {
                'X-Api-Key': API_KEY,
                'Content-Type': 'application/json'
            }
        });

        const { checkoutUrl, checkoutId } = checkoutResponse.data;
        console.log('✅ Checkout created successfully');
        console.log(`   Checkout ID: ${checkoutId}`);
        console.log(`   Checkout URL: ${checkoutUrl}\n`);

        // 2. Simulate payment completion
        console.log('2️⃣ Simulating payment completion...');
        console.log('   Mobile: 03030000000 (Success scenario)');
        
        const paymentResponse = await axios.post(
            `${API_BASE_URL}/payment/${checkoutId}/complete`,
            {
                mobileNumber: '03030000000',
                pin: '1234'
            }
        );

        console.log('✅ Payment processed');
        console.log(`   Status: ${paymentResponse.data.success ? 'SUCCESS' : 'FAILED'}`);
        console.log(`   Message: ${paymentResponse.data.message}\n`);

        // 3. Wait for webhook
        console.log('3️⃣ Waiting for webhook to be sent...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 4. Check transaction status
        console.log('4️⃣ Checking transaction status...');
        const statusResponse = await axios.get(
            `${API_BASE_URL}/checkouts/${checkoutId}`,
            {
                headers: { 'X-Api-Key': API_KEY }
            }
        );

        console.log('✅ Transaction Status:');
        console.log(JSON.stringify(statusResponse.data.checkout, null, 2));

        // Test different scenarios
        console.log('\n\n🧪 Testing Different Scenarios:');
        
        const scenarios = [
            { mobile: '03021111111', description: 'Transaction Failed' },
            { mobile: '03034444444', description: 'Invalid OTP' },
            { mobile: '03035555555', description: 'Insufficient Funds' }
        ];

        for (const scenario of scenarios) {
            console.log(`\n📱 Testing: ${scenario.description} (${scenario.mobile})`);
            
            // Create new checkout
            const testCheckout = await axios.post(`${API_BASE_URL}/checkouts`, {
                reference: `TEST-${scenario.mobile}-${Date.now()}`,
                amount: 500.00,
                paymentMethod: 'easypaisa',
                paymentType: 'onetime',
                successUrl: WEBHOOK_URL,
                returnUrl: 'https://merchant.com/return'
            }, {
                headers: {
                    'X-Api-Key': API_KEY,
                    'Content-Type': 'application/json'
                }
            });

            // Complete payment
            const testPayment = await axios.post(
                `${API_BASE_URL}/payment/${testCheckout.data.checkoutId}/complete`,
                {
                    mobileNumber: scenario.mobile,
                    pin: '1234'
                }
            );

            console.log(`   Result: ${testPayment.data.message}`);
        }

        console.log('\n\n✅ All tests completed successfully!');
        console.log('📝 Check http://localhost:4000/webhooks to see all received webhooks');

    } catch (error) {
        console.error('\n❌ Error during test:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

// Run the test
testCompleteFlow();
