-- Migration: Data migration for [description]
-- Description: [Detailed explanation of data transformation]
-- Author: [Your name]
-- Date: [YYYY-MM-DD]
-- Dependencies: [List dependent migrations or "None"]
-- Data Safety: [Explain data backup and safety measures]
-- Rollback Strategy: [How to undo this migration]

-- IMPORTANT: Always test data migrations on a copy of production data first

-- Step 1: Validate current data state
DO $$
DECLARE
    record_count INTEGER;
    invalid_count INTEGER;
BEGIN
    -- Check current data counts
    SELECT COUNT(*) INTO record_count FROM public.[source_table];
    RAISE NOTICE 'Found % records in [source_table]', record_count;
    
    -- Check for any data quality issues
    SELECT COUNT(*) INTO invalid_count 
    FROM public.[source_table] 
    WHERE [validation_condition];
    
    IF invalid_count > 0 THEN
        RAISE WARNING 'Found % invalid records that need attention', invalid_count;
    END IF;
END $$;

-- Step 2: Create backup/audit table (optional but recommended)
-- CREATE TABLE IF NOT EXISTS public.[table_name]_migration_backup AS
-- SELECT * FROM public.[source_table] WHERE [condition];

-- Step 3: Perform the data migration
-- Example: Update existing records
UPDATE public.[table_name] 
SET [column] = [new_value]
WHERE [condition];

-- Example: Insert new records based on existing data
-- INSERT INTO public.[target_table] ([columns])
-- SELECT [transformed_columns]
-- FROM public.[source_table]
-- WHERE [condition];

-- Example: Migrate data between columns
-- UPDATE public.[table_name]
-- SET 
--     new_column = old_column,
--     migration_date = NOW()
-- WHERE old_column IS NOT NULL;

-- Step 4: Validate migration results
DO $$
DECLARE
    migrated_count INTEGER;
    expected_count INTEGER;
BEGIN
    -- Count migrated records
    SELECT COUNT(*) INTO migrated_count 
    FROM public.[table_name] 
    WHERE [migration_validation_condition];
    
    -- Compare with expected count
    expected_count := [expected_number];
    
    RAISE NOTICE 'Migrated % records (expected %)', migrated_count, expected_count;
    
    IF migrated_count != expected_count THEN
        RAISE EXCEPTION 'Migration count mismatch! Expected %, got %', 
            expected_count, migrated_count;
    END IF;
END $$;

-- Step 5: Clean up (if applicable)
-- Remove temporary columns or obsolete data after validation
-- ALTER TABLE public.[table_name] DROP COLUMN IF EXISTS [old_column];

-- Migration completion log
INSERT INTO public.migration_log (migration_name, completed_at, records_affected)
VALUES ('[migration_name]', NOW(), [record_count])
ON CONFLICT DO NOTHING;

-- Performance notes:
-- [Document any performance impact or optimizations]

-- Rollback instructions:
-- To rollback this migration:
-- [Provide specific rollback SQL commands]