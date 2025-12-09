const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class PortalMerchantController {
    // Get merchant profile
    async getProfile(req, res) {
        try {
            const merchantId = req.merchantId;

            const [merchants] = await pool.query(
                'SELECT id, email, company_name, status, created_at FROM merchants WHERE id = ?',
                [merchantId]
            );

            if (merchants.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Merchant not found'
                });
            }

            const merchant = merchants[0];

            res.json({
                success: true,
                merchant: {
                    id: merchant.id,
                    email: merchant.email,
                    companyName: merchant.company_name,
                    status: merchant.status,
                    createdAt: merchant.created_at
                }
            });

        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get profile'
            });
        }
    }

    // Update merchant profile
    async updateProfile(req, res) {
        try {
            const merchantId = req.merchantId;
            const { companyName, email, currentPassword, newPassword } = req.body;

            // If changing password
            if (newPassword) {
                if (!currentPassword) {
                    return res.status(400).json({
                        success: false,
                        error: 'Current password is required to change password'
                    });
                }

                if (newPassword.length < 6) {
                    return res.status(400).json({
                        success: false,
                        error: 'New password must be at least 6 characters'
                    });
                }

                // Get current password hash
                const [merchants] = await pool.query(
                    'SELECT password_hash FROM merchants WHERE id = ?',
                    [merchantId]
                );

                if (merchants.length === 0) {
                    return res.status(404).json({
                        success: false,
                        error: 'Merchant not found'
                    });
                }

                // Verify current password
                const isValid = await bcrypt.compare(currentPassword, merchants[0].password_hash);

                if (!isValid) {
                    return res.status(401).json({
                        success: false,
                        error: 'Current password is incorrect'
                    });
                }

                // Hash new password
                const newPasswordHash = await bcrypt.hash(newPassword, 10);

                // Update password
                await pool.query(
                    'UPDATE merchants SET password_hash = ? WHERE id = ?',
                    [newPasswordHash, merchantId]
                );
            }

            // Update other fields
            const updates = [];
            const values = [];

            if (companyName) {
                updates.push('company_name = ?');
                values.push(companyName);
            }

            if (email) {
                // Check if email is already taken
                const [existing] = await pool.query(
                    'SELECT id FROM merchants WHERE email = ? AND id != ?',
                    [email, merchantId]
                );

                if (existing.length > 0) {
                    return res.status(400).json({
                        success: false,
                        error: 'Email already in use'
                    });
                }

                updates.push('email = ?');
                values.push(email);
            }

            if (updates.length > 0) {
                values.push(merchantId);
                await pool.query(
                    `UPDATE merchants SET ${updates.join(', ')} WHERE id = ?`,
                    values
                );
            }

            // Get updated merchant
            const [merchants] = await pool.query(
                'SELECT id, email, company_name, status FROM merchants WHERE id = ?',
                [merchantId]
            );

            res.json({
                success: true,
                merchant: {
                    id: merchants[0].id,
                    email: merchants[0].email,
                    companyName: merchants[0].company_name,
                    status: merchants[0].status
                }
            });

        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update profile'
            });
        }
    }

    // Get API credentials
    async getCredentials(req, res) {
        try {
            const merchantId = req.merchantId;

            const [keys] = await pool.query(
                'SELECT vendor_id, api_key, api_secret FROM api_keys WHERE merchant_id = ? AND is_active = TRUE LIMIT 1',
                [merchantId]
            );

            if (keys.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'No active API credentials found'
                });
            }

            const key = keys[0];

            res.json({
                success: true,
                credentials: {
                    vendorId: key.vendor_id,
                    apiKey: key.api_key,
                    apiSecret: key.api_secret
                }
            });

        } catch (error) {
            console.error('Get credentials error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get credentials'
            });
        }
    }

    // Generate new API key
    async generateApiKey(req, res) {
        try {
            const merchantId = req.merchantId;

            // Deactivate old keys
            await pool.query(
                'UPDATE api_keys SET is_active = FALSE WHERE merchant_id = ?',
                [merchantId]
            );

            // Generate new key
            const vendorId = `VENDOR_${merchantId.toString().padStart(6, '0')}`;
            const apiKey = `api-key-${uuidv4().substring(0, 8)}`;
            const apiSecret = `api-secret-${uuidv4()}`;

            await pool.query(
                `INSERT INTO api_keys (vendor_id, api_key, api_secret, merchant_id, is_active) 
                 VALUES (?, ?, ?, ?, TRUE)`,
                [vendorId, apiKey, apiSecret, merchantId]
            );

            res.json({
                success: true,
                credentials: {
                    vendorId,
                    apiKey,
                    apiSecret
                }
            });

        } catch (error) {
            console.error('Generate API key error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate API key'
            });
        }
    }
}

module.exports = new PortalMerchantController();

