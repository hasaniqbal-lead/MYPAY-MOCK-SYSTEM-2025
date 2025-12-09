const { pool } = require('../config/database');
const webhookService = require('../services/webhookService');

class PaymentController {
    // Render payment page
    async renderPaymentPage(req, res) {
        try {
            const { sessionId } = req.params;

            // Get transaction details
            const [transactions] = await pool.query(
                'SELECT * FROM transactions WHERE checkout_id = ?',
                [sessionId]
            );

            if (transactions.length === 0) {
                return res.status(404).send(this.renderErrorPage('Invalid Payment Session', 'The payment session you\'re trying to access doesn\'t exist or has expired.'));
            }

            const transaction = transactions[0];

            // Check if transaction is already processed
            if (transaction.status !== 'pending') {
                return res.redirect(transaction.return_url);
            }

            // Render payment page based on payment method
            const html = this.renderPaymentForm(transaction);
            res.send(html);

        } catch (error) {
            console.error('Render payment page error:', error);
            res.status(500).send(this.renderErrorPage('Payment Error', 'An error occurred while loading the payment page.'));
        }
    }

    // Render error page
    renderErrorPage(title, message) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title} - MyPay</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    ${this.getErrorStyles()}
                </style>
            </head>
            <body>
                <div class="error-container">
                    <div class="error-content">
                        <div class="error-icon">⚠️</div>
                        <h1>${title}</h1>
                        <p>${message}</p>
                        <a href="/" class="btn-home">Go to Home</a>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // Render payment form
    renderPaymentForm(transaction) {
        const paymentMethod = transaction.payment_method?.toLowerCase() || 'card';
        const amount = parseFloat(transaction.amount).toFixed(2);
        
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>MyPay Payment - ${this.getPaymentMethodName(paymentMethod)}</title>
                <style>
                    ${this.getPaymentStyles(paymentMethod)}
                </style>
            </head>
            <body>
                <div class="payment-container">
                    <div class="payment-card">
                        <!-- Header -->
                        <div class="payment-header">
                            <div class="logo-section">
                                <div class="mypay-logo">
                                    <span class="logo-my">my</span><span class="logo-pay">pay</span>
                                </div>
                                <span class="badge-merchant">Merchant Platform</span>
                            </div>
                            <div class="payment-method-badge ${paymentMethod}">
                                ${this.getPaymentMethodIcon(paymentMethod)}
                                <span>${this.getPaymentMethodName(paymentMethod)}</span>
                            </div>
                        </div>

                        <!-- Amount Display -->
                        <div class="amount-section">
                            <div class="amount-label">Amount to Pay</div>
                            <div class="amount-value">PKR ${amount}</div>
                            <div class="amount-reference">Reference: ${transaction.reference}</div>
                        </div>

                        <!-- Payment Form -->
                        <form id="paymentForm" class="payment-form">
                            ${this.getPaymentFormFields(paymentMethod)}
                            
                            <div id="errorMessage" class="error-message" style="display: none;"></div>
                            
                            <button type="submit" class="btn-pay">
                                <span class="btn-text">Pay PKR ${amount}</span>
                                <span class="btn-loader" style="display: none;">Processing...</span>
                            </button>
                            
                            <button type="button" class="btn-cancel" onclick="cancelPayment()">
                                Cancel Payment
                            </button>
                        </form>

                        <!-- Test Info -->
                        <div class="test-info">
                            <div class="test-header">
                                <span class="test-icon">🧪</span>
                                <strong>Test Mode</strong>
                            </div>
                            <div class="test-content">
                                ${this.getTestInfo(paymentMethod)}
                            </div>
                        </div>
                    </div>
                </div>

                <script>
                    const sessionId = '${transaction.checkout_id}';
                    const returnUrl = '${transaction.return_url}';
                    
                    ${this.getPaymentScript(paymentMethod)}
                    
                    ${this.getCommonPaymentScript()}
                    
                    function cancelPayment() {
                        if (confirm('Are you sure you want to cancel this payment?')) {
                            window.location.href = returnUrl + '?status=cancelled&checkoutId=' + sessionId;
                        }
                    }
                </script>
            </body>
            </html>
        `;
    }

    // Get payment form fields based on method
    getPaymentFormFields(paymentMethod) {
        if (paymentMethod === 'card') {
            return `
                <div class="form-group">
                    <label for="cardNumber">Card Number</label>
                    <input type="text" id="cardNumber" name="cardNumber" 
                           placeholder="1234 5678 9012 3456" 
                           maxlength="19" 
                           required
                           autocomplete="cc-number">
                    <div class="input-hint">Use test card: 4242 4242 4242 4242</div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="expiryDate">Expiry Date</label>
                        <input type="text" id="expiryDate" name="expiryDate" 
                               placeholder="MM/YY" 
                               maxlength="5" 
                               required
                               autocomplete="cc-exp">
                        <div class="input-hint">MM/YY format</div>
                    </div>
                    
                    <div class="form-group">
                        <label for="cvv">CVV</label>
                        <input type="password" id="cvv" name="cvv" 
                               placeholder="123" 
                               maxlength="4" 
                               required
                               autocomplete="cc-csc">
                        <div class="input-hint">3-4 digits</div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="cardholderName">Cardholder Name</label>
                    <input type="text" id="cardholderName" name="cardholderName" 
                           placeholder="John Doe" 
                           required
                           autocomplete="cc-name">
                </div>
            `;
        } else {
            // Easypaisa or Jazzcash
            return `
                <div class="form-group">
                    <label for="mobileNumber">Mobile Number</label>
                    <input type="text" id="mobileNumber" name="mobileNumber" 
                           placeholder="03XXXXXXXXX" 
                           maxlength="11" 
                           required
                           autocomplete="tel">
                    <div id="mobileError" class="input-error"></div>
                    <div class="input-hint">Enter your ${this.getPaymentMethodName(paymentMethod)} registered mobile number</div>
                </div>
                
                <div class="form-group">
                    <label for="pin">MPIN / OTP</label>
                    <input type="password" id="pin" name="pin" 
                           placeholder="Enter 4-digit PIN" 
                           maxlength="4" 
                           required>
                    <div class="input-hint">Enter your ${this.getPaymentMethodName(paymentMethod)} PIN</div>
                </div>
            `;
        }
    }

    // Get test info based on payment method
    getTestInfo(paymentMethod) {
        if (paymentMethod === 'card') {
            return `
                <p><strong>Test Card Numbers:</strong></p>
                <ul>
                    <li><strong>Success:</strong> 4242 4242 4242 4242</li>
                    <li><strong>Decline:</strong> 4000 0000 0000 0002</li>
                    <li><strong>Insufficient Funds:</strong> 4000 0000 0000 9995</li>
                </ul>
                <p><strong>Test Details:</strong></p>
                <ul>
                    <li>Expiry: Any future date (e.g., 12/25)</li>
                    <li>CVV: Any 3 digits (e.g., 123)</li>
                    <li>Cardholder: Any name</li>
                </ul>
            `;
        } else {
            const methodName = this.getPaymentMethodName(paymentMethod);
            return `
                <p><strong>Test Mobile Numbers:</strong></p>
                <ul>
                    <li><strong>Success:</strong> 03030000000</li>
                    <li><strong>Failed:</strong> 03021111111</li>
                    <li><strong>Pending:</strong> 03032222222</li>
                </ul>
                <p><strong>PIN:</strong> Use any 4-digit PIN (e.g., 1234)</p>
            `;
        }
    }

    // Get payment script based on method
    getPaymentScript(paymentMethod) {
        if (paymentMethod === 'card') {
            return `
                // Card number formatting
                document.getElementById('cardNumber').addEventListener('input', function(e) {
                    let value = e.target.value.replace(/\\s/g, '');
                    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
                    e.target.value = formattedValue;
                    
                    // Validate card number
                    const cardNumber = value.replace(/\\s/g, '');
                    if (cardNumber.length >= 13 && cardNumber.length <= 19) {
                        e.target.classList.remove('input-error');
                    }
                });
                
                // Expiry date formatting
                document.getElementById('expiryDate').addEventListener('input', function(e) {
                    let value = e.target.value.replace(/\\D/g, '');
                    if (value.length >= 2) {
                        value = value.substring(0, 2) + '/' + value.substring(2, 4);
                    }
                    e.target.value = value;
                    
                    // Validate expiry
                    const [month, year] = value.split('/');
                    if (month && year) {
                        const monthNum = parseInt(month);
                        const yearNum = parseInt('20' + year);
                        const currentDate = new Date();
                        const expiryDate = new Date(yearNum, monthNum - 1);
                        if (monthNum >= 1 && monthNum <= 12 && expiryDate > currentDate) {
                            e.target.classList.remove('input-error');
                        }
                    }
                });
                
                // CVV validation
                document.getElementById('cvv').addEventListener('input', function(e) {
                    let value = e.target.value.replace(/\\D/g, '');
                    e.target.value = value;
                });
                
                // Form submission
                document.getElementById('paymentForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const cardNumber = document.getElementById('cardNumber').value.replace(/\\s/g, '');
                    const expiryDate = document.getElementById('expiryDate').value;
                    const cvv = document.getElementById('cvv').value;
                    const cardholderName = document.getElementById('cardholderName').value;
                    
                    // Validate card number
                    if (!cardNumber.match(/^\\d{13,19}$/)) {
                        showError('Please enter a valid card number');
                        return;
                    }
                    
                    // Validate expiry
                    const [month, year] = expiryDate.split('/');
                    if (!month || !year || month.length !== 2 || year.length !== 2) {
                        showError('Please enter a valid expiry date (MM/YY)');
                        return;
                    }
                    
                    const monthNum = parseInt(month);
                    const yearNum = parseInt('20' + year);
                    const currentDate = new Date();
                    const expiryDateObj = new Date(yearNum, monthNum - 1);
                    
                    if (monthNum < 1 || monthNum > 12) {
                        showError('Invalid month');
                        return;
                    }
                    
                    if (expiryDateObj <= currentDate) {
                        showError('Card has expired');
                        return;
                    }
                    
                    // Validate CVV
                    if (!cvv.match(/^\\d{3,4}$/)) {
                        showError('Please enter a valid CVV');
                        return;
                    }
                    
                    // Validate cardholder name
                    if (!cardholderName.trim()) {
                        showError('Please enter cardholder name');
                        return;
                    }
                    
                    await submitPayment({
                        cardNumber: cardNumber,
                        expiryDate: expiryDate,
                        cvv: cvv,
                        cardholderName: cardholderName
                    });
                });
            `;
        } else {
            return `
                // Mobile number validation
                document.getElementById('mobileNumber').addEventListener('input', function(e) {
                    let value = e.target.value.replace(/\\D/g, '');
                    e.target.value = value;
                    
                    if (value.length === 11 && value.startsWith('03')) {
                        document.getElementById('mobileError').textContent = '';
                        e.target.classList.remove('input-error');
                    } else if (value.length > 0) {
                        document.getElementById('mobileError').textContent = 'Invalid mobile number format';
                        e.target.classList.add('input-error');
                    }
                });
                
                // Form submission
                document.getElementById('paymentForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const mobileNumber = document.getElementById('mobileNumber').value;
                    const pin = document.getElementById('pin').value;
                    
                    // Validate mobile number
                    if (!mobileNumber.match(/^03\\d{9}$/)) {
                        showError('Invalid mobile number format. Please use 03XXXXXXXXX');
                        return;
                    }
                    
                    // Validate PIN
                    if (!pin.match(/^\\d{4}$/)) {
                        showError('Please enter a valid 4-digit PIN');
                        return;
                    }
                    
                    await submitPayment({
                        mobileNumber: mobileNumber,
                        pin: pin
                    });
                });
            `;
        }
    }

    // Common payment submission functions
    getCommonPaymentScript() {
        return `
            async function submitPayment(paymentData) {
                const form = document.getElementById('paymentForm');
                const submitBtn = form.querySelector('.btn-pay');
                const btnText = submitBtn.querySelector('.btn-text');
                const btnLoader = submitBtn.querySelector('.btn-loader');
                
                // Show loading state
                submitBtn.disabled = true;
                btnText.style.display = 'none';
                btnLoader.style.display = 'inline-block';
                hideError();
                
                try {
                    const response = await fetch('/payment/' + sessionId + '/complete', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(paymentData)
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        // Show success message briefly
                        submitBtn.innerHTML = '<span style="color: #34d399;">✓ Payment Successful!</span>';
                        setTimeout(() => {
                            window.location.href = result.returnUrl;
                        }, 1000);
                    } else {
                        showError(result.message || 'Payment failed. Please try again.');
                        submitBtn.disabled = false;
                        btnText.style.display = 'inline-block';
                        btnLoader.style.display = 'none';
                        
                        // Redirect after 3 seconds if returnUrl is provided
                        if (result.returnUrl) {
                            setTimeout(() => {
                                window.location.href = result.returnUrl;
                            }, 3000);
                        }
                    }
                } catch (error) {
                    console.error('Payment error:', error);
                    showError('An error occurred. Please try again.');
                    submitBtn.disabled = false;
                    btnText.style.display = 'inline-block';
                    btnLoader.style.display = 'none';
                }
            }
            
            function showError(message) {
                const errorDiv = document.getElementById('errorMessage');
                errorDiv.textContent = message;
                errorDiv.style.display = 'block';
            }
            
            function hideError() {
                document.getElementById('errorMessage').style.display = 'none';
            }
        `;
    }

    // Complete payment
    async completePayment(req, res) {
        try {
            const { sessionId } = req.params;
            const { mobileNumber, pin, cardNumber, expiryDate, cvv, cardholderName } = req.body;

            // Get transaction
            const [transactions] = await pool.query(
                'SELECT * FROM transactions WHERE checkout_id = ?',
                [sessionId]
            );

            if (transactions.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Invalid payment session'
                });
            }

            const transaction = transactions[0];
            const paymentMethod = transaction.payment_method?.toLowerCase();

            // Check if already processed
            if (transaction.status !== 'pending') {
                return res.json({
                    success: false,
                    message: 'Payment already processed',
                    returnUrl: transaction.return_url
                });
            }

            let status, statusCode, description;

            if (paymentMethod === 'card') {
                // Handle card payment
                status = this.processCardPayment(cardNumber);
                statusCode = status === 'completed' ? 'SUCCESS' : 'FAILED';
                description = status === 'completed' ? 'Payment completed successfully' : 'Card payment declined';
            } else {
                // Handle mobile wallet payment (Easypaisa/Jazzcash)
                // Get scenario based on mobile number
                const [scenarios] = await pool.query(
                    'SELECT * FROM scenario_mappings WHERE mobile_number = ?',
                    [mobileNumber]
                );

                if (scenarios.length > 0) {
                    const scenario = scenarios[0];
                    status = scenario.status;
                    statusCode = scenario.status_code;
                    description = scenario.description;
                } else {
                    // Default behavior for unknown numbers - random success/fail
                    const isSuccess = Math.random() > 0.5;
                    status = isSuccess ? 'completed' : 'failed';
                    statusCode = isSuccess ? 'SUCCESS' : 'FAILED';
                    description = isSuccess ? 'Payment successful' : 'Payment failed';
                }
            }

            // Update transaction
            if (paymentMethod === 'card') {
                // For card payments, we'll store the last 4 digits in mobile_number field for now
                // (or we can add card_last_four column later if needed)
                await pool.query(
                    `UPDATE transactions 
                    SET status = ?, status_code = ?, mobile_number = ?, updated_at = NOW() 
                    WHERE checkout_id = ?`,
                    [status, statusCode, cardNumber ? cardNumber.slice(-4) : null, sessionId]
                );
            } else {
                // For mobile wallet payments
                await pool.query(
                    `UPDATE transactions 
                    SET status = ?, status_code = ?, mobile_number = ?, updated_at = NOW() 
                    WHERE checkout_id = ?`,
                    [status, statusCode, mobileNumber, sessionId]
                );
            }

            // Send webhook asynchronously
            setTimeout(() => {
                webhookService.sendWebhook(sessionId);
            }, 1000);

            // Return response
            res.json({
                success: status === 'completed',
                message: description,
                returnUrl: `${transaction.return_url}?status=${status}&checkoutId=${sessionId}`
            });

        } catch (error) {
            console.error('Complete payment error:', error);
            res.status(500).json({
                success: false,
                message: 'Payment processing failed'
            });
        }
    }

    // Process card payment based on card number
    processCardPayment(cardNumber) {
        if (!cardNumber) return 'failed';
        
        const card = cardNumber.replace(/\s/g, '');
        
        // Test card scenarios
        if (card === '4242424242424242' || card === '4111111111111111') {
            return 'completed'; // Success
        } else if (card === '4000000000000002' || card === '4000000000009995') {
            return 'failed'; // Decline
        } else if (card === '4000000000000005') {
            return 'failed'; // Insufficient funds
        } else if (card.startsWith('4000')) {
            // Other 4000 series cards - random failure
            return Math.random() > 0.3 ? 'completed' : 'failed';
        } else {
            // Default - random success/fail
            return Math.random() > 0.5 ? 'completed' : 'failed';
        }
    }

    // Get payment method name
    getPaymentMethodName(method) {
        const names = {
            'easypaisa': 'Easypaisa',
            'jazzcash': 'JazzCash',
            'card': 'Card Payment'
        };
        return names[method?.toLowerCase()] || 'Payment';
    }

    // Get payment method icon
    getPaymentMethodIcon(method) {
        const icons = {
            'easypaisa': '💳',
            'jazzcash': '📱',
            'card': '💳'
        };
        return icons[method?.toLowerCase()] || '💳';
    }

    // Get payment styles
    getPaymentStyles(paymentMethod) {
        return `
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
                background: linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #1a252f 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            
            .payment-container {
                width: 100%;
                max-width: 500px;
            }
            
            .payment-card {
                background: #ffffff;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                overflow: hidden;
            }
            
            .payment-header {
                background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
                padding: 24px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 12px;
            }
            
            .logo-section {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .mypay-logo {
                font-size: 24px;
                font-weight: bold;
            }
            
            .logo-my {
                color: #34d399;
            }
            
            .logo-pay {
                color: #ffffff;
            }
            
            .badge-merchant {
                background: rgba(255, 255, 255, 0.2);
                color: #ffffff;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 500;
            }
            
            .payment-method-badge {
                background: rgba(255, 255, 255, 0.2);
                color: #ffffff;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .payment-method-badge.easypaisa {
                background: rgba(0, 166, 81, 0.3);
            }
            
            .payment-method-badge.jazzcash {
                background: rgba(237, 28, 36, 0.3);
            }
            
            .payment-method-badge.card {
                background: rgba(52, 211, 153, 0.3);
            }
            
            .amount-section {
                padding: 32px 24px;
                text-align: center;
                background: #f9fafb;
            }
            
            .amount-label {
                font-size: 14px;
                color: #6b7280;
                margin-bottom: 8px;
                font-weight: 500;
            }
            
            .amount-value {
                font-size: 48px;
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 8px;
            }
            
            .amount-reference {
                font-size: 12px;
                color: #9ca3af;
                font-family: monospace;
            }
            
            .payment-form {
                padding: 24px;
            }
            
            .form-group {
                margin-bottom: 20px;
            }
            
            .form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
            }
            
            label {
                display: block;
                font-size: 14px;
                font-weight: 600;
                color: #374151;
                margin-bottom: 8px;
            }
            
            input {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 16px;
                transition: all 0.2s;
                background: #ffffff;
                color: #1f2937;
            }
            
            input:focus {
                outline: none;
                border-color: #34d399;
                box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.1);
            }
            
            input.input-error {
                border-color: #ef4444;
            }
            
            .input-hint {
                font-size: 12px;
                color: #6b7280;
                margin-top: 4px;
            }
            
            .input-error {
                font-size: 12px;
                color: #ef4444;
                margin-top: 4px;
            }
            
            .error-message {
                background: #fef2f2;
                border: 1px solid #fecaca;
                color: #dc2626;
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 16px;
                font-size: 14px;
            }
            
            .btn-pay {
                width: 100%;
                padding: 16px;
                background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
                color: #ffffff;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                margin-bottom: 12px;
                box-shadow: 0 4px 12px rgba(52, 211, 153, 0.3);
            }
            
            .btn-pay:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(52, 211, 153, 0.4);
            }
            
            .btn-pay:disabled {
                opacity: 0.7;
                cursor: not-allowed;
            }
            
            .btn-cancel {
                width: 100%;
                padding: 12px;
                background: #f3f4f6;
                color: #6b7280;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .btn-cancel:hover {
                background: #e5e7eb;
                color: #374151;
            }
            
            .test-info {
                background: #fef3c7;
                border-top: 1px solid #fde68a;
                padding: 20px 24px;
                margin-top: 24px;
            }
            
            .test-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 12px;
                font-size: 14px;
                font-weight: 600;
                color: #92400e;
            }
            
            .test-content {
                font-size: 13px;
                color: #78350f;
                line-height: 1.6;
            }
            
            .test-content ul {
                margin: 8px 0;
                padding-left: 20px;
            }
            
            .test-content li {
                margin: 4px 0;
            }
            
            @media (max-width: 640px) {
                .form-row {
                    grid-template-columns: 1fr;
                }
                
                .payment-header {
                    flex-direction: column;
                    align-items: flex-start;
                }
                
                .amount-value {
                    font-size: 36px;
                }
            }
        `;
    }

    // Get error styles
    getErrorStyles() {
        return `
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                background: linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #1a252f 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            
            .error-container {
                width: 100%;
                max-width: 500px;
            }
            
            .error-content {
                background: #ffffff;
                border-radius: 16px;
                padding: 40px;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }
            
            .error-icon {
                font-size: 64px;
                margin-bottom: 20px;
            }
            
            h1 {
                color: #1f2937;
                margin-bottom: 12px;
                font-size: 24px;
            }
            
            p {
                color: #6b7280;
                margin-bottom: 24px;
            }
            
            .btn-home {
                display: inline-block;
                padding: 12px 24px;
                background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
                color: #ffffff;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                transition: all 0.2s;
            }
            
            .btn-home:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(52, 211, 153, 0.3);
            }
        `;
    }

    // Get test scenarios (for documentation)
    async getTestScenarios(req, res) {
        try {
            // Get mobile wallet scenarios from database
            const [scenarios] = await pool.query(
                'SELECT mobile_number, scenario, status, status_code, description FROM scenario_mappings ORDER BY mobile_number'
            );

            // Format mobile wallet scenarios
            const walletScenarios = scenarios.map(scenario => ({
                mobileNumber: scenario.mobile_number,
                scenario: scenario.scenario,
                status: scenario.status,
                statusCode: scenario.status_code,
                description: scenario.description,
                paymentMethod: 'wallet', // Works for both Easypaisa and JazzCash
                usage: `Use mobile number ${scenario.mobile_number} with any 4-digit PIN`
            }));

            // Card payment scenarios
            const cardScenarios = [
                {
                    cardNumber: '4242 4242 4242 4242',
                    scenario: 'success',
                    status: 'completed',
                    statusCode: 'SUCCESS',
                    description: 'Payment completed successfully',
                    paymentMethod: 'card',
                    usage: 'Use with any future expiry date (e.g., 12/25), any 3-digit CVV (e.g., 123), and any cardholder name'
                },
                {
                    cardNumber: '4111 1111 1111 1111',
                    scenario: 'success',
                    status: 'completed',
                    statusCode: 'SUCCESS',
                    description: 'Payment completed successfully',
                    paymentMethod: 'card',
                    usage: 'Alternative success card - use with any future expiry date, CVV, and cardholder name'
                },
                {
                    cardNumber: '4000 0000 0000 0002',
                    scenario: 'decline',
                    status: 'failed',
                    statusCode: 'FAILED',
                    description: 'Card payment declined',
                    paymentMethod: 'card',
                    usage: 'Card declined - use with any expiry date, CVV, and cardholder name'
                },
                {
                    cardNumber: '4000 0000 0000 9995',
                    scenario: 'insufficient_funds',
                    status: 'failed',
                    statusCode: 'FAILED',
                    description: 'Insufficient funds',
                    paymentMethod: 'card',
                    usage: 'Insufficient funds error - use with any expiry date, CVV, and cardholder name'
                },
                {
                    cardNumber: '4000 0000 0000 0005',
                    scenario: 'insufficient_funds',
                    status: 'failed',
                    statusCode: 'FAILED',
                    description: 'Insufficient funds',
                    paymentMethod: 'card',
                    usage: 'Alternative insufficient funds card'
                }
            ];

            // Response structure
            const response = {
                success: true,
                message: 'Test scenarios for all payment methods',
                paymentMethods: {
                    easypaisa: {
                        name: 'Easypaisa',
                        description: 'Mobile wallet payment method',
                        scenarios: walletScenarios.map(s => ({
                            mobileNumber: s.mobileNumber,
                            scenario: s.scenario,
                            status: s.status,
                            statusCode: s.statusCode,
                            description: s.description,
                            usage: s.usage,
                            pin: 'Any 4-digit PIN (e.g., 1234)'
                        }))
                    },
                    jazzcash: {
                        name: 'JazzCash',
                        description: 'Mobile wallet payment method',
                        scenarios: walletScenarios.map(s => ({
                            mobileNumber: s.mobileNumber,
                            scenario: s.scenario,
                            status: s.status,
                            statusCode: s.statusCode,
                            description: s.description,
                            usage: s.usage,
                            pin: 'Any 4-digit PIN (e.g., 1234)'
                        }))
                    },
                    card: {
                        name: 'Card Payment',
                        description: 'Credit/Debit card payment method',
                        scenarios: cardScenarios.map(s => ({
                            cardNumber: s.cardNumber,
                            scenario: s.scenario,
                            status: s.status,
                            statusCode: s.statusCode,
                            description: s.description,
                            usage: s.usage,
                            expiryDate: 'Any future date in MM/YY format (e.g., 12/25)',
                            cvv: 'Any 3-4 digits (e.g., 123)',
                            cardholderName: 'Any name (e.g., John Doe)'
                        }))
                    }
                },
                summary: {
                    totalWalletScenarios: walletScenarios.length,
                    totalCardScenarios: cardScenarios.length,
                    totalScenarios: walletScenarios.length + cardScenarios.length
                },
                quickReference: {
                    wallet: {
                        success: '03030000000',
                        failed: '03021111111',
                        timeout: '03032222222'
                    },
                    card: {
                        success: '4242 4242 4242 4242',
                        decline: '4000 0000 0000 0002',
                        insufficientFunds: '4000 0000 0000 9995'
                    }
                }
            };

            res.json(response);

        } catch (error) {
            console.error('Get scenarios error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve test scenarios',
                message: error.message
            });
        }
    }
}

module.exports = new PaymentController();
