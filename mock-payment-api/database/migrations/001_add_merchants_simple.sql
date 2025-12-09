-- Simple migration: Add merchants table and link to existing tables
-- Run this on your database

USE dummy_payment_db;

-- Create merchants table
CREATE TABLE IF NOT EXISTS merchants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status ENUM('active', 'suspended', 'pending') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_status (status)
);

-- Add merchant_id to api_keys (run manually if column doesn't exist)
-- ALTER TABLE api_keys ADD COLUMN merchant_id INT;
-- ALTER TABLE api_keys ADD FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE;

-- Add merchant_id to transactions (run manually if column doesn't exist)
-- ALTER TABLE transactions ADD COLUMN merchant_id INT;
-- ALTER TABLE transactions ADD INDEX idx_merchant_id (merchant_id);
-- ALTER TABLE transactions ADD FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE SET NULL;

