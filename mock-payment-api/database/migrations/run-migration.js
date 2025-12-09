const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
});

async function runMigration() {
    try {
        console.log('Running portal migration...');
        
        const migrationPath = path.join(__dirname, '001_add_merchants_simple.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');
        
        // Split by semicolons and execute each statement
        const statements = sql.split(';').filter(s => s.trim().length > 0);
        
        for (const statement of statements) {
            if (statement.trim()) {
                await connection.promise().query(statement);
            }
        }
        
        // Check if merchant_id columns exist, add if not
        const [columns] = await connection.promise().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = 'api_keys' 
            AND COLUMN_NAME = 'merchant_id'
        `, [process.env.DB_NAME]);
        
        if (columns.length === 0) {
            console.log('Adding merchant_id to api_keys...');
            await connection.promise().query(`
                ALTER TABLE api_keys 
                ADD COLUMN merchant_id INT,
                ADD FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
            `);
        }
        
        const [txColumns] = await connection.promise().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = 'transactions' 
            AND COLUMN_NAME = 'merchant_id'
        `, [process.env.DB_NAME]);
        
        if (txColumns.length === 0) {
            console.log('Adding merchant_id to transactions...');
            await connection.promise().query(`
                ALTER TABLE transactions 
                ADD COLUMN merchant_id INT,
                ADD INDEX idx_merchant_id (merchant_id),
                ADD FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE SET NULL
            `);
        }
        
        console.log('✅ Migration completed successfully!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        connection.end();
    }
}

runMigration();

