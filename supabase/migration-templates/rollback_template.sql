-- Rollback Migration: [original_migration_name]
-- Description: Safely undo changes from [original_migration_file]
-- Author: [Your name]
-- Date: [YYYY-MM-DD]
-- Original Migration: [file_name_of_original_migration]
-- Data Safety: [Describe data preservation strategy]

-- WARNING: Always test rollbacks on a copy of production data first
-- WARNING: Ensure no dependent objects exist before running rollback

-- Step 1: Validate current state before rollback
DO $$
DECLARE
    table_exists BOOLEAN;
    function_exists BOOLEAN;
    data_count INTEGER;
BEGIN
    -- Check if objects to be removed exist
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = '[table_name]'
    ) INTO table_exists;
    
    SELECT EXISTS (
        SELECT FROM information_schema.routines 
        WHERE routine_schema = 'public' AND routine_name = '[function_name]'
    ) INTO function_exists;
    
    RAISE NOTICE 'Table exists: %, Function exists: %', table_exists, function_exists;
    
    -- Check data that might be lost
    IF table_exists THEN
        SELECT COUNT(*) INTO data_count FROM public.[table_name];
        RAISE NOTICE 'Table contains % records that will be lost', data_count;
        
        -- Optionally halt if data exists
        -- IF data_count > 0 THEN
        --     RAISE EXCEPTION 'Cannot rollback: table contains % records', data_count;
        -- END IF;
    END IF;
END $$;

-- Step 2: Drop objects in reverse dependency order

-- Drop triggers first
DROP TRIGGER IF EXISTS [trigger_name] ON public.[table_name];

-- Drop indexes
DROP INDEX IF EXISTS public.idx_[table_name]_[column_name];
DROP INDEX IF EXISTS public.idx_[table_name]_[column1]_[column2];

-- Drop policies
DROP POLICY IF EXISTS "[policy_name]" ON public.[table_name];

-- Drop functions
DROP FUNCTION IF EXISTS public.[function_name]([parameter_types]);

-- Drop tables (be very careful here)
-- DROP TABLE IF EXISTS public.[table_name];

-- Step 3: Restore previous state (if applicable)
-- If this rollback needs to restore previous schema:

-- Recreate previous table structure
-- CREATE TABLE public.[old_table_name] (
--     [previous_columns]
-- );

-- Restore previous function definition
-- CREATE OR REPLACE FUNCTION public.[old_function_name]([old_parameters])
-- RETURNS [old_return_type]
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN
--     [previous_function_body]
-- END;
-- $$;

-- Step 4: Restore data from backup (if applicable)
-- INSERT INTO public.[table_name] 
-- SELECT * FROM public.[table_name]_backup
-- WHERE [condition];

-- Step 5: Validate rollback completion
DO $$
DECLARE
    cleanup_complete BOOLEAN := TRUE;
BEGIN
    -- Verify objects are removed
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '[table_name]') THEN
        cleanup_complete := FALSE;
        RAISE WARNING 'Table [table_name] still exists';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = '[function_name]') THEN
        cleanup_complete := FALSE;
        RAISE WARNING 'Function [function_name] still exists';
    END IF;
    
    IF cleanup_complete THEN
        RAISE NOTICE 'Rollback completed successfully';
    ELSE
        RAISE EXCEPTION 'Rollback incomplete - check warnings above';
    END IF;
END $$;

-- Rollback completion log
INSERT INTO public.migration_log (migration_name, rollback_completed_at, notes)
VALUES ('[original_migration_name]', NOW(), 'Rollback completed successfully')
ON CONFLICT (migration_name) DO UPDATE SET
    rollback_completed_at = NOW(),
    notes = 'Rollback completed successfully';

-- Post-rollback verification:
-- 1. Test application functionality
-- 2. Check for any dependent objects that might be broken
-- 3. Verify data integrity
-- 4. Run application test suite