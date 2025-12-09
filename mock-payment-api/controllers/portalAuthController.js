const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { generateToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

class PortalAuthController {
    // Register new merchant
    async register(req, res) {
        try {
            const { companyName, username } = req.body;

            // Validation
            if (!companyName || !username) {
                return res.status(400).json({
                    success: false,
                    error: 'Company name and username are required'
                });
            }

            // Validate username (alphabets only, no spaces)
            const usernameRegex = /^[a-zA-Z]+$/;
            if (!usernameRegex.test(username)) {
                return res.status(400).json({
                    success: false,
                    error: 'Username must contain only alphabets (a-z, A-Z) with no spaces'
                });
            }

            // Normalize username to lowercase
            const normalizedUsername = username.toLowerCase();

            // Generate email from username
            const email = `${normalizedUsername}@mycodigital.io`;

            // Check if email already exists
            const [existing] = await pool.query(
                'SELECT id FROM merchants WHERE email = ?',
                [email]
            );

            if (existing.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Username already taken. Please choose a different username.'
                });
            }

            // Generate random password (12 characters: alphanumeric + special chars)
            const generatePassword = () => {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
                let password = '';
                for (let i = 0; i < 12; i++) {
                    password += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                return password;
            };

            const password = generatePassword();

            // Hash password
            const passwordHash = await bcrypt.hash(password, 10);

            // Create merchant
            const [result] = await pool.query(
                `INSERT INTO merchants (company_name, email, password_hash, status) 
                 VALUES (?, ?, ?, 'active')`,
                [companyName, email, passwordHash]
            );

            const merchantId = result.insertId;

            // Create default API key for merchant
            const vendorId = `VENDOR_${merchantId.toString().padStart(6, '0')}`;
            const apiKey = `test-${normalizedUsername}-vendor-${merchantId.toString().padStart(6, '0')}-${uuidv4().substring(0, 8)}`;
            const apiSecret = `api-secret-${uuidv4()}`;

            await pool.query(
                `INSERT INTO api_keys (vendor_id, api_key, api_secret, merchant_id, is_active) 
                 VALUES (?, ?, ?, ?, TRUE)`,
                [vendorId, apiKey, apiSecret, merchantId]
            );

            // Generate token
            const token = generateToken(merchantId);

            // Get merchant data
            const [merchants] = await pool.query(
                'SELECT id, email, company_name, status FROM merchants WHERE id = ?',
                [merchantId]
            );

            res.status(201).json({
                success: true,
                token,
                password, // Return generated password
                merchant: {
                    id: merchants[0].id,
                    email: merchants[0].email,
                    companyName: merchants[0].company_name,
                    status: merchants[0].status
                }
            });

        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({
                success: false,
                error: 'Registration failed'
            });
        }
    }

    // Login merchant
    async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Email and password are required'
                });
            }

            // Get merchant
            const [merchants] = await pool.query(
                'SELECT id, email, company_name, password_hash, status FROM merchants WHERE email = ?',
                [email]
            );

            if (merchants.length === 0) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid email or password'
                });
            }

            const merchant = merchants[0];

            // Check status
            if (merchant.status !== 'active') {
                return res.status(403).json({
                    success: false,
                    error: 'Account is not active'
                });
            }

            // Verify password
            const isValid = await bcrypt.compare(password, merchant.password_hash);

            if (!isValid) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid email or password'
                });
            }

            // Generate token
            const token = generateToken(merchant.id);

            res.json({
                success: true,
                token,
                merchant: {
                    id: merchant.id,
                    email: merchant.email,
                    companyName: merchant.company_name,
                    status: merchant.status
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                error: 'Login failed'
            });
        }
    }

    // Logout (client-side token removal, but endpoint for consistency)
    async logout(req, res) {
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    }
}

module.exports = new PortalAuthController();

