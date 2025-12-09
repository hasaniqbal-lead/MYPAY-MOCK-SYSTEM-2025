const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'strong-db-pass',
    database: process.env.DB_NAME || 'dummy_payment_db'
});

const merchants = [
    { email: 'myco@mycodigital.io', password: 'Myco@2024' },
    { email: 'emiratesdraw@mycodigital.io', password: 'Emirates@2024' },
    { email: 'tjm@mycodigital.io', password: 'TJM@2024' }
];

async function setPasswords() {
    try {
        for (const merchant of merchants) {
            const hash = await bcrypt.hash(merchant.password, 10);
            await connection.promise().query(
                'UPDATE merchants SET password_hash = ? WHERE email = ?',
                [hash, merchant.email]
            );
            console.log(`✅ Password set for ${merchant.email}`);
        }
        console.log('\n✅ All passwords updated!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        connection.end();
    }
}

setPasswords();

