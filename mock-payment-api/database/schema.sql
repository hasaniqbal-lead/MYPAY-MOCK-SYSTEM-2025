-- Create database
CREATE DATABASE IF NOT EXISTS dummy_payment_db;
USE dummy_payment_db;

-- Scenario mappings table
CREATE TABLE IF NOT EXISTS scenario_mappings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    mobile_number VARCHAR(15) NOT NULL UNIQUE,
    scenario VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    status_code VARCHAR(20) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert predefined scenarios
INSERT INTO scenario_mappings (mobile_number, scenario, status, status_code, description) VALUES
('03030000000', 'success', 'completed', 'SUCCESS', 'Payment successful'),
('03021111111', 'failed', 'failed', 'FAILED', 'Transaction failed'),
('03032222222', 'timeout', 'failed', 'TIMEOUT', 'Transaction timed-out'),
('03033333333', 'rejected', 'failed', 'REJECTED', 'Customer rejected transaction'),
('03034444444', 'invalid_otp', 'failed', 'INVALID_OTP', 'Customer entered invalid OTP'),
('03035555555', 'insufficient_funds', 'failed', 'INSUFFICIENT_FUNDS', 'Insufficient credit'),
('03036666666', 'account_deactivated', 'failed', 'ACCOUNT_DEACTIVATED', 'Account deactivated'),
('03037777777', 'no_response', 'failed', 'NO_RESPONSE', 'No response from wallet partner'),
('03038888888', 'invalid_mpin', 'failed', 'INVALID_MPIN', 'Customer entered invalid MPIN'),
('03039999999', 'not_approved', 'failed', 'NOT_APPROVED', 'Customer didn\'t approve');

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    checkout_id VARCHAR(100) NOT NULL UNIQUE,
    vendor_id VARCHAR(100),
    reference VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    payment_type VARCHAR(20) NOT NULL,
    success_url TEXT NOT NULL,
    return_url TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    status_code VARCHAR(50),
    mobile_number VARCHAR(15),
    user_data JSON,
    webhook_status VARCHAR(20) DEFAULT 'pending',
    webhook_attempts INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_checkout_id (checkout_id),
    INDEX idx_reference (reference),
    INDEX idx_status (status)
);

-- Webhook logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    checkout_id VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    payload JSON,
    response_status INT,
    response_body TEXT,
    error_message TEXT,
    attempt_number INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_checkout_id (checkout_id)
);

-- API keys table (for validation)
CREATE TABLE IF NOT EXISTS api_keys (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vendor_id VARCHAR(100) NOT NULL UNIQUE,
    api_key VARCHAR(255) NOT NULL,
    api_secret TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert a test API key
INSERT INTO api_keys (vendor_id, api_key, api_secret) VALUES
('TEST_VENDOR_001', 'test-api-key-123', 'test-api-secret-456');
