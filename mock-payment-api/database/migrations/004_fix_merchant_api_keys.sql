-- Fix API keys for existing merchants to ensure they all have proper test-format keys
USE dummy_payment_db;

-- Update Myco's API key to match test format
UPDATE api_keys 
SET 
  vendor_id = 'MYCO_VENDOR_001',
  api_key = 'test-myco-vendor-001-abc12345',
  api_secret = CONCAT('secret-myco-', REPLACE(UUID(), '-', ''))
WHERE merchant_id = 1 AND is_active = TRUE;

-- Ensure Emirates Draw has correct vendor_id
UPDATE api_keys 
SET vendor_id = 'EMIRATES_VENDOR_001'
WHERE merchant_id = 3 AND is_active = TRUE;

-- Ensure TJ Marketing has correct vendor_id
UPDATE api_keys 
SET vendor_id = 'TJM_VENDOR_001'
WHERE merchant_id = 4 AND is_active = TRUE;

-- Create API keys for any merchants that don't have them
INSERT INTO api_keys (vendor_id, api_key, api_secret, merchant_id, is_active)
SELECT
  CONCAT('VENDOR_', LPAD(m.id, 6, '0')) AS vendor_id,
  CONCAT(
    'test-',
    LOWER(SUBSTRING_INDEX(m.email, '@', 1)),
    '-vendor-',
    LPAD(m.id, 6, '0'),
    '-',
    SUBSTR(REPLACE(UUID(), '-', ''), 1, 8)
  ) AS api_key,
  CONCAT('secret-', REPLACE(UUID(), '-', '')) AS api_secret,
  m.id AS merchant_id,
  TRUE AS is_active
FROM merchants m
LEFT JOIN api_keys k ON k.merchant_id = m.id AND k.is_active = TRUE
WHERE k.id IS NULL;

