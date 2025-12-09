"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.portalAuthController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
class PortalAuthController {
    /**
     * Register new merchant
     */
    async register(req, res) {
        try {
            const { companyName, username } = req.body;
            // Validation
            if (!companyName || !username) {
                res.status(400).json({
                    success: false,
                    error: 'Company name and username are required',
                });
                return;
            }
            // Validate username (alphabets only, no spaces)
            const usernameRegex = /^[a-zA-Z]+$/;
            if (!usernameRegex.test(username)) {
                res.status(400).json({
                    success: false,
                    error: 'Username must contain only alphabets (a-z, A-Z) with no spaces',
                });
                return;
            }
            // Normalize username to lowercase
            const normalizedUsername = username.toLowerCase();
            // Generate email from username
            const email = `${normalizedUsername}@mycodigital.io`;
            // Check if email already exists
            const existing = await database_1.prisma.merchant.findFirst({
                where: { email },
            });
            if (existing) {
                res.status(400).json({
                    success: false,
                    error: 'Username already taken. Please choose a different username.',
                });
                return;
            }
            // Generate random password (12 characters)
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
            const passwordHash = await bcryptjs_1.default.hash(password, 10);
            // Create merchant
            const merchant = await database_1.prisma.merchant.create({
                data: {
                    name: companyName,
                    company_name: companyName,
                    email,
                    password_hash: passwordHash,
                    apiKey: `temp-${Date.now()}`, // Temporary key, will be replaced
                    status: 'active',
                },
            });
            // Create default API key for merchant
            const vendorId = `VENDOR_${merchant.id.toString().padStart(6, '0')}`;
            const apiKey = `test-${normalizedUsername}-vendor-${merchant.id.toString().padStart(6, '0')}-${(0, uuid_1.v4)().substring(0, 8)}`;
            const apiSecret = `api-secret-${(0, uuid_1.v4)()}`;
            await database_1.prisma.apiKey.create({
                data: {
                    vendor_id: vendorId,
                    api_key: apiKey,
                    api_secret: apiSecret,
                    merchant_id: merchant.id,
                    is_active: true,
                },
            });
            // Generate token
            const token = (0, auth_1.generateToken)(merchant.id);
            res.status(201).json({
                success: true,
                token,
                password, // Return generated password
                merchant: {
                    id: merchant.id,
                    email: merchant.email,
                    companyName: merchant.company_name,
                    status: merchant.status,
                },
            });
        }
        catch (error) {
            console.error('Register error:', error);
            res.status(500).json({
                success: false,
                error: 'Registration failed',
            });
        }
    }
    /**
     * Login merchant
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                res.status(400).json({
                    success: false,
                    error: 'Email and password are required',
                });
                return;
            }
            // Get merchant
            const merchant = await database_1.prisma.merchant.findFirst({
                where: { email },
            });
            if (!merchant) {
                res.status(401).json({
                    success: false,
                    error: 'Invalid email or password',
                });
                return;
            }
            // Check status
            if (merchant.status !== 'active') {
                res.status(403).json({
                    success: false,
                    error: 'Account is not active',
                });
                return;
            }
            // Verify password
            const isValid = merchant.password_hash ? await bcryptjs_1.default.compare(password, merchant.password_hash) : false;
            if (!isValid) {
                res.status(401).json({
                    success: false,
                    error: 'Invalid email or password',
                });
                return;
            }
            // Generate token
            const token = (0, auth_1.generateToken)(merchant.id);
            res.json({
                success: true,
                token,
                merchant: {
                    id: merchant.id,
                    email: merchant.email,
                    companyName: merchant.company_name,
                    status: merchant.status,
                },
            });
        }
        catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                error: 'Login failed',
            });
        }
    }
    /**
     * Logout
     */
    async logout(_req, res) {
        res.json({
            success: true,
            message: 'Logged out successfully',
        });
    }
}
exports.portalAuthController = new PortalAuthController();
//# sourceMappingURL=portalAuthController.js.map