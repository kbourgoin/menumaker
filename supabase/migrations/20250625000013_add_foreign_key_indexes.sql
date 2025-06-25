-- Add indexes for unindexed foreign keys to improve query performance
-- Foreign keys without indexes can cause performance issues on joins and lookups

-- Index for dishes.source_id foreign key
-- This will improve performance when joining dishes to sources or filtering by source
CREATE INDEX IF NOT EXISTS idx_dishes_source_id ON public.dishes (source_id);

-- Index for dishes.user_id foreign key  
-- This will improve performance for user-specific dish queries (which are very common due to RLS)
CREATE INDEX IF NOT EXISTS idx_dishes_user_id ON public.dishes (user_id);

-- Index for meal_history.dishid foreign key
-- This will improve performance when fetching meal history for specific dishes
CREATE INDEX IF NOT EXISTS idx_meal_history_dishid ON public.meal_history (dishid);

-- Index for meal_history.user_id foreign key
-- This will improve performance for user-specific meal history queries (very common due to RLS)
CREATE INDEX IF NOT EXISTS idx_meal_history_user_id ON public.meal_history (user_id);

-- Additional composite indexes that might be beneficial for common query patterns
-- Index for meal_history queries filtered by both user and dish (common in the app)
CREATE INDEX IF NOT EXISTS idx_meal_history_user_dish ON public.meal_history (user_id, dishid);

-- Index for meal_history date queries (used for "last_made" calculations)
CREATE INDEX IF NOT EXISTS idx_meal_history_dishid_date ON public.meal_history (dishid, date DESC);