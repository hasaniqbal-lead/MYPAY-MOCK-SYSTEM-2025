-- Create the three merchants with their API keys
USE dummy_payment_db;

-- Merchant 1: Myco
INSERT INTO merchants (company_name, email, password_hash, status)
VALUES (
    'Myco',
    'myco@mycodigital.io',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Password: Myco@2024
    'active'
)
ON DUPLICATE KEY UPDATE company_name='Myco', status='active';

SET @myco_id = (SELECT id FROM merchants WHERE email = 'myco@mycodigital.io' LIMIT 1);

INSERT INTO api_keys (vendor_id, api_key, api_secret, merchant_id, is_active)
VALUES (
    'MYCO_VENDOR_001',
    'test-myco-vendor-001-abc12345',
    CONCAT('secret-myco-', REPLACE(UUID(), '-', '')),
    @myco_id,
    TRUE
)
ON DUPLICATE KEY UPDATE 
    api_key = 'test-myco-vendor-001-abc12345',
    api_secret = CONCAT('secret-myco-', REPLACE(UUID(), '-', '')),
    is_active = TRUE;

-- Merchant 2: Emirates Draw
INSERT INTO merchants (company_name, email, password_hash, status)
VALUES (
    'Emirates Draw',
    'emiratesdraw@mycodigital.io',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- Password: Emirates@2024
    'active'
)
ON DUPLICATE KEY UPDATE company_name='Emirates Draw', status='active';

SET @emirates_id = (SELECT id FROM merchants WHERE email = 'emiratesdraw@mycodigital.io' LIMIT 1);

INSERT INTO api_keys (vendor_id, api_key, api_secret, merchant_id, is_active)
VALUES (
    'EMIRATES_VENDOR_001',
    'test-emirates-vendor-001-def67890',
    CONCAT('secret-emirates-', REPLACE(UUID(), '-', '')),
    @emirates_id,
    TRUE
)
ON DUPLICATE KEY UPDATE 
    api_key = 'test-emirates-vendor-001-def67890',
    api_secret = CONCAT('secret-emirates-', REPLACE(UUID(), '-', '')),
    is_active = TRUE;

-- Merchant 3: TJ Marketing
INSERT INTO merchants (company_name, email, password_hash, status)
VALUES (
    'TJ Marketing',
    'tjm@mycodigital.io',
    '$2a$10$rOzJqPYKZ5q5vY5Y5Y5Y5e5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y', -- Password: TJM@2024
    'active'
)
ON DUPLICATE KEY UPDATE company_name='TJ Marketing', status='active';

SET @tjm_id = (SELECT id FROM merchants WHERE email = 'tjm@mycodigital.io' LIMIT 1);

INSERT INTO api_keys (vendor_id, api_key, api_secret, merchant_id, is_active)
VALUES (
    'TJM_VENDOR_001',
    'test-tjm-vendor-001-ghi11223',
    CONCAT('secret-tjm-', REPLACE(UUID(), '-', '')),
    @tjm_id,
    TRUE
)
ON DUPLICATE KEY UPDATE 
    api_key = 'test-tjm-vendor-001-ghi11223',
    api_secret = CONCAT('secret-tjm-', REPLACE(UUID(), '-', '')),
    is_active = TRUE;

-- Deactivate old keys if new ones are created
UPDATE api_keys SET is_active = FALSE 
WHERE merchant_id IN (@myco_id, @emirates_id, @tjm_id) 
AND vendor_id NOT IN ('MYCO_VENDOR_001', 'EMIRATES_VENDOR_001', 'TJM_VENDOR_001');

