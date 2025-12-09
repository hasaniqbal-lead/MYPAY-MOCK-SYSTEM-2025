USE dummy_payment_db;

-- Link existing transactions created with TEST_VENDOR_001 to Myco (merchant_id = 1)
-- Since TEST_VENDOR_001 was the original test key, we'll link these to Myco
UPDATE transactions 
SET merchant_id = 1 
WHERE merchant_id IS NULL 
  AND vendor_id = 'TEST_VENDOR_001';

-- Verify the linking
SELECT 
  m.id as merchant_id,
  m.email,
  m.company_name,
  COUNT(t.id) as transaction_count,
  SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
  SUM(CASE WHEN t.status = 'failed' THEN 1 ELSE 0 END) as failed_count,
  SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END) as pending_count
FROM merchants m
LEFT JOIN transactions t ON m.id = t.merchant_id
GROUP BY m.id, m.email, m.company_name
ORDER BY m.id;

