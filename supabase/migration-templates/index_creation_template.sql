-- Migration: Add indexes for [table_name] performance optimization
-- Description: [Explain what queries these indexes will optimize]
-- Author: [Your name]
-- Date: [YYYY-MM-DD]
-- Dependencies: [List dependent tables/migrations or "None"]
-- Performance Impact: [Expected improvement and any tradeoffs]

-- Index for common lookup patterns
CREATE INDEX IF NOT EXISTS idx_[table_name]_[column_name] 
    ON public.[table_name]([column_name]);

-- Composite index for multi-column queries
CREATE INDEX IF NOT EXISTS idx_[table_name]_[col1]_[col2] 
    ON public.[table_name]([column1], [column2]);

-- Partial index for conditional queries
CREATE INDEX IF NOT EXISTS idx_[table_name]_[column]_active 
    ON public.[table_name]([column]) 
    WHERE status = 'active';

-- Index for sorting and pagination
CREATE INDEX IF NOT EXISTS idx_[table_name]_created_at_desc 
    ON public.[table_name](created_at DESC);

-- Full-text search index (if applicable)
-- CREATE INDEX IF NOT EXISTS idx_[table_name]_search 
--     ON public.[table_name] USING gin(to_tsvector('english', [text_column]));

-- Index comments for documentation
COMMENT ON INDEX idx_[table_name]_[column_name] IS 
'Optimizes queries filtering by [column_name]. Used by [specific features/queries].';

-- Performance testing notes:
-- Before: [Query time before index]
-- After: [Query time after index]
-- Use EXPLAIN ANALYZE to verify index usage