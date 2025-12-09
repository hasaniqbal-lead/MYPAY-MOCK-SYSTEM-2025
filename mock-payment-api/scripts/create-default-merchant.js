const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

async function createDefaultMerchant() {
    try {
        const email = 'admin@test.com';
        const password = 'admin123';
        const companyName = 'Default Merchant';
        
        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Check if merchant exists
        const [existing] = await connection.promise().query(
            'SELECT id FROM merchants WHERE email = ?',
            [email]
        );
        
        if (existing.length > 0) {
            console.log('Merchant already exists');
            process.exit(0);
        }
        
        // Create merchant
        const [result] = await connection.promise().query(
            'INSERT INTO merchants (company_name, email, password_hash, status) VALUES (?, ?, ?, ?)',
            [companyName, email, passwordHash, 'active']
        );
        
        const merchantId = result.insertId;
        
        // Link existing test API key
        await connection.promise().query(
            'UPDATE api_keys SET merchant_id = ? WHERE vendor_id = ?',
            [merchantId, 'TEST_VENDOR_001']
        );
        
        console.log('✅ Default merchant created!');
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        console.log(`   Merchant ID: ${merchantId}`);
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Failed to create merchant:', error.message);
        process.exit(1);
    } finally {
        connection.end();
    }
}

createDefaultMerchant();

