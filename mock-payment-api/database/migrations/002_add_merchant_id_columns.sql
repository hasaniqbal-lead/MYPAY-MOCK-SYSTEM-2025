-- Add merchant_id columns to existing tables

USE dummy_payment_db;

-- Add merchant_id to api_keys if not exists
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'dummy_payment_db' 
    AND TABLE_NAME = 'api_keys' 
    AND COLUMN_NAME = 'merchant_id'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE api_keys ADD COLUMN merchant_id INT',
    'SELECT "Column merchant_id already exists in api_keys" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key if column exists
SET @fk_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = 'dummy_payment_db' 
    AND TABLE_NAME = 'api_keys' 
    AND CONSTRAINT_NAME = 'fk_api_keys_merchant'
);

SET @sql = IF(@fk_exists = 0 AND @column_exists = 0,
    'ALTER TABLE api_keys ADD CONSTRAINT fk_api_keys_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE',
    'SELECT "Foreign key already exists or column not added" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add merchant_id to transactions if not exists
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'dummy_payment_db' 
    AND TABLE_NAME = 'transactions' 
    AND COLUMN_NAME = 'merchant_id'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE transactions ADD COLUMN merchant_id INT',
    'SELECT "Column merchant_id already exists in transactions" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index
SET @index_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = 'dummy_payment_db' 
    AND TABLE_NAME = 'transactions' 
    AND INDEX_NAME = 'idx_merchant_id'
);

SET @sql = IF(@index_exists = 0 AND @column_exists = 0,
    'ALTER TABLE transactions ADD INDEX idx_merchant_id (merchant_id)',
    'SELECT "Index already exists or column not added" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key
SET @fk_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = 'dummy_payment_db' 
    AND TABLE_NAME = 'transactions' 
    AND CONSTRAINT_NAME = 'fk_transactions_merchant'
);

SET @sql = IF(@fk_exists = 0 AND @column_exists = 0,
    'ALTER TABLE transactions ADD CONSTRAINT fk_transactions_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE SET NULL',
    'SELECT "Foreign key already exists or column not added" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

