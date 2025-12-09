"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentController = void 0;
const database_1 = require("../config/database");
const webhookService_1 = require("../services/webhookService");
class PaymentController {
    /**
     * Render payment page
     */
    async renderPaymentPage(req, res) {
        try {
            const { sessionId } = req.params;
            const transaction = await database_1.prisma.paymentTransaction.findUnique({
                where: { checkout_id: sessionId },
            });
            if (!transaction) {
                res.status(404).send(this.renderErrorPage('Invalid Payment Session', "The payment session you're trying to access doesn't exist or has expired."));
                return;
            }
            // Check if transaction is already processed
            if (transaction.status !== 'pending') {
                res.redirect(transaction.return_url);
                return;
            }
            // Render payment page based on payment method
            const html = this.renderPaymentForm(transaction);
            res.send(html);
        }
        catch (error) {
            console.error('Render payment page error:', error);
            res.status(500).send(this.renderErrorPage('Payment Error', 'An error occurred while loading the payment page.'));
        }
    }
    /**
     * Complete payment
     */
    async completePayment(req, res) {
        try {
            const { sessionId } = req.params;
            const { mobileNumber, pin, cardNumber } = req.body;
            const transaction = await database_1.prisma.paymentTransaction.findUnique({
                where: { checkout_id: sessionId },
            });
            if (!transaction) {
                res.status(404).json({
                    success: false,
                    message: 'Invalid payment session',
                });
                return;
            }
            const paymentMethod = transaction.payment_method?.toLowerCase();
            // Check if already processed
            if (transaction.status !== 'pending') {
                res.json({
                    success: false,
                    message: 'Payment already processed',
                    returnUrl: transaction.return_url,
                });
                return;
            }
            let status;
            let statusCode;
            let description;
            if (paymentMethod === 'card') {
                // Handle card payment
                status = this.processCardPayment(cardNumber);
                statusCode = status === 'completed' ? 'SUCCESS' : 'FAILED';
                description =
                    status === 'completed' ? 'Payment completed successfully' : 'Card payment declined';
            }
            else {
                // Handle mobile wallet payment (Easypaisa/Jazzcash)
                const scenario = await database_1.prisma.scenarioMapping.findFirst({
                    where: { mobile_number: mobileNumber },
                });
                if (scenario) {
                    status = scenario.status;
                    statusCode = scenario.status_code;
                    description = scenario.description;
                }
                else {
                    // Default behavior for unknown numbers - random success/fail
                    const isSuccess = Math.random() > 0.5;
                    status = isSuccess ? 'completed' : 'failed';
                    statusCode = isSuccess ? 'SUCCESS' : 'FAILED';
                    description = isSuccess ? 'Payment successful' : 'Payment failed';
                }
            }
            // Update transaction
            const mobileOrCard = paymentMethod === 'card' ? (cardNumber ? cardNumber.slice(-4) : null) : mobileNumber;
            await database_1.prisma.paymentTransaction.update({
                where: { checkout_id: sessionId },
                data: {
                    status,
                    status_code: statusCode,
                    mobile_number: mobileOrCard,
                },
            });
            // Send webhook asynchronously
            setTimeout(() => {
                webhookService_1.webhookService.sendWebhook(sessionId);
            }, 1000);
            // Return response
            res.json({
                success: status === 'completed',
                message: description,
                returnUrl: `${transaction.return_url}?status=${status}&checkoutId=${sessionId}`,
            });
        }
        catch (error) {
            console.error('Complete payment error:', error);
            res.status(500).json({
                success: false,
                message: 'Payment processing failed',
            });
        }
    }
    /**
     * Process card payment based on card number
     */
    processCardPayment(cardNumber) {
        if (!cardNumber)
            return 'failed';
        const card = cardNumber.replace(/\s/g, '');
        // Test card scenarios
        if (card === '4242424242424242' || card === '4111111111111111') {
            return 'completed'; // Success
        }
        else if (card === '4000000000000002' || card === '4000000000009995') {
            return 'failed'; // Decline
        }
        else if (card === '4000000000000005') {
            return 'failed'; // Insufficient funds
        }
        else if (card.startsWith('4000')) {
            // Other 4000 series cards - random failure
            return Math.random() > 0.3 ? 'completed' : 'failed';
        }
        else {
            // Default - random success/fail
            return Math.random() > 0.5 ? 'completed' : 'failed';
        }
    }
    /**
     * Get test scenarios
     */
    async getTestScenarios(_req, res) {
        try {
            const scenarios = await database_1.prisma.scenarioMapping.findMany({
                orderBy: { mobile_number: 'asc' },
            });
            const walletScenarios = scenarios.map((scenario) => ({
                mobileNumber: scenario.mobile_number,
                scenario: scenario.scenario,
                status: scenario.status,
                statusCode: scenario.status_code,
                description: scenario.description,
                paymentMethod: 'wallet',
                usage: `Use mobile number ${scenario.mobile_number} with any 4-digit PIN`,
            }));
            const cardScenarios = [
                {
                    cardNumber: '4242 4242 4242 4242',
                    scenario: 'success',
                    status: 'completed',
                    statusCode: 'SUCCESS',
                    description: 'Payment completed successfully',
                    paymentMethod: 'card',
                    usage: 'Use with any future expiry date, any 3-digit CVV, and any cardholder name',
                },
                {
                    cardNumber: '4000 0000 0000 0002',
                    scenario: 'decline',
                    status: 'failed',
                    statusCode: 'FAILED',
                    description: 'Card payment declined',
                    paymentMethod: 'card',
                    usage: 'Card declined - use with any expiry date, CVV, and cardholder name',
                },
                {
                    cardNumber: '4000 0000 0000 9995',
                    scenario: 'insufficient_funds',
                    status: 'failed',
                    statusCode: 'FAILED',
                    description: 'Insufficient funds',
                    paymentMethod: 'card',
                    usage: 'Insufficient funds error',
                },
            ];
            res.json({
                success: true,
                message: 'Test scenarios for all payment methods',
                paymentMethods: {
                    easypaisa: {
                        name: 'Easypaisa',
                        description: 'Mobile wallet payment method',
                        scenarios: walletScenarios,
                    },
                    jazzcash: {
                        name: 'JazzCash',
                        description: 'Mobile wallet payment method',
                        scenarios: walletScenarios,
                    },
                    card: {
                        name: 'Card Payment',
                        description: 'Credit/Debit card payment method',
                        scenarios: cardScenarios,
                    },
                },
                quickReference: {
                    wallet: {
                        success: '03030000000',
                        failed: '03021111111',
                        timeout: '03032222222',
                    },
                    card: {
                        success: '4242 4242 4242 4242',
                        decline: '4000 0000 0000 0002',
                        insufficientFunds: '4000 0000 0000 9995',
                    },
                },
            });
        }
        catch (error) {
            console.error('Get scenarios error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve test scenarios',
            });
        }
    }
    /**
     * Render error page
     */
    renderErrorPage(title, message) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title} - MyPay</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #1a252f 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .error-content {
            background: #ffffff;
            border-radius: 16px;
            padding: 40px;
            text-align: center;
            max-width: 500px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          }
          .error-icon { font-size: 64px; margin-bottom: 20px; }
          h1 { color: #1f2937; margin-bottom: 12px; font-size: 24px; }
          p { color: #6b7280; margin-bottom: 24px; }
          .btn-home {
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="error-content">
          <div class="error-icon">⚠️</div>
          <h1>${title}</h1>
          <p>${message}</p>
          <a href="/" class="btn-home">Go to Home</a>
        </div>
      </body>
      </html>
    `;
    }
    /**
     * Render payment form
     */
    renderPaymentForm(transaction) {
        const paymentMethod = transaction.payment_method?.toLowerCase() || 'card';
        const amount = Number(transaction.amount).toFixed(2);
        const methodName = this.getPaymentMethodName(paymentMethod);
        return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MyPay Payment - ${methodName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #1a252f 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .payment-card {
            background: #ffffff;
            border-radius: 16px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
          }
          .payment-header {
            background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
            padding: 24px;
            color: white;
          }
          .mypay-logo { font-size: 24px; font-weight: bold; }
          .amount-section {
            padding: 32px 24px;
            text-align: center;
            background: #f9fafb;
          }
          .amount-value { font-size: 48px; font-weight: bold; color: #1f2937; }
          .amount-reference { font-size: 12px; color: #9ca3af; font-family: monospace; }
          .payment-form { padding: 24px; }
          .form-group { margin-bottom: 20px; }
          label { display: block; font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px; }
          input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 16px;
          }
          input:focus { outline: none; border-color: #34d399; }
          .btn-pay {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            margin-bottom: 12px;
          }
          .btn-pay:disabled { opacity: 0.7; cursor: not-allowed; }
          .btn-cancel {
            width: 100%;
            padding: 12px;
            background: #f3f4f6;
            color: #6b7280;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
          }
          .error-message {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            display: none;
          }
          .test-info {
            background: #fef3c7;
            border-top: 1px solid #fde68a;
            padding: 20px 24px;
            font-size: 13px;
            color: #78350f;
          }
        </style>
      </head>
      <body>
        <div class="payment-card">
          <div class="payment-header">
            <div class="mypay-logo">mypay</div>
            <div style="margin-top: 8px;">${methodName}</div>
          </div>
          <div class="amount-section">
            <div class="amount-value">PKR ${amount}</div>
            <div class="amount-reference">Reference: ${transaction.reference}</div>
          </div>
          <form id="paymentForm" class="payment-form">
            ${this.getPaymentFormFields(paymentMethod)}
            <div id="errorMessage" class="error-message"></div>
            <button type="submit" class="btn-pay">
              <span class="btn-text">Pay PKR ${amount}</span>
              <span class="btn-loader" style="display: none;">Processing...</span>
            </button>
            <button type="button" class="btn-cancel" onclick="cancelPayment()">Cancel Payment</button>
          </form>
          <div class="test-info">
            <strong>🧪 Test Mode</strong><br>
            ${this.getTestInfo(paymentMethod)}
          </div>
        </div>
        <script>
          const sessionId = '${transaction.checkout_id}';
          const returnUrl = '${transaction.return_url}';
          
          document.getElementById('paymentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.querySelector('.btn-pay');
            const btnText = btn.querySelector('.btn-text');
            const btnLoader = btn.querySelector('.btn-loader');
            
            btn.disabled = true;
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline-block';
            document.getElementById('errorMessage').style.display = 'none';
            
            const formData = ${paymentMethod === 'card' ? `{
              cardNumber: document.getElementById('cardNumber')?.value,
              expiryDate: document.getElementById('expiryDate')?.value,
              cvv: document.getElementById('cvv')?.value,
              cardholderName: document.getElementById('cardholderName')?.value
            }` : `{
              mobileNumber: document.getElementById('mobileNumber')?.value,
              pin: document.getElementById('pin')?.value
            }`};
            
            try {
              const response = await fetch('/payment/' + sessionId + '/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
              });
              const result = await response.json();
              
              if (result.success) {
                btn.innerHTML = '<span style="color: #34d399;">✓ Payment Successful!</span>';
                setTimeout(() => { window.location.href = result.returnUrl; }, 1000);
              } else {
                document.getElementById('errorMessage').textContent = result.message || 'Payment failed';
                document.getElementById('errorMessage').style.display = 'block';
                btn.disabled = false;
                btnText.style.display = 'inline-block';
                btnLoader.style.display = 'none';
                if (result.returnUrl) {
                  setTimeout(() => { window.location.href = result.returnUrl; }, 3000);
                }
              }
            } catch (error) {
              document.getElementById('errorMessage').textContent = 'An error occurred';
              document.getElementById('errorMessage').style.display = 'block';
              btn.disabled = false;
              btnText.style.display = 'inline-block';
              btnLoader.style.display = 'none';
            }
          });
          
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
    getPaymentFormFields(paymentMethod) {
        if (paymentMethod === 'card') {
            return `
        <div class="form-group">
          <label for="cardNumber">Card Number</label>
          <input type="text" id="cardNumber" placeholder="4242 4242 4242 4242" maxlength="19" required>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label for="expiryDate">Expiry Date</label>
            <input type="text" id="expiryDate" placeholder="MM/YY" maxlength="5" required>
          </div>
          <div class="form-group">
            <label for="cvv">CVV</label>
            <input type="password" id="cvv" placeholder="123" maxlength="4" required>
          </div>
        </div>
        <div class="form-group">
          <label for="cardholderName">Cardholder Name</label>
          <input type="text" id="cardholderName" placeholder="John Doe" required>
        </div>
      `;
        }
        return `
      <div class="form-group">
        <label for="mobileNumber">Mobile Number</label>
        <input type="text" id="mobileNumber" placeholder="03XXXXXXXXX" maxlength="11" required>
      </div>
      <div class="form-group">
        <label for="pin">MPIN / OTP</label>
        <input type="password" id="pin" placeholder="Enter 4-digit PIN" maxlength="4" required>
      </div>
    `;
    }
    getTestInfo(paymentMethod) {
        if (paymentMethod === 'card') {
            return 'Success: 4242 4242 4242 4242 | Decline: 4000 0000 0000 0002';
        }
        return 'Success: 03030000000 | Failed: 03021111111 | Any 4-digit PIN';
    }
    getPaymentMethodName(method) {
        const names = {
            easypaisa: 'Easypaisa',
            jazzcash: 'JazzCash',
            card: 'Card Payment',
        };
        return names[method?.toLowerCase()] || 'Payment';
    }
}
exports.paymentController = new PaymentController();
//# sourceMappingURL=paymentController.js.map