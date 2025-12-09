const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const merchants = [
    {
        companyName: 'Myco',
        email: 'myco@mycodigital.io',
        password: 'Myco@2024',
        vendorId: 'MYCO_VENDOR_001'
    },
    {
        companyName: 'Emirates Draw',
        email: 'emiratesdraw@mycodigital.io',
        password: 'Emirates@2024',
        vendorId: 'EMIRATES_VENDOR_001'
    },
    {
        companyName: 'TJ Marketing',
        email: 'tjm@mycodigital.io',
        password: 'TJM@2024',
        vendorId: 'TJM_VENDOR_001'
    }
];

async function setupMerchants() {
    try {
        console.log('🚀 Setting up merchants...\n');

        for (const merchant of merchants) {
            console.log(`📝 Creating merchant: ${merchant.companyName}`);
            
            // Hash password
            const passwordHash = await bcrypt.hash(merchant.password, 10);
            
            // Check if merchant exists
            const [existing] = await connection.promise().query(
                'SELECT id FROM merchants WHERE email = ?',
                [merchant.email]
            );
            
            let merchantId;
            
            if (existing.length > 0) {
                merchantId = existing[0].id;
                console.log(`   ✅ Merchant already exists (ID: ${merchantId})`);
                
                // Update password if needed
                await connection.promise().query(
                    'UPDATE merchants SET password_hash = ?, company_name = ? WHERE id = ?',
                    [passwordHash, merchant.companyName, merchantId]
                );
            } else {
                // Create merchant
                const [result] = await connection.promise().query(
                    'INSERT INTO merchants (company_name, email, password_hash, status) VALUES (?, ?, ?, ?)',
                    [merchant.companyName, merchant.email, passwordHash, 'active']
                );
                
                merchantId = result.insertId;
                console.log(`   ✅ Merchant created (ID: ${merchantId})`);
            }
            
            // Generate API key
            const apiKey = `test-${merchant.vendorId.toLowerCase().replace('_vendor_', '-')}-${uuidv4().substring(0, 8)}`;
            const apiSecret = `secret-${uuidv4()}`;
            
            // Check if API key exists for this merchant
            const [existingKeys] = await connection.promise().query(
                'SELECT id FROM api_keys WHERE merchant_id = ? AND is_active = TRUE',
                [merchantId]
            );
            
            if (existingKeys.length > 0) {
                // Update existing key
                await connection.promise().query(
                    'UPDATE api_keys SET api_key = ?, api_secret = ?, vendor_id = ? WHERE merchant_id = ? AND is_active = TRUE',
                    [apiKey, apiSecret, merchant.vendorId, merchantId]
                );
                console.log(`   ✅ API key updated`);
            } else {
                // Create new API key
                await connection.promise().query(
                    'INSERT INTO api_keys (vendor_id, api_key, api_secret, merchant_id, is_active) VALUES (?, ?, ?, ?, TRUE)',
                    [merchant.vendorId, apiKey, apiSecret, merchantId]
                );
                console.log(`   ✅ API key created`);
            }
            
            // Get the final API key
            const [finalKeys] = await connection.promise().query(
                'SELECT api_key, api_secret, vendor_id FROM api_keys WHERE merchant_id = ? AND is_active = TRUE LIMIT 1',
                [merchantId]
            );
            
            const finalKey = finalKeys[0];
            
            console.log(`   📋 Credentials:`);
            console.log(`      Email: ${merchant.email}`);
            console.log(`      Password: ${merchant.password}`);
            console.log(`      API Key: ${finalKey.api_key}`);
            console.log(`      Vendor ID: ${finalKey.vendor_id}`);
            console.log('');
        }
        
        console.log('✅ All merchants created successfully!\n');
        console.log('📝 Summary:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        for (const merchant of merchants) {
            const [merchants] = await connection.promise().query(
                'SELECT id FROM merchants WHERE email = ?',
                [merchant.email]
            );
            const [keys] = await connection.promise().query(
                'SELECT api_key, vendor_id FROM api_keys WHERE merchant_id = ? AND is_active = TRUE LIMIT 1',
                [merchants[0].id]
            );
            
            console.log(`${merchant.companyName}:`);
            console.log(`  Login: ${merchant.email} / ${merchant.password}`);
            console.log(`  API Key: ${keys[0].api_key}`);
            console.log(`  Vendor ID: ${keys[0].vendor_id}`);
            console.log('');
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n✅ Setup complete!');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    } finally {
        connection.end();
    }
}

setupMerchants();

