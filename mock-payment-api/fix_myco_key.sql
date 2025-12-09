USE dummy_payment_db;

-- Deactivate all Myco keys
UPDATE api_keys SET is_active = FALSE WHERE merchant_id = 1;

-- Activate the correct Myco key
UPDATE api_keys SET is_active = TRUE, api_key = 'test-myco-vendor-001-abc12345' WHERE merchant_id = 1 AND vendor_id = 'MYCO_VENDOR_001';

-- If no key exists with MYCO_VENDOR_001, create one
INSERT INTO api_keys (vendor_id, api_key, api_secret, merchant_id, is_active)
SELECT 'MYCO_VENDOR_001', 'test-myco-vendor-001-abc12345', CONCAT('secret-myco-', REPLACE(UUID(), '-', '')), 1, TRUE
WHERE NOT EXISTS (SELECT 1 FROM api_keys WHERE merchant_id = 1 AND vendor_id = 'MYCO_VENDOR_001');

-- Verify all merchants have active keys
SELECT m.id, m.email, m.company_name, k.vendor_id, k.api_key, k.is_active 
FROM merchants m 
LEFT JOIN api_keys k ON m.id = k.merchant_id AND k.is_active = TRUE 
ORDER BY m.id;

